import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM ausencias ORDER BY mes DESC, id`;
    const ausencias = rows.map((r: any) => ({
      id: r.id,
      colaborador: r.colaborador,
      mes: r.mes,
      fecha: r.fecha,
      dias: r.dias,
      tipo: r.tipo,
      notas: r.notas,
    }));
    return NextResponse.json(ausencias);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const rows = await sql`
      INSERT INTO ausencias (colaborador, mes, fecha, dias, tipo, notas)
      VALUES (${b.colaborador}, ${b.mes}, ${b.fecha}, ${b.dias}, ${b.tipo}, ${b.notas ?? ''})
      RETURNING *
    `;
    const r = rows[0];
    return NextResponse.json({ id: r.id, colaborador: r.colaborador, mes: r.mes, fecha: r.fecha, dias: r.dias, tipo: r.tipo, notas: r.notas });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const b = await req.json();
    await sql`
      UPDATE ausencias SET colaborador=${b.colaborador}, mes=${b.mes}, fecha=${b.fecha},
      dias=${b.dias}, tipo=${b.tipo}, notas=${b.notas ?? ''}
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
    await sql`DELETE FROM ausencias WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
