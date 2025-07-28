"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navigation, Clock, User, Plus, CheckCircle, Package, Route } from "lucide-react"
import LeafletMap from "@/components/leaflet-map"
import CreateRouteForm from "@/components/create-route-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { products } from "@/data/products"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import PedidoForm from "@/components/PedidoForm"
import { USER_CREDENTIALS } from "../data/user-credentials";

interface RouteControlProps {
  role: string
  usuario?: string
}

export default function RouteControlModule({ role, usuario }: RouteControlProps) {
  const [selectedVendor, setSelectedVendor] = useState("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showClientForm, setShowClientForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [clientStatus, setClientStatus] = useState("")
  const [reason, setReason] = useState("")
  const [observations, setObservations] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [priceType, setPriceType] = useState("Al BCV")
  const [showRouteDialog, setShowRouteDialog] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [modalClient, setModalClient] = useState<any>(null);
  const [modalRouteId, setModalRouteId] = useState<number|null>(null);
  const [modalClientIdx, setModalClientIdx] = useState<number|null>(null);
  const [modalNewStatus, setModalNewStatus] = useState<string>("");
  const [addOrderProducts, setAddOrderProducts] = useState<any[]>([]);
  const [addOrderPriceType, setAddOrderPriceType] = useState("Al BCV");
  const [visitError, setVisitError] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [editRoute, setEditRoute] = useState<any>(null);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [zonaFiltro, setZonaFiltro] = useState("all");
  const ubicacionInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    const res = await fetch('/api/rutas')
    const data = await res.json()
    setRoutes(data)
  }

  const handleCreateFormChange = (open: boolean) => {
    setShowCreateForm(open)
    if (!open) fetchRoutes()
  }

  const handleEditFormChange = (open: boolean) => {
    setShowEditForm(open);
    if (!open) fetchRoutes();
  }

  const vendors = [
    { id: "susan_moran", name: "Susan Moran", type: "Masivo" },
    { id: "edwar_ruiz", name: "Edwar Ruíz", type: "Masivo" },
    { id: "reinaldo_rojo", name: "Reinaldo Rojo", type: "Masivo" },
    { id: "victor_hinestroza", name: "Víctor Hinestroza", type: "Masivo" },
    { id: "gerardo_hernandez", name: "Gerardo Hernández", type: "Masivo" },
    { id: "keinder_montilla", name: "Keinder Montilla", type: "Moto" },
    { id: "denys_fernandez", name: "Denys Fernández", type: "Moto" },
  ]

  const handleProductChange = (productId: string, field: string, value: any) => {
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.id === productId)
      if (existing) {
        return prev.map((p) => (p.id === productId ? { ...p, [field]: value } : p))
      } else {
        const product = products.find((p) => p.id === productId)
        return [
          ...prev,
          {
            id: productId,
            name: product?.name || "",
            [field]: value,
            priceType: "perSack",
            quantity: 1,
            unitPrice: 0,
            applyDiscount: false,
          },
        ]
      }
    })
  }

  const calculateProductTotal = (product: any) => {
    if (!product.quantity) return 0
    const productData = products.find((p) => p.id === product.id)
    if (!productData) return 0

    let basePrice = 0
    if (priceType === "Al BCV") {
      basePrice = product.priceType === "perSack" ? productData.priceAlBCV.perSack : productData.priceAlBCV.perKg
    } else {
      basePrice = product.priceType === "perSack" ? productData.priceDivisas.perSack : productData.priceDivisas.perKg
    }

    const finalPrice = product.applyDiscount ? product.unitPrice : basePrice
    return Math.round(product.quantity) * finalPrice // Round quantity for sacks
  }

  const calculateOrderTotal = () => {
    return selectedProducts.reduce((total, product) => {
      return total + calculateProductTotal(product)
    }, 0)
  }

  const completeRoute = (routeId: string) => {
    console.log(`Completing route ${routeId}`)
    // Here you would update the route status to completed
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_visited":
        return "bg-red-500"
      case "visited":
        return "bg-yellow-500"
      case "order_placed":
        return "bg-green-500"
      default:
        return "bg-gray-500"
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

  // Determinar si el usuario es vendedor por nombre de usuario
  const vendedorCreds = USER_CREDENTIALS.find((u: any) => u.usuario === (usuario || role));
  const esRolVendedor = !!(vendedorCreds && vendedorCreds.rol && vendedorCreds.rol.toLowerCase().includes('vendedor'));
  const miVendorId = vendedorCreds ? vendedorCreds.vendorId : null;

  // Filtrado de rutas: los vendedores ven todas sus rutas asignadas
  let filteredRoutes = routes;
  if (esRolVendedor && miVendorId) {
    filteredRoutes = routes.filter(route =>
      (route.vendorId || '').toLowerCase() === miVendorId.toLowerCase()
    );
  } else {
    filteredRoutes = selectedVendor === "all" ? routes : routes.filter(route => route.vendorId === selectedVendor);
  }

  // Solo mostrar filtros si NO es vendedor
  const canFilterZona = !esRolVendedor && (zonaFiltro === 'all' || zonaFiltro === 'Todas');
  const canFilterVendedor = !esRolVendedor;

  // useEffect para setSelectedVendor solo para no vendedores
  useEffect(() => {
    if (!esRolVendedor) setSelectedVendor(selectedVendor)
  }, [esRolVendedor, selectedVendor])

  // useEffect para fetchUbicaciones
  useEffect(() => {
    let stopped = false;
    async function fetchUbicaciones() {
      let url = "/api/ubicacion";
      if (esRolVendedor && miVendorId) {
        url += `?vendedor=${miVendorId}`;
      } else if (zonaFiltro !== "all") {
        url += `?zona=${zonaFiltro}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!stopped) setUbicaciones(data);
    }
    fetchUbicaciones();
    ubicacionInterval.current = setInterval(fetchUbicaciones, 10000);
    return () => {
      stopped = true;
      if (ubicacionInterval.current) clearInterval(ubicacionInterval.current);
    };
  }, [role, esRolVendedor, zonaFiltro, miVendorId]);

  const zonasDisponibles: string[] = ["Todas", "Zulia", "Centro", "Falcón", "Machiques"];

  console.log('role:', role);
  console.log('filteredRoutes:', filteredRoutes);
  return (
    <div className="min-h-screen bg-gray-50 animate-dashboard-enter visitas-responsive modulo-dimension">
      <div className="max-w-2xl mx-auto px-2 py-2">
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <CardTitle className="flex items-center gap-2 mb-4">
            <Route className="h-5 w-5 text-blue-600" />
            Control de Rutas
            {(["desarrollador", "gerencia", "planificación", "planificacion", "route_planner", "presidencia"].includes(role?.toLowerCase())) && (
              <Button className="flex items-center gap-2 ml-auto" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4" />
                Crear Nueva Ruta
              </Button>
            )}
          </CardTitle>
          <div className="flex gap-4 flex-wrap">
            {canFilterZona && (
              <Select value={zonaFiltro} onValueChange={setZonaFiltro}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por Zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Zonas</SelectItem>
                  {zonasDisponibles.filter(z => z !== "Todas").map(zona => (
                    <SelectItem key={zona} value={zona}>{zona}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {canFilterVendedor && (
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
          {/* Leyenda de estados */}
          <div className="flex gap-4 text-sm flex-wrap mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>No Visitado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Visitado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Pedido Realizado</span>
            </div>
          </div>
        </div>

        {/* Bloque 2: Mapa */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <CardTitle className="flex items-center gap-2 mb-4">
            <Navigation className="h-5 w-5 text-gray-600" />
            Mapa de Rutas
          </CardTitle>
          <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
            <LeafletMap
              key={filteredRoutes.map(r => r.id).join('-') + JSON.stringify(ubicaciones)}
              routes={filteredRoutes}
              selectedVendor={miVendorId || selectedVendor}
              height={400}
              showRouteLines={true}
              center={[10.6316, -71.6444]}
              ubicaciones={esRolVendedor && miVendorId ? ubicaciones.filter(u => u.usuario === miVendorId) : selectedVendor !== "all" ? ubicaciones.filter(u => u.usuario === selectedVendor) : ubicaciones}
            />
            {filteredRoutes.length === 0 && (
              <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow">
                No hay rutas asignadas actualmente
              </div>
            )}
          </div>
        </div>

        {/* Solo para vendedores: Mi Ruta Actual */}
        {esRolVendedor && (
          <div className="bg-white rounded-lg border p-4 mt-6">
            <h2 className="text-2xl font-bold mb-6">Mi Ruta Actual</h2>
            {filteredRoutes.map((route) => (
              <div key={route.id} className="bg-white rounded-lg border mb-6 p-4 shadow-sm">
                {/* Layout en columna para móvil */}
                <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-bold text-lg">{route.name}</div>
                    <div className="text-gray-600 text-sm mt-1">
                      <div>{route.vendor}</div>
                      <div>{route.date}</div>
                    </div>
                    <div className="mt-2">
                      {route.status === "Completada" ? (
                        <span className="inline-block rounded-full bg-black text-white px-3 py-1 text-xs font-semibold">Completada</span>
                      ) : (
                        <span className="inline-block rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-xs font-semibold">En Progreso</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 mt-2 w-full max-w-xs">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={route.status === "Completada"}
                        onClick={async () => {
                          if (route.status !== "Completada") {
                            const updatedRoutes = routes.map(r =>
                              r.id === route.id ? { ...r, status: "Completada" } : r
                            );
                            setRoutes(updatedRoutes);
                            await fetch('/api/rutas', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...route, status: "Completada" })
                            });
                          }
                        }}
                      >
                        Actualizar Estado
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">Ver Ruta</Button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 mb-1 font-medium text-gray-800">Clientes en la Ruta:</div>
                <div className="space-y-2">
                  {route.clients.map((client: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded px-4 py-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-medium">{client.name}</div>
                        {/* Estado debajo del nombre, con color */}
                        <div className="mt-1">
                          {client.status === 'not_visited' && (
                            <span className="inline-block rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">No Visitado</span>
                          )}
                          {client.status === 'visited' && (
                            <span className="inline-block rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-semibold">Visitado</span>
                          )}
                          {client.status === 'order_placed' && (
                            <span className="inline-block rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs font-semibold">Pedido Realizado</span>
                          )}
                        </div>
                        <Button variant="outline" size="sm" className="mt-2 w-full sm:w-auto" onClick={() => {
                          setModalClient(client);
                          setModalRouteId(route.id);
                          setModalClientIdx(idx);
                          setModalNewStatus(client.status || "");
                          setShowUpdateModal(true);
                        }}>Actualizar Estado</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Solo para NO vendedores: Lista de Rutas */}
        {!esRolVendedor && (
          <div className="bg-white rounded-xl shadow p-2 sm:p-4 mt-4 overflow-x-auto w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Lista de Rutas</h2>
            <div className="min-w-[600px]">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-semibold py-2 px-2">Nombre de Ruta</th>
                    {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                    <th className="text-left font-semibold py-2 px-2">Vendedor</th>
                    )}
                    <th className="text-left font-semibold py-2 px-2">Fecha</th>
                    <th className="text-left font-semibold py-2 px-2">Clientes</th>
                    <th className="text-left font-semibold py-2 px-2">Visitados</th>
                    <th className="text-left font-semibold py-2 px-2">Pedidos</th>
                    <th className="text-left font-semibold py-2 px-2">Estado</th>
                    <th className="text-left font-semibold py-2 px-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoutes.map((route) => {
                    const totalClientes = route.clients.length;
                    const visitados = route.clients.filter((c: any) => c.status === 'visited' || c.status === 'order_placed').length;
                    const pedidos = route.clients.filter((c: any) => c.status === 'order_placed').length;
                    return (
                      <tr key={route.id} className="border-b last:border-0">
                        <td className="py-2 px-2 font-medium">{route.name}</td>
                        {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                          <td className="py-2 px-2">{route.vendor || '-'}</td>
                        )}
                        <td className="py-2 px-2">{route.date}</td>
                        <td className="py-2 px-2">{totalClientes}</td>
                        <td className="py-2 px-2">
                          <span className="font-semibold text-green-700">{visitados}</span>
                          <span className="text-gray-500">/{totalClientes}</span>
                        </td>
                        <td className="py-2 px-2">{pedidos}</td>
                        <td className="py-2 px-2">
                          {route.status === "Completada" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">
                              <CheckCircle className="w-4 h-4" /> Terminada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-semibold">
                              <Clock className="w-4 h-4" /> En proceso
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {/* Acciones */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CreateRouteForm open={showCreateForm} onOpenChange={handleCreateFormChange} />
      {showEditForm && (
        <CreateRouteForm open={showEditForm} onOpenChange={handleEditFormChange} route={editRoute} isEdit />
      )}

      {/* Dialogo de detalles de ruta */}
      {(role === "administrator" || role === "route_planner") && (
        <Dialog open={showRouteDialog} onOpenChange={setShowRouteDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de la Ruta</DialogTitle>
            </DialogHeader>
            {selectedRoute && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{selectedRoute.name}</h3>
                <p className="flex items-center gap-2 text-gray-700 text-sm">
                  <User className="h-4 w-4" /> {selectedRoute.vendor}
                </p>
                <p className="flex items-center gap-2 text-gray-700 text-sm">
                  <Clock className="h-4 w-4" /> {selectedRoute.date}
                </p>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Clientes en la Ruta:</h4>
                <div className="space-y-2">
                    {selectedRoute.clients.map((client: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded p-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(client.status)}`}></div>
                        <span className="font-medium">{client.name}</span>
                        <Badge variant={
                          client.status === 'visited' ? 'secondary' :
                          client.status === 'order_placed' ? 'default' :
                          'destructive'
                        }>
                          {getStatusText(client.status)}
                        </Badge>
                      </div>
                    ))}
                                    </div>
                                  </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Mapa de la Ruta:</h4>
                  <LeafletMap
                    height={350}
                    center={selectedRoute.clients[0]?.location ? [selectedRoute.clients[0].location.lat, selectedRoute.clients[0].location.lng] : [10.6316, -71.6444]}
                    routes={[selectedRoute]}
                    showRouteLines={true}
                                                  />
                                                </div>
                                </div>
                              )}
                          </DialogContent>
                        </Dialog>
                      )}

      {showUpdateModal && modalClient && (
        <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar Estado - {modalClient.name}</DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <Label>Estado de la Visita</Label>
              <Select value={modalNewStatus} onValueChange={setModalNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_visited">Sin Visitar</SelectItem>
                  <SelectItem value="visited">Visitado</SelectItem>
                  <SelectItem value="order_placed">Pedido Realizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {modalNewStatus === "not_visited" && (
              <div className="mb-4">
                <Label>Motivo</Label>
                <Textarea
                  placeholder="Explique el motivo por el cual no se pudo visitar al cliente..."
                  value={modalClient?.reason || ""}
                  onChange={e => setModalClient({ ...modalClient, reason: e.target.value })}
                />
                {visitError && <div className="text-red-600 text-sm font-medium">{visitError}</div>}
              </div>
            )}
            {modalNewStatus === "visited" && (
              <div className="mb-4">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Ingrese sus observaciones sobre la visita..."
                  value={modalClient?.observations || ""}
                  onChange={e => setModalClient({ ...modalClient, observations: e.target.value })}
                />
                {visitError && <div className="text-red-600 text-sm font-medium">{visitError}</div>}
              </div>
            )}
            {modalNewStatus === "order_placed" && (
              <PedidoForm
                products={products}
                addOrderProducts={addOrderProducts}
                setAddOrderProducts={setAddOrderProducts}
                addOrderPriceType={addOrderPriceType}
                setAddOrderPriceType={setAddOrderPriceType}
                onSave={async () => {
                  if (modalRouteId !== null && modalClientIdx !== null) {
                    const route = routes.find(r => r.id === modalRouteId);
                    const client = route?.clients[modalClientIdx];
                    // Construir productos del pedido
                    const orderProducts = addOrderProducts.map((p: any) => {
                      if (!p) return null;
                      const prod = products.find(prod => prod.id === p.id);
                      if (!prod) return null;
                      const unitPrice = addOrderPriceType === "Al BCV"
                        ? (p.priceType === "perKg" ? prod.priceAlBCV.perKg : prod.priceAlBCV.perSack)
                        : (p.priceType === "perKg" ? prod.priceDivisas.perKg : prod.priceDivisas.perSack);
                      const finalUnitPrice = p.applyDiscount ? (p.unitPrice || unitPrice) : unitPrice;
                      return {
                        productId: p.id,
                        quantity: Number(p.quantity),
                        priceType: p.priceType || "perSack",
                        unitPrice: finalUnitPrice,
                        subtotal: Number(p.quantity) * finalUnitPrice
                      };
                    }).filter(Boolean);
                    // Calcular total
                    const total = orderProducts.reduce((sum, p) => p ? sum + p.subtotal : sum, 0);
                    // Construir pedido
                    const now = new Date();
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    const date = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
                    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
                    const orderId = `ORD-${now.getTime()}-${client.id}`;
                    const newOrder = {
                      id: orderId,
                      clientId: client.id.toString(),
                      vendorId: route.vendorId,
                      date,
                      time,
                      products: orderProducts,
                      paymentType: addOrderPriceType,
                      total,
                      status: "order_placed"
                    };
                    // Guardar pedido en la API
                    await fetch('/api/pedidos', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newOrder)
                    });
                    // Actualizar la ruta
                    const updatedRoutes = routes.map((r) => {
                      if (r.id === modalRouteId) {
                        return {
                          ...r,
                          clients: r.clients.map((c: any, i: number) =>
                            i === modalClientIdx ? { ...c, status: modalNewStatus, pedido: orderProducts, paymentType: addOrderPriceType } : c
                          ),
                        }
                      }
                      return r;
                    });
                    setRoutes(updatedRoutes);
                    await fetch(`/api/rutas`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ...route, clients: updatedRoutes.find(r => r.id === modalRouteId).clients }),
                    });
                  }
                  setShowUpdateModal(false);
                  setAddOrderProducts([]);
                }}
                onCancel={() => {
                  setShowUpdateModal(false);
                  setAddOrderProducts([]);
                }}
                saving={false}
                isVendedor={false}
                vendedores={vendors}
                selectedVendor={selectedVendor}
                setSelectedVendor={setSelectedVendor}
                clientes={routes.find(r => r.id === modalRouteId)?.clients || []}
                selectedClient={modalClient?.id?.toString() || ""}
                setSelectedClient={v => {
                  const route = routes.find(r => r.id === modalRouteId);
                  const idx = route?.clients.findIndex((c: any) => c.id.toString() === v);
                  if (idx !== undefined && idx >= 0) {
                    setModalClient(route.clients[idx]);
                    setModalClientIdx(idx);
                  }
                }}
              />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUpdateModal(false)}>Cancelar</Button>
              <Button onClick={async () => {
                if (modalRouteId !== null && modalClientIdx !== null) {
                  if (modalNewStatus === "not_visited" && !modalClient?.reason) {
                    setVisitError("El motivo es obligatorio.");
                    return;
                  }
                  if (modalNewStatus === "visited" && !modalClient?.observations) {
                    setVisitError("Las observaciones son obligatorias.");
                    return;
                  }
                  setVisitError("");
                  const route = routes.find(r => r.id === modalRouteId);
                  const client = route?.clients[modalClientIdx];
                  const now = new Date();
                  const pad = (n: number) => n.toString().padStart(2, '0');
                  const date = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
                  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
                  // Guardar visita
                  if (["not_visited", "visited"].includes(modalNewStatus)) {
                    const visitId = `VIS-${now.getTime()}-${client.id}`;
                    const visita = {
                      id: visitId,
                      clientId: client.id.toString(),
                      client: client.name,
                      vendorId: route.vendorId,
                      routeId: route.id,
                      date,
                      time,
                      status: modalNewStatus,
                      ...(modalNewStatus === "not_visited" ? { reason: modalClient.reason } : { observations: modalClient.observations })
                    };
                    await fetch('/api/visitas', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(visita)
                    });
                  }
                  // Guardar pedido si es order_placed
                  if (modalNewStatus === "order_placed") {
                    const orderProducts = addOrderProducts.map((p: any) => {
                      if (!p) return null;
                      const prod = products.find(prod => prod.id === p.id);
                      if (!prod) return null;
                      const unitPrice = addOrderPriceType === "Al BCV"
                        ? (p.priceType === "perKg" ? prod.priceAlBCV.perKg : prod.priceAlBCV.perSack)
                        : (p.priceType === "perKg" ? prod.priceDivisas.perKg : prod.priceDivisas.perSack);
                      const finalUnitPrice = p.applyDiscount ? (p.unitPrice || unitPrice) : unitPrice;
                      return {
                        productId: p.id,
                        quantity: Number(p.quantity),
                        priceType: p.priceType || "perSack",
                        unitPrice: finalUnitPrice,
                        subtotal: Number(p.quantity) * finalUnitPrice
                      };
                    }).filter(Boolean);
                    const total = orderProducts.reduce((sum, p) => p ? sum + p.subtotal : sum, 0);
                    const orderId = `ORD-${now.getTime()}-${client.id}`;
                    const newOrder = {
                      id: orderId,
                      clientId: client.id.toString(),
                      vendorId: route.vendorId,
                      date,
                      time,
                      products: orderProducts,
                      paymentType: addOrderPriceType,
                      total,
                      status: "order_placed"
                    };
                    await fetch('/api/pedidos', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newOrder)
                    });
                  }
                  // Actualizar la ruta
                  const updatedRoutes = routes.map((r) => {
                    if (r.id === modalRouteId) {
                      return {
                        ...r,
                        clients: r.clients.map((c: any, i: number) => {
                          if (i === modalClientIdx) {
                            let extra = {};
                            if (modalNewStatus === "not_visited") extra = { reason: modalClient?.reason || "" };
                            if (modalNewStatus === "visited") extra = { observations: modalClient?.observations || "" };
                            if (modalNewStatus === "order_placed") extra = { pedido: addOrderProducts, paymentType: addOrderPriceType };
                            return { ...c, status: modalNewStatus, ...extra };
                          }
                          return c;
                        }),
                      }
                    }
                    return r;
                  });
                  setRoutes(updatedRoutes);
                  await fetch(`/api/rutas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...routes.find(r => r.id === modalRouteId), clients: updatedRoutes.find(r => r.id === modalRouteId).clients }),
                  });
                }
                setShowUpdateModal(false);
              }}>Actualizar Estado</Button>
            </div>
                          </DialogContent>
                        </Dialog>
                      )}
    </div>
  )
}
