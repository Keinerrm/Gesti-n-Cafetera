-- =============================================
-- Fix RLS: Deshabilitar seguridad y otorgar permisos
-- Ejecutar en SQL Editor de Supabase
-- =============================================

-- Deshabilitar RLS en todas las tablas
ALTER TABLE fincas DISABLE ROW LEVEL SECURITY;
ALTER TABLE config DISABLE ROW LEVEL SECURITY;
ALTER TABLE obreros DISABLE ROW LEVEL SECURITY;
ALTER TABLE lotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE ciclos DISABLE ROW LEVEL SECURITY;
ALTER TABLE jornales DISABLE ROW LEVEL SECURITY;
ALTER TABLE asistencia DISABLE ROW LEVEL SECURITY;
ALTER TABLE comida DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_caja DISABLE ROW LEVEL SECURITY;
ALTER TABLE cascota DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversion DISABLE ROW LEVEL SECURITY;
ALTER TABLE transportes DISABLE ROW LEVEL SECURITY;

-- Otorgar permisos completos al rol anónimo (anon) y autenticado
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
