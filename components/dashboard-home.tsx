import { Card } from "@/components/ui/card";
import { Users, Package, DollarSign, TrendingUp, Route, Truck, FileText, ChevronRight, Shield } from "lucide-react";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const MODULES = [
  { id: "routes", name: "Control de Rutas", icon: Route, color: "bg-blue-100 text-blue-600", mobileColor: "bg-blue-500", description: "Visualización de rutas y ubicación en tiempo real" },
  { id: "visits", name: "Visitas", icon: Users, color: "bg-green-100 text-green-600", mobileColor: "bg-green-500", description: "Registro de visitas a clientes" },
  { id: "orders", name: "Pedidos", icon: Package, color: "bg-purple-100 text-purple-600", mobileColor: "bg-purple-500", description: "Gestión de pedidos pendientes" },
  { id: "clients", name: "Clientes", icon: Users, color: "bg-orange-100 text-orange-600", mobileColor: "bg-orange-500", description: "Base de datos de clientes" },
  { id: "statistics", name: "Estadísticas", icon: TrendingUp, color: "bg-indigo-100 text-indigo-600", mobileColor: "bg-indigo-500", description: "Reportes y análisis de ventas" },
  { id: "dispatches", name: "Despachos", icon: Truck, color: "bg-yellow-100 text-yellow-600", mobileColor: "bg-yellow-500", description: "Control de despachos" },
  { id: "collections", name: "Cobros", icon: DollarSign, color: "bg-teal-100 text-teal-600", mobileColor: "bg-teal-500", description: "Registro de cobros" },
  { id: "accounts", name: "Cuentas", icon: Users, color: "bg-blue-100 text-blue-600", mobileColor: "bg-blue-600", description: "Cuentas bancarias y datos de cobro" },
  { id: "support", name: "Soporte", icon: Users, color: "bg-gray-100 text-gray-700", mobileColor: "bg-gray-700", description: "Soporte y contacto" },
  { id: "returns", name: "Devoluciones", icon: FileText, color: "bg-red-100 text-red-600", mobileColor: "bg-red-500", description: "Gestión de devoluciones" },
];

const METRICS = [
  { id: "vendedores", label: "Total Vendedores", color: "bg-blue-50 text-blue-700", icon: <Users className="w-6 h-6" /> },
  { id: "clientes", label: "Total Clientes", color: "bg-green-50 text-green-700", icon: <Users className="w-6 h-6" /> },
  { id: "pedidosPendientes", label: "Pedidos Pendientes", color: "bg-orange-50 text-orange-700", icon: <Package className="w-6 h-6" /> },
  { id: "ventasMes", label: "Ventas del Mes", color: "bg-purple-50 text-purple-700", icon: <DollarSign className="w-6 h-6" /> },
];

type Module = {
  id: string;
  name: string;
  icon: React.ElementType;
  color?: string;
  mobileColor?: string;
  description?: string;
};

type DashboardHomeProps = {
  zona: string;
  onSelectModule: (id: string) => void;
  availableModules: Module[];
  metrics: {
    vendedores: number | string;
    clientes: number | string;
    pedidosPendientes: number | string;
    ventasMes: number | string;
  };
  onZonaChange: (zona: string) => void;
  zonas: string[];
  nombre?: string;
  onLogout?: () => void;
};

