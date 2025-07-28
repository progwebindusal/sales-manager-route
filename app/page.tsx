"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LogIn, Shield, Building2 } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
// Animaciones personalizadas para fade/slide y botón
import "./login-animations.css";
import RouteControlModule from "@/components/route-control";
import VisitsModule from "@/components/visits-module";
import OrdersModule from "@/components/orders-module";
import ClientsModule from "@/components/clients-module";
import StatisticsModule from "@/components/statistics-module";
import CollectionsModule from "@/components/collections-module";
import ReturnsModule from "@/components/returns-module";
import DispatchesModule from "@/components/dispatches-module";
import CuentasVendedor from "@/components/cuentas-vendedor";
import SupportModule from "@/components/support-module"; // Importar el nuevo módulo
import { Badge } from "@/components/ui/badge";
import { Select as ShadSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, ChevronRight, TrendingUp, Home } from "lucide-react";
import DashboardHome from "@/components/dashboard-home";
import { Users, Package, DollarSign, Route, Truck, FileText, LifeBuoy } from "lucide-react"; // Añadir LifeBuoy
const MODULES = [
  { id: "routes", name: "Control de Rutas", icon: Route, color: "bg-blue-100 text-blue-600", mobileColor: "bg-blue-500" },
  { id: "visits", name: "Visitas", icon: Users, color: "bg-green-100 text-green-600", mobileColor: "bg-green-500" },
  { id: "orders", name: "Pedidos", icon: Package, color: "bg-purple-100 text-purple-600", mobileColor: "bg-purple-500" },
  { id: "clients", name: "Clientes", icon: Users, color: "bg-orange-100 text-orange-600", mobileColor: "bg-orange-500" },
  { id: "statistics", name: "Estadísticas", icon: TrendingUp, color: "bg-indigo-100 text-indigo-600", mobileColor: "bg-indigo-500" },
  { id: "dispatches", name: "Despachos", icon: Truck, color: "bg-yellow-100 text-yellow-600", mobileColor: "bg-yellow-500" },
  { id: "collections", name: "Cobros", icon: DollarSign, color: "bg-teal-100 text-teal-600", mobileColor: "bg-teal-500" },
  { id: "cuentas", name: "Cuentas", icon: DollarSign, color: "bg-green-100 text-green-600", mobileColor: "bg-green-500" },
  { id: "support", name: "Soporte", icon: LifeBuoy, color: "bg-gray-100 text-gray-600", mobileColor: "bg-gray-500" }, // Nuevo módulo
];

