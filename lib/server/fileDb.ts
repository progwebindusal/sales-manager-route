import { promises as fs } from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

export async function readJsonFile(filename: string) {
  const filePath = path.join(dataDir, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function writeJsonFile(filename: string, data: any) {
  const filePath = path.join(dataDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Script temporal para asignar IDs únicos a clientes sin id
export async function asignarIdsClientes() {
  const filename = 'clientes.json';
  const clientes = await readJsonFile(filename);
  let maxId = clientes.reduce((max: number, c: any) => c.id ? Math.max(max, Number(c.id)) : max, 0);
  let changed = false;
  for (const cliente of clientes) {
    if (!cliente.id) {
      maxId++;
      cliente.id = maxId;
      changed = true;
    }
  }
  if (changed) {
    await writeJsonFile(filename, clientes);
    console.log('IDs asignados correctamente.');
  } else {
    console.log('Todos los clientes ya tienen ID.');
  }
}

// Permitir ejecución directa del script para asignar IDs
if (require.main === module) {
  asignarIdsClientes().catch(console.error)
} 