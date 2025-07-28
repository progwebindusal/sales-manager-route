"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LeafletMap from "@/components/leaflet-map"
import { MapPin, User, Route } from "lucide-react"
import { USER_CREDENTIALS } from "../data/user-credentials"

interface CreateRouteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route?: any
  isEdit?: boolean
}

export default function CreateRouteForm({ open, onOpenChange, route, isEdit }: CreateRouteFormProps) {
  const [routeName, setRouteName] = useState("")
  const [selectedVendor, setSelectedVendor] = useState("")
  const [routeDate, setRouteDate] = useState("")
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [clientOrder, setClientOrder] = useState<{ [key: string]: number }>({})
  const [allClients, setAllClients] = useState<any[]>([])

  const vendors = [
    { id: "susan_moran", name: "Susan Moran", type: "Masivo" },
    { id: "edwar_ruiz", name: "Edwar Ruíz", type: "Masivo" },
    { id: "reinaldo_rojo", name: "Reinaldo Rojo", type: "Masivo" },
    { id: "victor_hinestroza", name: "Víctor Hinestroza", type: "Masivo" },
    { id: "gerardo_hernandez", name: "Gerardo Hernández", type: "Masivo" },
    { id: "keinder_montilla", name: "Keinder Montilla", type: "Moto" },
    { id: "denys_fernandez", name: "Denys Fernández", type: "Moto" },
  ]

  // Cargar clientes reales desde la API
  useEffect(() => {
    const fetchClients = async () => {
      const res = await fetch('/api/clientes')
      const data = await res.json()
      setAllClients(data)
    }
    fetchClients()
  }, [])

  useEffect(() => {
    if (isEdit && route) {
      setRouteName(route.name || "")
      setSelectedVendor(route.vendorId || "")
      setRouteDate(route.date || "")
      setSelectedClients(route.clients ? route.clients.map((c: any) => c.id) : [])
      const orderObj: { [key: string]: number } = {}
      if (route.clients) {
        route.clients.forEach((c: any, idx: number) => { orderObj[c.id] = idx + 1 })
      }
      setClientOrder(orderObj)
    }
  }, [isEdit, route])

  const filteredClients = selectedVendor ? allClients.filter((client) => client.vendor === selectedVendor) : []

  const handleClientToggle = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients((prev) => {
        const newSelected = [...prev, clientId]
        setClientOrder((prevOrder) => ({ ...prevOrder, [clientId]: newSelected.length }))
        return newSelected
      })
    } else {
      setSelectedClients((prev) => {
        const newSelected = prev.filter((id) => id !== clientId)
        const newOrder = { ...clientOrder }
        delete newOrder[clientId]
        setClientOrder(newOrder)
        return newSelected
      })
    }
  }

  const getRoutePreviewData = () => {
    const clients = selectedClients
      .map((clientId) => {
        const client = allClients.find((c) => c.id === clientId)
        return {
          ...client,
          status: "not_visited",
          order: clientOrder[clientId] || 0,
        }
      })
      .sort((a, b) => a.order - b.order)

    return [
      {
        id: "preview",
        name: routeName || "Nueva Ruta",
        vendor: vendors.find((v) => v.id === selectedVendor)?.name || "",
        vendorId: selectedVendor,
        status: "planned",
        clients,
      },
    ]
  }

  const getVendorUsuario = (vendorId: string) => {
    const cred = USER_CREDENTIALS.find((u: any) => u.vendorId === vendorId);
    return cred ? cred.usuario : vendorId;
  };

  const handleSave = async () => {
    // Obtener el vendorId real (no el usuario)
    const cred = USER_CREDENTIALS.find((u: any) => u.usuario === selectedVendor || u.vendorId === selectedVendor);
    const realVendorId = cred ? cred.vendorId : selectedVendor;
    const routeData = {
      name: routeName,
      vendor: vendors.find((v) => v.id === selectedVendor)?.name || "",
      vendorId: realVendorId, // Guardar vendorId correcto
      date: routeDate,
      status: isEdit && route ? route.status : "planned",
      clients: selectedClients.map((id) => {
        const client = allClients.find((c) => c.id === id);
        let location = client?.location;
        if (!location) {
          const match = allClients.find((c) => c.id === id && c.location);
          if (match) location = match.location;
        }
        return {
          ...client,
          location,
          status: isEdit && route ? (route.clients.find((c: any) => c.id === id)?.status || "not_visited") : "not_visited",
          order: clientOrder[id] || 0,
        };
      }).sort((a, b) => a.order - b.order),
    };
    await fetch('/api/rutas', {
      method: isEdit && route ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit && route ? { ...routeData, id: route.id } : routeData),
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            {isEdit ? "Editar Ruta" : "Crear Nueva Ruta"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de la Ruta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="routeName">Nombre de la Ruta</Label>
                  <Input
                    id="routeName"
                    placeholder="Ej: Ruta Centro Maracaibo"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="vendor">Seleccionar Vendedor</Label>
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {vendor.name} ({vendor.type})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Fecha de la Ruta</Label>
                  <Input
                    id="date"
                    type="date"
                    value={routeDate}
                    onChange={(e) => setRouteDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </CardContent>
            </Card>

            {selectedVendor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seleccionar Clientes</CardTitle>
                  <p className="text-sm text-gray-600">
                    Los clientes se ordenarán automáticamente según el orden de selección
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {filteredClients.map((client, idx) => (
                      <div key={client.id || idx} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={selectedClients.includes(client.id)}
                          onCheckedChange={(checked) => handleClientToggle(client.id, !!checked)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{client.name}</div>
                          {selectedClients.includes(client.id) && (
                            <div className="text-sm text-blue-600">Orden: {clientOrder[client.id]}</div>
                          )}
                        </div>
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map Preview Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vista Previa de la Ruta</CardTitle>
              </CardHeader>
              <CardContent>
                <LeafletMap
                  routes={getRoutePreviewData()}
                  height={400}
                  showRouteLines={true}
                  center={[10.6316, -71.6444]}
                />

                {selectedClients.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Resumen de la Ruta:</h4>
                    <div className="text-sm text-blue-800">
                      <p>• {selectedClients.length} clientes seleccionados</p>
                      <p>• Vendedor: {vendors.find((v) => v.id === selectedVendor)?.name}</p>
                      <p>• Fecha: {routeDate || "No especificada"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!routeName || !selectedVendor || !routeDate || selectedClients.length === 0}
          >
            {isEdit ? "Guardar Cambios" : "Crear Ruta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
