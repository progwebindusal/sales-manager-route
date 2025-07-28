import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'data')
const dispatchesFile = path.join(dataPath, 'despachos.json')
const pedidosFile = path.join(dataPath, 'pedidos.json')

// Asegurar que el archivo existe
async function ensureFile() {
  try {
    await fs.access(dispatchesFile)
  } catch {
    await fs.writeFile(dispatchesFile, '[]')
  }
}

export async function GET() {
  try {
    await ensureFile()
    const data = await fs.readFile(dispatchesFile, 'utf8')
    const dispatches = JSON.parse(data)
    return NextResponse.json(dispatches)
  } catch (error) {
    console.error('Error al obtener despachos:', error)
    return NextResponse.json({ error: 'Error al obtener despachos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureFile()
    const data = await request.json()
    
    // Leer archivos existentes
    const [dispatchesContent, pedidosContent] = await Promise.all([
      fs.readFile(dispatchesFile, 'utf8'),
      fs.readFile(pedidosFile, 'utf8')
    ])
    
    const dispatches = JSON.parse(dispatchesContent)
    const pedidos = JSON.parse(pedidosContent)
    
    // Crear nuevo despacho
    const newDispatch = {
      id: `DSP-${Date.now()}-${data.orders.length}`,
      date: data.date,
      driver: data.driver,
      orders: data.orders.map((order: any) => ({
        orderId: order.id,
        clientId: order.clientId,
        vendorId: order.vendorId,
        products: order.products,
        total: order.total,
        paymentType: order.paymentType,
        address: data.addresses[order.id] || ''
      })),
      totalUnidades: data.totalUnidades,
      totalKilos: data.totalKilos,
      createdAt: new Date().toISOString()
    }
    
    // Agregar nuevo despacho
    dispatches.push(newDispatch)
    
    // Actualizar el estado de los pedidos a 'despachado' en pedidos.json
    const orderIds = new Set(data.orders.map((o: any) => o.id));
    const updatedPedidos = pedidos.map((p: any) =>
      orderIds.has(p.id) ? { ...p, status: 'despachado' } : p
    );
    // Guardar archivos
    await Promise.all([
      fs.writeFile(dispatchesFile, JSON.stringify(dispatches, null, 2)),
      fs.writeFile(pedidosFile, JSON.stringify(updatedPedidos, null, 2))
    ]);
    
    return NextResponse.json(newDispatch)
  } catch (error) {
    console.error('Error al crear despacho:', error)
    return NextResponse.json({ error: 'Error al crear despacho' }, { status: 500 })
  }
} 