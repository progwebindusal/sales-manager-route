export interface User {
  id: string
  name: string
  role: "administrator" | "route_planner" | "billing" | "collections" | "vendedor_masivo" | "vendedor_moto"
  email: string
}

export interface Client {
  id: string
  name: string
  rif: string
  sada: string
  vendor: string
  location: {
    lat: number
    lng: number
  }
  address: string
  phone: string
  email: string
}

export interface Product {
  id: string
  name: string
  category: string
  priceAlBCV: {
    perSack: number
    perKg: number
  }
  priceDivisas: {
    perSack: number
    perKg: number
  }
  weight: number
  unit: string
}

export interface Order {
  id: string
  clientId: string
  vendorId: string
  date: string
  time: string
  products: OrderProduct[]
  paymentType: "Al BCV" | "DIVISAS" | "Ambas"
  total: number
  status: "order_placed" | "collected" | "returned"
}

export interface OrderProduct {
  productId: string
  quantity: number
}

export interface OrderProduct {
  productId: string
  quantity: number
  priceType: "perSack" | "perKg"
  unitPrice: number
  subtotal: number
}

export interface Route {
  id: string
  name: string
  vendorId: string
  date: string
  status: "active" | "completed" | "planned"
  clients: RouteClient[]
}

export interface RouteClient {
  clientId: string
  order: number
  status: "not_visited" | "visited" | "order_placed"
  visitTime?: string
  observations?: string
  reason?: string
}

export interface Visit {
  id: string
  clientId: string
  vendorId: string
  routeId?: string
  date: string
  time: string
  status: "not_visited" | "visited" | "order_placed"
  observations?: string
  reason?: string
  isOffRoute: boolean
}

export interface Payment {
  id: string
  orderId: string
  amount: number
  paymentType: "Al BCV" | "DIVISAS" | "Ambas"
  amountBCV?: number
  amountDivisas?: number
  date: string
  collectedBy: string
}

export interface Return {
  id: string
  orderId: string
  reason: string
  date: string
  processedBy: string
}