// Lista fija de zonas
const ZONAS = [
  "Todas",
  "Zulia",
  "Centro",
  "Falcón",
  "Machiques"
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  type User = {
    propietario: string;
    usuario: string;
    rol: string;
    zona: string;
    modulos: string[] | "all"; // Campo de módulos añadido al tipo
  };
  const [user, setUser] = useState<User | null>(null); // usuario autenticado
  const [selectedZona, setSelectedZona] = useState("Todas");
  const [sidebarOpen, setSidebarOpen] = useState(false); // <-- Esto debe estar aquí

  // Preparar función para autenticación con backend (API futura)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: username, contrasena: password })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error de autenticación");
        setLoading(false);
        return;
      }
      const data = await res.json();
      
      // Animación de transición antes de establecer el usuario
      setLoading(false);
      
      // Pequeño delay para mostrar la animación de éxito
      setTimeout(() => {
        setUser(data);
      }, 300);
      
    } catch (err) {
      setError("Error de red o del servidor");
      setLoading(false);
    }
  };

  // Lógica de módulos ahora es más simple
  const getModulesForUser = (user: User | null) => {
    if (!user) return [];

    const allModulesWithIcons = MODULES.map(m => ({
      id: m.id,
      name: m.name,
      icon: m.icon,
    }));
    
    // Si el usuario tiene acceso a todos los módulos
    if (user.modulos === "all") {
      return allModulesWithIcons;
    }

    // Si tiene una lista específica de módulos
    if (Array.isArray(user.modulos)) {
      return allModulesWithIcons.filter(m => user.modulos.includes(m.id));
    }
    
    return [];
  };
  
  const [activeModule, setActiveModule] = useState<string | null>("home");
  const modules = getModulesForUser(user); // Usar la nueva función
  // Métricas demo (luego se consultarán reales)
  const [metrics, setMetrics] = useState({ vendedores: 0, clientes: 0, pedidosPendientes: 0, ventasMes: 0 });

  const renderModuleContent = () => {
    const role = user?.rol || "";
    const usuario = user?.usuario || "";
    switch (activeModule) {
      case "routes":
        return <RouteControlModule role={user?.rol || ""} usuario={user?.usuario || ""} />;
      case "visits":
        return <VisitsModule role={role} />;
      case "orders":
        return <OrdersModule role={role} />;
      case "dispatches":
        return <DispatchesModule role={role} />;
      case "clients":
        return <ClientsModule role={role} />;
      case "statistics":
        return <StatisticsModule role={role} />;
      case "collections":
        return <CollectionsModule role={role} />;
      case "returns":
        // Oculto para todos los usuarios
        return null;
      case "cuentas":
        return <CuentasVendedor />;
      case "support": // Nuevo caso
        return <SupportModule />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Módulo en Desarrollo</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Este módulo está siendo desarrollado.</p>
            </CardContent>
          </Card>
        );
    }
  };

  // --- CAPTURA Y ENVÍO DE UBICACIÓN PARA VENDEDORES ---
  const geoWatchId = useRef<number | null>(null);
  useEffect(() => {
    // Solo vendedores (tienen módulo 'routes' o 'visits' o 'cuentas', etc.)
    if (!user) return;
    const isVendedor = Array.isArray(user.modulos) && (
      user.modulos.includes("routes") ||
      user.modulos.includes("visits") ||
      user.modulos.includes("cuentas")
    );
    if (!isVendedor) return;

    let lastSent = 0;
    function sendUbicacion(position: GeolocationPosition) {
      if (!user) return;
      const now = Date.now();
      // Enviar solo si han pasado al menos 20 segundos
      if (now - lastSent < 20000) return;
      lastSent = now;
      fetch("/api/ubicacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: user.usuario,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          zona: user.zona,
          timestamp: new Date().toISOString(),
        }),
      });
    }
    if (navigator.geolocation) {
      geoWatchId.current = navigator.geolocation.watchPosition(
        sendUbicacion,
        (err) => { /* Opcional: manejar error */ },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }
    return () => {
      if (geoWatchId.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchId.current);
      }
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col-reverse md:flex-row">
        {/* Lado Izquierdo */}
        <div className="w-full md:w-1/2 flex flex-col justify-center bg-gradient-to-br from-blue-500 via-blue-400 to-green-400 p-8 md:p-16 animate-features-panel">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-4 mb-8 animate-features-title">
              <Building2 className="w-12 h-12 text-white bg-white/20 rounded-xl p-2 shadow-lg" />
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow mb-1">Sistema de Ventas</h1>
                <p className="text-white/90 text-lg font-medium">Gestión integral de rutas y ventas</p>
              </div>
            </div>
            <div className="space-y-6">
              <FeatureCard
                icon={<Shield className="w-8 h-8 text-blue-600 bg-white/80 rounded-lg p-1" />} 
                title="Control Total"
                description="Monitorea en tiempo real el desempeño de tu equipo de ventas con análisis avanzados"
                delay="150"
                animateClass="animate-feature-card"
              />
              <FeatureCard
                icon={<LogIn className="w-8 h-8 text-blue-600 bg-white/80 rounded-lg p-1" />} 
                title="Acceso Seguro"
                description="Sistema de autenticación avanzado con roles y permisos granulares"
                delay="350"
                animateClass="animate-feature-card"
              />
              <FeatureCard
                icon={<Building2 className="w-8 h-8 text-blue-600 bg-white/80 rounded-lg p-1" />} 
                title="Multi-zona"
                description="Gestiona operaciones en múltiples zonas con reportes centralizados"
                delay="550"
                animateClass="animate-feature-card"
              />
            </div>
            <footer className="mt-16 text-white/70 text-xs text-center md:text-left animate-fade-in-up" style={{animationDelay: '700ms', animationFillMode: 'both'}}>© 2025 Sistema de Ventas. Todos los derechos reservados.</footer>
          </div>
        </div>
        {/* Lado Derecho: Login */}
        <div className="w-full md:w-1/2 flex items-center justify-center animate-fade-in-right">
          <div className="w-full max-w-md rounded-2xl shadow-2xl bg-white/90 p-2 md:p-4 my-8 md:my-0 relative overflow-hidden animate-login-card">
            {/* Línea de gradiente superior */}
            <div className="absolute top-0 left-0 w-full h-2 rounded-t-2xl bg-gradient-to-r from-blue-500 to-green-400" />
            <Card className="w-full shadow-none border-0 animate-login-fadein" style={{animationDelay: '200ms', animationFillMode: 'both'}}>
            <CardHeader className="flex flex-col items-center gap-2 pb-2 mt-2">
              <div className="bg-blue-100 rounded-2xl p-4 shadow mb-2 animate-login-icon" style={{animationDelay: '400ms', animationFillMode: 'both'}}>
                <LogIn className="w-10 h-10 text-blue-500" />
              </div>
              <CardTitle className="text-3xl font-extrabold text-center w-full text-gray-800">Bienvenido</CardTitle>
              <span className="text-gray-400 text-base text-center w-full font-normal">Ingrese sus credenciales para acceder al sistema</span>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Ingrese su usuario"
                    required
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Ingrese su contraseña"
                    required
                    className="bg-gray-50"
                  />
                </div>
                {error && <div className="text-red-500 text-sm text-center animate-fade-in-up">{error}</div>}
                <Button
                  type="submit"
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 transition-all duration-200 text-base font-semibold shadow-lg animate-login-btn"
                  style={{animationDelay: '600ms', animationFillMode: 'both'}}
                  disabled={loading}
                >
                  <LogIn className="w-5 h-5" />
                  {loading ? "Ingresando..." : "Iniciar Sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    );
  }
  // Si está autenticado, mostrar dashboard/módulos
  return (
    <div className="min-h-screen bg-gray-50 animate-dashboard-enter">
      {/* Header - Solo visible en escritorio */}
      <header className="hidden md:block bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px:8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold text-gray-900">Sistema de Gestión de Ventas</h1>
                  <Badge variant="outline" className="text-sm">
                    {user.rol}
                  </Badge>
              {/* Eliminado el Badge de 'Todas' */}
                  <Badge variant="outline" className="text-sm">
                    {user.zona === "Todas" ? selectedZona : user.zona}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Filtro de zona solo si zona es 'Todas' */}
                  {user.zona === "Todas" && (
                <div className="flex items-center gap-2">
                  {/* Icono púrpura a la izquierda del filtro */}
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                    <ShadSelect value={selectedZona} onValueChange={setSelectedZona}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Zona" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="Todas">Todas</SelectItem>
                        {ZONAS.filter(z => z !== "Todas").map(zona => (
                          <SelectItem key={zona} value={zona}>{zona}</SelectItem>
                        ))}
                      </SelectContent>
                    </ShadSelect>
                </div>
              )}
              {/* Botón de cerrar sesión con icono a la izquierda */}
              <button
                onClick={() => setUser(null)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
                Cerrar sesión
              </button>
            </div>
              </div>
            </div>
          </header>
      
      {/* Contenedor principal - Responsive */}
      <div className="md:max-w-7xl md:mx-auto md:px-4 md:sm:px-6 md:lg:px-8 py-8 pt-14 md:pt-8">
        {/* Botón hamburguesa */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-white rounded-full shadow p-2"
          onClick={() => setSidebarOpen(true)}
        >
          <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Drawer móvil */}
        <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
          <button className="absolute top-4 right-4" onClick={() => setSidebarOpen(false)}>✕</button>
          {/* Botón de Inicio */}
          <Button
            className={`w-full justify-start transition-colors mb-2
              ${activeModule === "home"
                ? "bg-cyan-100 text-cyan-700"
                : "bg-white text-cyan-600 hover:bg-cyan-50"}
            `}
            onClick={() => { setActiveModule("home"); if (typeof setSidebarOpen === 'function') setSidebarOpen(false); }}
          >
            <span className={`mr-2 rounded-lg p-2 flex items-center justify-center
              ${activeModule === "home" ? "bg-cyan-200 text-cyan-700" : "bg-cyan-50 text-cyan-600"}
            `}>
              <Home className="w-5 h-5" />
            </span>
            Inicio
          </Button>
          {/* Botones de módulos */}
          {modules.map((module) => {
            const moduleInfo = MODULES.find(m => m.id === module.id);
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            const hoverBg = moduleInfo?.color?.replace("bg-", "hover:bg-")?.replace("text-", "hover:text-") + "/60";
            return (
              <Button
                key={module.id}
                className={`w-full justify-start bg-white text-black transition-colors mb-2 ${isActive ? moduleInfo?.color + " bg-opacity-60" : ""} ${hoverBg}`}
                onClick={() => { setActiveModule(module.id); setSidebarOpen(false); }}
              >
                <span className={`mr-2 rounded-lg p-2 ${moduleInfo?.color || ""}`}>
                  <Icon className="w-5 h-5" />
                </span>
                {module.name}
              </Button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1">
              {activeModule === "home" ? (
                <div className="w-full">
                  <DashboardHome
                    zona={user.zona === "Todas" ? selectedZona : user.zona}
                    onSelectModule={setActiveModule}
                    availableModules={modules}
                    metrics={metrics}
                    onZonaChange={setSelectedZona}
                    zonas={user.zona === "Todas" ? ZONAS.filter(z => z !== "Todas") : [user.zona]}
                    nombre={user.propietario}
                onLogout={() => setUser(null)}
                  />
                </div>
              ) : (
                <div className="flex gap-6">
              {/* Sidebar escritorio */}
              <div className="hidden md:block w-64 space-y-2">
                <Card className="bg-white">
                      <CardHeader>
                        <CardTitle className="text-lg">Módulos</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                    {/* Botón de Inicio */}
                        <Button
                      className={`w-full justify-start transition-colors mb-2
                        ${activeModule === "home" ? "bg-cyan-50 text-cyan-600" : "bg-white text-black"}
                        hover:bg-cyan-100 hover:text-cyan-700`}
                      onClick={() => { setActiveModule("home"); if (typeof setSidebarOpen === 'function') setSidebarOpen(false); }}
                    >
                      <span className="mr-2 rounded-lg p-2 bg-cyan-100 text-cyan-600 flex items-center justify-center">
                        <Home className="w-5 h-5" />
                      </span>
                          Inicio
                        </Button>
                    {/* Botones de módulos */}
                        {modules.map((module) => {
                      const moduleInfo = MODULES.find(m => m.id === module.id);
                          const Icon = module.icon;
                          const isActive = activeModule === module.id;
                      // Color de fondo para hover/active
                      const hoverBg = moduleInfo?.color?.replace("bg-", "hover:bg-")?.replace("text-", "hover:text-") + "/60";
                          return (
                            <Button
                              key={module.id}
                          className={`w-full justify-start bg-white text-black transition-colors mb-2 ${isActive ? moduleInfo?.color + " bg-opacity-60" : ""} ${hoverBg}`}
                              onClick={() => setActiveModule(module.id)}
                            >
                          <span className={`mr-2 rounded-lg p-2 ${moduleInfo?.color || ""}`}>
                            <Icon className="w-5 h-5" />
                          </span>
                              {module.name}
                            </Button>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>
                  {/* Main Content */}
                  <div className="flex-1">{renderModuleContent()}</div>
                </div>
              )}
        </div>
          </div>
    </div>
  );
}

// Card de característica animado
function FeatureCard({ icon, title, description, delay, animateClass }: { icon: React.ReactNode, title: string, description: string, delay: string, animateClass?: string }) {
  return (
    <div className={`flex items-center gap-4 bg-white/20 rounded-2xl p-6 shadow-lg backdrop-blur-md border border-white/30 hover:scale-[1.03] hover:shadow-2xl transition-all duration-300 cursor-pointer ${animateClass || ''}`} style={{animationDelay: `${delay}ms`, animationFillMode: 'both'}}>
      <div>{icon}</div>
      <div>
        <div className="text-lg font-bold text-white mb-1">{title}</div>
        <div className="text-white/90 text-sm">{description}</div>
      </div>
    </div>
  )
}

// Animaciones keyframes (TailwindCSS ya incluye tailwindcss-animate, pero agrego clases utilitarias si es necesario)
