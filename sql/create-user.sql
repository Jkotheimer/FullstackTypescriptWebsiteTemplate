USE tssk;

DROP PROCEDURE IF EXISTS create_tsk_user;

DELIMITER //

CREATE PROCEDURE create_tsk_user ()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

    DROP USER IF EXISTS '{tsk_user}'@'{tsk_host}';
    CREATE USER IF NOT EXISTS '{tsk_user}'@'{tsk_host}' IDENTIFIED BY '{tsk_password}';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {tsk_database}.* TO '{tsk_user}'@'{tsk_host}';
    FLUSH PRIVILEGES;
    COMMIT;
END //

DELIMITER ;

CALL create_tsk_user();