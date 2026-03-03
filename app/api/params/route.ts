import { NextResponse } from "next/server";
import sql from "@/lib/db";

// Ensure table exists
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS params (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `;
}

export async function GET() {
  try {
    await ensureTable();
    const rows = await sql`SELECT key, value FROM params`;
    if (rows.length === 0) {
      // Return defaults if not yet saved
      return NextResponse.json({
        utilObjetivo: 100,
        horasNoCobrable: 11,
        pilotoPorPersona: ["Yarigai"],
      });
    }
    const result: any = {};
    rows.forEach((r: any) => { result[r.key] = r.value; });
    return NextResponse.json({
      utilObjetivo: result.utilObjetivo ?? 100,
      horasNoCobrable: result.horasNoCobrable ?? 11,
      pilotoPorPersona: result.pilotoPorPersona ?? ["Yarigai"],
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureTable();
    const b = await req.json();
    // Upsert each param key
    for (const [key, value] of Object.entries(b)) {
      await sql`
        INSERT INTO params (key, value) VALUES (${key}, ${JSON.stringify(value)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
