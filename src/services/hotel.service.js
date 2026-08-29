const hotelRepository = require('../repositories/hotel.repository');
const hotelRoomRepository = require('../repositories/hotelRoom.repository');
const ApiError = require('../utils/ApiError');
const ExcelJS = require('exceljs');
const { ROOM_TYPE } = require('../constants/enums');

function getCellValue(cell) {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  const val = cell.value;
  if (typeof val === 'object') {
    if (val.text) return String(val.text).trim();
    if (val.result !== undefined) return String(val.result).trim();
    if (val.richText) return val.richText.map((t) => t.text).join('').trim();
    return String(JSON.stringify(val));
  }
  return String(val).trim();
}

function normalizeHeader(val) {
  return String(val || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeRoomType(val) {
  if (!val) return ROOM_TYPE.DORMITORY;
  const str = String(val).trim().toUpperCase().replace(/[\s\-_]+/g, '_');

  if (Object.values(ROOM_TYPE).includes(str)) return str;
  if (str.includes('DORM')) return ROOM_TYPE.DORMITORY;
  if (str.includes('NON') && str.includes('AC')) return ROOM_TYPE.NON_AC_SHARING;
  if (str.includes('DELUXE')) return ROOM_TYPE.DELUXE_AC;
  if (str.includes('PREMIUM')) return ROOM_TYPE.PREMIUM_AC;
  if (str.includes('AC')) return ROOM_TYPE.AC_SHARING;
  return ROOM_TYPE.DORMITORY;
}

function parseBoolean(val, defaultVal = true) {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  const str = String(val).trim().toLowerCase();
  if (['yes', 'true', '1', 'y', 'active'].includes(str)) return true;
  if (['no', 'false', '0', 'n', 'inactive'].includes(str)) return false;
  return defaultVal;
}

/**
 * Business logic for the hotel directory. Hotels are reusable
 * records that admins pick from when assigning accommodation.
 */
class HotelService {
  create(payload) {
    return hotelRepository.create(payload);
  }

  async update(id, payload) {
    const hotel = await this.getById(id);
    return hotelRepository.updateInstance(hotel, payload);
  }

  async getById(id) {
    const hotel = await hotelRepository.findById(id);
    if (!hotel) throw ApiError.notFound('Hotel not found.');
    return hotel;
  }

  list() {
    return hotelRepository.findAll();
  }

  async remove(id) {
    await this.getById(id);
    await hotelRepository.destroy(id);
    return true;
  }

  async createRoom(hotelId, payload) {
    await this.getById(hotelId);
    return hotelRoomRepository.create({ ...payload, hotelId });
  }

  async updateRoom(hotelId, roomId, payload) {
    await this.getById(hotelId);
    const room = await this.getRoomById(hotelId, roomId);
    return hotelRoomRepository.updateInstance(room, payload);
  }

  async getRoomById(hotelId, roomId) {
    const room = await hotelRoomRepository.findById(roomId);
    if (!room || String(room.hotelId) !== String(hotelId)) {
      throw ApiError.notFound('Hotel room not found.');
    }
    return room;
  }

  async removeRoom(hotelId, roomId) {
    await this.getRoomById(hotelId, roomId);
    await hotelRoomRepository.destroy(roomId);
    return true;
  }

  async importFromExcel(fileBuffer) {
    if (!fileBuffer) {
      throw ApiError.badRequest('Excel file buffer is required.');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet || worksheet.rowCount <= 0) {
      throw ApiError.badRequest('Uploaded Excel file contains no data.');
    }

    const existingHotels = await hotelRepository.findAll();
    const hotelMap = new Map();
    const roomMap = new Map();

    for (const h of existingHotels) {
      const key = h.hotelName.trim().toLowerCase();
      hotelMap.set(key, h);
      const rooms = h.rooms || [];
      for (const r of rooms) {
        roomMap.set(`${h.id}_${String(r.roomNo).trim().toLowerCase()}`, r);
      }
    }

    let colMap = {
      hotelName: 1,
      hotelAddress: 2,
      hotelMapLink: 3,
      roomNo: 4,
      roomType: 5,
      roomCapacity: 6,
      currentOccupancy: 7,
      notes: 8,
      isActive: 9,
    };

    let startRowIndex = 1;
    const firstRow = worksheet.getRow(1);

    if (firstRow && firstRow.cellCount > 0) {
      const foundCols = {};
      firstRow.eachCell((cell, colNumber) => {
        const norm = normalizeHeader(getCellValue(cell));
        if (norm.includes('hotelname') || norm === 'hotel' || norm === 'hoteltitle') foundCols.hotelName = colNumber;
        else if (norm.includes('address') || norm.includes('location')) foundCols.hotelAddress = colNumber;
        else if (norm.includes('maplink') || norm.includes('map') || norm.includes('googlemap')) foundCols.hotelMapLink = colNumber;
        else if (norm.includes('roomno') || norm.includes('roomnumber') || norm === 'room' || norm === 'roomnum') foundCols.roomNo = colNumber;
        else if (norm.includes('roomtype') || norm === 'type' || norm.includes('category')) foundCols.roomType = colNumber;
        else if (norm.includes('capacity') || norm === 'cap' || norm.includes('maxoccupants')) foundCols.roomCapacity = colNumber;
        else if (norm.includes('occupancy') || norm === 'occ') foundCols.currentOccupancy = colNumber;
        else if (norm.includes('note') || norm.includes('remark')) foundCols.notes = colNumber;
        else if (norm.includes('active') || norm.includes('status')) foundCols.isActive = colNumber;
      });

      if (foundCols.hotelName || foundCols.roomNo) {
        colMap = { ...colMap, ...foundCols };
        startRowIndex = 2;
      }
    }

    let hotelsCreated = 0;
    let hotelsUpdated = 0;
    let roomsCreated = 0;
    let roomsUpdated = 0;
    const errors = [];
    const updatedHotelIds = new Set();

    for (let r = startRowIndex; r <= worksheet.rowCount; r++) {
      const row = worksheet.getRow(r);
      if (!row || !row.cellCount) continue;

      const rawHotelName = getCellValue(row.getCell(colMap.hotelName));
      if (!rawHotelName) continue;

      const hotelName = rawHotelName.trim();
      const hotelAddress = getCellValue(row.getCell(colMap.hotelAddress)).trim() || 'Vrindavan';
      const hotelMapLink = getCellValue(row.getCell(colMap.hotelMapLink)).trim() || null;

      const hotelKey = hotelName.toLowerCase();
      let hotel = hotelMap.get(hotelKey);

      if (!hotel) {
        try {
          hotel = await hotelRepository.create({
            hotelName,
            hotelAddress,
            hotelMapLink: hotelMapLink && hotelMapLink.startsWith('http') ? hotelMapLink : null,
          });
          hotelMap.set(hotelKey, hotel);
          hotelsCreated++;
        } catch (err) {
          errors.push(`Row ${r}: Failed to create hotel "${hotelName}" — ${err.message}`);
          continue;
        }
      } else {
        const updateData = {};
        if (hotelAddress && hotelAddress !== 'Vrindavan' && hotel.hotelAddress !== hotelAddress) {
          updateData.hotelAddress = hotelAddress;
        }
        if (hotelMapLink && hotelMapLink.startsWith('http') && hotel.hotelMapLink !== hotelMapLink) {
          updateData.hotelMapLink = hotelMapLink;
        }

        if (Object.keys(updateData).length > 0) {
          await hotelRepository.updateInstance(hotel, updateData);
          if (!updatedHotelIds.has(hotel.id)) {
            updatedHotelIds.add(hotel.id);
            hotelsUpdated++;
          }
        }
      }

      const rawRoomNo = getCellValue(row.getCell(colMap.roomNo));
      if (rawRoomNo) {
        const roomNo = rawRoomNo.trim();
        const rawRoomType = getCellValue(row.getCell(colMap.roomType));
        const roomType = normalizeRoomType(rawRoomType);

        const capVal = parseInt(getCellValue(row.getCell(colMap.roomCapacity)), 10);
        const roomCapacity = !isNaN(capVal) && capVal > 0 ? capVal : 1;

        const occVal = parseInt(getCellValue(row.getCell(colMap.currentOccupancy)), 10);
        const currentOccupancy = !isNaN(occVal) && occVal >= 0 ? occVal : 0;

        const notes = getCellValue(row.getCell(colMap.notes)).trim() || null;
        const isActive = parseBoolean(getCellValue(row.getCell(colMap.isActive)), true);

        const roomKey = `${hotel.id}_${roomNo.toLowerCase()}`;
        const existingRoom = roomMap.get(roomKey);

        const roomData = {
          hotelId: hotel.id,
          roomNo,
          roomType,
          roomCapacity,
          currentOccupancy,
          notes,
          isActive,
        };

        if (existingRoom) {
          try {
            await hotelRoomRepository.updateInstance(existingRoom, roomData);
            roomsUpdated++;
          } catch (err) {
            errors.push(`Row ${r}: Failed to update room "${roomNo}" — ${err.message}`);
          }
        } else {
          try {
            const newRoom = await hotelRoomRepository.create(roomData);
            roomMap.set(roomKey, newRoom);
            roomsCreated++;
          } catch (err) {
            errors.push(`Row ${r}: Failed to create room "${roomNo}" — ${err.message}`);
          }
        }
      }
    }

    return {
      hotelsCreated,
      hotelsUpdated,
      roomsCreated,
      roomsUpdated,
      totalRowsProcessed: worksheet.rowCount - startRowIndex + 1,
      errors,
    };
  }
}

module.exports = new HotelService();
