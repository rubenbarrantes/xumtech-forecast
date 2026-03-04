import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function ensure() {
  await sql`CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY, nombre TEXT NOT NULL, razon_social TEXT,
    cedula_juridica TEXT, pais TEXT, industria TEXT, tamano TEXT,
    sitio_web TEXT, notas TEXT, provincia TEXT, canton TEXT,
    distrito TEXT, direccion_detalle TEXT, estado TEXT DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
}

const map = (r: any) => ({
  id: r.id, nombre: r.nombre, razonSocial: r.razon_social || "",
  cedulaJuridica: r.cedula_juridica || "", pais: r.pais || "",
  industria: r.industria || "", tamano: r.tamano || "",
  sitioWeb: r.sitio_web || "", notas: r.notas || "",
  provincia: r.provincia || "", canton: r.canton || "",
  distrito: r.distrito || "", direccionDetalle: r.direccion_detalle || "",
  estado: r.estado || "Activo",
});

export async function GET() {
  try {
    await ensure();
    const rows = await sql`SELECT * FROM clientes ORDER BY nombre`;
    return NextResponse.json(rows.map(map));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    await ensure();
    const b = await req.json();
    const [r] = await sql`INSERT INTO clientes (nombre, razon_social, cedula_juridica, pais, industria, tamano, sitio_web, notas, provincia, canton, distrito, direccion_detalle, estado)
      VALUES (${b.nombre}, ${b.razonSocial||""}, ${b.cedulaJuridica||""}, ${b.pais||""}, ${b.industria||""}, ${b.tamano||""}, ${b.sitioWeb||""}, ${b.notas||""}, ${b.provincia||""}, ${b.canton||""}, ${b.distrito||""}, ${b.direccionDetalle||""}, ${b.estado||"Activo"})
      RETURNING *`;
    return NextResponse.json(map(r));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PUT(req: Request) {
  try {
    await ensure();
    const b = await req.json();
    const [r] = await sql`UPDATE clientes SET nombre=${b.nombre}, razon_social=${b.razonSocial||""}, cedula_juridica=${b.cedulaJuridica||""}, pais=${b.pais||""}, industria=${b.industria||""}, tamano=${b.tamano||""}, sitio_web=${b.sitioWeb||""}, notas=${b.notas||""}, provincia=${b.provincia||""}, canton=${b.canton||""}, distrito=${b.distrito||""}, direccion_detalle=${b.direccionDetalle||""}, estado=${b.estado||"Activo"}
      WHERE id=${b.id} RETURNING *`;
    return NextResponse.json(map(r));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await sql`DELETE FROM contactos WHERE cliente_id=${id}`;
    await sql`DELETE FROM clientes WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
