"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Download, Search, Eye, Edit, Plus, Users } from "lucide-react"
import DateRangePicker from "@/components/date-range-picker"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import clientesData from "@/data/clientes.json";
import { USER_CREDENTIALS } from "../data/user-credentials";

interface VisitsModuleProps {
  role: string
}

export default function VisitsModule({ role }: VisitsModuleProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVendor, setSelectedVendor] = useState("all")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<any>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newVisit, setNewVisit] = useState({ client: '', status: '', observations: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [visits, setVisits] = useState<any[]>([])

  // Estado para el vendedor seleccionado en el formulario de agregar visita
  const [selectedVendorForm, setSelectedVendorForm] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  // Obtener vendorId real del usuario logueado
  const vendedorCreds = USER_CREDENTIALS.find((u: any) => u.usuario === role || u.vendorId === role);
  const miVendorId = vendedorCreds ? vendedorCreds.vendorId : null;

  const fetchVisits = async () => {
    const res = await fetch('/api/visitas')
    const data = await res.json()
    setVisits(data)
  }

  useEffect(() => { fetchVisits() }, [])

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Visitas", 14, 16);
    const tableColumn = [
      "Cliente",
      "Vendedor",
      "Fecha",
      "Hora",
      "Estado",
      "Observaciones/Motivo"
    ];
    const tableRows = filteredVisits.map((visit) => [
      visit.client,
      vendedorNombres[visit.vendorId] || visit.vendorId,
      visit.date,
      visit.time,
      getStatusText(visit.status),
      visit.observations || visit.reason || "-"
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 22 });
    doc.save("visitas.pdf");
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredVisits.map((visit) => ({
      "Cliente": visit.client,
      "Vendedor": vendedorNombres[visit.vendorId] || visit.vendorId,
      "Fecha": visit.date,
      "Hora": visit.time,
      "Estado": getStatusText(visit.status),
      "Observaciones/Motivo": visit.observations || visit.reason || "-"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visitas");
    XLSX.writeFile(wb, "visitas.xlsx");
  }

  const handleDateRangeSelect = (start: string, end: string) => {
    setDateRange({ start, end })
  }

  const isVendedor = !!miVendorId

  const vendedores = [
    { id: "susan_moran", name: "Susan Moran" },
    { id: "edwar_ruiz", name: "Edwar Ruíz" },
    { id: "reinaldo_rojo", name: "Reinaldo Rojo" },
    { id: "victor_hinestroza", name: "Víctor Hinestroza" },
    { id: "gerardo_hernandez", name: "Gerardo Hernández" },
    { id: "keinder_montilla", name: "Keinder Montilla" },
    { id: "denys_fernandez", name: "Denys Fernández" },
  ];

  const vendedorNombres: Record<string, string> = {
    victor_hinestroza: "Víctor Hinestroza",
    edwar_ruiz: "Edwar Ruíz",
    reinaldo_rojo: "Reinaldo Rojo",
    gerardo_hernandez: "Gerardo Hernández",
    susan_moran: "Susan Moran"
  };

  const filteredVisits = isVendedor && miVendorId
    ? visits.filter((visit) => {
        const matchesVendor = (visit.vendorId || visit.vendor || "") === miVendorId;
        const matchesSearch = visit.client?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = !dateRange || (visit.date >= dateRange.start && visit.date <= dateRange.end);
        return matchesVendor && matchesSearch && matchesDate;
      })
    : visits.filter((visit) => {
        const matchesSearch = visit.client?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesVendor = selectedVendor === "all" || (visit.vendorId || visit.vendor || "") === selectedVendor;
        const matchesDate = !dateRange || (visit.date >= dateRange.start && visit.date <= dateRange.end);
        return matchesSearch && matchesVendor && matchesDate;
  })

  // Reemplazar allClients por los datos reales de clientes
  const allClients = (clientesData || []).map((c: any) => ({
    id: String(c.id),
    name: c.name,
    vendorId: c.vendorId || c.vendor || ""
  }));

  // Filtrar clientes según el vendedor seleccionado o el rol y el texto de búsqueda
  const filteredClientsForForm = (isVendedor && miVendorId
    ? allClients.filter(c => String(c.vendorId || "") === miVendorId)
    : selectedVendorForm
      ? allClients.filter(c => String(c.vendorId || "") === selectedVendorForm)
      : allClients
  ).filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_visited":
        return <Badge variant="destructive">No Visitado</Badge>
      case "visited":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Visitado
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "not_visited":
        return "No Visitado"
      case "visited":
        return "Visitado"
      case "order_placed":
        return "Pedido Realizado"
      default:
        return "Desconocido"
    }
  }

  const canEdit = role === "route_planner" || role === "administrator"

  // Determinar si el usuario puede agregar visitas
  const forbiddenRoles = ["facturación", "facturacion", "cobranza"];
  const canAddVisit = !forbiddenRoles.includes(role?.toLowerCase());

  const handleSaveVisit = async () => {
    setSaving(true)
    // Buscar datos del cliente seleccionado
    const cliente = allClients.find(c => String(c.id) === String(newVisit.client))
    // Determinar el vendedorId
    const vendorId = isVendedor ? miVendorId : selectedVendorForm
    // Generar fecha y hora actuales
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const date = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    // Generar un id único
    const visitId = `VIS-${now.getTime()}-${cliente?.id || 'unknown'}`
    // Construir el objeto de visita completo
    const visita = {
      id: visitId,
      clientId: cliente?.id,
      client: cliente?.name,
      vendorId,
      date,
      time,
      status: newVisit.status,
      observations: newVisit.status === 'visited' ? newVisit.observations : '',
      reason: newVisit.status === 'not_visited' ? newVisit.reason : ''
    }
    const res = await fetch('/api/visitas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visita)
    })
    setSaving(false)
    if (res.ok) {
      setShowAddDialog(false)
      setNewVisit({ client: '', status: '', observations: '', reason: '' })
      fetchVisits()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-dashboard-enter p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="max-w-2xl mx-auto px-2 py-2">
        {/* Bloque 1: Título y filtros */}
        <div className="visitas-responsive bg-white rounded-xl shadow p-4 mb-6">
          <CardTitle className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-green-600" />
            Módulo de Visitas
          </CardTitle>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nombre de cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                <div className="w-full sm:w-48">
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por Vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Vendedores</SelectItem>
                      {vendedores.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
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
              {canAddVisit && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2" onClick={() => setShowAddDialog(true)}>
                      <Plus className="h-4 w-4" />
                      Agregar Visita
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Agregar Nueva Visita</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Campo Vendedor solo para no vendedores */}
                      {!isVendedor && (
                        <div>
                          <Label>Vendedor</Label>
                          <Select value={selectedVendorForm} onValueChange={v => { setSelectedVendorForm(v); setNewVisit({ ...newVisit, client: "" }); }}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar vendedor" /></SelectTrigger>
                            <SelectContent>
                              {vendedores.map(v => (
                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label>Cliente</Label>
                        <div className="w-64">
                          <Select value={newVisit.client} onValueChange={v => setNewVisit({ ...newVisit, client: v })}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="px-2 py-1 sticky top-0 bg-white z-10">
                                <input
                                  type="text"
                                  className="mb-2 w-full border rounded px-2 py-1 text-sm"
                                  placeholder="Buscar cliente..."
                                  value={clientSearch}
                                  onChange={e => setClientSearch(e.target.value)}
                                  autoFocus
                                />
                              </div>
                              {filteredClientsForForm.length === 0 && (
                                <div className="px-2 py-1 text-gray-500 text-sm">No hay clientes que coincidan</div>
                              )}
                              {filteredClientsForForm.map((c: any) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Select value={newVisit.status} onValueChange={v => setNewVisit({ ...newVisit, status: v })}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="visited">Visitado</SelectItem>
                            <SelectItem value="not_visited">No Visitado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newVisit.status === 'not_visited' && (
                        <div>
                          <Label>Motivo</Label>
                          <Textarea value={newVisit.reason} onChange={e => setNewVisit({ ...newVisit, reason: e.target.value })} placeholder="Motivo de no visita" />
                        </div>
                      )}
                      {newVisit.status === 'visited' && (
                        <div>
                          <Label>Observaciones</Label>
                          <Textarea value={newVisit.observations} onChange={e => setNewVisit({ ...newVisit, observations: e.target.value })} placeholder="Observaciones de la visita" />
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSaveVisit} disabled={saving || !newVisit.client || (!isVendedor && !selectedVendorForm)}>Guardar Visita</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
        {/* Bloque 2: Tabla */}
        <div className="visitas-responsive bg-white rounded-xl shadow p-4">
          <div className="overflow-x-auto w-full">
            <table className="min-w-[700px] w-full text-xs sm:text-sm">
              <thead>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                    <TableHead>Vendedor</TableHead>
                  )}
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Observaciones/Motivo</TableHead>
                  {canEdit && <TableHead>Acciones</TableHead>}
                </TableRow>
              </thead>
              <tbody>
                {filteredVisits.map((visit, idx) => (
                  <TableRow key={visit.id || `visit-row-${idx}`}>
                    <TableCell className="font-medium">{visit.client}</TableCell>
                    {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                      <TableCell>{vendedorNombres[visit.vendorId] || visit.vendorId || '-'}</TableCell>
                    )}
                    <TableCell>{visit.date}</TableCell>
                    <TableCell>{visit.time}</TableCell>
                    <TableCell>{getStatusBadge(visit.status)}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">{visit.observations || visit.reason || "-"}</div>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog
                            open={showViewDialog && selectedVisit?.id === visit.id}
                            onOpenChange={(open) => {
                              setShowViewDialog(open)
                              if (open) setSelectedVisit(visit)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Detalles de la Visita</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p>
                                      <strong>Cliente:</strong> {visit.client}
                                    </p>
                                    <p>
                                      <strong>Vendedor:</strong> {vendedorNombres[visit.vendorId] || visit.vendorId}
                                    </p>
                                    <p>
                                      <strong>Fecha:</strong> {visit.date}
                                    </p>
                                    <p>
                                      <strong>Hora:</strong> {visit.time}
                                    </p>
                                  </div>
                                  <div>
                                    <p>
                                      <strong>Estado:</strong> {getStatusText(visit.status)}
                                    </p>
                                    <p>
                                      <strong>Observaciones:</strong> {visit.observations || visit.reason || "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog
                            open={showEditDialog && selectedVisit?.id === visit.id}
                            onOpenChange={(open) => {
                              setShowEditDialog(open)
                              if (open) setSelectedVisit(visit)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Visita</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Estado de la Visita</Label>
                                  <Select defaultValue={visit.status}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="not_visited">No Visitado</SelectItem>
                                      <SelectItem value="visited">Visitado</SelectItem>
                                      <SelectItem value="order_placed">Pedido Realizado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Observaciones</Label>
                                  <Textarea defaultValue={visit.observations || visit.reason || ""} />
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
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <DateRangePicker
          open={showDatePicker}
          onOpenChange={setShowDatePicker}
          onDateRangeSelect={handleDateRangeSelect}
        />
      </div>
    </div>
  )
}
