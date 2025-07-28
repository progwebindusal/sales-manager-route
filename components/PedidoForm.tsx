import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { products as allProducts } from "@/data/products";
import React, { useState } from "react";

interface PedidoFormProps {
  products: any[];
  addOrderProducts: any[];
  setAddOrderProducts: (fn: (prev: any[]) => any[]) => void;
  addOrderPriceType: string;
  setAddOrderPriceType: (v: string) => void;
  onSave: (productosPedido: any[]) => void;
  onCancel: () => void;
  saving?: boolean;
  isVendedor: boolean;
  vendedores: { id: string, name: string }[];
  selectedVendor: string;
  setSelectedVendor: (v: string) => void;
  clientes: any[];
  selectedClient: string;
  setSelectedClient: (v: string) => void;
}

export default function PedidoForm({
  products,
  addOrderProducts,
  setAddOrderProducts,
  addOrderPriceType,
  setAddOrderPriceType,
  onSave,
  onCancel,
  saving,
  isVendedor,
  vendedores,
  selectedVendor,
  setSelectedVendor,
  clientes,
  selectedClient,
  setSelectedClient
}: PedidoFormProps) {
  const [error, setError] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  const validate = () => {
    if (addOrderProducts.length === 0) return "Debe seleccionar al menos un producto.";
    for (const p of addOrderProducts) {
      if (!p.priceType) return "Debe seleccionar el tipo de precio para todos los productos.";
      if (!p.quantity || p.quantity <= 0) return "La cantidad debe ser mayor a 0 en todos los productos.";
      if (p.applyDiscount && (!p.unitPrice || p.unitPrice <= 0)) return "El precio unitario con descuento debe ser mayor a 0.";
    }
    if (!selectedClient) return "Debe seleccionar un cliente.";
    if (!isVendedor && !selectedVendor) return "Debe seleccionar un vendedor.";
    return "";
  };

  const handleSave = () => {
    const err = validate();
    setError(err);
    if (!err) {
      // Construir el array de productos correctamente para la tabla de pedidos
      const productosPedido = addOrderProducts.map(prodSel => {
        const product = products.find(prod => prod.id === prodSel.id) || {};
        const unitPrice = addOrderPriceType === "Al BCV"
          ? (prodSel.priceType === "perKg" ? product.priceAlBCV?.perKg : product.priceAlBCV?.perSack)
          : (prodSel.priceType === "perKg" ? product.priceDivisas?.perKg : product.priceDivisas?.perSack);
        const finalUnitPrice = prodSel.applyDiscount ? (prodSel.unitPrice || unitPrice) : unitPrice;
        return {
          id: prodSel.id,
          name: product.name,
          quantity: prodSel.quantity,
          price: finalUnitPrice,
          priceType: prodSel.priceType,
          applyDiscount: !!prodSel.applyDiscount,
          unitPrice: prodSel.unitPrice || undefined,
          subtotal: finalUnitPrice * prodSel.quantity,
          weight: product.weight
        };
      });
      onSave(productosPedido);
    }
  };

  // Filtrar clientes por búsqueda
  const filteredClientes = (clientes || []).filter((c: any) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const detallesPedido = addOrderProducts.map(p => {
    const product = products.find(prod => prod.id === p.id);
    const unitPrice = addOrderPriceType === "Al BCV"
      ? (p.priceType === "perKg" ? product.priceAlBCV.perKg : product.priceAlBCV.perSack)
      : (p.priceType === "perKg" ? product.priceDivisas.perKg : product.priceDivisas.perSack);
    const finalUnitPrice = p.applyDiscount ? (p.unitPrice || unitPrice) : unitPrice;
    return {
      productoId: p.id,
      cantidad: p.quantity,
      precio_unitario: finalUnitPrice, // Aquí se guarda el precio con descuento si aplica
      subtotal: finalUnitPrice * p.quantity,
    };
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {!isVendedor && (
        <div>
          <Label>Vendedor</Label>
          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Seleccionar vendedor" />
            </SelectTrigger>
            <SelectContent>
              {(vendedores || []).map(v => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label>Cliente</Label>
        <div className="w-64">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {/* Buscador dentro del select, sin autoFocus para evitar conflicto de focus */}
              <div className="px-2 py-2 sticky top-0 bg-white z-10">
                <Input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  className="mb-2"
                />
              </div>
              {(clientes || []).filter((c: any) =>
                c.name.toLowerCase().includes(clientSearch.toLowerCase())
              ).map((c: any) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Precio Aplicado</Label>
        <Select value={addOrderPriceType} onValueChange={setAddOrderPriceType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Al BCV">Al BCV</SelectItem>
            <SelectItem value="DIVISAS">DIVISAS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Productos del Pedido</h3>
        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {products.map((product: any) => {
            const selected = addOrderProducts.find(p => p.id === product.id) || {};
            const isSelected = !!selected.id;
            const handleSelect = (checked: boolean) => {
              if (checked) {
                setAddOrderProducts(prev => [...prev, { id: product.id, priceType: 'perSack', quantity: 1, applyDiscount: false }]);
              } else {
                setAddOrderProducts(prev => prev.filter(p => p.id !== product.id));
              }
            };
            const handleChange = (field: string, value: any) => {
              setAddOrderProducts(prev => prev.map(p => p.id === product.id ? { ...p, [field]: value } : p));
            };
            const unitPrice = addOrderPriceType === "Al BCV"
              ? (selected.priceType === "perKg" ? product.priceAlBCV.perKg : product.priceAlBCV.perSack)
              : (selected.priceType === "perKg" ? product.priceDivisas.perKg : product.priceDivisas.perSack);
            const finalUnitPrice = selected.applyDiscount ? (selected.unitPrice || unitPrice) : unitPrice;
            const subtotal = selected.quantity ? (Number(selected.quantity) * finalUnitPrice) : 0;
            return (
              <div key={product.id} className="border rounded p-3 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={e => handleSelect(e.target.checked)}
                  />
                  <span className="font-medium">{product.name}</span>
                </div>
                {isSelected && (
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
                    <div>
                      <Label className="text-xs">Tipo de Precio</Label>
                      <Select
                        value={selected.priceType || "perSack"}
                        onValueChange={v => handleChange('priceType', v)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="perSack">
                            Por Saco (${addOrderPriceType === "Al BCV" ? product.priceAlBCV.perSack : product.priceDivisas.perSack})
                          </SelectItem>
                          <SelectItem value="perKg">
                            Por Kg (${addOrderPriceType === "Al BCV" ? product.priceAlBCV.perKg : product.priceDivisas.perKg})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        step={selected.priceType === "perSack" ? "1" : "0.1"}
                        className="h-8"
                        value={selected.quantity || ""}
                        onChange={e => {
                          const value = Number.parseFloat(e.target.value) || 0
                          const finalValue = selected.priceType === "perSack" ? Math.round(value) : value
                          handleChange('quantity', finalValue)
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <input
                          type="checkbox"
                          checked={!!selected.applyDiscount}
                          onChange={e => handleChange('applyDiscount', e.target.checked)}
                        />
                        <Label className="text-xs">Descuento</Label>
                      </div>
                      {selected.applyDiscount ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-8"
                          placeholder="Precio"
                          value={selected.unitPrice || ""}
                          onChange={e => handleChange('unitPrice', Number.parseFloat(e.target.value) || 0)}
                        />
                      ) : (
                        <div className="h-8 px-3 py-1 bg-gray-50 rounded text-sm flex items-center">
                          ${unitPrice}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Subtotal</Label>
                      <div className="h-8 px-3 py-1 bg-gray-50 rounded text-sm flex items-center font-medium">
                        ${subtotal.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Total Kg</Label>
                      <div className="h-8 px-3 py-1 bg-gray-50 rounded text-sm flex items-center">
                        {(selected.quantity * product.weight).toFixed(2)} Kg
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {addOrderProducts.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total del Pedido ({addOrderPriceType}):</span>
            <span>$
              {addOrderProducts.reduce((total, p) => {
                const product = products.find(prod => prod.id === p.id)
                if (!product) return total
                const unitPrice = addOrderPriceType === "Al BCV"
                  ? (p.priceType === "perKg" ? product.priceAlBCV.perKg : product.priceAlBCV.perSack)
                  : (p.priceType === "perKg" ? product.priceDivisas.perKg : product.priceDivisas.perSack)
                const finalUnitPrice = p.applyDiscount ? (p.unitPrice || unitPrice) : unitPrice;
                return total + (Number(p.quantity) * finalUnitPrice)
              }, 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
      {addOrderProducts.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Kg General:</span>
            <span>
              {addOrderProducts.reduce((totalKg, p) => {
                const product = allProducts.find(prod => prod.id === p.id);
                return totalKg + (Number(p.quantity) * (product ? product.weight : 0));
              }, 0).toFixed(2)} Kg
            </span>
          </div>
        </div>
      )}
      {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving || !!validate()}>Guardar Pedido</Button>
      </div>
      {addOrderProducts.length > 0 && (
        <div className="mt-4 w-full overflow-x-auto">
          <h3 className="text-lg font-semibold">Detalles del Pedido</h3>
          <table className="min-w-[600px] w-full mt-2">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Producto</th>
                <th className="px-4 py-2 text-left">Cantidad</th>
                <th className="px-4 py-2 text-left">Precio Unit.</th>
                <th className="px-4 py-2 text-left">Subtotal</th>
                <th className="px-4 py-2 text-left">Total Kg</th>
              </tr>
            </thead>
            <tbody>
              {detallesPedido.map((item, idx) => (
                <tr key={idx}>
                  <td className="border px-4 py-2">{item.productoId}</td>
                  <td className="border px-4 py-2">{item.cantidad}</td>
                  <td className="border px-4 py-2">${item.precio_unitario.toFixed(2)}</td>
                  <td className="border px-4 py-2">${item.subtotal.toFixed(2)}</td>
                  <td className="border px-4 py-2">{(item.cantidad * (products.find(prod => prod.id === item.productoId)?.weight || 0)).toFixed(2)} Kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}