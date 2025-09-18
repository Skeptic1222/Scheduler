-- SQL Server schema creation script
-- Run this on SQL Server Express to create the database schema

USE master;
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'HospitalScheduler')
BEGIN
    CREATE DATABASE HospitalScheduler;
END
GO

USE HospitalScheduler;
GO

-- Create Users table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) NOT NULL UNIQUE,
        name NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'staff',
        department_id NVARCHAR(36),
        skills NVARCHAR(MAX) DEFAULT '[]',
        seniority_years INT DEFAULT 0,
        last_shift_date DATETIME2,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Create Departments table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='departments' AND xtype='U')
BEGIN
    CREATE TABLE departments (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Create Shifts table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='shifts' AND xtype='U')
BEGIN
    CREATE TABLE shifts (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        department_id NVARCHAR(36) NOT NULL,
        start_time DATETIME2 NOT NULL,
        end_time DATETIME2 NOT NULL,
        required_skills NVARCHAR(MAX) DEFAULT '[]',
        min_experience_years INT DEFAULT 0,
        status NVARCHAR(50) NOT NULL DEFAULT 'available',
        assigned_user_id NVARCHAR(36),
        created_by NVARCHAR(36) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Create FCFS Queue table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='fcfs_queue' AND xtype='U')
BEGIN
    CREATE TABLE fcfs_queue (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        shift_id NVARCHAR(36) NOT NULL,
        user_id NVARCHAR(36) NOT NULL,
        priority_score DECIMAL(5,2) NOT NULL,
        response_deadline DATETIME2 NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Create Notifications table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='notifications' AND xtype='U')
BEGIN
    CREATE TABLE notifications (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        user_id NVARCHAR(36) NOT NULL,
        type NVARCHAR(100) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        data NVARCHAR(MAX) DEFAULT '{}',
        is_read BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Create Audit Logs table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs' AND xtype='U')
BEGIN
    CREATE TABLE audit_logs (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        user_id NVARCHAR(36),
        action NVARCHAR(255) NOT NULL,
        resource_type NVARCHAR(100) NOT NULL,
        resource_id NVARCHAR(36),
        details NVARCHAR(MAX) DEFAULT '{}',
        ip_address NVARCHAR(45),
        user_agent NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT FK_users_department 
    FOREIGN KEY (department_id) REFERENCES departments(id);
GO

ALTER TABLE shifts ADD CONSTRAINT FK_shifts_department 
    FOREIGN KEY (department_id) REFERENCES departments(id);
GO

ALTER TABLE shifts ADD CONSTRAINT FK_shifts_assigned_user 
    FOREIGN KEY (assigned_user_id) REFERENCES users(id);
GO

ALTER TABLE shifts ADD CONSTRAINT FK_shifts_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id);
GO

ALTER TABLE fcfs_queue ADD CONSTRAINT FK_fcfs_queue_shift 
    FOREIGN KEY (shift_id) REFERENCES shifts(id);
GO

ALTER TABLE fcfs_queue ADD CONSTRAINT FK_fcfs_queue_user 
    FOREIGN KEY (user_id) REFERENCES users(id);
GO

ALTER TABLE notifications ADD CONSTRAINT FK_notifications_user 
    FOREIGN KEY (user_id) REFERENCES users(id);
GO

-- Create indexes for better performance
CREATE INDEX IX_users_email ON users(email);
CREATE INDEX IX_users_department_id ON users(department_id);
CREATE INDEX IX_shifts_department_id ON shifts(department_id);
CREATE INDEX IX_shifts_status ON shifts(status);
CREATE INDEX IX_shifts_start_time ON shifts(start_time);
CREATE INDEX IX_fcfs_queue_shift_id ON fcfs_queue(shift_id);
CREATE INDEX IX_fcfs_queue_user_id ON fcfs_queue(user_id);
CREATE INDEX IX_notifications_user_id ON notifications(user_id);
GO

-- Insert sample data for testing
INSERT INTO departments (id, name, description) VALUES 
    (NEWID(), 'Emergency', 'Emergency Department'),
    (NEWID(), 'ICU', 'Intensive Care Unit'),
    (NEWID(), 'Surgery', 'Surgical Department');
GO

PRINT 'SQL Server schema created successfully for Hospital Scheduler';