export default function DashboardHome({ zona, onSelectModule, availableModules, metrics, onZonaChange, zonas, nombre, onLogout }: DashboardHomeProps) {
  // Obtener las iniciales del nombre para el avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-full animate-dashboard-enter">
      {/* Encabezado y bienvenida unificados SOLO en móvil */}
      <div className="md:hidden max-w-2xl mx-auto px-4 py-2 animate-mobile-header">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-gray-900">Sistema de Gestión de Ventas</h1>
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-all duration-200 animate-logout-btn"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          {/* Mensaje de bienvenida y avatar */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {nombre ? getInitials(nombre) : 'MG'}
              </span>
            </div>
            <div className="flex-1 text-left">
              <span className="text-2xl font-bold text-gray-900 mb-0">{nombre || 'María'}</span>
            </div>
          </div>
          {/* Filtro de zona dentro del header */}
          <div className="space-y-3 animate-zone-filter">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Filtrar por Zona:</span>
            </div>
            <Select value={zona} onValueChange={onZonaChange}>
              <SelectTrigger className="w-full bg-gray-50 border-gray-200 rounded-lg">
                <SelectValue placeholder="Seleccionar zona" />
              </SelectTrigger>
              <SelectContent>
                {zonas.map(z => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="w-fit bg-blue-100 text-blue-800 rounded-full px-3 py-1">
              Mostrando: {zona}
            </Badge>
          </div>
        </div>
      </div>

      {/* DISEÑO DE ESCRITORIO CLÁSICO */}
      <div className="hidden md:block max-w-6xl mx-auto py-8 px-4 animate-dashboard-enter">
      {/* Saludo y subtítulo */}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-1 animate-fade-in-up">Bienvenido{nombre ? `, ${nombre}` : ""}</h1>
        <div className="text-lg text-gray-600 mb-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Seleccione un módulo para comenzar a trabajar</div>
      {/* Grid de módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {availableModules.map((mod, index) => {
            const ModIcon = mod.icon;
            const moduleInfo = MODULES.find(m => m.id === mod.id) || mod;
            return (
              <button
                key={mod.id}
                className={`flex flex-col items-start p-5 rounded-xl shadow bg-white hover:shadow-lg transition-all duration-200 group border border-gray-100 hover:border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300 animate-module-card module-card-hover`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => onSelectModule(mod.id)}
              >
                <div className={`rounded-lg p-2 mb-3 text-2xl ${moduleInfo.color}`}> 
                  <ModIcon className="w-7 h-7" /> 
                </div>
                <div className="font-bold text-lg text-gray-800 mb-1 group-hover:text-violet-700 transition">{mod.name}</div>
                <div className="text-gray-500 text-sm">{moduleInfo.description}</div>
              </button>
            );
          })}
        </div>
        {/* Resumen General */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>Resumen General</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard {...METRICS[0]} value={metrics.vendedores} delay="0.4s" />
          <MetricCard {...METRICS[1]} value={metrics.clientes} delay="0.5s" />
          <MetricCard {...METRICS[2]} value={metrics.pedidosPendientes} delay="0.6s" />
          <MetricCard {...METRICS[3]} value={metrics.ventasMes} delay="0.7s" />
        </div>
      </div>

      {/* Módulos en formato de tarjetas verticales con animación para móvil */}
      <div className="md:hidden space-y-3">
        {availableModules.map((mod, index) => {
          const ModIcon = mod.icon;
          const moduleInfo = MODULES.find(m => m.id === mod.id) || mod;
          return (
            <button
              key={mod.id}
              className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 module-card-hover animate-module-card"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onSelectModule(mod.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${moduleInfo.color} rounded-xl flex items-center justify-center shadow-sm`}>
                    <ModIcon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 text-base">{mod.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{moduleInfo.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          );
        })}
        {/* Resumen General en móvil */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 mt-8 pl-4">Resumen General</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard {...METRICS[0]} value={metrics.vendedores} />
        <MetricCard {...METRICS[1]} value={metrics.clientes} />
        <MetricCard {...METRICS[2]} value={metrics.pedidosPendientes} />
        <MetricCard {...METRICS[3]} value={metrics.ventasMes} />
          </div>
        </div>
      </div>
    </div>
  );
}

type MetricCardProps = { label: string; value: number | string; color: string; icon: React.ReactNode; delay?: string };
function MetricCard({ label, value, color, icon, delay }: MetricCardProps) {
  return (
    <div 
      className={`flex items-center gap-4 rounded-xl px-6 py-5 shadow border-0 ${color} animate-fade-in-up`}
      style={{ animationDelay: delay }}
    >
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-sm font-medium mt-1">{label}</div>
      </div>
    </div>
  );
} 