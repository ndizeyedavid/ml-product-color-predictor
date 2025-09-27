CREATE DATABASE IF NOT EXISTS color_detection;
USE color_detection;

CREATE TABLE IF NOT EXISTS color_detections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    color VARCHAR(50) NOT NULL,
    hsv_values JSON,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);