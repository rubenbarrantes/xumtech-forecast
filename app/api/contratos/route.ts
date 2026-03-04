import { NextResponse } from "next/server";
import sql from "@/lib/db";

async function ensure() {
  await sql`CREATE TABLE IF NOT EXISTS contratos (
    id SERIAL PRIMARY KEY, numero TEXT NOT NULL UNIQUE, cliente_id INTEGER,
    tipo TEXT, moneda TEXT DEFAULT 'USD', monto_mensual NUMERIC DEFAULT 0,
    monto_total NUMERIC DEFAULT 0, tribu TEXT, po TEXT,
    fecha_inicio DATE, fecha_vencimiento DATE, renovacion_automatica BOOLEAN DEFAULT false,
    estado TEXT DEFAULT 'Activo', notas TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
}

const map = (r: any) => ({
  id: r.id, numero: r.numero, clienteId: r.cliente_id,
  tipo: r.tipo || "", moneda: r.moneda || "USD",
  montoMensual: Number(r.monto_mensual || 0), montoTotal: Number(r.monto_total || 0),
  tribu: r.tribu || "", po: r.po || "",
  fechaInicio: r.fecha_inicio ? String(r.fecha_inicio).substring(0,10) : "",
  fechaVencimiento: r.fecha_vencimiento ? String(r.fecha_vencimiento).substring(0,10) : "",
  renovacionAutomatica: !!r.renovacion_automatica,
  estado: r.estado || "Activo", notas: r.notas || "",
});

export async function GET() {
  try {
    await ensure();
    const rows = await sql`SELECT * FROM contratos ORDER BY created_at DESC`;
    return NextResponse.json(rows.map(map));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    await ensure();
    const b = await req.json();
    const clienteId = b.clienteId ? Number(b.clienteId) : null;
    const [r] = await sql`INSERT INTO contratos (numero, cliente_id, tipo, moneda, monto_mensual, monto_total, tribu, po, fecha_inicio, fecha_vencimiento, renovacion_automatica, estado, notas)
      VALUES (${b.numero}, ${clienteId}, ${b.tipo||""}, ${b.moneda||"USD"}, ${b.montoMensual||0}, ${b.montoTotal||0}, ${b.tribu||""}, ${b.po||""}, ${b.fechaInicio||null}, ${b.fechaVencimiento||null}, ${!!b.renovacionAutomatica}, ${b.estado||"Activo"}, ${b.notas||""})
      RETURNING *`;
    return NextResponse.json(map(r));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PUT(req: Request) {
  try {
    await ensure();
    const b = await req.json();
    const clienteId = b.clienteId ? Number(b.clienteId) : null;
    const [r] = await sql`UPDATE contratos SET numero=${b.numero}, cliente_id=${clienteId}, tipo=${b.tipo||""}, moneda=${b.moneda||"USD"}, monto_mensual=${b.montoMensual||0}, monto_total=${b.montoTotal||0}, tribu=${b.tribu||""}, po=${b.po||""}, fecha_inicio=${b.fechaInicio||null}, fecha_vencimiento=${b.fechaVencimiento||null}, renovacion_automatica=${!!b.renovacionAutomatica}, estado=${b.estado||"Activo"}, notas=${b.notas||""}
      WHERE id=${b.id} RETURNING *`;
    return NextResponse.json(map(r));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await sql`DELETE FROM contratos WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
