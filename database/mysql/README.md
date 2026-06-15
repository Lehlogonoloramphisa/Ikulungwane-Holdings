# Ikulungwane cPanel MySQL Installer

The `/setup` installer creates the MySQL tables through `public_html/api/setup.php`.

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

After installation, the installer inserts:

```sql
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('installed', 'true');
```

The database password is never stored in frontend JavaScript or localStorage. The installer writes it to `public_html/api/config/database.php`, which is protected by `public_html/api/config/.htaccess`.
