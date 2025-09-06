-- Identity Module Database Schema
-- This migration creates the core user management tables for the Kama platform

-- Users table for storing user account information
CREATE TABLE "users"
(
    "id"             VARCHAR(36) PRIMARY KEY, -- UUID4 format
    "email"          VARCHAR(255) UNIQUE NOT NULL,
    "password_hash"  VARCHAR(255)        NOT NULL,
    "display_name"   VARCHAR(255),
    "email_verified" BOOLEAN DEFAULT FALSE,
    "active"         BOOLEAN DEFAULT TRUE,
    "create_time"    TIMESTAMP           NOT NULL,
    "update_time"    TIMESTAMP           NOT NULL
);

-- Create indexes for common queries
CREATE INDEX "idx_users_email" ON "users" ("email");
CREATE INDEX "idx_users_active" ON "users" ("active");
CREATE INDEX "idx_users_create_time" ON "users" ("create_time");

-- User roles table
CREATE TABLE "user_roles"
(
    "id"          VARCHAR(36) PRIMARY KEY, -- UUID4 format
    "name"        VARCHAR(100) UNIQUE NOT NULL,
    "description" TEXT,
    "permissions" TEXT,                    -- JSON array of permissions
    "create_time" TIMESTAMP           NOT NULL,
    "update_time" TIMESTAMP           NOT NULL
);

-- User to role assignments
CREATE TABLE "user_role_assignments"
(
    "id"          VARCHAR(36) PRIMARY KEY, -- UUID4 format
    "user_id"     VARCHAR(36) NOT NULL,
    "role_id"     VARCHAR(36) NOT NULL,
    "assigned_at" TIMESTAMP   NOT NULL,
    "assigned_by" VARCHAR(36),             -- User ID who assigned the role
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("role_id") REFERENCES "user_roles" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("assigned_by") REFERENCES "users" ("id"),
    UNIQUE ("user_id", "role_id")
);

-- Password reset tokens
CREATE TABLE "password_reset_tokens"
(
    "id"          VARCHAR(36) PRIMARY KEY, -- UUID4 format
    "user_id"     VARCHAR(36)         NOT NULL,
    "token"       VARCHAR(255) UNIQUE NOT NULL,
    "expires_at"  TIMESTAMP           NOT NULL,
    "used"        BOOLEAN DEFAULT FALSE,
    "create_time" TIMESTAMP           NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Create indexes for password reset tokens
CREATE INDEX "idx_password_reset_token" ON "password_reset_tokens" ("token");
CREATE INDEX "idx_password_reset_user_id" ON "password_reset_tokens" ("user_id");
CREATE INDEX "idx_password_reset_expires" ON "password_reset_tokens" ("expires_at");

-- User sessions for tracking active sessions
CREATE TABLE "user_sessions"
(
    "id"            VARCHAR(36) PRIMARY KEY, -- UUID4 format
    "user_id"       VARCHAR(36)         NOT NULL,
    "session_token" VARCHAR(255) UNIQUE NOT NULL,
    "expires_at"    TIMESTAMP           NOT NULL,
    "ip_address"    VARCHAR(45),             -- Supports IPv6
    "user_agent"    TEXT,
    "active"        BOOLEAN DEFAULT TRUE,
    "create_time"   TIMESTAMP           NOT NULL,
    "update_time"   TIMESTAMP           NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Create indexes for user sessions
CREATE INDEX "idx_user_sessions_token" ON "user_sessions" ("session_token");
CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions" ("user_id");
CREATE INDEX "idx_user_sessions_expires" ON "user_sessions" ("expires_at");
CREATE INDEX "idx_user_sessions_active" ON "user_sessions" ("active");

-- Insert default roles
INSERT INTO "user_roles" ("id", "name", "description", "permissions", "create_time", "update_time")
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', 'System Administrator', '["*"]', CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       ('00000000-0000-0000-0000-000000000002', 'user', 'Regular User', '["read:own", "write:own"]', CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       ('00000000-0000-0000-0000-000000000003', 'viewer', 'Read-only User', '["read:own"]', CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP);