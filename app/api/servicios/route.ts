import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM servicios ORDER BY nombre`;
    const servicios = rows.map((r: any) => ({
      id: r.id,
      nombre: r.nombre,
      tipo: r.tipo,
      tribu: r.tribu,
      po: r.po,
      contratoId: r.contrato_id,
      jiraId: r.jira_id,
      tecnologia: r.tecnologia,
      horasLimite: r.horas_limite,
      estado: r.estado,
      fechaInicio: r.fecha_inicio,
      fechaVencimiento: r.fecha_vencimiento,
      renovable: r.renovable,
    }));
    return NextResponse.json(servicios);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const rows = await sql`
      INSERT INTO servicios (nombre, tipo, tribu, po, contrato_id, jira_id, tecnologia, horas_limite, estado, fecha_inicio, fecha_vencimiento, renovable)
      VALUES (${b.nombre}, ${b.tipo}, ${b.tribu}, ${b.po}, ${b.contratoId}, ${b.jiraId}, ${b.tecnologia}, ${b.horasLimite}, ${b.estado}, ${b.fechaInicio}, ${b.fechaVencimiento}, ${b.renovable})
      RETURNING *
    `;
    const r = rows[0];
    return NextResponse.json({ id: r.id, nombre: r.nombre, tipo: r.tipo, tribu: r.tribu, po: r.po, contratoId: r.contrato_id, jiraId: r.jira_id, tecnologia: r.tecnologia, horasLimite: r.horas_limite, estado: r.estado, fechaInicio: r.fecha_inicio, fechaVencimiento: r.fecha_vencimiento, renovable: r.renovable });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const b = await req.json();
    await sql`
      UPDATE servicios SET nombre=${b.nombre}, tipo=${b.tipo}, tribu=${b.tribu}, po=${b.po},
      contrato_id=${b.contratoId}, jira_id=${b.jiraId}, tecnologia=${b.tecnologia},
      horas_limite=${b.horasLimite}, estado=${b.estado}, fecha_inicio=${b.fechaInicio},
      fecha_vencimiento=${b.fechaVencimiento}, renovable=${b.renovable}
      WHERE id=${b.id}
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
