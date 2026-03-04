// app/api/asignaciones/route.ts
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function ensure() {
  await sql`
    CREATE TABLE IF NOT EXISTS asignaciones (
      id           SERIAL PRIMARY KEY,
      tribu        TEXT NOT NULL DEFAULT 'Dunamis',
      rol          TEXT NOT NULL DEFAULT 'Técnico',
      colaborador  TEXT,
      tipo_recurso TEXT NOT NULL DEFAULT 'colaborador',
      servicio_id  INTEGER,
      mes          TEXT NOT NULL,
      horas        NUMERIC NOT NULL DEFAULT 0,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  try { await sql`ALTER TABLE asignaciones ADD COLUMN IF NOT EXISTS tipo_recurso TEXT NOT NULL DEFAULT 'colaborador'`; } catch {}
}

const map = (r: any) => ({
  id:           r.id,
  tribu:        r.tribu        || "Dunamis",
  rol:          r.rol          || "Técnico",
  colaborador:  r.colaborador  || null,
  tipoRecurso:  r.tipo_recurso || "colaborador",
  servicioId:   r.servicio_id  || null,
  mes:          r.mes          || "",
  horas:        Number(r.horas || 0),
});

export async function GET() {
  try {
    await ensure();
    const rows = await sql`SELECT * FROM asignaciones ORDER BY mes DESC, tribu`;
    return NextResponse.json(rows.map(map));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensure();
    const b = await req.json();
    const [row] = await sql`
      INSERT INTO asignaciones (tribu, rol, colaborador, tipo_recurso, servicio_id, mes, horas)
      VALUES (
        ${b.tribu || "Dunamis"},
        ${b.rol || "Técnico"},
        ${b.colaborador || null},
        ${b.tipoRecurso || "colaborador"},
        ${b.servicioId || null},
        ${b.mes},
        ${Number(b.horas || 0)}
      )
      RETURNING *
    `;
    return NextResponse.json(map(row));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensure();
    const b = await req.json();
    if (!b.id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    const [row] = await sql`
      UPDATE asignaciones SET
        tribu        = ${b.tribu || "Dunamis"},
        rol          = ${b.rol || "Técnico"},
        colaborador  = ${b.colaborador || null},
        tipo_recurso = ${b.tipoRecurso || "colaborador"},
        servicio_id  = ${b.servicioId || null},
        mes          = ${b.mes},
        horas        = ${Number(b.horas || 0)}
      WHERE id = ${b.id}
      RETURNING *
    `;
    if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(map(row));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await sql`DELETE FROM asignaciones WHERE id = ${id}`;
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
