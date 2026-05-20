-- =============================================================
--  HabitTracker — Script para insertar usuarios y admins
--
--  RECOMENDADO: usar seed.php en lugar de este archivo SQL,
--  ya que genera los hashes bcrypt correctamente de forma automática.
--    Navegador : http://localhost:8000/backend/database/seed.php
--    Terminal  : php backend/database/seed.php
--
--  Este archivo solo es útil si necesitas insertar un usuario
--  cuyo hash ya generaste con generate_hash.php
-- =============================================================
USE habitos_db;

-- ---------------------------------------------------------------
--  CÓMO USAR ESTE SCRIPT
-- ---------------------------------------------------------------
--  1. Copia y pega en HeidiSQL o la consola de MySQL de Laragon.
--  2. Cambia nombre/email a gusto.
--  3. Si quieres usar UNA contraseña diferente, corre primero
--     el archivo generate_hash.php (ver más abajo).
--  4. INSERT IGNORE evita errores si el correo ya existe.
-- ---------------------------------------------------------------

-- ---------------------------------------------------------------
--  ADMINS (rol = 'admin')
-- ---------------------------------------------------------------

-- Admin principal (ya viene en schema.sql — contraseña: admin123)
INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol)
VALUES (
    'Administrador',
    'admin@habitos.com',
    '$2y$10$wT0EHK/Xg0tJ19a3gZ8O2e3T1A6nJzC.pX1I7gB5UqF5y3qBv7B12',
    'admin'
);

-- Segundo admin (contraseña: password123)
INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol)
VALUES (
    'Coordinador Sistema',
    'coordinador@habitos.com',
    '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkMtbnMeVTa',
    'admin'
);

-- ---------------------------------------------------------------
--  USUARIOS NORMALES (rol = 'user')
-- ---------------------------------------------------------------

-- contraseña: password123
INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol)
VALUES (
    'María García',
    'maria@ejemplo.com',
    '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkMtbnMeVTa',
    'user'
);

INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol)
VALUES (
    'Carlos López',
    'carlos@ejemplo.com',
    '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkMtbnMeVTa',
    'user'
);

INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol)
VALUES (
    'Ana Torres',
    'ana@ejemplo.com',
    '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkMtbnMeVTa',
    'user'
);

INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol)
VALUES (
    'Luis Martínez',
    'luis@ejemplo.com',
    '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkMtbnMeVTa',
    'user'
);

INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol)
VALUES (
    'Sofía Ramírez',
    'sofia@ejemplo.com',
    '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LkMtbnMeVTa',
    'user'
);

-- ---------------------------------------------------------------
--  CAMBIAR PUNTOS MANUALMENTE (opcional)
-- ---------------------------------------------------------------
--  UPDATE usuarios SET puntos = 150 WHERE email = 'carlos@ejemplo.com';

-- ---------------------------------------------------------------
--  VER TODOS LOS USUARIOS INSERTADOS
-- ---------------------------------------------------------------
SELECT id, nombre, email, rol, puntos, creado_en FROM usuarios;
