import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/server/fileDb';

const FILENAME = 'pedidos.json';

export async function GET() {
  const pedidos = await readJsonFile(FILENAME);
  return NextResponse.json(pedidos);
}

export async function POST(req: NextRequest) {
  const nuevoPedido = await req.json();
  const pedidos = await readJsonFile(FILENAME) || [];
  pedidos.push(nuevoPedido);
  await writeJsonFile(FILENAME, pedidos);
  return NextResponse.json(nuevoPedido, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, ...updates } = await req.json();
  const pedidos = await readJsonFile(FILENAME) || [];
  const idx = pedidos.findIndex((p: any) => String(p.id) === String(id));
  if (idx === -1) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  }
  pedidos[idx] = { ...pedidos[idx], ...updates };
  await writeJsonFile(FILENAME, pedidos);
  return NextResponse.json(pedidos[idx]);
} 