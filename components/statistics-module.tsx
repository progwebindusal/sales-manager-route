"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, Download, Calendar, Users, Package, DollarSign, Target } from "lucide-react"
import clientesData from "@/data/clientes.json"
import { products as productsData } from "@/data/products"
import pedidosData from "@/data/pedidos.json"
import devolucionesData from "@/data/devoluciones.json"
import visitasData from "@/data/visitas.json"

interface StatisticsModuleProps {
  role: string
}

export default function StatisticsModule({ role }: StatisticsModuleProps) {
  const [dateRange, setDateRange] = useState("month")
  const [selectedVendor, setSelectedVendor] = useState("all")

  // --- Procesamiento de datos reales ---
  // Vendedores únicos (filtrar y mapear solo strings válidos)
  const vendedores = Array.from(new Set(clientesData.map(c => c.vendorId).filter((v): v is string => typeof v === 'string' && !!v)))
  // Total clientes
  const totalClientes = clientesData.length
  // Total vendedores
  const totalVendedores = vendedores.length
  // Visitas por cliente (normalizar id, forzar any)
  const visitasPorCliente = (visitasData as any[]).reduce((acc, v) => {
    const id = String((v as any).clientId ?? (v as any).client ?? '')
    if (id) acc[id] = (acc[id] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  // Pedidos por cliente (normalizar id, forzar any)
  const pedidosPorCliente = (pedidosData as any[]).reduce((acc, p) => {
    const id = String((p as any).clientId ?? (p as any).client ?? '')
    if (id) acc[id] = (acc[id] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  // Pedidos concretados (status despachado)
  const pedidosConcretados = pedidosData.filter(p => p.status === "despachado")
  // Clientes visitados
  const clientesVisitados = Object.keys(visitasPorCliente).length
  // Pedidos realizados
  const pedidosRealizados = pedidosData.length
  // Pedidos concretados
  const totalPedidosConcretados = pedidosConcretados.length
  // Distribución de clientes por estado
  const clientStatusDistribution = [
    { name: "No Visitados", value: totalClientes - clientesVisitados, color: "#ef4444" },
    { name: "Visitados", value: clientesVisitados, color: "#eab308" },
    { name: "Pedidos Realizados", value: Object.keys(pedidosPorCliente).length, color: "#22c55e" },
  ]
  // Distribución de productos en pedidos (normalizar id)
  const productCount: Record<string, number> = {}
  pedidosData.forEach(p => {
    (p.products || []).forEach(prod => {
      const id = String((prod as any).id ?? (prod as any).productId ?? '')
      if (id) productCount[id] = (productCount[id] || 0) + (prod.quantity || 0)
    })
  })
  const productDistribution = productsData.map(prod => ({
    name: prod.name,
    value: productCount[prod.id] || 0,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`
  })).filter(p => p.value > 0)
  // Desempeño de vendedores (forzar any para vendorId)
  const vendorPerformance = vendedores.map(vendorId => {
    const name = vendorId ? vendorId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''
    const visits = (visitasData as any[]).filter((v: any) => v.vendorId === vendorId).length
    const orders = (pedidosData as any[]).filter((p: any) => p.vendor === vendorId || p.vendorId === vendorId).length
    const sales = (pedidosData as any[]).filter((p: any) => (p.vendor === vendorId || p.vendorId === vendorId) && p.status === "despachado").reduce((acc: number, p: any) => acc + (p.total || 0), 0)
    return { name, visits, orders, sales }
  })
  // Tendencia de ventas por mes
  const salesByMonth: Record<string, number> = {}
  pedidosConcretados.forEach(p => {
    const mes = p.date ? new Date(p.date).toLocaleString('es-VE', { month: 'short', year: '2-digit' }) : "Sin Fecha"
    salesByMonth[mes] = (salesByMonth[mes] || 0) + (p.total || 0)
  })
  const salesTrend = Object.entries(salesByMonth).map(([month, sales]) => ({ month, sales }))
  // Clientes con menor/mayor visitas y pedidos (forzar any para clientId)
  const clientesConVisitas = Object.entries(visitasPorCliente).map(([id, visits]) => {
    const cliente = clientesData.find(c => String(c.id) === String(id))
    return { name: cliente?.name || id, visits: Number(visits) }
  })
  const clientesConPedidos = Object.entries(pedidosPorCliente).map(([id, orders]) => {
    const cliente = clientesData.find(c => String(c.id) === String(id))
    const amount = (pedidosData as any[]).filter((p: any) => (p.clientId ?? p.client) == id).reduce((acc: number, p: any) => acc + (p.total || 0), 0)
    return { name: cliente?.name || id, orders: Number(orders), amount }
  })
  clientesConVisitas.sort((a, b) => a.visits - b.visits)
  clientesConPedidos.sort((a, b) => a.orders - b.orders)
  // Tabla de frecuencia de clientes
  const frecuenciaClientes = clientesConVisitas.map(c => {
    // Buscar el cliente por id para obtener el nombre real
    const cliente = clientesData.find(cl => cl.name === c.name || String(cl.id) === String(c.name))
    const idCliente = cliente ? String(cliente.id) : c.name
    const orders = clientesConPedidos.find(p => {
      // Buscar por id o nombre
      const clientePedido = clientesData.find(cl => cl.name === p.name || String(cl.id) === String(p.name))
      return (clientePedido && clientePedido.id === cliente?.id) || p.name === c.name
    })?.orders || 0
    const conversion = orders && c.visits ? Math.round((Number(orders) / Number(c.visits)) * 100) : 0
    const frequency = Number(c.visits) > 10 ? "Semanal" : Number(c.visits) > 5 ? "Quincenal" : "Mensual"
    // Buscar última visita por id (asegurar tipado)
    const lastVisitArr = (visitasData as any[]).filter((v: any) => String(v.clientId ?? v.client ?? '') === idCliente)
      .sort((a: any, b: any) => (b.date || "") > (a.date || "") ? 1 : -1)
    const lastVisit = lastVisitArr[0]?.date || "-"
    return { ...c, orders, conversion, frequency, lastVisit }
  })

  const filteredVendorPerformance = selectedVendor === "all"
    ? vendorPerformance
    : vendorPerformance.filter(v => v.name.replace(/ /g, '_').toLowerCase() === selectedVendor)

  const exportToPDF = () => {
    console.log("Exporting statistics to PDF...", { dateRange, selectedVendor })
  }

  const exportToExcel = () => {
    console.log("Exporting statistics to Excel...", { dateRange, selectedVendor })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Módulo de Estadísticas
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rango de Fechas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-8">
            {!(role === 'Vendedor Masivo' || role === 'Vendedor Moto') && (
              <div className="w-48">
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Vendedores</SelectItem>
                    {vendedores.map(v => (
                      <SelectItem key={v} value={v}>{v ? v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {role !== "vendedor_moto" && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">{totalVendedores}</div>
                      <p className="text-sm text-gray-600">Total Vendedores</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">{totalClientes}</div>
                    <p className="text-sm text-gray-600">Total Clientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold">{clientesVisitados}</div>
                    <p className="text-sm text-gray-600">Clientes Visitados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">{pedidosRealizados}</div>
                    <p className="text-sm text-gray-600">Pedidos Realizados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">{totalPedidosConcretados}</div>
                    <p className="text-sm text-gray-600">Pedidos Concretados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendor Performance Chart */}
            {role !== "vendedor_moto" && (
              <Card>
                <CardHeader>
                  <CardTitle>Desempeño entre Vendedores</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={selectedVendor === "all" ? vendorPerformance : vendorPerformance.filter(v => v.name.replace(/ /g, '_').toLowerCase() === selectedVendor)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="visits" fill="#3b82f6" name="Visitas" />
                      <Bar dataKey="orders" fill="#22c55e" name="Pedidos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {/* Client Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Clientes por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={clientStatusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {clientStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Product Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Pedidos por Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Sales Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          {/* New Statistics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Clients with Least Visits */}
            <Card>
              <CardHeader>
                <CardTitle>Clientes con Menor Volumen de Visitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clientesConVisitas.slice(0, 4).map((client, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-red-600 font-semibold">{client.visits} visitas</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Clients with Least Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Clientes con Menor Volumen de Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clientesConPedidos.slice(0, 4).map((client, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <div>
                        <span className="font-medium">{client.name}</span>
                        <div className="text-sm text-gray-600">{client.orders} pedidos</div>
                      </div>
                      <span className="text-red-600 font-semibold">${client.amount}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Client Frequency Table */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tabla de Frecuencia de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto w-full">
                <table className="min-w-[600px] w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Cliente</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Visitas Totales</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Pedidos Realizados</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Tasa de Conversión</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Frecuencia Promedio</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Última Visita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frecuenciaClientes.slice(0, 10).map((client, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">{client.name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{client.visits}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{client.orders}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              client.conversion >= 70
                                ? "bg-green-100 text-green-800"
                                : client.conversion >= 50
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {client.conversion}%
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{client.frequency}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{client.lastVisit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {/* Top Clients Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Clientes con Mayor Volumen de Visitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clientesConVisitas.slice(-4).reverse().map((client, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-blue-600 font-semibold">{client.visits} visitas</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Clientes con Mayor Volumen de Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clientesConPedidos.slice(-4).reverse().map((client, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{client.name}</span>
                        <div className="text-sm text-gray-600">{client.orders} pedidos</div>
                      </div>
                      <span className="text-green-600 font-semibold">${client.amount}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
