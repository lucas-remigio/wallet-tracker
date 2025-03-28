CREATE TABLE IF NOT EXISTS accounts (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `account_name` VARCHAR(255) NOT NULL,
    `balance` DECIMAL(15, 2) DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`user_id`) REFERENCES users(`id`) ON DELETE CASCADE,
    UNIQUE (`token`)
);