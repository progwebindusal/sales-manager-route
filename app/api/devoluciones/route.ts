import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/server/fileDb';

const FILENAME = 'devoluciones.json';

export async function GET() {
  const devoluciones = await readJsonFile(FILENAME);
  return NextResponse.json(devoluciones);
}

export async function POST(req: NextRequest) {
  const nuevaDevolucion = await req.json();
  const devoluciones = await readJsonFile(FILENAME);
  devoluciones.push(nuevaDevolucion);
  await writeJsonFile(FILENAME, devoluciones);
  return NextResponse.json(nuevaDevolucion, { status: 201 });
} 