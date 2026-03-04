import { NextResponse } from "next/server";
import sql from "@/lib/db";

async function ensure() {
  await sql`CREATE TABLE IF NOT EXISTS contactos (
    id SERIAL PRIMARY KEY, cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL, cargo TEXT, email TEXT, telefono TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
}

const map = (r: any) => ({
  id: r.id, clienteId: r.cliente_id, nombre: r.nombre,
  cargo: r.cargo || "", email: r.email || "", telefono: r.telefono || "",
});

export async function GET() {
  try {
    await ensure();
    const rows = await sql`SELECT * FROM contactos ORDER BY nombre`;
    return NextResponse.json(rows.map(map));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    await ensure();
    const b = await req.json();
    const [r] = await sql`INSERT INTO contactos (cliente_id, nombre, cargo, email, telefono)
      VALUES (${b.clienteId}, ${b.nombre}, ${b.cargo||""}, ${b.email||""}, ${b.telefono||""}) RETURNING *`;
    return NextResponse.json(map(r));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await sql`DELETE FROM contactos WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
