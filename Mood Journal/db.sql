CREATE DATABASE mood_journal;
USE mood_journal;

CREATE TABLE entries (
	id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT 1,
    entry_text TEXT NOT NULL,
    mood VARCHAR(50),
    confidence DECIMAL(5,2),
    tags VARCHAR(255),
    mood_scale INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    