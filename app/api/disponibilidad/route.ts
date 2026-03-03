// app/api/disponibilidad/route.ts
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Crear tabla si no existe
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS disponibilidad (
      id        SERIAL PRIMARY KEY,
      colaborador TEXT NOT NULL,
      rol         TEXT NOT NULL,
      tribu       TEXT NOT NULL,
      mes         TEXT NOT NULL,
      porcentaje  INTEGER NOT NULL DEFAULT 100,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET() {
  try {
    await ensureTable();
    const rows = await sql`SELECT * FROM disponibilidad ORDER BY mes, tribu, colaborador`;
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable();
    const { colaborador, rol, tribu, mes, porcentaje } = await req.json();
    const [row] = await sql`
      INSERT INTO disponibilidad (colaborador, rol, tribu, mes, porcentaje)
      VALUES (${colaborador}, ${rol}, ${tribu}, ${mes}, ${porcentaje})
      RETURNING *
    `;
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await sql`DELETE FROM disponibilidad WHERE id = ${id}`;
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}