# Ikulungwane cPanel MySQL / MariaDB Schema

Use this folder for cPanel, MySQL, MariaDB, or phpMyAdmin.

Do **not** import `database/postgres/schema.sql` into cPanel/phpMyAdmin. That file is only for PostgreSQL and starts with PostgreSQL-only syntax such as:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

MariaDB/MySQL will reject that line with SQL error `#1064`.

## Recommended Setup

The easiest setup is to use the website installer:

1. Create a blank MySQL database in cPanel.
2. Upload the built website files to `public_html`.
3. Open `/setup`.
4. Enter the database details.
5. Let the installer create tables, create the first admin, save settings, and mark the system installed.

## Manual Import Option

If you need to create the tables manually in phpMyAdmin, import:

```sql
database/mysql/schema.sql
```

`schema.sql` creates the main MySQL/MariaDB tables but does not insert `installed=true` by default. The install flag should only be inserted after:

- the database connection is saved to `public_html/api/config/database.php`
- the first super admin exists in `app_users`
- website settings are saved

The `/setup` installer handles that safely.

## Install Flag Table

The required install flag table is:

```sql
CREATE TABLE system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

After successful installation, the installer inserts:

```sql
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('installed', 'true');
```

The database password is never stored in frontend JavaScript or localStorage. The installer writes it to `public_html/api/config/database.php`, which is protected by `public_html/api/config/.htaccess`.
