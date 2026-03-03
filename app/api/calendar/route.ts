import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM calendar ORDER BY mes`;
    const calendar = rows.map((r: any) => ({
      mes: r.mes,
      label: r.label,
      diasLaborales: r.dias_laborales,
      feriados: r.feriados,
      dif20: r.dif20,
    }));
    return NextResponse.json(calendar);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    await sql`
      INSERT INTO calendar (mes, label, dias_laborales, feriados, dif20)
      VALUES (${b.mes}, ${b.label}, ${b.diasLaborales}, ${b.feriados}, ${b.dif20})
      ON CONFLICT (mes) DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const b = await req.json();
    await sql`
      UPDATE calendar SET label=${b.label}, dias_laborales=${b.diasLaborales},
      feriados=${b.feriados}, dif20=${b.dif20}
      WHERE mes=${b.mes}
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { mes } = await req.json();
    await sql`DELETE FROM calendar WHERE mes=${mes}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
