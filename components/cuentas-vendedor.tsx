"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Building2, Mail } from "lucide-react";

interface BankAccount {
  id: string;
  name: string;
  number: string;
  logo: React.ReactNode;
}

const bcvAccounts: BankAccount[] = [
  { id: 'bnc-bcv', name: 'Banco Nacional de Crédito', number: '0191-0123-14-2100000668', logo: <Building2 className="h-8 w-8 text-blue-600" /> },
  { id: 'provincial-bcv', name: 'Banco Provincial', number: '0108-0116-81-0100079454', logo: <Building2 className="h-8 w-8 text-blue-800" /> },
  { id: 'mercantil-bcv', name: 'Banco Mercantil', number: '0105-0067-27-1067298843', logo: <Building2 className="h-8 w-8 text-red-600" /> },
  { id: 'caribe-bcv', name: 'Banco Caribe', number: '0114-0502-92-5020021073', logo: <Building2 className="h-8 w-8 text-green-500" /> },
  { id: 'bicentenario-bcv', name: 'Banco Bicentenario', number: '0175-0060-12-0000002006', logo: <Building2 className="h-8 w-8 text-yellow-500" /> },
];

const divisasAccounts: BankAccount[] = [
  { id: 'bnc-div', name: 'Banco Nacional de Crédito', number: '0191-0123-12-2300001489', logo: <Building2 className="h-8 w-8 text-blue-600" /> },
  { id: 'provincial-div', name: 'Banco Provincial', number: '0108-0305-57-0100124287', logo: <Building2 className="h-8 w-8 text-blue-800" /> },
  { id: 'mercantil-div', name: 'Banco Mercantil', number: '0105-0067-21-5067125144', logo: <Building2 className="h-8 w-8 text-red-600" /> },
];

const AccountRow = ({ account, copiedId, onCopy }: { account: BankAccount; copiedId: string | null; onCopy: (number: string, id: string) => void; }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0">{account.logo}</div>
      <div>
        <p className="font-semibold text-gray-800">{account.name}</p>
        <p className="text-sm text-gray-600 font-mono tracking-wider">{account.number}</p>
      </div>
    </div>
    <Button variant="ghost" size="icon" onClick={() => onCopy(account.number, account.id)}>
      <Copy className="h-5 w-5 text-gray-500" />
      {copiedId === account.id && <span className="ml-2 text-xs text-green-600">Copiado</span>}
    </Button>
  </div>
);

export default function CuentasVendedor() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (textToCopy: string, id: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
  };

  const companyEmail = "gestion.cobranza@indusalca.com.ve";

  return (
    <div className="min-h-screen bg-gray-50 animate-dashboard-enter p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="overflow-hidden shadow-md">
          <CardHeader className="bg-gray-100 border-b">
            <CardTitle className="text-xl">Cuentas con titular Industrias Salineras, C.A.</CardTitle>
            <CardDescription>RIF: J-070083786</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <a href={`mailto:${companyEmail}`} className="font-mono text-blue-600 hover:underline">{companyEmail}</a>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="sm:ml-auto"
                  onClick={() => handleCopy(companyEmail, 'email-main')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copiedId === 'email-main' ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
          </CardContent>
        </Card>

        {/* Cuentas para Al BCV */}
        <Card className="overflow-hidden shadow-md">
          <CardHeader>
            <CardTitle>Cuentas para Al BCV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bcvAccounts.map(account => (
              <AccountRow key={account.id} account={account} copiedId={copiedId} onCopy={handleCopy} />
            ))}
          </CardContent>
        </Card>

        {/* Cuentas para DIVISAS */}
        <Card className="overflow-hidden shadow-md">
          <CardHeader>
            <CardTitle>Cuentas para DIVISAS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {divisasAccounts.map(account => (
              <AccountRow key={account.id} account={account} copiedId={copiedId} onCopy={handleCopy} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 