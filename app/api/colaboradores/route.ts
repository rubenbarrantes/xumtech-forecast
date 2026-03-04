import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function ensure() {
  await sql`CREATE TABLE IF NOT EXISTS colaboradores (
    id SERIAL PRIMARY KEY,
    codigo_interno TEXT,
    name TEXT NOT NULL,
    nombre TEXT,
    apellidos TEXT,
    tipo_id TEXT DEFAULT 'Cédula de identidad',
    cedula TEXT,
    rol_principal TEXT DEFAULT 'Técnico',
    rol_operativo TEXT DEFAULT 'Técnico',
    puesto TEXT DEFAULT '',
    tribu TEXT DEFAULT 'Dunamis',
    status TEXT DEFAULT 'Activo',
    correo TEXT,
    email TEXT,
    telefono TEXT,
    fecha_ingreso DATE,
    fecha_nacimiento DATE,
    horas_dia INTEGER DEFAULT 8,
    dias_libres_anio INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  try { await sql`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS codigo_interno TEXT`; } catch {}
  try { await sql`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS nombre TEXT`; } catch {}
  try { await sql`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS apellidos TEXT`; } catch {}
  try { await sql`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS tipo_id TEXT DEFAULT 'Cédula de identidad'`; } catch {}
  try { await sql`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS cedula TEXT`; } catch {}
  try { await sql`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS correo TEXT`; } catch {}
  try { await sql`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS telefono TEXT`; } catch {}
  try { await sql`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS fecha_ingreso DATE`; } catch {}
  try { await sql`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE`; } catch {}
  try { await sql`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS dias_libres_anio INTEGER DEFAULT 15`; } catch {}
  try { await sql`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS rol_operativo TEXT DEFAULT 'Técnico'`; } catch {}
  try { await sql`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS puesto TEXT DEFAULT ''`; } catch {}
}

const map = (r: any) => ({
  id: r.id,
  codigoInterno: r.codigo_interno || `COL-${r.id}`,
  name: r.name || "",
  nombre: r.nombre || (r.name || "").split(" ")[0],
  apellidos: r.apellidos || (r.name || "").split(" ").slice(1).join(" "),
  tipoId: r.tipo_id || "Cédula de identidad",
  cedula: r.cedula || "",
  rolPrincipal: r.rol_operativo || r.rol_principal || "Técnico",
  rolOperativo: r.rol_operativo || r.rol_principal || "Técnico",
  puesto: r.puesto || "",
  tribu: r.tribu || "Dunamis",
  status: r.status || "Activo",
  correo: r.correo || r.email || "",
  email: r.correo || r.email || "",
  telefono: r.telefono || "",
  fechaIngreso: r.fecha_ingreso ? String(r.fecha_ingreso).substring(0, 10) : "",
  fechaNacimiento: r.fecha_nacimiento ? String(r.fecha_nacimiento).substring(0, 10) : "",
  horasDia: r.horas_dia || 8,
  diasLibresAnio: r.dias_libres_anio || 15,
});

export async function GET() {
  try {
    await ensure();
    const rows = await sql`SELECT * FROM colaboradores ORDER BY name`;
    return NextResponse.json(rows.map(map));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    await ensure();
    const b = await req.json();
    const fullName = b.name || `${b.nombre||""} ${b.apellidos||""}`.trim();
    const [r] = await sql`
      INSERT INTO colaboradores (
        codigo_interno, name, nombre, apellidos, tipo_id, cedula,
        rol_principal, rol_operativo, puesto, tribu, status, correo, email, telefono,
        fecha_ingreso, fecha_nacimiento, horas_dia, dias_libres_anio
      ) VALUES (
        ${b.codigoInterno||""}, ${fullName}, ${b.nombre||""}, ${b.apellidos||""},
        ${b.tipoId||"Cédula de identidad"}, ${b.cedula||""},
        ${b.rolPrincipal||b.rolOperativo||"Técnico"}, ${b.rolOperativo||b.rolPrincipal||"Técnico"}, ${b.puesto||""}, ${b.tribu||"Dunamis"}, ${b.status||"Activo"},
        ${b.correo||b.email||""}, ${b.correo||b.email||""}, ${b.telefono||""},
        ${b.fechaIngreso||null}, ${b.fechaNacimiento||null},
        ${b.horasDia||8}, ${b.diasLibresAnio||15}
      ) RETURNING *`;
    return NextResponse.json(map(r));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PUT(req: Request) {
  try {
    await ensure();
    const b = await req.json();
    const fullName = b.name || `${b.nombre||""} ${b.apellidos||""}`.trim();
    const [r] = await sql`
      UPDATE colaboradores SET
        codigo_interno=${b.codigoInterno||""}, name=${fullName},
        nombre=${b.nombre||""}, apellidos=${b.apellidos||""},
        tipo_id=${b.tipoId||"Cédula de identidad"}, cedula=${b.cedula||""},
        rol_principal=${b.rolOperativo||b.rolPrincipal||"Técnico"}, rol_operativo=${b.rolOperativo||b.rolPrincipal||"Técnico"}, puesto=${b.puesto||""}, tribu=${b.tribu||"Dunamis"},
        status=${b.status||"Activo"}, correo=${b.correo||b.email||""},
        email=${b.correo||b.email||""}, telefono=${b.telefono||""},
        fecha_ingreso=${b.fechaIngreso||null}, fecha_nacimiento=${b.fechaNacimiento||null},
        horas_dia=${b.horasDia||8}, dias_libres_anio=${b.diasLibresAnio||15}
      WHERE id=${b.id} RETURNING *`;
    return NextResponse.json(map(r));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await sql`DELETE FROM colaboradores WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
