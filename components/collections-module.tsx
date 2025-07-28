"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Download, Calendar, Eye, Edit, Plus } from "lucide-react"
import CollectionsModuleFormCobro from "./collections-module-form-cobro";
import CuentasVendedor from "@/components/cuentas-vendedor"
import clientesData from "@/data/clientes.json"
import { USER_CREDENTIALS } from "../data/user-credentials";

interface CollectionsModuleProps {
  role: string
}

export default function CollectionsModule({ role }: CollectionsModuleProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVendor, setSelectedVendor] = useState("all")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [collections, setCollections] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  // Obtener vendorId real del usuario logueado
  const vendedorCreds = USER_CREDENTIALS.find((u: any) => u.usuario === role || u.vendorId === role);
  const miVendorId = vendedorCreds ? vendedorCreds.vendorId : null;
  const isVendedor = !!miVendorId;

  // Filtrar pedidos solo para el vendedor actual si es vendedor
  const filteredOrders = isVendedor && miVendorId
    ? orders.filter(order => (order.vendorId || order.vendor) === miVendorId)
    : orders;

  // Filtrado de cobros: los vendedores solo ven sus propios cobros, otros roles ven todos
  const filteredCollections = isVendedor && miVendorId
    ? collections.filter(collection => (collection.vendor || collection.vendorId) === miVendorId)
    : collections;

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/cobros')
      const data = await res.json()
      setCollections(data)
    } catch (error) {
      console.error('Error fetching collections:', error)
      setCollections([])
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/pedidos')
      const data = await res.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchCollections()
  }, [])

  const handleSave = async (data: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/cobros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Error al guardar el cobro')
      setShowDialog(false)
      fetchCollections()
    } catch (error) {
      alert('Hubo un error al guardar el cobro')
    } finally {
      setSaving(false)
    }
  }

  const totalCobros = filteredCollections.length
  const totalMonto = filteredCollections.reduce((sum, collection) => sum + collection.amount, 0)
  const cobrosAlBCV = filteredCollections.filter(c => c.paymentType === "Al BCV").length
  const cobrosDivisas = filteredCollections.filter(c => c.paymentType === "DIVISAS").length

  // Permitir agregar cobros solo a ciertos roles (ajusta según tu lógica)
  const canAddCollection = [
    "route_planner",
    "administrator",
    "billing",
    "collections"
  ].includes(role) || isVendedor;

  return (
    <div className="min-h-screen bg-gray-50 animate-dashboard-enter visitas-responsive modulo-dimension">
      <div className="max-w-2xl mx-auto px-2 py-2">
        {isVendedor && (
          <CuentasVendedor />
        )}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <CardTitle className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-teal-600" />
            Módulo de Cobros
          </CardTitle>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por cliente o número de cobro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Renderizado del filtro por vendedor */}
              {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                <div className="w-full sm:w-48">
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por Vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Vendedores</SelectItem>
                      <SelectItem value="susan_moran">Susan Moran</SelectItem>
                      <SelectItem value="edwar_ruiz">Edwar Ruíz</SelectItem>
                      <SelectItem value="reinaldo_rojo">Reinaldo Rojo</SelectItem>
                      <SelectItem value="victor_hinestroza">Víctor Hinestroza</SelectItem>
                      <SelectItem value="gerardo_hernandez">Gerardo Hernández</SelectItem>
                      <SelectItem value="keinder_montilla">Keinder Montilla</SelectItem>
                      <SelectItem value="denys_fernandez">Denys Fernández</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Rango de Fechas
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
              <Button className="flex items-center gap-2" onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4" /> Agregar Cobro
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[600px] w-full text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Cobro</TableHead>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto ($)</TableHead>
                  <TableHead>Tipo de Pago</TableHead>
                  <TableHead>Forma de Pago</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Tasa</TableHead>
                  <TableHead>Fecha Pago</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-gray-400 py-8">
                      No hay cobros registrados para mostrar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCollections.map((collection, idx) => (
                    <TableRow key={collection?.id ? String(collection.id) : `row-${idx}`}> 
                      <TableCell className="font-medium">{collection.id}</TableCell>
                      <TableCell>{collection.orderId}</TableCell>
                      <TableCell>{
                        collection && collection.client
                          ? (typeof collection.client === 'string' && !isNaN(Number(collection.client))
                              ? (Array.isArray(clientesData)
                                  ? (clientesData.find((c: any) => String(c.id) === String(collection.client))?.name || collection.client)
                                  : collection.client)
                          : collection.client)
                          : '-'
                      }</TableCell>
                      <TableCell>{collection?.date || '-'}</TableCell>
                      <TableCell>{collection?.amount !== undefined && collection?.amount !== null ? `$${Number(collection.amount).toFixed(2)}` : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={collection?.paymentType === "Al BCV" ? "default" : "secondary"}>
                          {collection?.paymentType || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>{collection?.paymentMethod || "-"}</TableCell>
                      <TableCell>{collection?.bank || "-"}</TableCell>
                      <TableCell>{collection?.exchangeRate !== null && collection?.exchangeRate !== undefined ? collection.exchangeRate : '-'}</TableCell>
                      <TableCell>{collection?.paymentDate || '-'}</TableCell>
                      <TableCell>{collection?.vendor || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canAddCollection && (
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        {/* Formulario de Cobro */}
        {canAddCollection && (
          <CollectionsModuleFormCobro
            showDialog={showDialog}
            setShowDialog={setShowDialog}
            orders={filteredOrders}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  )
}