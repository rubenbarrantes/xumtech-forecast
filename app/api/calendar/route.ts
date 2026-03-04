import { NextResponse } from "next/server";
import sql from "@/lib/db";

const DEFAULT_MONTHS = [
  { mes: "2026-01", label: "Ene 2026", dias_laborales: 21, feriados: 1, dif20: 2 },
  { mes: "2026-02", label: "Feb 2026", dias_laborales: 20, feriados: 0, dif20: 0 },
  { mes: "2026-03", label: "Mar 2026", dias_laborales: 22, feriados: 0, dif20: 2 },
  { mes: "2026-04", label: "Abr 2026", dias_laborales: 19, feriados: 3, dif20: 2 },
  { mes: "2026-05", label: "May 2026", dias_laborales: 20, feriados: 1, dif20: 1 },
  { mes: "2026-06", label: "Jun 2026", dias_laborales: 22, feriados: 0, dif20: 2 },
  { mes: "2026-07", label: "Jul 2026", dias_laborales: 23, feriados: 1, dif20: 3 },
  { mes: "2026-08", label: "Ago 2026", dias_laborales: 19, feriados: 2, dif20: 1 },
  { mes: "2026-09", label: "Sep 2026", dias_laborales: 21, feriados: 1, dif20: 2 },
  { mes: "2026-10", label: "Oct 2026", dias_laborales: 22, feriados: 0, dif20: 2 },
  { mes: "2026-11", label: "Nov 2026", dias_laborales: 19, feriados: 2, dif20: 1 },
  { mes: "2026-12", label: "Dic 2026", dias_laborales: 21, feriados: 2, dif20: 3 },
];

export async function GET() {
  try {
    // Remove months before 2026
    await sql`DELETE FROM calendar WHERE mes < '2026-01'`;
    // Insert missing 2026 months
    for (const m of DEFAULT_MONTHS) {
      await sql`
        INSERT INTO calendar (mes, label, dias_laborales, feriados, dif20)
        VALUES (${m.mes}, ${m.label}, ${m.dias_laborales}, ${m.feriados}, ${m.dif20})
        ON CONFLICT (mes) DO NOTHING
      `;
    }
    const rows = await sql`SELECT * FROM calendar WHERE mes >= '2026-01' ORDER BY mes DESC`;
    return NextResponse.json(rows.map((r: any) => ({
      mes: r.mes, label: r.label,
      diasLaborales: r.dias_laborales, feriados: r.feriados, dif20: r.dif20,
    })));
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const MESES_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const [yr, mo] = b.mes.split("-");
    const label = `${MESES_ES[parseInt(mo,10)-1]} ${yr}`;
    await sql`
      INSERT INTO calendar (mes, label, dias_laborales, feriados, dif20)
      VALUES (${b.mes}, ${label}, ${b.diasLaborales}, ${b.feriados}, ${b.dif20})
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
