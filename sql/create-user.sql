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

    DROP USER IF EXISTS '{!user}'@'{!host}';
    CREATE USER IF NOT EXISTS '{!user}'@'{!host}' IDENTIFIED BY '{!password}';
    GRANT SELECT, INSERT, UPDATE, DELETE ON {!database}.* TO '{!user}'@'{!host}';
    FLUSH PRIVILEGES;

    COMMIT;
END //

DELIMITER ;

CALL create_tsk_user();