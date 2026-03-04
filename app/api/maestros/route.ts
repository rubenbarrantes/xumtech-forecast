import { NextResponse } from "next/server";
import sql from "@/lib/db";

async function ensure() {
  await sql`CREATE TABLE IF NOT EXISTS maestros (
    tipo TEXT PRIMARY KEY, valores JSONB DEFAULT '[]'
  )`;
}

export async function GET() {
  try {
    await ensure();
    const rows = await sql`SELECT * FROM maestros`;
    const result: any = {};
    rows.forEach((r: any) => { result[r.tipo] = r.valores; });
    return NextResponse.json(result);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    await ensure();
    const { tipo, valores } = await req.json();
    await sql`INSERT INTO maestros (tipo, valores) VALUES (${tipo}, ${JSON.stringify(valores)})
      ON CONFLICT (tipo) DO UPDATE SET valores = EXCLUDED.valores`;
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
