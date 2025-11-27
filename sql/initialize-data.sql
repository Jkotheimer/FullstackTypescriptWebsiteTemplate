USE {!database};

DROP PROCEDURE IF EXISTS generate_init_data;

DELIMITER //
CREATE PROCEDURE generate_init_data ()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    DELETE FROM UserCredentialType;
    INSERT INTO UserCredentialType (Id, Value) VALUES {!user_credential_types};

END //
DELIMITER ;

CALL generate_init_data;