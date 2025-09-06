CREATE TABLE IF NOT EXISTS "collections_meta"
(
    "id"           VARCHAR(36) PRIMARY KEY,
    "name"         VARCHAR(255) UNIQUE NOT NULL,
    "display_name" VARCHAR(255),
    "schema_json"  CLOB                NOT NULL,
    "create_time"  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "update_time"  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);