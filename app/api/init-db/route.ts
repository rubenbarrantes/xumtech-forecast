import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS colaboradores (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'Activo',
        rol_principal TEXT,
        tribu TEXT,
        email TEXT,
        horas_dia INTEGER DEFAULT 8,
        horas_no_cobrable INTEGER
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS servicios (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        tipo TEXT,
        tribu TEXT,
        po TEXT,
        contrato_id TEXT,
        jira_id TEXT,
        tecnologia TEXT,
        horas_limite INTEGER,
        estado TEXT DEFAULT 'Activo',
        fecha_inicio TEXT,
        fecha_vencimiento TEXT,
        renovable BOOLEAN DEFAULT true
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS asignaciones (
        id SERIAL PRIMARY KEY,
        tribu TEXT,
        rol TEXT,
        colaborador TEXT,
        servicio_id INTEGER,
        mes TEXT,
        horas INTEGER
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ausencias (
        id SERIAL PRIMARY KEY,
        colaborador TEXT,
        mes TEXT,
        fecha TEXT,
        dias INTEGER,
        tipo TEXT,
        notas TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS calendar (
        id SERIAL PRIMARY KEY,
        mes TEXT UNIQUE,
        label TEXT,
        dias_laborales INTEGER,
        feriados INTEGER DEFAULT 0,
        dif20 INTEGER DEFAULT 0
      )
    `;

    return NextResponse.json({ ok: true, message: "Base de datos inicializada" });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}