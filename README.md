# SANGAMAHOTSAV — Backend Database Setup

Steps to create the database schema (migrations) and load initial data (seeders).

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|-------|
| Node.js 18+ | `node -v` to check |
| MySQL 8 running | Local install or Docker |
| A MySQL user with privileges | To create tables in the target database |

---

## 2. Install dependencies

```powershell
cd "c:\React Project\SANGAMAHOTSAV\backend"
npm install
```

---

## 3. Create your local `.env`

Copy the template and fill in **your own** MySQL credentials (never commit this file):

```powershell
Copy-Item .env.example .env
```

Edit `.env`:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=sangamahotsav
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password

# Seed admin login (change these)
SEED_ADMIN_NAME=Super Admin
SEED_ADMIN_EMAIL=admin@sangamahotsav.com
SEED_ADMIN_PASSWORD=Admin@12345
BCRYPT_SALT_ROUNDS=12
```

---

## 4. Create the database (one time)

The migrations create **tables**, not the database itself. Create the empty database first:

```powershell
mysql -u your_mysql_user -p -e "CREATE DATABASE IF NOT EXISTS sangamahotsav CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

> Alternatively, run the full raw DDL directly: `mysql -u your_mysql_user -p < sql\schema.sql`
> If you use `schema.sql`, skip the migration step (5) and go straight to seeding, or use migrations only. Do not run both against the same DB.

---

## 5. Run migrations (build the tables)

```powershell
npm run db:migrate
```

Creates all 7 tables in order with indexes and foreign keys:
`admins → registrations → seminar_halls → accommodation_assignments → sms_campaigns → sms_logs → feedbacks`

Verify:

```powershell
mysql -u your_mysql_user -p sangamahotsav -e "SHOW TABLES;"
```

---

## 6. Run seeders (load initial data)

```powershell
npm run db:seed
```

Inserts:
- 1 admin account (bcrypt-hashed password from `.env`)
- 1 active seminar hall (sample)
- 2 sample registrations

---

## 7. Verify the seed

```powershell
mysql -u your_mysql_user -p sangamahotsav -e "SELECT id, name, email, role FROM admins;"
mysql -u your_mysql_user -p sangamahotsav -e "SELECT id, name, mobile_number, accommodation_status FROM registrations;"
```

Default admin login (change in production): `admin@sangamahotsav.com` / `Admin@12345`

---

## Useful commands

| Command | Purpose |
|---------|---------|
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:migrate:undo` | Roll back the last migration |
| `npm run db:seed` | Run all seeders |
| `npm run db:seed:undo` | Undo all seeders |
| `npm run db:reset` | Undo all migrations, re-migrate, re-seed (fresh DB) |

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `ER_ACCESS_DENIED_ERROR` | Wrong `DB_USER` / `DB_PASSWORD` in `.env` |
| `ER_BAD_DB_ERROR: Unknown database` | Run step 4 to create the database first |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL service not running |
| `Dialect needs to be explicitly supplied` | Ensure `.env` exists and `.sequelizerc` points to `src/config/config.js` |
| Seeder fails on duplicate admin | Already seeded; run `npm run db:seed:undo` first |
