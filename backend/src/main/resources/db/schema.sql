-- =============================================================================
-- CampusFind Database Schema
-- Database: campusfind_dev
-- Storage Engine: InnoDB
-- Charset: utf8mb4 / utf8mb4_unicode_ci
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT NOT NULL,
    type ENUM('LOST', 'FOUND') NOT NULL,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    color VARCHAR(50) NULL,
    brand VARCHAR(50) NULL,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    location_text VARCHAR(200) NULL,
    latitude DECIMAL(9, 6) NULL,
    longitude DECIMAL(9, 6) NULL,
    event_date DATE NULL,
    status ENUM('ACTIVE', 'RESOLVED', 'REMOVED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_items_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_items_type_category_status (type, category, status),
    INDEX idx_items_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS matches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lost_item_id BIGINT NOT NULL,
    found_item_id BIGINT NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    image_score DECIMAL(5, 2) NULL,
    category_score DECIMAL(5, 2) NULL,
    color_score DECIMAL(5, 2) NULL,
    brand_score DECIMAL(5, 2) NULL,
    text_score DECIMAL(5, 2) NULL,
    location_score DECIMAL(5, 2) NULL,
    date_score DECIMAL(5, 2) NULL,
    status ENUM('SUGGESTED', 'DISMISSED', 'CONFIRMED') NOT NULL DEFAULT 'SUGGESTED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_matches_lost_found UNIQUE (lost_item_id, found_item_id),
    CONSTRAINT fk_matches_lost_item FOREIGN KEY (lost_item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_matches_found_item FOREIGN KEY (found_item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_matches_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS claims (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT NOT NULL,
    claimant_id BIGINT NOT NULL,
    evidence_text TEXT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    reviewed_by BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    CONSTRAINT fk_claims_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_claims_claimant FOREIGN KEY (claimant_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_claims_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_claims_item_status (item_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type ENUM('MATCH_FOUND', 'CLAIM_SUBMITTED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'NEW_MESSAGE', 'ITEM_RESOLVED') NOT NULL,
    payload TEXT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT NULL,
    user_a_id BIGINT NOT NULL,
    user_b_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversations_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL,
    CONSTRAINT fk_conversations_user_a FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversations_user_b FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_messages_conversation_created (conversation_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
