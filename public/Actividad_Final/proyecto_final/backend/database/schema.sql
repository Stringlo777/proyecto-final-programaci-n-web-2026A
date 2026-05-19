-- Base de Datos para Plataforma de Seguimiento de Hábitos
CREATE DATABASE IF NOT EXISTS habitos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE habitos_db;

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'user') DEFAULT 'user',
    puntos INT DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Hábitos
CREATE TABLE IF NOT EXISTS habitos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    frecuencia ENUM('diaria', 'semanal', 'personalizada') DEFAULT 'diaria',
    meta_semanal INT DEFAULT 7,
    color VARCHAR(20) DEFAULT '#00ffcc',
    importancia TINYINT DEFAULT 3,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. Historial de Registros
CREATE TABLE IF NOT EXISTS registros_habito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    habito_id INT NOT NULL,
    fecha DATE NOT NULL,
    completado BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (habito_id) REFERENCES habitos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_registro (habito_id, fecha) -- Solo 1 registro por día por hábito
);

-- 4. Insignias (Gamificación)
CREATE TABLE IF NOT EXISTS insignias_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre_insignia VARCHAR(100) NOT NULL,
    icono_url VARCHAR(255),
    fecha_obtenida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Insertar un Admin por defecto (la contraseña es "admin123", debes generarla el hash previamente o registrar normalmente y cambiar el rol manual. 
-- El hash de "admin123" es $2y$10$wT0EHK/Xg0tJ19a3gZ8O2e3T1A6nJzC.pX1I7gB5UqF5y3qBv7B12
INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol) 
VALUES ('Administrador', 'admin@habitos.com', '$2y$10$wT0EHK/Xg0tJ19a3gZ8O2e3T1A6nJzC.pX1I7gB5UqF5y3qBv7B12', 'admin');
