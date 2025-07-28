"use client"

import { useEffect, useRef } from "react"

interface LeafletMapProps {
  routes?: any[]
  selectedVendor?: string
  height?: number
  onClientClick?: (client: any) => void
  showRouteLines?: boolean
  center?: [number, number]
  onLocationSelect?: (lat: number, lng: number) => void
  selectedLocation?: { lat: number; lng: number }
  ubicaciones?: { usuario: string; lat: number; lng: number; zona?: string; timestamp?: string }[]
}

export default function LeafletMap({
  routes = [],
  selectedVendor = "all",
  height = 400,
  onClientClick,
  showRouteLines = true,
  center = [10.6316, -71.6444], // Maracaibo coordinates
  onLocationSelect,
  selectedLocation,
  ubicaciones = [],
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return

    let isMounted = true;

    // Limpiar el contenedor del mapa antes de inicializar uno nuevo
    if (mapRef.current) {
      mapRef.current.innerHTML = "";
    }

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      const L = (await import("leaflet")).default

      // Fix for default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      // Initialize map if not already done
      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView(center, 12)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapInstanceRef.current)

        // Add click handler for location selection
        if (onLocationSelect) {
          mapInstanceRef.current.on("click", (e: any) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng)
          })
        }
      }

      // Clear existing markers and polylines
      if (mapInstanceRef.current) {
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            mapInstanceRef.current && mapInstanceRef.current.removeLayer(layer)
        }
      })
      }

      // --- Mostrar ubicaciones de vendedores ---
      // Si hay rutas y la primera tiene vendorId, solo mostrar la ubicación de ese usuario (que ahora es el nombre de usuario)
      let ubicacionesFiltradas = ubicaciones;
      if (routes.length === 1 && routes[0].vendorId) {
        ubicacionesFiltradas = ubicaciones.filter(u => u.usuario === routes[0].vendorId);
      } else if (selectedVendor && selectedVendor !== "all") {
        ubicacionesFiltradas = ubicaciones.filter(u => u.usuario === selectedVendor);
      } else if (routes.length > 0 && routes.every(r => r.vendorId)) {
        const uniqueVendors = Array.from(new Set(routes.map(r => r.vendorId)));
        if (uniqueVendors.length === 1) {
          ubicacionesFiltradas = ubicaciones.filter(u => u.usuario === uniqueVendors[0]);
        } else {
          ubicacionesFiltradas = [];
        }
      } else {
        ubicacionesFiltradas = [];
      }
      if (ubicacionesFiltradas && ubicacionesFiltradas.length > 0) {
        ubicacionesFiltradas.forEach((u, index) => {
          const isOwnLocation = ubicacionesFiltradas.length === 1; // Asumir que si solo hay una, es la propia
          const iconColor = isOwnLocation ? '#ef4444' : '#2563eb'; // Rojo para propia, azul para otras
          const vendedorIcon = L.divIcon({
            className: "vendedor-marker",
            html: `<div style=\"background-color: ${iconColor}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;\">${isOwnLocation ? 'YO' : 'V'}</div>`
          });
          L.marker([u.lat, u.lng], { icon: vendedorIcon })
            .bindPopup(`<strong>${u.usuario}</strong><br/>Zona: ${u.zona || "-"}${isOwnLocation ? '<br/><em>Tu ubicación actual</em>' : ''}`)
            .addTo(mapInstanceRef.current);
        });
      }

      // Add selected location marker
      if (selectedLocation && mapInstanceRef.current) {
        const selectedIcon = L.divIcon({
          className: "selected-location-marker",
          html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        L.marker([selectedLocation.lat, selectedLocation.lng], { icon: selectedIcon })
          .bindPopup("Ubicación seleccionada")
          .addTo(mapInstanceRef.current)
      }

      // Eliminar la simulación de movimiento de los puntos azules (vendedores)
      // y el punto azul especial para Víctor Hinestroza

      // Add route markers and lines
      for (const route of routes) {
        if (selectedVendor !== "all" && route.vendorId !== selectedVendor) continue

        const routeCoordinates: [number, number][] = []

        for (const [index, client] of route.clients.entries()) {
          const { lat, lng } = client.location || {
            lat: 10.6316 + (Math.random() - 0.5) * 0.1,
            lng: -71.6444 + (Math.random() - 0.5) * 0.1,
          }
          routeCoordinates.push([lat, lng])

          // Create custom icon based on status
          let iconColor = "#6b7280" // gray
          switch (client.status) {
            case "not_visited":
              iconColor = "#ef4444" // red
              break
            case "visited":
              iconColor = "#eab308" // yellow
              break
            case "order_placed":
              iconColor = "#22c55e" // green
              break
          }

          const customIcon = L.divIcon({
            className: "custom-marker",
            html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">${index + 1}</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })

          if (mapInstanceRef.current) {
          const marker = L.marker([lat, lng], { icon: customIcon })
            .bindPopup(`
              <div>
                <strong>${client.name}</strong><br/>
                <span>Estado: ${getStatusText(client.status)}</span><br/>
                <span>Ruta: ${route.name}</span><br/>
                <span>Vendedor: ${route.vendor}</span><br/>
                <span>Orden: ${index + 1}</span>
              </div>
            `)
            .addTo(mapInstanceRef.current)

          if (onClientClick) {
            marker.on("click", () => onClientClick({ ...client, route }))
            }
          }
        }

        // Draw route line using routing service for road-following paths
        if (showRouteLines && routeCoordinates.length > 1 && mapInstanceRef.current) {
          try {
            // Use OSRM routing service for road-following routes
            const waypoints = routeCoordinates.map((coord) => `${coord[1]},${coord[0]}`).join(";")
            const routingUrl = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`

            fetch(routingUrl)
              .then((response) => response.json())
              .then((data) => {
                if (!isMounted || !mapInstanceRef.current) return;
                if (data.routes && data.routes[0]) {
                  const routeGeometry = data.routes[0].geometry.coordinates.map((coord: number[]) => [
                    coord[1],
                    coord[0],
                  ])

                  L.polyline(routeGeometry, {
                    color: route.status === "completed" ? "#22c55e" : "#3b82f6",
                    weight: 4,
                    opacity: 0.8,
                  }).addTo(mapInstanceRef.current)
                }
              })
              .catch(() => {
                if (!isMounted || !mapInstanceRef.current) return;
                // Fallback to straight lines if routing fails
                L.polyline(routeCoordinates, {
                  color: route.status === "completed" ? "#22c55e" : "#3b82f6",
                  weight: 3,
                  opacity: 0.7,
                  dashArray: "5, 5",
                }).addTo(mapInstanceRef.current)
              })
          } catch (error) {
            if (!isMounted || !mapInstanceRef.current) return;
            // Fallback to straight lines
            L.polyline(routeCoordinates, {
              color: route.status === "completed" ? "#22c55e" : "#3b82f6",
              weight: 3,
              opacity: 0.7,
              dashArray: "5, 5",
            }).addTo(mapInstanceRef.current)
          }
        }
      }
    }

    initMap()

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [routes, selectedVendor, onClientClick, showRouteLines, selectedLocation, ubicaciones])

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

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
        integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
        crossOrigin=""
      />
      <div ref={mapRef} style={{ height: `${height}px`, width: "100%" }} className="rounded-lg border" />
    </>
  )
}
