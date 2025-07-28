import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/server/fileDb';

const FILENAME = 'visitas.json';

export async function GET() {
  const visitas = await readJsonFile(FILENAME);
  return NextResponse.json(visitas);
}

export async function POST(req: NextRequest) {
  const nuevaVisita = await req.json();
  const visitas = await readJsonFile(FILENAME);
  visitas.push(nuevaVisita);
  await writeJsonFile(FILENAME, visitas);
  return NextResponse.json(nuevaVisita, { status: 201 });
} 