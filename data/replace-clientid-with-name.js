// Script para reemplazar clientId por el nombre del cliente en despachos.json y eliminar clientId
const fs = require('fs');
const path = require('path');

const despachosPath = path.join(__dirname, 'despachos.json');
const clientesPath = path.join(__dirname, 'clientes.json');

const despachos = JSON.parse(fs.readFileSync(despachosPath, 'utf8'));
const clientes = JSON.parse(fs.readFileSync(clientesPath, 'utf8'));

function getNombreCliente(id) {
  const cliente = clientes.find(c => String(c.id) === String(id));
  return cliente ? cliente.name : id;
}

despachos.forEach(despacho => {
  if (Array.isArray(despacho.orders)) {
    despacho.orders.forEach(order => {
      if (order.clientId) {
        order.clientName = getNombreCliente(order.clientId);
        delete order.clientId;
      }
    });
  }
});

fs.writeFileSync(despachosPath, JSON.stringify(despachos, null, 2), 'utf8');
console.log('Actualización completada: clientId eliminado y reemplazado por nombre en despachos.json');
