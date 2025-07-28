import { useState } from "react"
import clientesData from "@/data/clientes.json"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { USER_CREDENTIALS } from "../data/user-credentials"

const BANCOS_BCV = [
  "Banco Nacional De Crédito",
  "Banco Provincial",
  "Banco Mercantil",
  "Banco Caribe",
  "Banco Bicentenario"
]

const BANCOS_DIVISAS = [
  "Banco Nacional De Crédito",
  "Banco Provincial",
  "Banco Mercantil"
]

export default function FormularioCobro({
  showDialog,
  setShowDialog,
  orders,
  onSave
}: {
  showDialog: boolean,
  setShowDialog: (v: boolean) => void,
  orders: any[],
  onSave: (data: any) => void
}) {
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [paymentType, setPaymentType] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [exchangeRate, setExchangeRate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    if (!selectedOrderId || !paymentType) {
      alert("Por favor complete todos los campos obligatorios")
      return
    }

    if (paymentType === "Al BCV" && (!paymentDate || !exchangeRate || !paymentMethod)) {
      alert("Por favor complete todos los campos para Al BCV")
      return
    }

    if (paymentType === "Al BCV" && paymentMethod === "Transferencia Bancaria" && !selectedBank) {
      alert("Por favor seleccione un banco")
      return
    }

    if (paymentType === "DIVISAS" && !paymentMethod) {
      alert("Por favor seleccione la forma de pago para DIVISAS")
      return
    }

    if (paymentType === "DIVISAS" && paymentMethod === "Transferencia Bancaria" && !selectedBank) {
      alert("Por favor seleccione un banco para Transferencia Bancaria en DIVISAS")
      return
    }

    setSaving(true)
    const order = orders.find(o => o.id === selectedOrderId)
    // Buscar el nombre del cliente usando el ID
    let clientName = ""
    if (order?.client) {
      const clienteObj = Array.isArray(clientesData)
        ? clientesData.find((c: any) => String(c.id) === String(order.client) || c.name === order.client)
        : undefined;
      clientName = clienteObj?.name || order.client || "";
    }
    // Obtener vendorId del pedido o buscarlo por el usuario logueado
    let vendorId = order?.vendorId || order?.vendor || "";
    if (!vendorId && order?.usuario) {
      const cred = USER_CREDENTIALS.find((u: any) => u.usuario === order.usuario);
      vendorId = cred ? cred.vendorId : "";
    }
    // Forzar que el campo vendor sea SIEMPRE el vendorId correcto
    onSave({
      id: `COB-${Date.now()}`,
      orderId: selectedOrderId,
      client: clientName,
      date: new Date().toISOString().split('T')[0],
      amount: order?.total || 0,
      paymentType,
      paymentMethod: paymentType === "Al BCV" || paymentType === "DIVISAS" ? paymentMethod : null,
      bank: (paymentType === "Al BCV" && paymentMethod === "Transferencia Bancaria") || (paymentType === "DIVISAS" && paymentMethod === "Transferencia Bancaria") ? selectedBank : null,
      exchangeRate: paymentType === "Al BCV" ? parseFloat(exchangeRate) : null,
      paymentDate: paymentType === "Al BCV" ? paymentDate : null,
      vendor: vendorId // SIEMPRE el vendorId correcto
    })
    setSaving(false)
    setShowDialog(false)
    setSelectedOrderId("")
    setPaymentType("")
    setPaymentDate("")
    setExchangeRate("")
    setPaymentMethod("")
    setSelectedBank("")
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Cobro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 1. Seleccionar Pedido */}
          <div>
            <Label htmlFor="order">Seleccionar Pedido *</Label>
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar pedido" />
              </SelectTrigger>
              <SelectContent>
                {orders.map(order => {
                  let clientName = "";
                  if (order.client) {
                    const clienteObj = Array.isArray(clientesData)
                      ? clientesData.find((c: any) => String(c.id) === String(order.client) || c.name === order.client)
                      : undefined;
                    clientName = clienteObj?.name || order.client || "";
                  }
                  return (
                    <SelectItem key={order.id} value={order.id}>
                      {order.id} - {clientName} - ${order.total}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Tipo de Pago */}
          <div>
            <Label htmlFor="paymentType">Tipo de Pago *</Label>
            <Select value={paymentType} onValueChange={(value) => {
              setPaymentType(value)
              setPaymentMethod("")
              setSelectedBank("")
              setPaymentDate("")
              setExchangeRate("")
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Al BCV">Al BCV</SelectItem>
                <SelectItem value="DIVISAS">DIVISAS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos para Al BCV */}
          {paymentType === "Al BCV" && (
            <>
              <div>
                <Label htmlFor="paymentDate">Fecha del Pago *</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="exchangeRate">Tasa del Día *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={e => setExchangeRate(e.target.value)}
                  placeholder="Ingrese la tasa"
                />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Forma de Pago *</Label>
                <Select value={paymentMethod} onValueChange={(value) => {
                  setPaymentMethod(value)
                  setSelectedBank("")
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar forma de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentMethod === "Transferencia Bancaria" && (
                <div>
                  <Label htmlFor="bank">Banco *</Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANCOS_BCV.map(banco => (
                        <SelectItem key={banco} value={banco}>
                          {banco}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Campos para DIVISAS */}
          {paymentType === "DIVISAS" && (
            <>
              <div>
                <Label htmlFor="paymentMethod">Forma de Pago *</Label>
                <Select value={paymentMethod} onValueChange={(value) => {
                  setPaymentMethod(value)
                  setSelectedBank("")
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar forma de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                    <SelectItem value="Zelle">Zelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentMethod === "Transferencia Bancaria" && (
                <div>
                  <Label htmlFor="bank">Banco *</Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANCOS_DIVISAS.map(banco => (
                        <SelectItem key={banco} value={banco}>
                          {banco}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}