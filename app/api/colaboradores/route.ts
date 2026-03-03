import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM colaboradores ORDER BY name`;
    const colaboradores = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      rolPrincipal: r.rol_principal,
      tribu: r.tribu,
      email: r.email,
      horasDia: r.horas_dia,
      horasNoCobrable: r.horas_no_cobrable,
    }));
    return NextResponse.json(colaboradores);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const rows = await sql`
      INSERT INTO colaboradores (name, status, rol_principal, tribu, email, horas_dia, horas_no_cobrable)
      VALUES (${b.name}, ${b.status}, ${b.rolPrincipal}, ${b.tribu}, ${b.email}, ${b.horasDia}, ${b.horasNoCobrable ?? null})
      RETURNING *
    `;
    const r = rows[0];
    return NextResponse.json({ id: r.id, name: r.name, status: r.status, rolPrincipal: r.rol_principal, tribu: r.tribu, email: r.email, horasDia: r.horas_dia });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const b = await req.json();
    await sql`
      UPDATE colaboradores SET name=${b.name}, status=${b.status}, rol_principal=${b.rolPrincipal},
      tribu=${b.tribu}, email=${b.email}, horas_dia=${b.horasDia}, horas_no_cobrable=${b.horasNoCobrable ?? null}
      WHERE id=${b.id}
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
