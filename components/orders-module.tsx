"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Package, Download, Calendar, Edit, Eye, Plus} from "lucide-react"
import DateRangePicker from "@/components/date-range-picker"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { products as allProducts } from "@/data/products"
import clientes from "@/data/clientes.json";
import PedidoForm from "./PedidoForm";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { USER_CREDENTIALS } from "../data/user-credentials";

interface OrdersModuleProps {
  role: string
}

export default function OrdersModule({ role }: OrdersModuleProps) {
  const orders = [
    {
      id: "ORD-001",
      client: "Restaurante La Plaza",
      vendor: "Juan Pérez",
      date: "2024-01-15",
      time: "11:30",
      total: 450.75,
      paymentType: "Al BCV",
      status: "order_placed",
      products: [
        { name: "SAL RECRISTALIZADA MONTE BLANCO: SACOS 25KG", quantity: 10, price: 18.9 },
        { name: "SAL REFINADA CRUZ DE ORO: SACOS 25KG", quantity: 15, price: 8.1 },
      ],
    },
    {
      id: "ORD-002",
      client: "Supermercado Central",
      vendor: "María González",
      date: "2024-01-15",
      time: "14:15",
      total: 320.5,
      paymentType: "DIVISAS",
      status: "order_placed",
      products: [
        { name: "SAL MICRONIZADA CRUZ DE ORO: SACOS 25KG", quantity: 8, price: 15.0 },
        { name: "MONTE BLANCO de 1X 12 UNIDADES: SALERO 500 gr", quantity: 12, price: 25.0 },
      ],
    },
  ]

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVendor, setSelectedVendor] = useState("all")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newOrder, setNewOrder] = useState({ client: '', products: [], paymentType: '', status: 'order_placed' })
  const [addOrderProducts, setAddOrderProducts] = useState<any[]>([])
  const [addOrderPriceType, setAddOrderPriceType] = useState("Al BCV")
  const [showDispatchDialog, setShowDispatchDialog] = useState(false)
  const [orderToDispatch, setOrderToDispatch] = useState<any>(null)
  const [ordersState, setOrdersState] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  // Estado para edición de pedido
  const [editOrderProducts, setEditOrderProducts] = useState<any[]>([]);
  const [editOrderPriceType, setEditOrderPriceType] = useState("");
  const [editOrderClient, setEditOrderClient] = useState("");
  const [editOrderVendor, setEditOrderVendor] = useState("");

  const canEdit = role === "route_planner" || role === "administrator" || role === "billing" || role === "collections"

  // Determinar si el usuario puede agregar pedidos
  const forbiddenRoles = ["facturación", "facturacion", "cobranza"];
  const canAddOrder = !forbiddenRoles.includes(role?.toLowerCase());

  // Before the exportToPDF function, add a type definition for OrderProduct

  type OrderProduct = {
    name: string;
    quantity: number;
    id: string;  // Add other properties if needed based on the structure
  };

  // Then in the exportToPDF function, use the new type
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Detalles de Pedidos", 14, 16);
    const tableColumn = [
      "Nº Pedido",
      "Cliente",
      "Vendedor",
      "Fecha",
      "Producto",
      "Cantidad",
      "Precio Unit.",
      "Subtotal",
      "Total Kg"
    ];
    const tableRows: any[] = [];
    filteredOrders.forEach((order: any) => {
      order.products.forEach((product: any) => {
        const prodDetails = allProducts.find(prod => prod.id === product.id);
        const totalKg = Number(product.quantity) * (prodDetails ? prodDetails.weight : 0);
        const precioUnitario = product.applyDiscount && product.unitPrice !== undefined
          ? product.unitPrice
          : product.price;
        tableRows.push([
          order.id,
          getClientName(order),
          vendedorNombres[getVendorId(order)] || getVendorId(order),
          order.date,
          product.name || allProducts.find(p => p.id === product.id)?.name || product.id,
          product.quantity,
          Number(precioUnitario).toFixed(2),
          (Number(product.quantity) * Number(precioUnitario)).toFixed(2),
          totalKg.toFixed(2) + " Kg"
        ]);
      });
    });
    // Ajuste de alineación y ancho de columnas
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 22,
      styles: { valign: 'middle', fontSize: 8 },
      headStyles: { fillColor: [240,240,240], halign: 'center', valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 18 }, // Nº Pedido
        1: { cellWidth: 38 }, // Cliente
        2: { cellWidth: 32 }, // Vendedor
        3: { cellWidth: 20 }, // Fecha
        4: { cellWidth: 38 }, // Producto
        5: { cellWidth: 15, halign: 'right' }, // Cantidad
        6: { cellWidth: 18, halign: 'right' }, // Precio Unit.
        7: { cellWidth: 18, halign: 'right' }, // Subtotal
        8: { cellWidth: 18, halign: 'right' }  // Total Kg
      }
    });
    doc.save("pedidos.pdf");
  };

  const exportToExcel = () => {
    const detalles = filteredOrders.flatMap((order: any) =>
      order.products.map((product: any) => {
        const prodDetails = allProducts.find(prod => prod.id === product.id);
        const totalKg = Number(product.quantity) * (prodDetails ? prodDetails.weight : 0);
        const precioUnitario = product.applyDiscount && product.unitPrice !== undefined
          ? product.unitPrice
          : product.price;
        return {
          "Nº Pedido": order.id,
          "Cliente": getClientName(order),
          "Vendedor": vendedorNombres[getVendorId(order)] || getVendorId(order),
          "Fecha": order.date,
          "Producto": product.name || allProducts.find(p => p.id === product.id)?.name || product.id,
          "Cantidad": product.quantity,
          "Precio Unit.": Number(precioUnitario).toFixed(2),
          "Subtotal": (Number(product.quantity) * Number(precioUnitario)).toFixed(2),
          "Total Kg": totalKg.toFixed(2) + " Kg"
        };
      })
    );
    const ws = XLSX.utils.json_to_sheet(detalles);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    XLSX.writeFile(wb, "pedidos.xlsx");
  };

  const handleDateRangeSelect = (start: string, end: string) => {
    setDateRange({ start, end })
  }

  // Obtener vendorId real del usuario logueado
  const vendedorCreds = USER_CREDENTIALS.find((u: any) => u.usuario === role || u.vendorId === role);
  const miVendorId = vendedorCreds ? vendedorCreds.vendorId : null;
  const isVendedor = !!miVendorId;

  // Determinar si el usuario es vendedor
  const vendedoresUsernames = [
    "smoran", "eruiz", "ghernandez", "rrojo", "victorh", "dfernandez", "kmontilla", "jbolivar", "osanchez", "agarcia", "mcarreño", "iparedes", "frodriguez", "jortega", "csantander", "hhernandez", "ejaimes", "dmartinez", "jmedina", "egarcia", "yhernandez", "gcorona", "xcabarca", "jlarreal"
  ];
  const isVendedorMasivoOMoto = role === 'Vendedor Masivo' || role === 'Vendedor Moto';

  const vendedores = [
    { id: "susan_moran", name: "Susan Moran" },
    { id: "edwar_ruiz", name: "Edwar Ruíz" },
    { id: "reinaldo_rojo", name: "Reinaldo Rojo" },
    { id: "victor_hinestroza", name: "Víctor Hinestroza" },
    { id: "gerardo_hernandez", name: "Gerardo Hernández" },
    { id: "keinder_montilla", name: "Keinder Montilla" },
    { id: "denys_fernandez", name: "Denys Fernández" },
  ];

  // Usa la data real de clientes
  const allClients = clientes;

  // Ajusta la función para comparar ids como string
  const getClientName = (order: any) => {
    if (!order.client && order.clientId) {
      return allClients.find(c => String(c.id) === String(order.clientId))?.name || "";
    }
    if (order.client) {
      // Si client es un id numérico o string
      const found = allClients.find(c => String(c.id) === String(order.client));
      return found ? found.name : order.client;
    }
    return "";
  };
  const getVendorId = (order: any) => order.vendor || order.vendorId || "";

  const vendedorNombres: Record<string, string> = {
    victor_hinestroza: "Víctor Hinestroza",
    edwar_ruiz: "Edwar Ruíz",
    reinaldo_rojo: "Reinaldo Rojo",
    gerardo_hernandez: "Gerardo Hernández",
    susan_moran: "Susan Moran"
  };

  // Estado para filtrar por estado de pedido
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Elimino el filtro por estado en filteredOrders
  const filteredOrders = isVendedor && miVendorId
    ? ordersState.filter(order => (order.vendor || order.vendorId) === miVendorId)
    : ordersState.filter((order: any) => {
    const matchesSearch = getClientName(order).toLowerCase().includes(searchTerm.toLowerCase()) || (order.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = selectedVendor === "all" || getVendorId(order) === selectedVendor;
    const matchesDate = !dateRange || (order.date >= dateRange.start && order.date <= dateRange.end);
    return matchesSearch && matchesVendor && matchesDate;
  });

  // Cargar pedidos desde la API
  const fetchOrders = async () => {
    const res = await fetch('/api/pedidos')
    const data = await res.json()
    setOrdersState(data)
  }
  useEffect(() => { fetchOrders() }, [])

  // Bloqueo de nuevos pedidos para clientes con deuda (pedido despachado no cobrado)
  const clientesConDeuda = ordersState.filter((o: any) => o.status === 'dispatched' && o.paymentType !== 'collected').map((o: any) => o.client)
  const canAddOrderFinal = canAddOrder && (!newOrder.client || !clientesConDeuda.includes(allClients.find(c => String(c.id) === String(newOrder.client))?.name || ''))

  // Estado para el vendedor seleccionado en el formulario (solo para no vendedores)
  const [selectedVendorForm, setSelectedVendorForm] = useState("");
  // Estado para el cliente seleccionado en el formulario
  const [selectedClientForm, setSelectedClientForm] = useState("");

  // Filtrar clientes según el vendedor seleccionado o el rol
  const filteredClients = isVendedor && miVendorId
    ? allClients.filter(c => String(c.vendorId) === miVendorId)
    : selectedVendorForm
      ? allClients.filter(c => String(c.vendorId) === selectedVendorForm)
      : allClients;

  const handleSaveOrder = async () => {
    setSaving(true);

    // Generar un id único (timestamp)
    const orderId = `ORD-${Date.now()}`;

    // Obtener cliente seleccionado
    const cliente = allClients.find(c => String(c.id) === String(newOrder.client));

    // Obtener vendedor
    let vendedorId = "";
    if (isVendedor) {
      vendedorId = role;
    } else if (selectedVendorForm) {
      vendedorId = selectedVendorForm;
    } else if (cliente && cliente.vendorId) {
      vendedorId = cliente.vendorId;
    }

    // Calcular total
    const total = addOrderProducts.reduce((acc, p) => {
      const product = allProducts.find(prod => prod.id === p.id);
      if (!product) return acc;
      const unitPrice = addOrderPriceType === "Al BCV"
        ? (p.priceType === "perKg" ? product.priceAlBCV.perKg : product.priceAlBCV.perSack)
        : (p.priceType === "perKg" ? product.priceDivisas.perKg : product.priceDivisas.perSack);
      const finalUnitPrice = p.applyDiscount ? (p.unitPrice || unitPrice) : unitPrice;
      return acc + (Number(p.quantity) * finalUnitPrice);
    }, 0);

    // Fecha y hora actual
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);

    // Construir objeto de pedido completo
    const pedidoCompleto = {
      id: orderId,
      client: String(selectedClientForm),
      vendor: vendedorId,
      products: addOrderProducts.map(p => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        price: addOrderPriceType === "Al BCV"
          ? (p.priceType === "perKg" ? allProducts.find(prod => prod.id === p.id)?.priceAlBCV.perKg : allProducts.find(prod => prod.id === p.id)?.priceAlBCV.perSack)
          : (p.priceType === "perKg" ? allProducts.find(prod => prod.id === p.id)?.priceDivisas.perKg : allProducts.find(prod => prod.id === p.id)?.priceDivisas.perSack),
        priceType: p.priceType,
        applyDiscount: p.applyDiscount,
        unitPrice: p.applyDiscount ? p.unitPrice : undefined
      })),
      paymentType: addOrderPriceType,
      status: "order_placed",
      date,
      time,
      total: Number(total.toFixed(2))
    };

    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoCompleto)
    });
    setSaving(false);
    if (res.ok) {
      setShowAddDialog(false);
      setNewOrder({ client: '', products: [], paymentType: '', status: 'order_placed' });
      setAddOrderProducts([]);
      fetchOrders();
    }
  }

  // Manejar cambios en los productos al editar
  const handleEditProductChange = (idx: number, field: string, value: any) => {
    setEditOrderProducts((prev: any[]) =>
      prev.map((prod, i) =>
        i === idx ? { ...prod, [field]: value } : prod
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-dashboard-enter p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="max-w-2xl mx-auto px-2 py-2">
        {/* Bloque 1: Título y filtros */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <CardTitle className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-purple-600" />
            Módulo de Pedidos
          </CardTitle>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por cliente o número de pedido..."
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
              {canAddOrder && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2" onClick={() => {
                      setShowAddDialog(true);
                      setSelectedVendorForm("");
                      setSelectedClientForm("");
                    }} disabled={!canAddOrderFinal}>
                      <Plus className="h-4 w-4" />
                      Agregar Pedido
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Agregar Nuevo Pedido</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-x-auto">
                      <PedidoForm
                        products={allProducts}
                        addOrderProducts={addOrderProducts}
                        setAddOrderProducts={setAddOrderProducts}
                        addOrderPriceType={addOrderPriceType}
                        setAddOrderPriceType={setAddOrderPriceType}
                        onSave={handleSaveOrder}
                        onCancel={() => setShowAddDialog(false)}
                        saving={saving}
                        isVendedor={isVendedor}
                        vendedores={vendedores}
                        selectedVendor={selectedVendorForm}
                        setSelectedVendor={setSelectedVendorForm}
                        clientes={filteredClients}
                        selectedClient={selectedClientForm}
                        setSelectedClient={setSelectedClientForm}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
        {/* Bloque 2: Tabla */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[600px] w-full text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                    <TableHead>Vendedor</TableHead>
                  )}
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Total ($)</TableHead>
                  <TableHead>Precio Aplicado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: any, orderIdx: number) => (
                  <TableRow key={order.id || orderIdx}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{getClientName(order)}</TableCell>
                    {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
                      <TableCell>{vendedorNombres[getVendorId(order)] || getVendorId(order) || '-'}</TableCell>
                    )}
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.time}</TableCell>
                    <TableCell>${(Number(order.total) || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={order.paymentType === "Al BCV" ? "default" : "secondary"}>
                        {order.paymentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'despachado' || order.status === 'dispatched' ? 'secondary' : 'default'}>
                        {order.status === 'despachado' || order.status === 'dispatched' ? 'Despachado' : 'Pendiente'}
                      </Badge>
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
                              <DialogTitle>Detalles del Pedido {order.id}</DialogTitle>
                            </DialogHeader>
                            <div className="overflow-x-auto w-full">
                              <div className="space-y-4 min-w-[350px]">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p>
                                      <strong>Cliente:</strong> {getClientName(order)}
                                    </p>
                                    <p>
                                      <strong>SADA:</strong> {(() => {
                                        const cliente = allClients.find(c => String(c.id) === String(order.client) || String(c.id) === String(order.clientId));
                                        return cliente?.sada || "-";
                                      })()}
                                    </p>
                                    <p>
                                      <strong>Vendedor:</strong> {vendedorNombres[order.vendor] || order.vendor}
                                    </p>
                                    <p>
                                      <strong>Fecha:</strong> {order.date} {order.time}
                                    </p>
                                  </div>
                                  <div>
                                    <p>
                                      <strong>Total:</strong> ${(Number(order.total) || 0).toFixed(2)}
                                    </p>
                                    <p>
                                      <strong>Tipo de Pago:</strong> {order.paymentType}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Productos:</h4>
                                  <div className="overflow-x-auto">
                                    <Table className="min-w-[600px] w-full">
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Producto</TableHead>
                                          <TableHead>Cantidad</TableHead>
                                          <TableHead>Precio Unit.</TableHead>
                                          <TableHead>Subtotal</TableHead>
                                          <TableHead>Total Kg</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {order.products.map((product: any, pidx: number) => {
                                          const prodDetails = allProducts.find(prod => prod.id === product.id);
                                          const totalKgForProduct = (Number(product.quantity) * (prodDetails ? prodDetails.weight : 0)).toFixed(2);
                                          const precioUnitario = product.applyDiscount && product.unitPrice !== undefined
                                            ? product.unitPrice
                                            : product.price;
                                          return (
                                            <TableRow key={product.productId || product.id || `${order.id || orderIdx}-${pidx}`}>
                                              <TableCell className="text-sm">{product.name || allProducts.find(p => p.id === product.id)?.name || product.id}</TableCell>
                                              <TableCell>{product.quantity}</TableCell>
                                              <TableCell>${Number(precioUnitario).toFixed(2)}</TableCell>
                                              <TableCell>${(Number(product.quantity) * Number(precioUnitario)).toFixed(2)}</TableCell>
                                              <TableCell>{totalKgForProduct} Kg</TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                  <div className="mt-4">
                                    <span className="font-semibold">Total Kg General: </span>
                                    {order.products.reduce((totalKg: number, p: any) => {
                                      const prodDetails = allProducts.find(prod => prod.id === p.id);
                                      return totalKg + (Number(p.quantity) * (prodDetails ? prodDetails.weight : 0));
                                    }, 0).toFixed(2)} Kg
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm" onClick={() => {
                          setEditOrderClient(order.client);
                          setEditOrderVendor(order.vendor);
                          setEditOrderProducts(order.products);
                          setEditOrderPriceType(order.paymentType);
                          setShowEditDialog(true);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                          <DialogContent className="max-w-md w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Editar Pedido {order.id}</DialogTitle>
                            </DialogHeader>
                            <div style={{maxHeight: '70vh', overflowY: 'auto'}} className="overflow-x-auto">
                              <PedidoForm
                                products={allProducts}
                                addOrderProducts={editOrderProducts}
                                setAddOrderProducts={setEditOrderProducts}
                                addOrderPriceType={editOrderPriceType}
                                setAddOrderPriceType={setEditOrderPriceType}
                                onSave={async () => {
                                  const updatedOrder = {
                                    ...order,
                                    client: editOrderClient,
                                    vendor: editOrderVendor,
                                    products: editOrderProducts,
                                    paymentType: editOrderPriceType
                                  };
                                  await fetch('/api/pedidos', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: order.id, ...updatedOrder })
                                  });
                                  setShowEditDialog(false);
                                  fetchOrders();
                                }}
                                onCancel={() => setShowEditDialog(false)}
                                saving={saving}
                                isVendedor={isVendedor}
                                vendedores={vendedores}
                                selectedVendor={editOrderVendor || ""}
                                setSelectedVendor={setEditOrderVendor}
                                clientes={(() => {
                                  if (isVendedor) {
                                    return allClients.filter(c => String(c.vendorId) === role);
                                  } else if (editOrderVendor) {
                                    return allClients.filter(c => String(c.vendorId) === editOrderVendor);
                                  } else {
                                    return allClients;
                                  }
                                })()}
                                selectedClient={editOrderClient || ""}
                                setSelectedClient={setEditOrderClient}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>

                        {canEdit && (
                          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Editar Pedido {selectedOrder?.id}</DialogTitle>
                              </DialogHeader>
                              <PedidoForm
                                products={allProducts}
                                addOrderProducts={editOrderProducts}
                                setAddOrderProducts={setEditOrderProducts}
                                addOrderPriceType={editOrderPriceType}
                                setAddOrderPriceType={setEditOrderPriceType}
                                onSave={async () => {
                                  const updatedOrder = {
                                    ...order,
                                    client: editOrderClient,
                                    vendor: editOrderVendor,
                                    products: editOrderProducts,
                                    paymentType: editOrderPriceType
                                  };
                                  await fetch('/api/pedidos', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: order.id, ...updatedOrder })
                                  });
                                  setShowEditDialog(false);
                                  fetchOrders();
                                }}
                                onCancel={() => setShowEditDialog(false)}
                                saving={saving}
                                isVendedor={isVendedor}
                                vendedores={vendedores}
                                selectedVendor={editOrderVendor || ""}
                                setSelectedVendor={setEditOrderVendor}
                                clientes={(() => {
                                  if (isVendedor) {
                                    return allClients.filter(c => String(c.vendorId) === role);
                                  } else if (editOrderVendor) {
                                    return allClients.filter(c => String(c.vendorId) === editOrderVendor);
                                  } else {
                                    return allClients;
                                  }
                                })()}
                                selectedClient={editOrderClient || ""}
                                setSelectedClient={setEditOrderClient}
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
