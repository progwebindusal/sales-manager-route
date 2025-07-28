"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DollarSign, Download, Calendar, Eye, Edit, Plus } from "lucide-react"
import DateRangePicker from "@/components/date-range-picker"
import LeafletMap                                                                           from "@/components/leaflet-map"
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface CollectionsModuleProps {
  role: string
}

export default function EnhancedCollectionsModule({ role }: CollectionsModuleProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVendor, setSelectedVendor] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<any>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [selectedPaymentType, setSelectedPaymentType] = useState("")
  const [bcvAmount, setBcvAmount] = useState("")
  const [divisasAmount, setDivisasAmount] = useState("")
  const [collections, setCollections] = useState<any[]>([])

  const pendingOrders = [
    { id: "ORD-003", client: "Panadería El Sol", amount: 280.0, vendor: "Susan Moran" },
    { id: "ORD-004", client: "Hotel Plaza Mayor", amount: 520.25, vendor: "Edwar Ruíz" },
  ]

  const isVendedor = role.includes("vendedor") || [
    "susan_moran",
    "edwar_ruiz",
    "reinaldo_rojo",
    "victor_hinestroza",
    "gerardo_hernandez",
    "keinder_montilla",
    "denys_fernandez"
  ].includes(role)

  const vendedores = [
    { id: "susan_moran", name: "Susan Moran" },
    { id: "edwar_ruiz", name: "Edwar Ruíz" },
    { id: "reinaldo_rojo", name: "Reinaldo Rojo" },
    { id: "victor_hinestroza", name: "Víctor Hinestroza" },
    { id: "gerardo_hernandez", name: "Gerardo Hernández" },
    { id: "keinder_montilla", name: "Keinder Montilla" },
    { id: "denys_fernandez", name: "Denys Fernández" },
  ]

  const filteredCollections = collections.filter((collection) => {
    const matchesSearch = collection.client.toLowerCase().includes(searchTerm.toLowerCase()) || collection.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesVendor = selectedVendor === "all" || collection.vendor.replace(/ /g, '_').toLowerCase() === selectedVendor
    const matchesDate = !dateRange || (collection.date >= dateRange.start && collection.date <= dateRange.end)
    return matchesSearch && matchesVendor && matchesDate
  })

  const canAddCollection = [
    "route_planner",
    "administrator",
    "billing",
    "collections"
  ].includes(role) || isVendedor

  const calculateTotal = () => {
    const bcv = Number.parseFloat(bcvAmount) || 0
    const divisas = Number.parseFloat(divisasAmount) || 0
    return bcv + divisas
  }

  const handleDateRangeSelect = (start: string, end: string) => {
    setDateRange({ start, end })
  }

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Cobros", 14, 16);
    const tableColumn = [
      "Nº Cobro",
      "Nº Pedido",
      "Cliente",
      "Vendedor",
      "Fecha",
      "Monto ($)",
      "Tipo de Pago"
    ];
    const tableRows = filteredCollections.map((col) => [
      col.id,
      col.orderId,
      col.client,
      col.vendor,
      col.date,
      col.amount,
      col.paymentType
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 22 });
    doc.save("cobros.pdf");
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredCollections.map((col) => ({
      "Nº Cobro": col.id,
      "Nº Pedido": col.orderId,
      "Cliente": col.client,
      "Vendedor": col.vendor,
      "Fecha": col.date,
      "Monto ($)": col.amount,
      "Tipo de Pago": col.paymentType
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cobros");
    XLSX.writeFile(wb, "cobros.xlsx");
  };

  // Cargar cobros desde la API
  const fetchCollections = async () => {
    const res = await fetch('/api/cobros')
    const data = await res.json()
    setCollections(data)
  }

  useEffect(() => { fetchCollections() }, [])

  return (
    <div className="min-h-screen bg-gray-50 animate-dashboard-enter">
      <div className="max-w-2xl mx-auto px-2 py-2">
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <CardTitle className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-teal-600" />
            Módulo de Cobros
            {canAddCollection && (
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button className="ml-auto" onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4" /> Registrar Cobro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Nuevo Cobro</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Form Section */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="order">Seleccionar Pedido</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Número de control del pedido" />
                          </SelectTrigger>
                          <SelectContent>
                            {pendingOrders.map((order) => (
                              <SelectItem key={order.id} value={order.id}>
                                {order.id} - {order.client} (${order.amount})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="paymentType">Tipo de Pago</Label>
                        <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo de pago" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Al BCV">Al BCV</SelectItem>
                            <SelectItem value="DIVISAS">Divisas</SelectItem>
                            <SelectItem value="Ambas">Ambas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(selectedPaymentType === "Al BCV" || selectedPaymentType === "Ambas") && (
                        <div>
                          <Label htmlFor="bcvAmount">Monto Al BCV ($)</Label>
                          <Input
                            id="bcvAmount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={bcvAmount}
                            onChange={(e) => setBcvAmount(e.target.value)}
                          />
                        </div>
                      )}

                      {(selectedPaymentType === "DIVISAS" || selectedPaymentType === "Ambas") && (
                        <div>
                          <Label htmlFor="divisasAmount">Monto en Divisas ($)</Label>
                          <Input
                            id="divisasAmount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={divisasAmount}
                            onChange={(e) => setDivisasAmount(e.target.value)}
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="notes">Notas del Cobro</Label>
                        <Textarea id="notes" placeholder="Observaciones adicionales..." rows={3} />
                      </div>

                      {selectedPaymentType === "Ambas" && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium">Total a Cobrar: ${calculateTotal().toFixed(2)}</p>
                        </div>
                      )}
                    </div>

                    {/* Map Section */}
                    <div>
                      <Label>Ubicación del Cobro</Label>
                      <p className="text-sm text-gray-600 mb-2">Ubicación donde se realizó el cobro</p>
                      <LeafletMap height={300} center={[10.6316, -71.6444]} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setShowAddForm(false)}>Registrar Cobro</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Buscar por cliente o número de cobro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por Vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Vendedores</SelectItem>
                {vendedores.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
                </SelectContent>
              </Select>

            <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowDatePicker(true)}>
              <Calendar className="h-4 w-4" />
              Rango de Fechas
              {dateRange && (
                <span className="text-xs">
                  ({dateRange.start} - {dateRange.end})
                </span>
              )}
            </Button>

            <Button variant="outline" className="flex items-center gap-2" onClick={exportToPDF}>
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>

            <Button variant="outline" className="flex items-center gap-2" onClick={exportToExcel}>
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Cobro</TableHead>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  {/* {role !== "vendedor_moto" && <TableHead>Vendedor</TableHead>} */}
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto ($)</TableHead>
                  <TableHead>Tipo de Pago</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell className="font-medium">{collection.id}</TableCell>
                    <TableCell>{collection.orderId}</TableCell>
                    <TableCell>{collection.client}</TableCell>
                    {/* {role !== "vendedor_moto" && <TableCell>{collection.vendor}</TableCell>} */}
                    <TableCell>{collection.date}</TableCell>
                    <TableCell>${collection.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={collection.paymentType === "Al BCV" ? "default" : "secondary"}>
                        {collection.paymentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog
                          open={showViewDialog && selectedCollection?.id === collection.id}
                          onOpenChange={(open) => {
                            setShowViewDialog(open)
                            if (open) setSelectedCollection(collection)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalles del Cobro {collection.id}</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <p>
                                    <strong>Pedido:</strong> {collection.orderId}
                                  </p>
                                  <p>
                                    <strong>Cliente:</strong> {collection.client}
                                  </p>
                                  <p>
                                    <strong>Vendedor:</strong> {collection.vendor}
                                  </p>
                                  <p>
                                    <strong>Fecha:</strong> {collection.date}
                                  </p>
                                  <p>
                                    <strong>Monto:</strong> ${collection.amount.toFixed(2)}
                                  </p>
                                  <p>
                                    <strong>Tipo de Pago:</strong> {collection.paymentType}
                                  </p>
                                  <p>
                                    <strong>Cobrado por:</strong> {collection.collectedBy}
                                  </p>
                                </div>
                                <div>
                                  <p>
                                    <strong>Notas:</strong>
                                  </p>
                                  <p className="mt-2 p-3 bg-gray-50 rounded-lg">{collection.notes}</p>
                                </div>
                              </div>
                              <div>
                                <strong>Ubicación del Cobro:</strong>
                                <LeafletMap
                                  height={200}
                                  center={[collection.location.lat, collection.location.lng]}
                                  selectedLocation={collection.location}
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {canAddCollection && (
                          <>
                            <Dialog
                              open={showEditDialog && selectedCollection?.id === collection.id}
                              onOpenChange={(open) => {
                                setShowEditDialog(open)
                                if (open) setSelectedCollection(collection)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Cobro {collection.id}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Estado del Cobro</Label>
                                    <Select defaultValue={collection.status}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="collected">Cobrado</SelectItem>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="partial">Parcial</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Monto</Label>
                                    <Input type="number" step="0.01" defaultValue={collection.amount} />
                                  </div>
                                  <div>
                                    <Label>Notas</Label>
                                    <Textarea defaultValue={collection.notes} />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                      Cancelar
                                    </Button>
                                    <Button onClick={() => setShowEditDialog(false)}>Guardar</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <DateRangePicker
        open={showDatePicker}
        onOpenChange={setShowDatePicker}
        onDateRangeSelect={handleDateRangeSelect}
      />
    </div>
  )
}
