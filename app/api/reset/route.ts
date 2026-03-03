import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    await sql`TRUNCATE TABLE colaboradores, servicios, asignaciones, ausencias, calendar, params RESTART IDENTITY CASCADE`;
    return NextResponse.json({ ok: true, message: "Todas las tablas limpiadas correctamente" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}