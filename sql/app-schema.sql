CREATE DATABASE IF NOT EXISTS {tsk_database};
USE {tsk_database};

DROP PROCEDURE IF EXISTS initialize_db;

DELIMITER //

CREATE PROCEDURE initialize_db()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

    CREATE TABLE User (
        Email NVARCHAR(255) NOT NULL,
        Phone NVARCHAR(32),
        FirstName NVARCHAR(255),
        LastName NVARCHAR(255),
        EmailVerified BOOLEAN DEFAULT FALSE,
        IsActive BOOLEAN DEFAULT TRUE,
        ActivatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
        PRIMARY KEY (Id)
    ) CHARACTER SET utf8mb4;

    CREATE UNIQUE INDEX UserEmail ON User(email);

    CREATE TABLE UserCredentialType (
        Value NCHAR(32) NOT NULL,
        PRIMARY KEY (Value)
    ) CHARACTER SET utf8mb4;

    INSERT INTO UserCredentialType (Id, Value) VALUES
        ('password', 'password'),
        ('mfa_key', 'mfa_key'),
        ('jwt', 'jwt');

    CREATE TABLE UserCredential (
        Value VARCHAR(4096) NOT NULL,
        UserId CHAR(255) NOT NULL,
        Type NCHAR(32) NOT NULL,
        IsActive BOOLEAN DEFAULT TRUE,
        ExpirationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
        CONSTRAINT CredentialUser
            FOREIGN KEY (UserId) REFERENCES User(Id)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT UserCredentialType
            FOREIGN KEY (Type) REFERENCES UserCredentialType(Value)
            ON DELETE RESTRICT
            ON UPDATE RESTRICT,
        PRIMARY KEY (Id)
    ) CHARACTER SET utf8mb4;

    CREATE TABLE Organization (
        Name NVARCHAR(255) NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        PRIMARY KEY (Id)
    ) CHARACTER SET utf8mb4;

    CREATE TABLE OrganizationRole (
        Name NVARCHAR(255) NOT NULL,
        Label NVARCHAR(255) NOT NULL,
        OrganizationId CHAR(255) NOT NULL,
        PRIMARY KEY (Id)
    ) CHARACTER SET utf8mb4;

    CREATE UNIQUE INDEX RoleNameWithinOrg ON OrganizationRole(Name, OrganizationId);

    CREATE TABLE OrganizationUser (
        OrganizationId CHAR(255) NOT NULL,
        UserId CHAR(255) NOT NULL,
        RoleId CHAR(255) NOT NULL,
        CONSTRAINT OrganizationUserOrganization
            FOREIGN KEY (OrganizationId) REFERENCES Organization(Id)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT OrganizationUserUser
            FOREIGN KEY (UserId) REFERENCES User(Id)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT OrganizationUserRole
            FOREIGN KEY (RoleId) REFERENCES OrganizationRole(Id)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        PRIMARY KEY (OrganizationId, UserId)
    ) CHARACTER SET utf8mb4;

    CREATE TABLE Post (
        AuthorId CHAR(255) NOT NULL,
        Title NVARCHAR(255),
        Body NVARCHAR(8191),
        CONSTRAINT PostAuthor
            FOREIGN KEY (AuthorId) REFERENCES User(Id)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        PRIMARY KEY (Id)
    ) CHARACTER SET utf8mb4;

    COMMIT;
END //

DELIMITER ;

CALL initialize_db();