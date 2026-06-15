-- Ikulungwane cPanel/MySQL install flag table.
-- The /setup installer creates this table automatically.

CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Created by the installer only after database connection, tables,
-- first admin, and website settings are completed.
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('installed', 'true')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
