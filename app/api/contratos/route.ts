import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function ensure() {
  await sql`CREATE TABLE IF NOT EXISTS contratos (
    id SERIAL PRIMARY KEY,
    numero TEXT NOT NULL UNIQUE,
    cliente_id INTEGER,
    nombre TEXT,
    descripcion TEXT,
    tipo TEXT,
    estado TEXT DEFAULT 'Activo',
    fecha_firma DATE,
    fecha_inicio DATE,
    cantidad_meses INTEGER DEFAULT 12,
    fecha_vencimiento DATE,
    fecha_renovacion DATE,
    url_contrato TEXT,
    tribu TEXT,
    forma_pago TEXT,
    moneda TEXT DEFAULT 'USD',
    monto_contrato NUMERIC DEFAULT 0,
    nombre_facturar TEXT,
    factura_extranjera BOOLEAN DEFAULT false,
    aplica_iva BOOLEAN DEFAULT false,
    porcentaje_iva NUMERIC DEFAULT 13,
    gerente_cuenta TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  // Add new columns if table already exists (migration)
  const migrations = [
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS nombre TEXT`,
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS descripcion TEXT`,
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS fecha_firma DATE`,
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS cantidad_meses INTEGER DEFAULT 12`,
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS fecha_renovacion DATE`,
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS url_contrato TEXT`,
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS forma_pago TEXT`,
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS monto_contrato NUMERIC DEFAULT 0`,
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS nombre_facturar TEXT`,
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS factura_extranjera BOOLEAN DEFAULT false`,
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS aplica_iva BOOLEAN DEFAULT false`,
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS porcentaje_iva NUMERIC DEFAULT 13`,
    `ALTER TABLE contratos ADD COLUMN IF NOT EXISTS gerente_cuenta TEXT`,
  ];
  for (const m of migrations) {
    try { await sql.unsafe(m); } catch {}
  }
}

const map = (r: any) => ({
  id: r.id,
  numero: r.numero,
  clienteId: r.cliente_id,
  nombre: r.nombre || "",
  descripcion: r.descripcion || "",
  tipo: r.tipo || "",
  estado: r.estado || "Activo",
  fechaFirma: r.fecha_firma ? String(r.fecha_firma).substring(0, 10) : "",
  fechaInicio: r.fecha_inicio ? String(r.fecha_inicio).substring(0, 10) : "",
  cantidadMeses: r.cantidad_meses || 12,
  fechaVencimiento: r.fecha_vencimiento ? String(r.fecha_vencimiento).substring(0, 10) : "",
  fechaRenovacion: r.fecha_renovacion ? String(r.fecha_renovacion).substring(0, 10) : "",
  urlContrato: r.url_contrato || "",
  tribu: r.tribu || "",
  formaPago: r.forma_pago || "",
  moneda: r.moneda || "USD",
  montoContrato: Number(r.monto_contrato || 0),
  nombreFacturar: r.nombre_facturar || "",
  facturaExtranjera: !!r.factura_extranjera,
  aplicaIVA: !!r.aplica_iva,
  porcentajeIVA: Number(r.porcentaje_iva || 13),
  gerenteCuenta: r.gerente_cuenta || "",
  notas: r.notas || "",
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
    const [r] = await sql`
      INSERT INTO contratos (
        numero, cliente_id, nombre, descripcion, tipo, estado,
        fecha_firma, fecha_inicio, cantidad_meses, fecha_vencimiento, fecha_renovacion,
        url_contrato, tribu, forma_pago, moneda, monto_contrato,
        nombre_facturar, factura_extranjera, aplica_iva, porcentaje_iva, gerente_cuenta, notas
      ) VALUES (
        ${b.numero}, ${clienteId}, ${b.nombre||""}, ${b.descripcion||""}, ${b.tipo||""}, ${b.estado||"Activo"},
        ${b.fechaFirma||null}, ${b.fechaInicio||null}, ${b.cantidadMeses||12},
        ${b.fechaVencimiento||null}, ${b.fechaRenovacion||null},
        ${b.urlContrato||""}, ${b.tribu||""}, ${b.formaPago||""}, ${b.moneda||"USD"}, ${b.montoContrato||0},
        ${b.nombreFacturar||""}, ${!!b.facturaExtranjera}, ${!!b.aplicaIVA}, ${b.porcentajeIVA||13},
        ${b.gerenteCuenta||""}, ${b.notas||""}
      ) RETURNING *`;
    return NextResponse.json(map(r));
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PUT(req: Request) {
  try {
    await ensure();
    const b = await req.json();
    const clienteId = b.clienteId ? Number(b.clienteId) : null;
    const [r] = await sql`
      UPDATE contratos SET
        numero=${b.numero}, cliente_id=${clienteId}, nombre=${b.nombre||""},
        descripcion=${b.descripcion||""}, tipo=${b.tipo||""}, estado=${b.estado||"Activo"},
        fecha_firma=${b.fechaFirma||null}, fecha_inicio=${b.fechaInicio||null},
        cantidad_meses=${b.cantidadMeses||12}, fecha_vencimiento=${b.fechaVencimiento||null},
        fecha_renovacion=${b.fechaRenovacion||null}, url_contrato=${b.urlContrato||""},
        tribu=${b.tribu||""}, forma_pago=${b.formaPago||""}, moneda=${b.moneda||"USD"},
        monto_contrato=${b.montoContrato||0}, nombre_facturar=${b.nombreFacturar||""},
        factura_extranjera=${!!b.facturaExtranjera}, aplica_iva=${!!b.aplicaIVA},
        porcentaje_iva=${b.porcentajeIVA||13}, gerente_cuenta=${b.gerenteCuenta||""}, notas=${b.notas||""}
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
