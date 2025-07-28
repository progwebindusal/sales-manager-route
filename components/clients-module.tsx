"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Users, Download, Plus, Eye, Edit, Calendar } from "lucide-react"
import LeafletMap from "@/components/leaflet-map"
import DateRangePicker from "@/components/date-range-picker"
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ClientsModuleProps {
  role: string
}

export default function ClientsModule({ role }: ClientsModuleProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVendor, setSelectedVendor] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [address, setAddress] = useState("")
  const [saving, setSaving] = useState(false)
  const [newClient, setNewClient] = useState({
    name: '', rif: '', sada: '', vendor: '', address: '', location: null as {lat: number, lng: number} | null
  })
  const [clients, setClients] = useState<any[]>([])
  const [showEditForm, setShowEditForm] = useState(false)
  const [editClient, setEditClient] = useState<any>(null)

  const rolesWithVendorFilter = [
    "administrator",
        "route_planner",
    "billing",
    "collections"
  ];

  const vendedoresUsernames = [
    "smoran", "eruiz", "ghernandez", "rrojo", "victorh", "dfernandez", "kmontilla", "jbolivar", "osanchez", "agarcia", "mcarreño", "iparedes", "frodriguez", "jortega", "csantander", "hhernandez", "ejaimes", "dmartinez", "jmedina", "egarcia", "yhernandez", "gcorona", "xcabarca", "jlarreal"
  ];
  const isVendedor = vendedoresUsernames.includes(role);

  const vendedorNombres: Record<string, string> = {
    victor_hinestroza: "Víctor Hinestroza",
    edwar_ruiz: "Edwar Ruíz",
    reinaldo_rojo: "Reinaldo Rojo",
    gerardo_hernandez: "Gerardo Hernández",
    susan_moran: "Susan Moran"
  }

  const forbiddenRoles = ["vendedor masivo", "vendedor moto"];
  const canAddClient = !forbiddenRoles.includes(role?.toLowerCase());

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
    // Geocodificación inversa con Nominatim
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`)
      const data = await response.json()
      if (data && data.display_name) {
        setAddress(data.display_name)
      }
    } catch (e) {
      // Si falla, no autocompleta
    }
  }

  const handleDateRangeSelect = (start: string, end: string) => {
    setDateRange({ start, end })
  }

  // Filtrado de clientes: los vendedores solo ven sus propios clientes
  const filteredClients = isVendedor
    ? clients.filter(client => (client.vendorId || client.vendor) === role)
    : clients.filter((client: any) => client && client.name)
    .filter((client: any) => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase())
      const vendorKey = (client.vendorId || client.vendor || '').replace(/ /g, '_').toLowerCase()
        const matchesVendor = selectedVendor === "all" || vendorKey === selectedVendor
      return matchesSearch && matchesVendor
      });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Clientes", 14, 16);
    const tableColumn = [
      "Nombre/Razón Social",
      "RIF",
      "SADA",
      "Vendedor",
      "Dirección"
    ];
    const tableRows = filteredClients.map((client) => [
      client.name,
      client.rif,
      client.sada,
      vendedorNombres[client.vendorId || client.vendor] || client.vendorId || client.vendor || '-',
      client.address
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 22 });
    doc.save("clientes.pdf");
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredClients.map((client) => ({
      "Nombre/Razón Social": client.name,
      "RIF": client.rif,
      "SADA": client.sada,
      "Vendedor": vendedorNombres[client.vendorId || client.vendor] || client.vendorId || client.vendor || '-',
      "Dirección": client.address
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "clientes.xlsx");
  };

  const fetchClients = async () => {
    const res = await fetch('/api/clientes')
    const data = await res.json()
    setClients(data)
  }

  useEffect(() => { fetchClients() }, [])

  const handleSaveClient = async () => {
    if (!selectedLocation || !newClient.name || !newClient.rif || !newClient.vendor) return;
    setSaving(true)
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newClient,
        address,
        location: selectedLocation
      })
    })
    setSaving(false)
    if (res.ok) {
      setShowAddForm(false)
      setNewClient({ name: '', rif: '', sada: '', vendor: '', address: '', location: null })
      setAddress("")
      setSelectedLocation(null)
      fetchClients()
    }
  }

  const handleEditClient = (client: any) => {
    setEditClient({ ...client })
    setAddress(client.address || "")
    setSelectedLocation(client.location || null)
    setShowEditForm(true)
  }

  const handleSaveEditClient = async () => {
    if (!editClient.name || !editClient.rif || !editClient.vendor) return;
    setSaving(true)
    const res = await fetch('/api/clientes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editClient,
        address,
        location: selectedLocation || editClient.location || null
      })
    })
    setSaving(false)
    if (res.ok) {
      setShowEditForm(false)
      setEditClient(null)
      setAddress("")
      setSelectedLocation(null)
      fetchClients()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-dashboard-enter visitas-responsive">
      <div className="max-w-2xl mx-auto px-2 py-2">
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <CardTitle className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-orange-600" />
            Módulo de Clientes
            {canAddClient && (
              <Button className="ml-auto" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4" /> Agregar Cliente
              </Button>
            )}
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
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[600px] w-full text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre/Razón Social</TableHead>
                  <TableHead>RIF</TableHead>
                  <TableHead>SADA</TableHead>
                  {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                    <TableHead>Vendedor</TableHead>
                  )}
                  <TableHead>Dirección</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client: any, idx: number) => (
                  <TableRow key={client.id || idx}>
                    <TableCell className="font-medium">{client?.name ?? ''}</TableCell>
                    <TableCell>{client?.rif ?? ''}</TableCell>
                    <TableCell>{client?.sada ?? ''}</TableCell>
                    {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                      <TableCell>{vendedorNombres[client?.vendorId || client?.vendor] || client?.vendorId || client?.vendor || '-'}</TableCell>
                    )}
                    <TableCell className="max-w-xs">
                      <div className="truncate">{client?.address ?? ''}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalles del Cliente</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <p>
                                    <strong>Nombre:</strong> {client?.name ?? ''}
                                  </p>
                                  <p>
                                    <strong>RIF:</strong> {client?.rif ?? ''}
                                  </p>
                                  <p>
                                    <strong>SADA:</strong> {client?.sada ?? ''}
                                  </p>
                                  {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                                  <p>
                                    <strong>Vendedor:</strong> {vendedorNombres[client?.vendorId || client?.vendor] || client?.vendorId || client?.vendor || '-'}
                                  </p>
                                  )}
                                  <p>
                                    <strong>Dirección:</strong> {client?.address ?? ''}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <strong>Ubicación:</strong>
                                <LeafletMap
                                  height={200}
                                  center={client?.location ? [client.location.lat, client.location.lng] : [10.6316, -71.6444]}
                                  selectedLocation={client?.location ?? undefined}
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {canAddClient && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleEditClient(client)}>
                              <Edit className="h-4 w-4" />
                            </Button>
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
        {/* Modales */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre o Razón Social</Label>
                    <Input id="name" placeholder="Nombre del cliente" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="rif">RIF</Label>
                    <Input id="rif" placeholder="J-12345678-9" value={newClient.rif} onChange={e => setNewClient({ ...newClient, rif: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="sada">SADA</Label>
                    <Input id="sada" placeholder="Código SADA" value={newClient.sada} onChange={e => setNewClient({ ...newClient, sada: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="vendor">Asignar Vendedor</Label>
                    <Select value={newClient.vendor} onValueChange={v => setNewClient({ ...newClient, vendor: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar vendedor" />
                      </SelectTrigger>
                      <SelectContent>
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
                  <div>
                    <Label htmlFor="address">Dirección</Label>
                    <Textarea id="address" placeholder="Dirección completa del cliente" rows={3} value={address} onChange={e => { setAddress(e.target.value); setNewClient({ ...newClient, address: e.target.value }) }} />
                  </div>
                  {selectedLocation && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Ubicación seleccionada:</p>
                      <p className="text-sm text-green-600">
                        Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* Map Section */}
              <div className="space-y-4">
                <div>
                  <Label>Ubicación en el Mapa</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Haga clic en el mapa para seleccionar la ubicación del cliente
                  </p>
                  <LeafletMap
                    height={350}
                    center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [10.6316, -71.6444]}
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={selectedLocation ?? undefined}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
              <Button disabled={!selectedLocation || saving} onClick={handleSaveClient}>Guardar Cliente</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            {editClient ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Nombre o Razón Social</Label>
                      <Input id="edit-name" placeholder="Nombre del cliente" value={editClient.name} onChange={e => setEditClient({ ...editClient, name: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="edit-rif">RIF</Label>
                      <Input id="edit-rif" placeholder="J-12345678-9" value={editClient.rif} onChange={e => setEditClient({ ...editClient, rif: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="edit-sada">SADA</Label>
                      <Input id="edit-sada" placeholder="Código SADA" value={editClient.sada} onChange={e => setEditClient({ ...editClient, sada: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="edit-vendor">Asignar Vendedor</Label>
                      <Select value={editClient.vendor} onValueChange={v => setEditClient({ ...editClient, vendor: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar vendedor" />
                        </SelectTrigger>
                        <SelectContent>
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
                    <div>
                      <Label htmlFor="edit-address">Dirección</Label>
                      <Textarea id="edit-address" placeholder="Dirección completa del cliente" rows={3} value={address} onChange={e => { setAddress(e.target.value); setEditClient({ ...editClient, address: e.target.value }) }} />
                    </div>
                    {selectedLocation && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800">Ubicación seleccionada:</p>
                        <p className="text-sm text-green-600">
                          Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Map Section */}
                <div className="space-y-4">
                  <div>
                    <Label>Ubicación en el Mapa</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      Haga clic en el mapa para seleccionar la ubicación del cliente
                    </p>
                    <LeafletMap
                      height={350}
                      center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [10.6316, -71.6444]}
                      onLocationSelect={handleLocationSelect}
                      selectedLocation={selectedLocation ?? undefined}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-red-500">No hay cliente seleccionado para editar.</div>
            )}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditForm(false)}>
                Cancelar
              </Button>
              <Button disabled={!editClient || !editClient.name || !editClient.rif || !editClient.vendor || saving} onClick={handleSaveEditClient}>Guardar Cambios</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DateRangePicker
        open={showDatePicker}
        onOpenChange={setShowDatePicker}
        onDateRangeSelect={handleDateRangeSelect}
      />
    </div>
  )
}
