-- =============================================
-- SQL Script para inicializar CaféControl en Supabase
-- IMPORTANTE: Ejecutar todo el bloque junto en el SQL Editor
-- =============================================

-- 1. Tabla: fincas
CREATE TABLE fincas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  ubicacion TEXT,
  areatotal TEXT,
  fechacreacion DATE DEFAULT CURRENT_DATE
);

-- 2. Tabla: config
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- 3. Tabla: obreros
CREATE TABLE obreros (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id),
  nombre TEXT NOT NULL,
  estado TEXT DEFAULT 'activo',
  documento TEXT,
  telefono TEXT,
  fechaingreso DATE DEFAULT CURRENT_DATE,
  notas TEXT
);

-- 4. Tabla: lotes
CREATE TABLE lotes (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id),
  nombre TEXT NOT NULL,
  variedad TEXT,
  hectareas NUMERIC,
  estado TEXT DEFAULT 'activo'
);

-- 5. Tabla: ciclos
CREATE TABLE ciclos (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id),
  nombre TEXT NOT NULL,
  fechainicio DATE,
  fechafin DATE,
  activo BOOLEAN DEFAULT false,
  totalkilos NUMERIC DEFAULT 0,
  totalpagado NUMERIC DEFAULT 0
);

-- 6. Tabla: jornales
CREATE TABLE jornales (
  id SERIAL PRIMARY KEY,
  obrereid INTEGER REFERENCES obreros(id),
  loteid INTEGER REFERENCES lotes(id),
  fincaid INTEGER REFERENCES fincas(id),
  cicloid INTEGER REFERENCES ciclos(id),
  fecha DATE NOT NULL,
  tipo TEXT,
  kilosrecolectados NUMERIC,
  tarifa NUMERIC,
  totalpago NUMERIC
);

-- 7. Tabla: asistencia
CREATE TABLE asistencia (
  id SERIAL PRIMARY KEY,
  obrereid INTEGER REFERENCES obreros(id),
  fincaid INTEGER REFERENCES fincas(id),
  cicloid INTEGER REFERENCES ciclos(id),
  fecha DATE NOT NULL,
  estado TEXT,
  pago NUMERIC
);

-- 8. Tabla: comida
CREATE TABLE comida (
  id SERIAL PRIMARY KEY,
  obrereid INTEGER REFERENCES obreros(id),
  fincaid INTEGER REFERENCES fincas(id),
  cicloid INTEGER REFERENCES ciclos(id),
  fecha DATE NOT NULL,
  desayuno BOOLEAN DEFAULT false,
  almuerzo BOOLEAN DEFAULT false,
  cena BOOLEAN DEFAULT false,
  total NUMERIC DEFAULT 0
);

-- 9. Tabla: pagos
CREATE TABLE pagos (
  id SERIAL PRIMARY KEY,
  obrereid INTEGER REFERENCES obreros(id),
  fincaid INTEGER REFERENCES fincas(id),
  cicloid INTEGER REFERENCES ciclos(id),
  fechapago DATE NOT NULL,
  fechainicio DATE,
  fechafin DATE,
  totalkilos NUMERIC,
  montokilos NUMERIC,
  diastrabajados INTEGER,
  montodias NUMERIC,
  totalbruto NUMERIC,
  descuentocomida NUMERIC,
  descuentotienda NUMERIC,
  totalneto NUMERIC,
  metodopago TEXT
);

-- 10. Tabla: productos (Tienda / Caja)
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id),
  nombre TEXT NOT NULL,
  categoria TEXT,
  precio NUMERIC,
  stock INTEGER
);

-- 11. Tabla: ventas_caja
CREATE TABLE ventas_caja (
  id SERIAL PRIMARY KEY,
  obrereid INTEGER REFERENCES obreros(id),
  productoid INTEGER REFERENCES productos(id),
  fincaid INTEGER REFERENCES fincas(id),
  cicloid INTEGER REFERENCES ciclos(id),
  fecha DATE NOT NULL,
  cantidad INTEGER,
  total NUMERIC,
  fiado BOOLEAN DEFAULT true
);

-- 12. Tabla: cascota
CREATE TABLE cascota (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id),
  loteid INTEGER REFERENCES lotes(id),
  fecha DATE NOT NULL,
  kilos NUMERIC
);

-- 13. Tabla: conversion
CREATE TABLE conversion (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id),
  fecha DATE NOT NULL,
  kiloscereza NUMERIC,
  kilospergamino NUMERIC,
  factor NUMERIC
);

-- 14. Tabla: transportes
CREATE TABLE transportes (
  id SERIAL PRIMARY KEY,
  fincaid INTEGER REFERENCES fincas(id),
  loteid INTEGER REFERENCES lotes(id),
  cicloid INTEGER REFERENCES ciclos(id),
  fecha DATE NOT NULL,
  kilos NUMERIC,
  costo NUMERIC,
  conductor TEXT
);

-- =============================================
-- Desactivar RLS para pruebas (sin autenticación por ahora)
-- =============================================
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
