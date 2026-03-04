import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function ensure() {
  await sql`CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    codigo TEXT,
    nombre TEXT NOT NULL,
    tipo TEXT DEFAULT 'Persona física',
    cedula TEXT,
    correo TEXT,
    telefono TEXT,
    especialidad TEXT,
    tribu TEXT DEFAULT '',
    costo_hora NUMERIC DEFAULT 0,
    moneda_costo TEXT DEFAULT 'USD',
    pais TEXT DEFAULT 'Costa Rica',
    notas TEXT,
    estado TEXT DEFAULT 'Activo',
    horas_dia INTEGER DEFAULT 8,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
}

const map = (r: any) => ({
  id: r.id,
  codigo: r.codigo || `PRV-${r.id}`,
  nombre: r.nombre,
  tipo: r.tipo || "Persona física",
  cedula: r.cedula || "",
  correo: r.correo || "",
  telefono: r.telefono || "",
  especialidad: r.especialidad || "",
  tribu: r.tribu || "",
  costoHora: Number(r.costo_hora || 0),
  monedaCosto: r.moneda_costo || "USD",
  pais: r.pais || "Costa Rica",
  notas: r.notas || "",
  estado: r.estado || "Activo",
  horasDia: r.horas_dia || 8,
});

export async function GET() {
  try {
    await ensure();
    const rows = await sql`SELECT * FROM proveedores ORDER BY nombre`;
    return NextResponse.json(rows.map(map));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    await ensure();
    const b = await req.json();
    const [r] = await sql`
      INSERT INTO proveedores (codigo, nombre, tipo, cedula, correo, telefono, especialidad, tribu, costo_hora, moneda_costo, pais, notas, estado, horas_dia)
      VALUES (${b.codigo||""}, ${b.nombre}, ${b.tipo||"Persona física"}, ${b.cedula||""}, ${b.correo||""}, ${b.telefono||""}, ${b.especialidad||""}, ${b.tribu||"Dunamis"}, ${b.costoHora||0}, ${b.monedaCosto||"USD"}, ${b.pais||"Costa Rica"}, ${b.notas||""}, ${b.estado||"Activo"}, ${b.horasDia||8})
      RETURNING *`;
    return NextResponse.json(map(r));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PUT(req: Request) {
  try {
    await ensure();
    const b = await req.json();
    const [r] = await sql`
      UPDATE proveedores SET
        codigo=${b.codigo||""}, nombre=${b.nombre}, tipo=${b.tipo||"Persona física"},
        cedula=${b.cedula||""}, correo=${b.correo||""}, telefono=${b.telefono||""},
        especialidad=${b.especialidad||""}, tribu=${b.tribu||"Dunamis"},
        costo_hora=${b.costoHora||0}, moneda_costo=${b.monedaCosto||"USD"},
        pais=${b.pais||"Costa Rica"}, notas=${b.notas||""}, estado=${b.estado||"Activo"}, horas_dia=${b.horasDia||8}
      WHERE id=${b.id} RETURNING *`;
    return NextResponse.json(map(r));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await sql`DELETE FROM proveedores WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
