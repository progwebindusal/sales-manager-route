import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/server/fileDb';

const FILENAME = 'rutas.json';

export async function GET() {
  const rutas = await readJsonFile(FILENAME);
  return NextResponse.json(rutas);
}

export async function POST(req: NextRequest) {
  const nuevaRuta = await req.json();
  const rutas: any[] = await readJsonFile(FILENAME);
  let updated = false;
  // Si la ruta ya existe (por id), actualizarla
  if (nuevaRuta.id) {
    for (let i = 0; i < rutas.length; i++) {
      if (String(rutas[i].id) === String(nuevaRuta.id)) {
        rutas[i] = { ...rutas[i], ...nuevaRuta };
        updated = true;
        break;
      }
    }
  }
  // Si no existe, agregarla como nueva
  if (!updated) {
    // Generar un ID numérico incremental solo si no tiene id
    const maxId = rutas.length > 0 ? Math.max(...rutas.map((r: any) => Number(r.id) || 0)) : 0;
    nuevaRuta.id = nuevaRuta.id || (maxId + 1);
    rutas.push(nuevaRuta);
  }
  await writeJsonFile(FILENAME, rutas);
  return NextResponse.json(nuevaRuta, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const updatedRoute = await req.json();
  const rutas: any[] = await readJsonFile(FILENAME);
  let found = false;
  for (let i = 0; i < rutas.length; i++) {
    if (String(rutas[i].id) === String(updatedRoute.id)) {
      rutas[i] = { ...rutas[i], ...updatedRoute };
      found = true;
      break;
    }
  }
  if (!found) {
    return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 });
  }
  await writeJsonFile(FILENAME, rutas);
  return NextResponse.json(updatedRoute, { status: 200 });
} 