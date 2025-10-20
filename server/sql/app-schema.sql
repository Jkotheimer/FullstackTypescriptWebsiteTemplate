DELIMITER //

CREATE DATABASE IF NOT EXISTS typescript_server_starter_kit;
USE typescript_server_starter_kit;

DROP PROCEDURE IF EXISTS initialize_db;

CREATE PROCEDURE initialize_db ()
BEGIN

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

    CREATE TABLE Organization (
        Id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        Name NVARCHAR(255) NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        PRIMARY KEY (Id)
    ) CHARACTER SET utf8mb4;

    CREATE TABLE Role (
        Id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        Name NVARCHAR(255) NOT NULL,
        Label NVARCHAR(255) NOT NULL,
        Type CHAR(1) NOT NULL,
        PRIMARY KEY (Id)
    ) CHARACTER SET utf8mb4;

    CREATE UNIQUE INDEX RoleName ON Role(Name);

    INSERT INTO Role (Name, Label, Type) VALUES
        ('OrganizationAdministrator', 'Organization Administrator', 'd'),
        ('RegisteredUser', 'Registered User', 'd'),
        ('GuestUser', 'Guest User', 'd');

    CREATE TABLE User (
        Id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        Email NVARCHAR(255) NOT NULL,
        Phone NVARCHAR(32),
        FirstName NVARCHAR(255),
        LastName NVARCHAR(255),
        Password NVARCHAR(8191) NOT NULL,
        EmailVerified BOOLEAN DEFAULT FALSE,
        IsActive BOOLEAN DEFAULT TRUE,
        CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
        LastModifiedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
        ActivatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
        PRIMARY KEY (Id)
    ) CHARACTER SET utf8mb4;

    CREATE UNIQUE INDEX UserEmail ON User(email);

    CREATE TABLE OrganizationUser (
        Organization INT UNSIGNED NOT NULL,
        User INT UNSIGNED NOT NULL,
        Role INT UNSIGNED NOT NULL,
        CONSTRAINT OrganizationUserOrganization
            FOREIGN KEY (Organization) REFERENCES Organization(Id)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT OrganizationUserUser
            FOREIGN KEY (User) REFERENCES User(Id)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        CONSTRAINT OrganizationUserRole
            FOREIGN KEY (Role) REFERENCES Role(Id)
            ON DELETE CASCADE
            ON UPDATE RESTRICT,
        PRIMARY KEY (Organization, User)
    ) CHARACTER SET utf8mb4;

    CREATE TABLE Post (
        Id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        Author INT UNSIGNED NOT NULL,
        Title NVARCHAR(255),
        Body NVARCHAR(8191),
        FOREIGN KEY (Author) REFERENCES User(Id),
        PRIMARY KEY (Id)
    ) CHARACTER SET utf8mb4;

    COMMIT;
END //

DELIMITER ;

CALL initialize_db();