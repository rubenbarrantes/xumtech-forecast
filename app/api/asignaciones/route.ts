import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM asignaciones ORDER BY mes, id`;
    const asignaciones = rows.map((r: any) => ({
      id: r.id,
      tribu: r.tribu,
      rol: r.rol,
      colaborador: r.colaborador,
      servicioId: r.servicio_id,
      mes: r.mes,
      horas: r.horas,
    }));
    return NextResponse.json(asignaciones);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const rows = await sql`
      INSERT INTO asignaciones (tribu, rol, colaborador, servicio_id, mes, horas)
      VALUES (${b.tribu}, ${b.rol}, ${b.colaborador ?? null}, ${b.servicioId}, ${b.mes}, ${b.horas})
      RETURNING *
    `;
    const r = rows[0];
    return NextResponse.json({ id: r.id, tribu: r.tribu, rol: r.rol, colaborador: r.colaborador, servicioId: r.servicio_id, mes: r.mes, horas: r.horas });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const b = await req.json();
    await sql`
      UPDATE asignaciones SET tribu=${b.tribu}, rol=${b.rol}, colaborador=${b.colaborador ?? null},
      servicio_id=${b.servicioId}, mes=${b.mes}, horas=${b.horas}
      WHERE id=${b.id}
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await sql`DELETE FROM asignaciones WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
