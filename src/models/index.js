const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const db = {};
const basename = path.basename(__filename);

/**
 * Auto-load every *.model.js file, initialize it with the shared
 * Sequelize instance, then wire up associations.
 */
fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file !== basename &&
      file.endsWith('.model.js') &&
      !file.startsWith('.')
  )
  .forEach((file) => {
    const modelFactory = require(path.join(__dirname, file));
    const model = modelFactory(sequelize);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
