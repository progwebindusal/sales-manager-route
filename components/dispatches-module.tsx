"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Eye, Edit, Plus, Download, Calendar, Truck } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "@/components/ui/combobox"
import Select from 'react-select'
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import DateRangePicker from "@/components/date-range-picker"
import { products as productsList } from "@/data/products";
import clientesData from "@/data/clientes.json";

interface DispatchesModuleProps {
  role: string
}

export default function DispatchesModule({ role }: DispatchesModuleProps) {
  const [dispatches, setDispatches] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [searchOrder, setSearchOrder] = useState("")
  const [saving, setSaving] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().slice(0, 10))
  const [driver, setDriver] = useState({ name: "", plate: "" })
  const [addresses, setAddresses] = useState<Record<string, string>>({})
  const [editAddress, setEditAddress] = useState<Record<string, boolean>>({});
  const printRef = useRef<HTMLDivElement>(null)
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDispatch, setSelectedDispatch] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [dispatchQuantities, setDispatchQuantities] = useState<Record<string, number>>({});

  const toggleProductSelection = (orderId: string, productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
    // Si se selecciona, inicializa la cantidad a la cantidad máxima del pedido
    setDispatchQuantities(prev => {
      if (!selectedProducts.includes(productId)) {
        // Buscar la cantidad máxima del producto en el pedido
        const order = mappedOrders.find(o => o.id === orderId);
        const prod = order?.products.find((p: any) => p.productId === productId);
        return { ...prev, [productId]: prod ? prod.quantity : 1 };
      } else {
        // Si se deselecciona, elimina la cantidad
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  const handleDispatchQuantityChange = (productId: string, max: number, value: number) => {
    let val = Math.max(1, Math.min(max, value));
    setDispatchQuantities(prev => ({ ...prev, [productId]: val }));
  };

  const vendedores = [
    { id: "susan_moran", name: "Susan Moran" },
    { id: "edwar_ruiz", name: "Edwar Ruíz" },
    { id: "reinaldo_rojo", name: "Reinaldo Rojo" },
    { id: "victor_hinestroza", name: "Víctor Hinestroza" },
    { id: "gerardo_hernandez", name: "Gerardo Hernández" },
    { id: "keinder_montilla", name: "Keinder Montilla" },
    { id: "denys_fernandez", name: "Denys Fernández" },
  ]

  const vendedorNombres: Record<string, string> = {
    victor_hinestroza: "Víctor Hinestroza",
    edwar_ruiz: "Edwar Ruíz",
    reinaldo_rojo: "Reinaldo Rojo",
    gerardo_hernandez: "Gerardo Hernández",
    susan_moran: "Susan Moran"
  };

  // Función para obtener el nombre del cliente por id
  const getClientNameById = (id: string | number) => {
    const cliente = clientesData.find((c: any) => String(c.id) === String(id));
    return cliente ? cliente.name : id;
  };

  // Utilidades para obtener datos por ID
  const getClienteById = (id: string | number) => {
    return clientesData.find((c: any) => String(c.id) === String(id));
  };
  const getProductName = (id: string) => {
    const prod = productsList.find((p: any) => String(p.id) === String(id));
    return prod ? prod.name : id;
  };

  useEffect(() => {
    fetchOrders()
    fetchDispatches()
  }, [])

  useEffect(() => {
    if (showDialog && selectedOrderIds.length > 0) {
      const orderIds = selectedOrderIds.map((o: any) => String(o.orderId || o.id));
      setDispatchDate(new Date().toISOString().slice(0, 10)); // Default to today
      setDriver({ name: "", plate: "" });
      // Precargar direcciones por id de orden
      const addr: Record<string, string> = {};
      selectedOrderIds.forEach((order: any) => {
        addr[String(order.orderId || order.id)] = order.address || "";
      });
      setAddresses(addr);
    }
  }, [showDialog, selectedOrderIds]);

  // Mapeo de pedidos para compatibilidad con el formato de despacho
  const mappedOrders = orders.map((order: any) => ({
    ...order,
    clientId: order.client,
    vendorId: order.vendor,
    products: (order.products || []).map((p: any) => ({
      ...p,
      productId: p.id,
      unitPrice: p.price,
      subtotal: (p.quantity * (p.price || 0))
    }))
  }))

  const fetchOrders = async () => {
    const res = await fetch('/api/pedidos')
    const data = await res.json()
    setOrders(data)
  }

  const fetchDispatches = async () => {
    const res = await fetch('/api/despachos')
    const data = await res.json()
    setDispatches(data)
  }

  // Pega aquí tu logo en base64 (data:image/png;base64,...)
  const LOGO_BASE64 = "";

  // Función unificada para generar el PDF del despacho
  function generateDispatchPDF({
    id,
    date,
    driver,
    totalUnidades,
    totalKilos,
    orders,
    addresses,
    editAddress
  }: any) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 8;
    const labelWidth = 18;
    const valueX = margin + labelWidth + 1;
    const fieldHeight = 7;
    let startY = margin;
    // Encabezado con logo y título
    if (LOGO_BASE64) {
      doc.addImage(LOGO_BASE64, 'PNG', margin, startY, 18, 10);
    }
    doc.setFontSize(10);
    doc.text('FORMATO DE DESPACHO', pageWidth / 2, startY + 7, { align: 'center' });
    doc.setFontSize(7);
    doc.text(`Fecha: ${date}`, pageWidth - margin, startY + 7, { align: 'right' });
    startY += 13;
    // Cuadro Conductor y Placa
    const conductorPlacaY = startY;
    const conductorPlacaHeight = fieldHeight;
    doc.rect(margin, conductorPlacaY, pageWidth - 2 * margin, conductorPlacaHeight);
    doc.setFontSize(7);
    const conductorPlacaText = `Conductor: ${driver?.name || '-'}    Placa: ${driver?.plate || '-'}`;
    doc.text(conductorPlacaText, pageWidth / 2, conductorPlacaY + 5, { align: 'center' });
    startY += conductorPlacaHeight + 2;
    // Mostrar todos los pedidos uno debajo del otro
    let totalUni = 0;
    let totalKg = 0;
    orders.forEach((order: any, idx: number) => {
      // Cuadro Cliente
      doc.rect(margin, startY, pageWidth - 2 * margin, fieldHeight);
      doc.text('Cliente:', margin + 2, startY + 5);
      const cliente = getClienteById(order.clientId);
      doc.text(cliente?.name || order.clientId || '-', valueX, startY + 5);
      startY += fieldHeight;
      // Cuadro RIF y SADA
      doc.rect(margin, startY, (pageWidth - 2 * margin) / 2, fieldHeight);
      doc.rect(margin + (pageWidth - 2 * margin) / 2, startY, (pageWidth - 2 * margin) / 2, fieldHeight);
      doc.text('RIF:', margin + 2, startY + 5);
      doc.text(cliente?.rif || '-', valueX, startY + 5);
      doc.text('SADA:', margin + (pageWidth - 2 * margin) / 2 + 2, startY + 5);
      doc.text(cliente?.sada || '-', margin + (pageWidth - 2 * margin) / 2 + labelWidth, startY + 5);
      startY += fieldHeight;
      // Cuadro Vendedor y Fecha
      doc.rect(margin, startY, (pageWidth - 2 * margin) / 2, fieldHeight);
      doc.rect(margin + (pageWidth - 2 * margin) / 2, startY, (pageWidth - 2 * margin) / 2, fieldHeight);
      doc.text('Vendedor:', margin + 2, startY + 5);
      doc.text(vendedorNombres[order.vendorId] || order.vendorId || '-', valueX, startY + 5);
      doc.text('Fecha:', margin + (pageWidth - 2 * margin) / 2 + 2, startY + 5);
      doc.text(date || '-', margin + (pageWidth - 2 * margin) / 2 + labelWidth, startY + 5);
      startY += fieldHeight;
      // Cuadro Dirección
      const direccionHeight = 8;
      doc.rect(margin, startY, pageWidth - 2 * margin, direccionHeight);
      doc.setFontSize(7);
      doc.text('Dirección:', margin + 2, startY + 5);
      let direccionFinal = order.address;
      if (editAddress && editAddress[order.id] && addresses && addresses[order.id]) {
        direccionFinal = addresses[order.id];
      } else if (!order.address && cliente?.address) {
        direccionFinal = cliente.address;
      }
      doc.text(direccionFinal || '-', valueX, startY + 5, { maxWidth: pageWidth - valueX - margin });
      startY += direccionHeight;
      // Cuadro Productos, Cantidad y KG
      const productos = (order.products || []);
      const productosCount = productos.length;
      const rowHeight = 5;
      const headerHeight = 6;
      const productosHeight = headerHeight + productosCount * rowHeight + 1;
      const productosWidth = pageWidth - 2 * margin - 50;
      doc.rect(margin, startY, productosWidth, productosHeight);
      doc.rect(margin + productosWidth, startY, 25, productosHeight); // Cantidad
      doc.rect(margin + productosWidth + 25, startY, 25, productosHeight); // KG
      doc.setFontSize(7);
      // Títulos en la primera fila
      doc.text('Productos', margin + 2, startY + 5);
      doc.text('Cantidad', margin + productosWidth + 2, startY + 5);
      doc.text('KG', margin + productosWidth + 27, startY + 5);
      // Ahora los productos empiezan justo debajo (bajo los títulos)
      let prodY = startY + headerHeight + 2; // +2 para bajar un poco más
      productos.forEach((p: any, i: number) => {
        const prodName = p.name || getProductName(p.productId);
        const qty = p.quantity;
        // Mostrar exactamente el valor de totalKg del producto
        let kilos = typeof p.totalKg === 'number' ? p.totalKg : 0;
        doc.setFontSize(6.5);
        doc.text(`- ${prodName}`, margin + 15, prodY + i * rowHeight, { maxWidth: productosWidth - 8 });
        doc.text(`${qty}`, margin + productosWidth + 8, prodY + i * rowHeight, { align: 'center' });
        doc.text(`${kilos.toFixed(2)}`, margin + productosWidth + 33, prodY + i * rowHeight, { align: 'center' });
        totalUni += qty;
        totalKg += kilos;
      });
      startY += productosHeight + 2;
      // Si se pasa del límite, salto de página
      if (startY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        startY = margin;
      }
    });
    // Totales generales pegados a la última tabla
    doc.setFontSize(8);
    doc.text('Total Uni:', margin + 2, startY + 7);
    doc.text(String(totalUni), margin + 22, startY + 7);
    doc.text('Total KG:', margin + 50, startY + 7);
    doc.text(totalKg.toFixed(2), margin + 70, startY + 7);
    // Apartado de firmas
    const firmasY = startY + 18;
    const colWidth = (pageWidth - 2 * margin) / 4;
    doc.setLineWidth(0.3);
    for (let i = 0; i < 4; i++) {
      const x = margin + i * colWidth;
      doc.line(x, firmasY, x + colWidth - 10, firmasY);
    }
    doc.setFontSize(7);
    doc.text('Asistente de Ventas', margin + colWidth / 2, firmasY + 5, { align: 'center' });
    doc.text('Autorizado', margin + colWidth + colWidth / 2, firmasY + 5, { align: 'center' });
    doc.text('Supervisor de Despacho', margin + 2 * colWidth + colWidth / 2, firmasY + 5, { align: 'center' });
    doc.text('PCP', margin + 3 * colWidth + colWidth / 2, firmasY + 5, { align: 'center' });
    doc.save(`formato_despacho_${id || ''}.pdf`);
  }

  // handleGenerateDispatch modificado
  const handleGenerateDispatch = async () => {
    if (selectedOrderIds.length === 0) return;
    setSaving(true);
    try {
      const dispatchData = {
        id: undefined,
        orders: mappedOrders.filter(order => selectedOrderIds.includes(order.id)).map(order => ({
          ...order,
          clientName: getClienteById(order.clientId)?.name || order.clientId,
          products: order.products.filter((p: any) => selectedProducts.includes(p.productId)).map((p: any) => {
            const prod = productsList.find(prod => prod.id === p.productId);
            return {
              ...p,
              name: prod ? prod.name : p.productId,
              weight: prod ? prod.weight : 0,
              totalKg: (dispatchQuantities[p.productId] ?? p.quantity) * (prod ? prod.weight : 0)
            };
          })
        })), // <- cierre correcto del map
        date: dispatchDate,
        driver,
        addresses,
        totalUnidades: totalUnidadesGeneral,
        totalKilos: totalKilosGeneral,
        createdAt: new Date().toISOString(),
      };
      selectedOrders.forEach(order => {
        const undispatchedProducts = order.products.filter((p: any) => !selectedProducts.includes(p.productId));
        if (undispatchedProducts.length > 0) {
          fetch(`/api/pedidos`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: order.id, status: 'order_placed' })
          });
        } else {
          fetch(`/api/pedidos`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: order.id, status: 'despachado' })
          });
        }
      });
      const res = await fetch('/api/despachos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispatchData)
      });
      if (!res.ok) throw new Error('Error al guardar el despacho');
      generateDispatchPDF({
        id: undefined,
        date: dispatchDate,
        driver,
        totalUnidades: totalUnidadesGeneral,
        totalKilos: totalKilosGeneral,
        orders: dispatchData.orders,
        addresses
      });
      setShowDialog(false);
      setSelectedOrderIds([]);
      setSelectedProducts([]);
      setDriver({ name: "", plate: "" });
      setAddresses({});
      fetchOrders();
      fetchDispatches();
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al generar el despacho');
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = orders.filter((o: any) =>
    String(o.id).toLowerCase().includes(String(searchOrder).toLowerCase())
  )

  // Selección múltiple Combobox
  const orderOptions = mappedOrders
    .filter((order: any) => order.status === 'order_placed')
    .map((order: any) => ({ value: order.id, label: `${order.id.toString().padStart(5, '0')} - ${order.clientId}` }))
  const selectedOrders = mappedOrders.filter((o: any) => selectedOrderIds.includes(String(o.id)));

  // Totales
  const productTotals: Record<string, { unidades: number, kilos: number }> = {}
  let totalUnidadesGeneral = 0
  let totalKilosGeneral = 0
  selectedOrders.forEach(order => {
    order.products.forEach((product: any) => {
      if (!productTotals[product.name]) productTotals[product.name] = { unidades: 0, kilos: 0 }
      productTotals[product.name].unidades += product.quantity
      // Suponiendo que cada producto tiene un campo pesoKg o similar, si no, usar 1 como dummy
      const peso = product.kilos || product.pesoKg || 1
      productTotals[product.name].kilos += product.quantity * peso
      totalUnidadesGeneral += product.quantity
      totalKilosGeneral += product.quantity * peso
    })
  })

  function safeToLower(val: any) {
    try {
      return String(val ?? '').toLowerCase();
    } catch {
      return '';
    }
  }

  const filteredDispatches = dispatches.filter((dispatch: any) => {
    const safeSearchTerm = safeToLower(searchTerm);
    const safeSelectedVendor = safeToLower(selectedVendor || 'all');
    const firstOrder = Array.isArray(dispatch.orders) && dispatch.orders.length > 0 ? dispatch.orders[0] : {};
    const matchesSearch =
      safeToLower(firstOrder.clientId).includes(safeSearchTerm) ||
      safeToLower(firstOrder.vendorId).includes(safeSearchTerm) ||
      safeToLower(dispatch.id).includes(safeSearchTerm);
    const matchesVendor = safeSelectedVendor === 'all' || safeToLower(firstOrder.vendorId) === safeSelectedVendor;
    const matchesDate = !dateRange || (dispatch.date >= dateRange.start && dispatch.date <= dateRange.end);
    return matchesSearch && matchesVendor && matchesDate;
  })

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text("Despachos", 14, 16)
    const tableColumn = [
      "Nº Pedido", "Cliente", "Vendedor", "Fecha", "Hora", "Total ($)", "Precio Aplicado"
    ]
    const tableRows = filteredDispatches.map((dispatch: any) => [
      dispatch.id,
      dispatch.orders[0]?.clientId || '-',
      dispatch.orders[0]?.vendorId || '-',
      dispatch.date,
      new Date(dispatch.createdAt).toLocaleTimeString(),
      dispatch.orders.reduce((sum: number, order: any) => sum + order.total, 0).toFixed(2),
      dispatch.orders[0]?.paymentType || '-'
    ])
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 22, margin: { left: 24 } })
    doc.save("despachos.pdf")
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredDispatches.map((dispatch: any) => ({
      "Nº Pedido": dispatch.id,
      "Cliente": dispatch.orders[0]?.clientId || '-',
      "Vendedor": dispatch.orders[0]?.vendorId || '-',
      "Fecha": dispatch.date,
      "Hora": new Date(dispatch.createdAt).toLocaleTimeString(),
      "Total ($)": dispatch.orders.reduce((sum: number, order: any) => sum + order.total, 0).toFixed(2),
      "Precio Aplicado": dispatch.orders[0]?.paymentType || '-'
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Despachos")
    XLSX.writeFile(wb, "despachos.xlsx")
  }

  const handleDateRangeSelect = (start: string, end: string) => {
    setDateRange({ start, end })
  }

  // handleReprint modificado
  function handleReprint(dispatch: any) {
    // Normalizar estructura de pedidos igual que mappedOrders
    const normalizedOrders = (dispatch.orders || []).map((order: any) => ({
      ...order,
      clientId: order.clientId || order.client,
      vendorId: order.vendorId || order.vendor,
      products: (order.products || []).map((p: any) => ({
        ...p,
        productId: p.productId || p.id,
        unitPrice: p.unitPrice || p.price,
        subtotal: (p.quantity * (p.price || p.unitPrice || 0))
      }))
    }));
    // Normalizar addresses
    const addresses: Record<string, string> = {};
    normalizedOrders.forEach((o: any) => {
      addresses[String(o.id)] = o.address || (dispatch.addresses ? dispatch.addresses[String(o.id)] : "");
    });
    // Calcular totales igual que al guardar
    let totalUnidadesGeneral = 0;
    let totalKilosGeneral = 0;
    normalizedOrders.forEach((order: any) => {
      order.products.forEach((product: any) => {
        totalUnidadesGeneral += product.quantity;
        totalKilosGeneral += (product.kilos || product.pesoKg || 1) * product.quantity;
      });
    });
    generateDispatchPDF({
      id: dispatch.id,
      date: dispatch.date,
      driver: dispatch.driver,
      totalUnidades: totalUnidadesGeneral,
      totalKilos: totalKilosGeneral,
      orders: normalizedOrders,
      addresses
    });
  }

  const forbiddenRoles = ["vendedor masivo", "vendedor moto"];
  const canAddDispatch = !forbiddenRoles.includes(role?.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50 animate-dashboard-enter p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="max-w-2xl mx-auto px-2 py-2">
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <CardTitle className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-yellow-600" />
            Módulo de Despachos
            {canAddDispatch && (
              <Button className="ml-auto" onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4" /> Generar Despacho
              </Button>
            )}
          </CardTitle>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por cliente, vendedor o pedido..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <select
                  className="w-full border rounded px-2 py-1 text-sm h-10"
                  value={selectedVendor}
                  onChange={e => setSelectedVendor(e.target.value)}
                >
                  <option value="all">Todos los Vendedores</option>
                  {vendedores.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
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
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[600px] w-full text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Total ($)</TableHead>
                  <TableHead>Precio Aplicado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispatches?.map((dispatch: any) => (
                  <TableRow key={dispatch.id}>
                    <TableCell className="font-medium">{dispatch.id}</TableCell>
                    <TableCell>{getClientNameById(dispatch.orders[0]?.clientId) || '-'}</TableCell>
                    <TableCell>{vendedorNombres[dispatch.orders[0]?.vendorId] || dispatch.orders[0]?.vendorId || '-'}</TableCell>
                    <TableCell>{dispatch.date}</TableCell>
                    <TableCell>{new Date(dispatch.createdAt).toLocaleTimeString()}</TableCell>
                    <TableCell>${dispatch.orders.reduce((sum: number, order: any) => sum + (typeof order.total === 'number' ? order.total : 0), 0).toFixed(2)}</TableCell>
                    <TableCell>{dispatch.orders[0]?.paymentType || '-'}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedDispatch(dispatch); setShowViewDialog(true); }}><Eye className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => handleReprint(dispatch)}><Download className="h-4 w-4 text-blue-700" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

        {/* Dialogo Generar Despacho */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-4xl sm:max-w-lg md:max-w-2xl lg:max-w-4xl p-6 bg-white rounded-lg shadow-lg overflow-y-auto max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800">Generar Despacho</DialogTitle>
            </DialogHeader>
            {/* Select de órdenes siempre arriba */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-lg">Seleccionar Pedidos</h4>
              <Select
                isMulti
                options={orderOptions}
                value={orderOptions.filter(opt => selectedOrderIds.includes(opt.value))}
                onChange={opts => {
                  const newSelectedOrderIds = Array.isArray(opts) ? opts.map(opt => opt.value) : [];
                  setSelectedOrderIds(newSelectedOrderIds);
                }}
                placeholder="Buscar y seleccionar pedidos"
                classNamePrefix="react-select"
              />
            </div>
            {/* Formulario y detalles debajo */}
            <div className="space-y-6 mt-4 overflow-y-auto max-h-[60vh]">
              {selectedOrders.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Despacho</label>
                      <Input type="date" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conductor (Nombre)</label>
                      <Input placeholder="Nombre" value={driver.name} onChange={e => setDriver({ ...driver, name: e.target.value })} className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Placa del Vehículo</label>
                      <Input placeholder="Placa" value={driver.plate} onChange={e => setDriver({ ...driver, plate: e.target.value })} className="w-full" />
                    </div>
                  </div>
                  {/* Mostrar información de cada pedido seleccionado */}
                  {selectedOrders.map((order: any) => {
                    const cliente = getClienteById(order.clientId);
                    const addressValue = addresses[order.id] !== undefined ? addresses[order.id] : order.address || cliente?.address || "";
                    return (
                      <div key={order.id} className="border rounded p-3 mb-4 bg-gray-50">
                        <div className="mb-2 flex flex-wrap gap-4 text-xs items-center">
                          <div><strong>Pedido:</strong> {order.id}</div>
                          <div><strong>Cliente:</strong> {cliente?.name || order.clientId}</div>
                          <div className="flex items-center gap-2">
                            <strong>Dirección:</strong>
                            {!editAddress[order.id] ? (
                              <>
                                <span>{addressValue}</span>
                                <input
                                  type="checkbox"
                                  className="ml-2"
                                  checked={!!editAddress[order.id]}
                                  onChange={e => setEditAddress(prev => ({ ...prev, [order.id]: e.target.checked }))}
                                />
                                <span className="ml-1">Editar</span>
                              </>
                            ) : (
                              <>
                                <Input
                                  value={addressValue}
                                  onChange={e => setAddresses(prev => ({ ...prev, [order.id]: e.target.value }))}
                                  className="w-64"
                                />
                                <input
                                  type="checkbox"
                                  className="ml-2"
                                  checked={!!editAddress[order.id]}
                                  onChange={e => setEditAddress(prev => ({ ...prev, [order.id]: e.target.checked }))}
                                />
                                <span className="ml-1">Editar</span>
                              </>
                            )}
                          </div>
                          <div><strong>Vendedor:</strong> {vendedorNombres[order.vendorId] || order.vendorId}</div>
                          <div><strong>Tipo de Pago:</strong> {order.paymentType}</div>
                        </div>
                        <Table className="min-w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead>Cantidad Pedida</TableHead>
                              <TableHead>Cantidad a Despachar</TableHead>
                              <TableHead>Total Kg</TableHead>
                              <TableHead>Seleccionar</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.products.map((product: any) => {
                              const prodDetails = productsList.find((p: any) => p.id === product.productId);
                              const totalKgForProduct = (product.quantity * (prodDetails ? prodDetails.weight : 0)).toFixed(2);
                              return (
                                <TableRow key={`${order.id}-${product.productId}`}>
                                  <TableCell>{getProductName(product.productId)}</TableCell>
                                  <TableCell>{product.quantity}</TableCell>
                                  <TableCell>
                                    <input
                                      type="number"
                                      min={1}
                                      max={product.quantity}
                                      value={dispatchQuantities[product.productId] ?? product.quantity}
                                      disabled={!selectedProducts.includes(product.productId)}
                                      onChange={e => handleDispatchQuantityChange(product.productId, product.quantity, Number(e.target.value))}
                                      className="border rounded px-2 py-1 w-20"
                                    />
                                  </TableCell>
                                  <TableCell>{((dispatchQuantities[product.productId] ?? product.quantity) * (prodDetails ? prodDetails.weight : 0)).toFixed(2)} Kg</TableCell>
                                  <TableCell>
                                    <input
                                      type="checkbox"
                                      checked={selectedProducts.includes(product.productId)}
                                      onChange={() => toggleProductSelection(order.id, product.productId)}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })}
                  <div className="mt-2 font-semibold text-gray-700">
                    Total Kg General: {
                      selectedOrders.reduce((totalKg: number, order: any) =>
                        totalKg + order.products.reduce((sumKg: number, p: any) => {
                          if (selectedProducts.includes(p.productId)) {
                            // Usar la cantidad a despachar (input) y el peso unitario real
                            const prodDetails = productsList.find((prod: any) => prod.id === p.productId);
                            const cantidadDespachar = dispatchQuantities[p.productId] ?? p.quantity;
                            const pesoUnitario = prodDetails ? prodDetails.weight : 0;
                            return sumKg + (cantidadDespachar * pesoUnitario);
                          }
                          return sumKg;
                        }, 0)
                      , 0).toFixed(2)
                    } Kg
                  </div>
                  {selectedProducts.length < selectedOrders.flatMap(o => o.products).length && (
                    <div className="text-yellow-600 mt-2 text-sm">Advertencia: No todos los productos están seleccionados. El pedido permanecerá pendiente si no se despachan todos.</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="px-4 py-2">Cancelar</Button>
              <Button onClick={handleGenerateDispatch} disabled={saving || selectedOrderIds.length === 0} className="px-4 py-2 bg-blue-600 hover:bg-blue-700">Generar y Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialogo Ver */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-md w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Despacho</DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto w-full">
              {selectedDispatch && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Conductor:</strong> {selectedDispatch.driver?.name}</p>
                      <p><strong>Placa:</strong> {selectedDispatch.driver?.plate}</p>
                      <p><strong>Fecha:</strong> {selectedDispatch.date}</p>
                    </div>
                    <div>
                      <p><strong>Total Unidades:</strong> {selectedDispatch.totalUnidades}</p>
                      <p><strong>Total Kilos:</strong> {selectedDispatch.totalKilos}</p>
                      <p><strong>Creado:</strong> {new Date(selectedDispatch.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Órdenes:</h4>
                    {selectedDispatch.orders.map((order: any, index: number) => {
                      const cliente = getClienteById(order.clientId);
                      return (
                        <div key={order.orderId || order.id} className="border rounded p-4 mb-4">
                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                              <p><strong>Orden:</strong> {order.orderId || order.id}</p>
                              <p><strong>Estado:</strong> {order.status || '-'}</p>
                              <p><strong>Cliente:</strong> {cliente?.name || order.clientId}</p>
                              <p><strong>Vendedor:</strong> {vendedorNombres[order.vendorId] || order.vendorId}</p>
                            </div>
                            <div>
                              <p><strong>Total:</strong> ${(typeof order.total === 'number' ? order.total : 0).toFixed(2)}</p>
                              <p><strong>Tipo de Pago:</strong> {order.paymentType}</p>
                              <p><strong>Dirección:</strong> {order.address}</p>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-semibold mb-1">Productos:</h5>
                            <Table>
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
                                {order.products.map((product: any, idx: number) => (
                                  <TableRow key={idx}>
                                    <TableCell>{product.name || getProductName(product.productId)}</TableCell>
                                    <TableCell>{product.quantity}</TableCell>
                                    <TableCell>${Number(product.unitPrice).toFixed(2)}</TableCell>
                                    <TableCell>${(typeof product.subtotal === 'number' ? product.subtotal : 0).toFixed(2)}</TableCell>
                                    <TableCell>{typeof product.totalKg === 'number' ? product.totalKg.toFixed(2) : '0.00'} Kg</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
    </div>
  )
}