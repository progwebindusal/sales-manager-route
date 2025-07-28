import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/server/fileDb'

const FILENAME = 'cobros.json'

export async function GET() {
  const cobros = await readJsonFile(FILENAME)
  return NextResponse.json(cobros)
}

export async function POST(request: NextRequest) {
  const nuevoCobro = await request.json()
  const cobros = await readJsonFile(FILENAME)
  cobros.push(nuevoCobro)
  await writeJsonFile(FILENAME, cobros)
  return NextResponse.json(nuevoCobro)
} 