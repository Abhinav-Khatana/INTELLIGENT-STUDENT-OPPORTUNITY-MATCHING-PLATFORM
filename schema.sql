-- ============================================================
-- PIMS reference schema (MySQL) — matches the ER diagram exactly.
--
-- The running app creates its tables automatically via SQLAlchemy
-- (see models.py), which produces the same structure as this file.
-- This version is here for your DBMS report: table/column names
-- follow the diagram's capitalization and includes the primary and
-- foreign keys and the package-rule trigger described in the proposal.
-- ============================================================

CREATE TABLE STUDENT (
    Student_ID          INT AUTO_INCREMENT PRIMARY KEY,
    Roll_No             VARCHAR(20) UNIQUE NOT NULL,
    Name                VARCHAR(120) NOT NULL,
    Email               VARCHAR(120) UNIQUE,
    Password_Hash       VARCHAR(255) NOT NULL,
    Branch              VARCHAR(20),
    CGPA                DECIMAL(3,2) DEFAULT 0,
    Current_Offer_Package DECIMAL(6,2) DEFAULT 0,   -- ₹ LPA
    Backlog_Count       INT DEFAULT 0,
    Phone               VARCHAR(20),
    Resume_Path         VARCHAR(255),
    Date_Registered     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Placement cell login accounts. Not on the original diagram, added so
-- the placement cell has somewhere to sign in from.
CREATE TABLE ADMIN_USER (
    Admin_ID            INT AUTO_INCREMENT PRIMARY KEY,
    Name                VARCHAR(120) NOT NULL,
    Email               VARCHAR(120) UNIQUE NOT NULL,
    Password_Hash       VARCHAR(255) NOT NULL,
    Date_Registered     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE COMPANY (
    Company_ID          INT AUTO_INCREMENT PRIMARY KEY,
    Company_Name        VARCHAR(150) NOT NULL,
    Contact_Person      VARCHAR(120),
    Email               VARCHAR(120),
    Phone               VARCHAR(20),
    Website             VARCHAR(200),
    Address             VARCHAR(255)
);

CREATE TABLE SKILL (
    Skill_ID            INT AUTO_INCREMENT PRIMARY KEY,
    Skill_Name          VARCHAR(80) UNIQUE NOT NULL,
    Category            VARCHAR(50)
);

-- Associative entity: STUDENT <-> SKILL (M:N)
CREATE TABLE STUDENT_SKILL (
    SS_ID               INT AUTO_INCREMENT PRIMARY KEY,
    Student_ID          INT NOT NULL,
    Skill_ID            INT NOT NULL,
    Proficiency_Level   VARCHAR(20),
    FOREIGN KEY (Student_ID) REFERENCES STUDENT(Student_ID) ON DELETE CASCADE,
    FOREIGN KEY (Skill_ID)   REFERENCES SKILL(Skill_ID)   ON DELETE CASCADE
);

CREATE TABLE OPPORTUNITY (
    Opportunity_ID      INT AUTO_INCREMENT PRIMARY KEY,
    Company_ID          INT NOT NULL,
    Role                VARCHAR(150) NOT NULL,
    Job_Description     TEXT,
    Eligibility_CGPA    DECIMAL(3,2) DEFAULT 0,
    Eligible_Branch     VARCHAR(150),                 -- comma-separated, e.g. "CSE, IT"
    Max_Backlogs        INT DEFAULT 0,
    Required_Skills     VARCHAR(255),                 -- comma-separated summary
    Package_Offered     DECIMAL(6,2) NOT NULL,        -- ₹ LPA
    Number_of_Openings  INT DEFAULT 1,
    Application_Deadline VARCHAR(50),
    Status              ENUM('Active','Closed') DEFAULT 'Active',
    Posted_Date         DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Company_ID) REFERENCES COMPANY(Company_ID) ON DELETE CASCADE
);

-- Associative entity: OPPORTUNITY <-> SKILL (M:N)
CREATE TABLE OPPORTUNITY_SKILL (
    OS_ID               INT AUTO_INCREMENT PRIMARY KEY,
    Opportunity_ID      INT NOT NULL,
    Skill_ID            INT NOT NULL,
    Required_Level      VARCHAR(20),
    FOREIGN KEY (Opportunity_ID) REFERENCES OPPORTUNITY(Opportunity_ID) ON DELETE CASCADE,
    FOREIGN KEY (Skill_ID)       REFERENCES SKILL(Skill_ID)             ON DELETE CASCADE
);

CREATE TABLE APPLICATION (
    Application_ID      INT AUTO_INCREMENT PRIMARY KEY,
    Student_ID          INT NOT NULL,
    Opportunity_ID      INT NOT NULL,
    Application_Date    DATETIME DEFAULT CURRENT_TIMESTAMP,
    Resume_Version      VARCHAR(255),
    Status              ENUM('Applied','Shortlisted','Interview','Selected','Rejected') DEFAULT 'Applied',
    FOREIGN KEY (Student_ID)     REFERENCES STUDENT(Student_ID)         ON DELETE CASCADE,
    FOREIGN KEY (Opportunity_ID) REFERENCES OPPORTUNITY(Opportunity_ID) ON DELETE CASCADE
);

CREATE TABLE INTERVIEW (
    Interview_ID        INT AUTO_INCREMENT PRIMARY KEY,
    Application_ID      INT NOT NULL,
    Interview_Round     INT,
    Interview_Date      DATETIME,
    Mode                ENUM('Online','Offline'),
    Interview_Result    ENUM('Cleared','Not Cleared'),
    Remarks             TEXT,
    FOREIGN KEY (Application_ID) REFERENCES APPLICATION(Application_ID) ON DELETE CASCADE
);

CREATE TABLE OFFER (
    Offer_ID            INT AUTO_INCREMENT PRIMARY KEY,
    Application_ID      INT UNIQUE NOT NULL,
    Offer_Date          DATETIME,
    Package_Offered     DECIMAL(6,2),
    Offer_Status        ENUM('Accepted','Rejected','Withdrawn'),
    Joining_Date        DATE,
    FOREIGN KEY (Application_ID) REFERENCES APPLICATION(Application_ID) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Package rule as a database-level safety net (the app also checks
-- this in Python before inserting — this trigger catches anything
-- that goes around the API, e.g. a direct SQL insert).
-- "Student may apply only if Opportunity Package > Current Offer Package."
-- ------------------------------------------------------------
DELIMITER //
CREATE TRIGGER trg_enforce_package_rule
BEFORE INSERT ON APPLICATION
FOR EACH ROW
BEGIN
    DECLARE v_current_offer DECIMAL(6,2);
    DECLARE v_new_package DECIMAL(6,2);

    SELECT Current_Offer_Package INTO v_current_offer
    FROM STUDENT WHERE Student_ID = NEW.Student_ID;

    SELECT Package_Offered INTO v_new_package
    FROM OPPORTUNITY WHERE Opportunity_ID = NEW.Opportunity_ID;

    IF v_current_offer IS NOT NULL AND v_current_offer > 0 AND v_new_package <= v_current_offer THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Package rule violated: new offer must exceed current offer package.';
    END IF;
END//
DELIMITER ;
