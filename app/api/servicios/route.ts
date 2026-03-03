// app/api/servicios/route.ts
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS servicios (
      id                SERIAL PRIMARY KEY,
      nombre            TEXT NOT NULL,
      tipo              TEXT NOT NULL DEFAULT 'Soporte Evolutivo',
      tribu             TEXT NOT NULL DEFAULT 'Dunamis',
      po                TEXT NOT NULL DEFAULT '',
      contrato_id       TEXT NOT NULL DEFAULT '',
      jira_id           TEXT NOT NULL DEFAULT '',
      tecnologia        TEXT NOT NULL DEFAULT '',
      horas_limite      INTEGER NOT NULL DEFAULT 0,
      personas_dedicadas INTEGER NOT NULL DEFAULT 1,
      estado            TEXT NOT NULL DEFAULT 'Activo',
      fecha_inicio      TEXT NOT NULL DEFAULT '',
      fecha_vencimiento TEXT NOT NULL DEFAULT '',
      renovable         BOOLEAN NOT NULL DEFAULT true,
      created_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

function mapRow(row: any) {
  return {
    id:                row.id,
    nombre:            row.nombre,
    tipo:              row.tipo,
    tribu:             row.tribu,
    po:                row.po,
    contratoId:        row.contrato_id,
    jiraId:            row.jira_id,
    tecnologia:        row.tecnologia,
    horasLimite:       row.horas_limite,
    personasDedicadas: row.personas_dedicadas,
    estado:            row.estado,
    fechaInicio:       row.fecha_inicio,
    fechaVencimiento:  row.fecha_vencimiento,
    renovable:         row.renovable,
    roles:             {},
  };
}

export async function GET() {
  try {
    await ensureTable();
    const rows = await sql`SELECT * FROM servicios ORDER BY tribu, nombre`;
    return NextResponse.json(rows.map(mapRow));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable();
    const b = await req.json();
    const [row] = await sql`
      INSERT INTO servicios
        (nombre, tipo, tribu, po, contrato_id, jira_id, tecnologia,
         horas_limite, personas_dedicadas, estado, fecha_inicio, fecha_vencimiento, renovable)
      VALUES
        (${b.nombre}, ${b.tipo}, ${b.tribu}, ${b.po ?? ""}, ${b.contratoId ?? ""},
         ${b.jiraId ?? ""}, ${b.tecnologia ?? ""},
         ${b.horasLimite ?? 0}, ${b.personasDedicadas ?? 1},
         ${b.estado ?? "Activo"}, ${b.fechaInicio ?? ""}, ${b.fechaVencimiento ?? ""},
         ${b.renovable ?? true})
      RETURNING *
    `;
    return NextResponse.json(mapRow(row));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureTable();
    const b = await req.json();
    const [row] = await sql`
      UPDATE servicios SET
        nombre            = ${b.nombre},
        tipo              = ${b.tipo},
        tribu             = ${b.tribu},
        po                = ${b.po ?? ""},
        contrato_id       = ${b.contratoId ?? ""},
        jira_id           = ${b.jiraId ?? ""},
        tecnologia        = ${b.tecnologia ?? ""},
        horas_limite      = ${b.horasLimite ?? 0},
        personas_dedicadas = ${b.personasDedicadas ?? 1},
        estado            = ${b.estado ?? "Activo"},
        fecha_inicio      = ${b.fechaInicio ?? ""},
        fecha_vencimiento = ${b.fechaVencimiento ?? ""},
        renovable         = ${b.renovable ?? true}
      WHERE id = ${b.id}
      RETURNING *
    `;
    return NextResponse.json(mapRow(row));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await sql`DELETE FROM servicios WHERE id = ${id}`;
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}