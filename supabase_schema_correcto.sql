-- =============================================
-- CaféControl - Supabase Schema CORRECTO
-- Borrar todo y recrear con columnas correctas
-- Ejecutar TODO en el SQL Editor de Supabase
-- =============================================

-- PASO 1: Borrar tablas existentes (en orden para evitar FK violations)
DROP TABLE IF EXISTS transportes CASCADE;
DROP TABLE IF EXISTS conversion CASCADE;
DROP TABLE IF EXISTS cascota CASCADE;
DROP TABLE IF EXISTS ventas_caja CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS comida CASCADE;
DROP TABLE IF EXISTS asistencia CASCADE;
DROP TABLE IF EXISTS jornales CASCADE;
DROP TABLE IF EXISTS ciclos CASCADE;
DROP TABLE IF EXISTS lotes CASCADE;
DROP TABLE IF EXISTS obreros CASCADE;
DROP TABLE IF EXISTS config CASCADE;
DROP TABLE IF EXISTS fincas CASCADE;
DROP TABLE IF EXISTS cycle_stats CASCADE;

-- PASO 2: Recrear con schema CORRECTO

-- 1. fincas
CREATE TABLE fincas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  ubicacion TEXT,
  areatotal TEXT,
  fechacreacion TEXT DEFAULT CURRENT_DATE::TEXT
);

-- 2. config
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- 3. obreros
CREATE TABLE obreros (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  estado TEXT DEFAULT 'activo',
  documento TEXT,
  telefono TEXT,
  fechaingreso TEXT,
  fecharetiro TEXT,
  notas TEXT
);

-- 4. lotes
CREATE TABLE lotes (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  variedad TEXT,
  area NUMERIC DEFAULT 0,
  factorrendimiento NUMERIC,
  descripcion TEXT,
  estado TEXT DEFAULT 'activo'
);

-- 5. ciclos
CREATE TABLE ciclos (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  fechainicio TEXT,
  fechafin TEXT,
  activo BOOLEAN DEFAULT false,
  totalkilos NUMERIC DEFAULT 0,
  totalpagado NUMERIC DEFAULT 0,
  totalcomida NUMERIC DEFAULT 0,
  totalventas NUMERIC DEFAULT 0,
  totaljornales INTEGER DEFAULT 0
);

-- 6. jornales
CREATE TABLE jornales (
  id SERIAL PRIMARY KEY,
  obrereid INTEGER REFERENCES obreros(id) ON DELETE CASCADE,
  loteid INTEGER REFERENCES lotes(id) ON DELETE SET NULL,
  fincaid INTEGER REFERENCES fincas(id) ON DELETE CASCADE,
  cicloid INTEGER REFERENCES ciclos(id) ON DELETE SET NULL,
  fecha TEXT NOT NULL,
  kilosam NUMERIC DEFAULT 0,
  kilospm NUMERIC DEFAULT 0,
  kilosrecolectados NUMERIC DEFAULT 0,
  tipopago TEXT DEFAULT 'kilo',
  tarifadia NUMERIC DEFAULT 0,
  totaldia NUMERIC DEFAULT 0
);

-- 7. asistencia
CREATE TABLE asistencia (
  id SERIAL PRIMARY KEY,
  obrereid INTEGER REFERENCES obreros(id) ON DELETE CASCADE,
  fincaid INTEGER REFERENCES fincas(id) ON DELETE CASCADE,
  cicloid INTEGER REFERENCES ciclos(id) ON DELETE SET NULL,
  fecha TEXT NOT NULL,
  estado TEXT,
  pago NUMERIC DEFAULT 0
);

-- 8. comida (una fila por comida individual: desayuno, almuerzo o cena)
CREATE TABLE comida (
  id SERIAL PRIMARY KEY,
  obrereid INTEGER REFERENCES obreros(id) ON DELETE CASCADE,
  fincaid INTEGER REFERENCES fincas(id) ON DELETE CASCADE,
  cicloid INTEGER REFERENCES ciclos(id) ON DELETE SET NULL,
  fecha TEXT NOT NULL,
  tipo TEXT NOT NULL,
  valor NUMERIC DEFAULT 0
);

-- 9. pagos
CREATE TABLE pagos (
  id SERIAL PRIMARY KEY,
  obrereid INTEGER REFERENCES obreros(id) ON DELETE CASCADE,
  fincaid INTEGER REFERENCES fincas(id) ON DELETE CASCADE,
  cicloid INTEGER REFERENCES ciclos(id) ON DELETE SET NULL,
  fechapago TEXT NOT NULL,
  fechainicio TEXT,
  fechafin TEXT,
  totalganado NUMERIC DEFAULT 0,
  desccomida NUMERIC DEFAULT 0,
  desccaja NUMERIC DEFAULT 0,
  netoapagar NUMERIC DEFAULT 0,
  fiadodescontado BOOLEAN DEFAULT false,
  recibound TEXT,
  estado TEXT DEFAULT 'pagado'
);

-- 10. productos
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  categoria TEXT,
  codigo TEXT,
  precio NUMERIC DEFAULT 0,
  precioventa NUMERIC DEFAULT 0,
  costocompra NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0
);

-- 11. ventas_caja
CREATE TABLE ventas_caja (
  id SERIAL PRIMARY KEY,
  obrereid INTEGER REFERENCES obreros(id) ON DELETE CASCADE,
  productoid INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  fincaid INTEGER REFERENCES fincas(id) ON DELETE CASCADE,
  cicloid INTEGER REFERENCES ciclos(id) ON DELETE SET NULL,
  fecha TEXT NOT NULL,
  cantidad INTEGER DEFAULT 1,
  valortotal NUMERIC DEFAULT 0,
  fiado BOOLEAN DEFAULT true,
  pagado BOOLEAN DEFAULT false,
  fechapago TEXT,
  descripcion TEXT
);

-- 12. cascota
CREATE TABLE cascota (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id) ON DELETE CASCADE,
  loteid INTEGER REFERENCES lotes(id) ON DELETE SET NULL,
  fecha TEXT NOT NULL,
  kilos NUMERIC DEFAULT 0
);

-- 13. conversion
CREATE TABLE conversion (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id) ON DELETE CASCADE,
  fecha TEXT NOT NULL,
  kiloscereza NUMERIC DEFAULT 0,
  kilospergamino NUMERIC DEFAULT 0,
  factor NUMERIC DEFAULT 0
);

-- 14. transportes
CREATE TABLE transportes (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id) ON DELETE CASCADE,
  loteid INTEGER REFERENCES lotes(id) ON DELETE SET NULL,
  cicloid INTEGER REFERENCES ciclos(id) ON DELETE SET NULL,
  fecha TEXT NOT NULL,
  kilos NUMERIC DEFAULT 0,
  costo NUMERIC DEFAULT 0,
  conductor TEXT
);

-- 15. cycle_stats (historial estadístico)
CREATE TABLE cycle_stats (
  id SERIAL PRIMARY KEY,
  cycle_id INTEGER REFERENCES ciclos(id) ON DELETE SET NULL,
  week_name TEXT,
  start_date TEXT,
  end_date TEXT,
  total_kilos NUMERIC DEFAULT 0,
  total_payroll NUMERIC DEFAULT 0,
  total_meals NUMERIC DEFAULT 0,
  total_store_debts NUMERIC DEFAULT 0,
  workers_count INTEGER DEFAULT 0,
  created_at TEXT
);

-- PASO 3: Deshabilitar RLS en todas las tablas
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
ALTER TABLE cycle_stats DISABLE ROW LEVEL SECURITY;

-- PASO 4: Permisos completos al rol anónimo
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
