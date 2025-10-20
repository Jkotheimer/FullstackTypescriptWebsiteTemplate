DROP USER IF EXISTS 'tssk_user'@'localhost';
CREATE USER IF NOT EXISTS 'tssk_user'@'localhost' IDENTIFIED BY 'tssk_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON typescript_server_starter_kit.* TO 'tssk_user'@'localhost';
FLUSH PRIVILEGES;
