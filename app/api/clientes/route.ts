import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/server/fileDb';

const FILENAME = 'clientes.json';

export async function GET() {
  const clientes = await readJsonFile(FILENAME);
  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const nuevoCliente = await req.json();
  const clientes: any[] = await readJsonFile(FILENAME);
  // Generar un ID numérico incremental
  const maxId = clientes.length > 0 ? Math.max(...clientes.map((c: any) => Number(c.id) || 0)) : 0;
  nuevoCliente.id = maxId + 1;
  clientes.push(nuevoCliente);
  await writeJsonFile(FILENAME, clientes);
  return NextResponse.json(nuevoCliente, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const updatedClient = await req.json();
  const clientes: any[] = await readJsonFile(FILENAME);
  console.log('ID recibido:', updatedClient.id);
  console.log('IDs existentes:', clientes.map(c => c.id));
  const idx = clientes.findIndex((c: any) => String(c.id) === String(updatedClient.id));
  if (idx === -1) {
    console.log('Cliente no encontrado para actualizar');
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }
  clientes[idx] = { ...clientes[idx], ...updatedClient };
  await writeJsonFile(FILENAME, clientes);
  console.log('Cliente actualizado:', clientes[idx]);
  return NextResponse.json(clientes[idx], { status: 200 });
} 