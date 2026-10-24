-- Tables only. Create the databases first, then run this from inside them:
--   CREATE DATABASE slotspot;  USE slotspot;  SOURCE sql/schema.sql;
-- Drops existing tables so it can be re-run.

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS opening_hours;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS businesses;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'owner') NOT NULL DEFAULT 'customer'
) ENGINE=InnoDB;

-- One business per owner (owner_id is unique). NULL means no owner account yet.
CREATE TABLE businesses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id INT UNSIGNED NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(60) NOT NULL,
    area VARCHAR(60) NOT NULL,
    address VARCHAR(255) NOT NULL,
    description TEXT NULL,
    INDEX idx_business_category_area (category, area),
    CONSTRAINT fk_business_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Price is in whole rupees.
CREATE TABLE services (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    business_id INT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    duration_minutes SMALLINT UNSIGNED NOT NULL,
    price INT UNSIGNED NOT NULL DEFAULT 0,
    INDEX idx_service_business (business_id),
    CONSTRAINT fk_service_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- weekday: 0 = Sunday ... 6 = Saturday. NULL opens_at/closes_at means closed that day.
CREATE TABLE opening_hours (
    business_id INT UNSIGNED NOT NULL,
    weekday TINYINT UNSIGNED NOT NULL,
    opens_at TIME NULL,
    closes_at TIME NULL,
    PRIMARY KEY (business_id, weekday),
    CONSTRAINT fk_hours_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE bookings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    business_id INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED NOT NULL,
    customer_id INT UNSIGNED NOT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    status ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_booking_business_start (business_id, start_at),
    INDEX idx_booking_customer_start (customer_id, start_at),
    CONSTRAINT fk_booking_business FOREIGN KEY (business_id) REFERENCES businesses (id),
    CONSTRAINT fk_booking_service FOREIGN KEY (service_id) REFERENCES services (id),
    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES users (id)
) ENGINE=InnoDB;
