-- =============================================
-- CaféControl - Esquema de Usuarios y Roles
-- =============================================

-- 1. Crear el tipo ENUM para los roles si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_rol') THEN
        CREATE TYPE tipo_rol AS ENUM ('super_admin', 'admin', 'tienda', 'transporte', 'cuenta', 'obrero');
    END IF;
END
$$;

-- 1b. Agregar el rol 'obrero' al ENUM existente (si la BD ya tenía el tipo creado)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'tipo_rol'::regtype AND enumlabel = 'obrero'
    ) THEN
        ALTER TYPE tipo_rol ADD VALUE 'obrero';
    END IF;
END
$$;

-- 2. Crear la tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    cedula TEXT UNIQUE NOT NULL,
    telefono TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    rol tipo_rol NOT NULL,
    password_hash TEXT NOT NULL,
    password_plain TEXT, -- Contraseña en texto plano para visualización del Super Admin
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'desactivado'))
);

-- 3. Deshabilitar RLS temporalmente
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 4. Otorgar permisos completos al rol anónimo y autenticado
GRANT ALL ON TABLE usuarios TO anon;
GRANT ALL ON TABLE usuarios TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. Insertar Super Admin por defecto
-- Usuario: admin
-- Contraseña por defecto: 1234
-- Hash SHA-256 de '1234': 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
INSERT INTO usuarios (nombre, cedula, telefono, username, rol, password_hash, password_plain)
VALUES ('Super Administrador', '1000000000', '3000000000', 'admin', 'super_admin', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '1234')
ON CONFLICT (username) DO NOTHING;
