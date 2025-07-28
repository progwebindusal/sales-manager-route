"use client"

import { useState, useEffect } from "react"
import pedidosData from "@/data/pedidos.json";
import clientesData from "@/data/clientes.json";
import { products as allProducts } from "@/data/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RotateCcw, Download, Calendar, Eye, Plus, FileText } from "lucide-react"

interface ReturnsModuleProps {
  role: string
}

export default function ReturnsModule({ role }: ReturnsModuleProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVendor, setSelectedVendor] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [newReturn, setNewReturn] = useState<{
    orderId: string;
    products: { id: string; quantity: number }[];
    reason: string;
    date: string;
    processedBy: string;
    status: string;
    client: string;
    vendor: string;
    amount: number;
  }>({ orderId: '', products: [], reason: '', date: '', processedBy: '', status: 'returned', client: '', vendor: '', amount: 0 })
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [returns, setReturns] = useState<any[]>([])

  const availableOrders = pedidosData;
  // Obtener nombre de cliente por id
  const getClientName = (order: any) => {
    const cliente = clientesData.find((c: any) => String(c.id) === String(order.client) || String(c.id) === String(order.clientId));
    return cliente?.name || order.client;
  };

  const vendedoresUsernames = [
    "smoran", "eruiz", "ghernandez", "rrojo", "victorh", "dfernandez", "kmontilla", "jbolivar", "osanchez", "agarcia", "mcarreño", "iparedes", "frodriguez", "jortega", "csantander", "hhernandez", "ejaimes", "dmartinez", "jmedina", "egarcia", "yhernandez", "gcorona", "xcabarca", "jlarreal"
  ];
  const isVendedor = vendedoresUsernames.includes(role);

  const canAdd = true;

  const vendedores = [
    { id: "susan_moran", name: "Susan Moran" },
    { id: "edwar_ruiz", name: "Edwar Ruíz" },
    { id: "reinaldo_rojo", name: "Reinaldo Rojo" },
    { id: "victor_hinestroza", name: "Víctor Hinestroza" },
    { id: "gerardo_hernandez", name: "Gerardo Hernández" },
    { id: "keinder_montilla", name: "Keinder Montilla" },
    { id: "denys_fernandez", name: "Denys Fernández" },
  ]

  // Filtrado de devoluciones: los vendedores solo ven sus propias devoluciones
  const filteredReturns = isVendedor
    ? returns.filter(ret => (ret.vendor || ret.vendorId) === role)
    : returns.filter((returnItem) => {
        const matchesSearch = returnItem.client.toLowerCase().includes(searchTerm.toLowerCase()) || returnItem.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesVendor = selectedVendor === "all" || returnItem.vendor.replace(/ /g, '_').toLowerCase() === selectedVendor;
        const matchesDate = !dateRange || (returnItem.date >= dateRange.start && returnItem.date <= dateRange.end);
        return matchesSearch && matchesVendor && matchesDate;
      })

  // Cargar devoluciones desde la API
  const fetchReturns = async () => {
    const res = await fetch('/api/devoluciones')
    const data = await res.json()
    setReturns(data)
  }
  useEffect(() => { fetchReturns() }, [])

  const handleSaveReturn = async () => {
    setSaving(true);
    // Calcular monto total devuelto
    const amount = (newReturn.products || []).reduce((acc, p) => {
      const prod = allProducts.find(ap => ap.id === p.id);
      const price = prod ? prod.priceAlBCV.perSack : 0;
      return acc + (Number(p.quantity) * price);
    }, 0);
    const payload = {
      ...newReturn,
      amount,
      client: selectedOrder ? getClientName(selectedOrder) : '',
      vendor: selectedOrder ? selectedOrder.vendor : '',
    };
    const res = await fetch('/api/devoluciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (res.ok) {
      setShowAddForm(false);
      setNewReturn({ orderId: '', products: [], reason: '', date: '', processedBy: '', status: 'returned', client: '', vendor: '', amount: 0 });
      setSelectedOrder(null);
      fetchReturns();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-dashboard-enter p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="max-w-2xl mx-auto px-2 py-2">
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <CardTitle className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-red-600" />
            Módulo de Devoluciones
            <Button className="flex items-center gap-2" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4" /> Agregar Devolución
            </Button>
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Registrar Devolución</DialogTitle>
                </DialogHeader>
                <div className="mb-2">
                  <label>Orden:</label>
                  <select
                    value={newReturn.orderId}
                    onChange={e => {
                      const order = availableOrders.find((o: any) => o.id === e.target.value);
                      setSelectedOrder(order);
                      setNewReturn(r => ({ ...r, orderId: e.target.value, products: [] }));
                    }}
                    className="w-full border rounded p-1"
                  >
                    <option value="">Seleccione una orden</option>
                    {availableOrders.map(order => (
                      <option key={order.id} value={order.id}>
                        {order.id} - {getClientName(order)}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedOrder && (
                  <div className="mb-2">
                    <label>Productos a devolver:</label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad a devolver</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.products.map((prod: any, idx: number) => {
                          const productInfo = allProducts.find(p => p.id === prod.id);
                          const selected = (newReturn.products || []).find((p: any) => p.id === prod.id) || { quantity: 0 };
                          return (
                            <TableRow key={prod.id}>
                              <TableCell>{productInfo?.name || prod.id}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={prod.quantity}
                                  value={selected.quantity || ""}
                                  onChange={e => {
                                    const qty = Number(e.target.value);
                                    setNewReturn(r => ({
                                      ...r,
                                      products: [
                                        ...(r.products.filter((p: any) => p.id !== prod.id)),
                                        ...(qty > 0 ? [{ id: prod.id, quantity: qty }] : [])
                                      ]
                                    }));
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="mb-2">
                  <label>Fecha de devolución:</label>
                  <Input type="date" value={newReturn.date} onChange={e => setNewReturn(r => ({ ...r, date: e.target.value }))} />
                </div>
                <div className="mb-2">
                  <label>Procesado por:</label>
                  <Input value={newReturn.processedBy} onChange={e => setNewReturn(r => ({ ...r, processedBy: e.target.value }))} />
                </div>
                <div className="mb-2">
                  <label>Motivo de la devolución:</label>
                  <Textarea value={newReturn.reason} onChange={e => setNewReturn(r => ({ ...r, reason: e.target.value }))} />
                </div>
                <Button className="mt-2" onClick={handleSaveReturn} disabled={saving || !newReturn.orderId || !newReturn.date || !newReturn.processedBy || !newReturn.reason || !(newReturn.products && newReturn.products.length > 0)}>
                  Guardar Devolución
                </Button>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por cliente o número de devolución..."
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
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[600px] w-full text-xs sm:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Devolución</TableHead>
                    <TableHead>Nº Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                      <TableHead>Vendedor</TableHead>
                    )}
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto ($)</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Procesado Por</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((returnItem) => (
                    <TableRow key={returnItem.id}>
                      <TableCell className="font-medium">{returnItem.id}</TableCell>
                      <TableCell>{returnItem.orderId}</TableCell>
                      <TableCell>{returnItem.client}</TableCell>
                      {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                        <TableCell>{returnItem.vendor || '-'}</TableCell>
                      )}
                      <TableCell>{returnItem.date}</TableCell>
                      <TableCell>${returnItem.amount.toFixed(2)}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={returnItem.reason}>
                          {returnItem.reason}
                        </div>
                      </TableCell>
                      <TableCell>{returnItem.processedBy}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Detalles de la Devolución {returnItem.id}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p>
                                      <strong>Pedido:</strong> {returnItem.orderId}
                                    </p>
                                    <p>
                                      <strong>Cliente:</strong> {returnItem.client}
                                    </p>
                                    {/* {role !== "vendedor_moto" && <p><strong>Vendedor:</strong> {returnItem.vendor}</p>} */}
                                  </div>
                                  <div>
                                    <p>
                                      <strong>Fecha:</strong> {returnItem.date}
                                    </p>
                                    <p>
                                      <strong>Monto:</strong> ${returnItem.amount.toFixed(2)}
                                    </p>
                                    <p>
                                      <strong>Procesado por:</strong> {returnItem.processedBy}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <p>
                                    <strong>Motivo de la devolución:</strong>
                                  </p>
                                  <p className="mt-2 p-3 bg-gray-50 rounded-lg">{returnItem.reason}</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
