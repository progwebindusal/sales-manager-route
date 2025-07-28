import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data/ubicaciones.json");

// Utilidad para leer ubicaciones
async function readUbicaciones() {
  try {
    const data = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Utilidad para guardar ubicaciones
async function writeUbicaciones(ubicaciones: any[]) {
  await fs.writeFile(DATA_PATH, JSON.stringify(ubicaciones, null, 2), "utf-8");
}

// POST: Guardar/actualizar ubicación
export async function POST(request: Request) {
  const { usuario, lat, lng, zona, timestamp } = await request.json();
  if (!usuario || !lat || !lng) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  let ubicaciones = await readUbicaciones();
  // Actualizar si existe, si no agregar
  const idx = ubicaciones.findIndex((u: any) => u.usuario === usuario);
  if (idx >= 0) {
    ubicaciones[idx] = { usuario, lat, lng, zona, timestamp };
  } else {
    ubicaciones.push({ usuario, lat, lng, zona, timestamp });
  }
  await writeUbicaciones(ubicaciones);
  return NextResponse.json({ ok: true });
}

// GET: Consultar ubicaciones (filtro por zona y/o vendedor)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zona = searchParams.get("zona");
  const vendedor = searchParams.get("vendedor");
  let ubicaciones = await readUbicaciones();
  if (zona) {
    ubicaciones = ubicaciones.filter((u: any) => u.zona === zona);
  }
  if (vendedor) {
    ubicaciones = ubicaciones.filter((u: any) => u.usuario === vendedor);
  }
  return NextResponse.json(ubicaciones);
} 