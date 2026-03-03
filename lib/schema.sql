-- Colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Activo',
  rol_principal TEXT,
  tribu TEXT,
  email TEXT,
  horas_dia INTEGER DEFAULT 8,
  horas_no_cobrable INTEGER
);

-- Servicios
CREATE TABLE IF NOT EXISTS servicios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT,
  tribu TEXT,
  po TEXT,
  contrato_id TEXT,
  jira_id TEXT,
  tecnologia TEXT,
  horas_limite INTEGER,
  estado TEXT DEFAULT 'Activo',
  fecha_inicio TEXT,
  fecha_vencimiento TEXT,
  renovable BOOLEAN DEFAULT true
);

-- Asignaciones
CREATE TABLE IF NOT EXISTS asignaciones (
  id SERIAL PRIMARY KEY,
  tribu TEXT,
  rol TEXT,
  colaborador TEXT,
  servicio_id INTEGER REFERENCES servicios(id),
  mes TEXT,
  horas INTEGER
);

-- Ausencias
CREATE TABLE IF NOT EXISTS ausencias (
  id SERIAL PRIMARY KEY,
  colaborador TEXT,
  mes TEXT,
  fecha TEXT,
  dias INTEGER,
  tipo TEXT,
  notas TEXT
);

-- Calendar
CREATE TABLE IF NOT EXISTS calendar (
  id SERIAL PRIMARY KEY,
  mes TEXT UNIQUE,
  label TEXT,
  dias_laborales INTEGER,
  feriados INTEGER DEFAULT 0,
  dif20 INTEGER DEFAULT 0
);