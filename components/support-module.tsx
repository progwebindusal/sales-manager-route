"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Copy, Video } from "lucide-react";

export default function SupportModule() {
  const [copied, setCopied] = useState('');

  const handleCopy = (textToCopy: string, type: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000); // Reset after 2 seconds
  };

  const supportEmail = "programadorwe.indusalca@gmail.com";
  const supportPhone = "+58 4121803205";

  return (
    <div className="min-h-screen bg-gray-50 animate-dashboard-enter p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Mail className="h-6 w-6 text-gray-700" />
              <span>Soporte y Contacto</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <p className="text-gray-600">
                En caso de requerir la eliminación de un registro específico, redactar una solicitud al correo proporcionado.
              </p>
              
              {/* Email */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <span className="font-mono text-gray-800">{supportEmail}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => handleCopy(supportEmail, 'email')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied === 'email' ? 'Copiado' : 'Copiar'}
                </Button>
              </div>

              {/* Phone */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <span className="font-mono text-gray-800">{supportPhone}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => handleCopy(supportPhone, 'phone')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied === 'phone' ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8 overflow-hidden">
          <CardHeader className="bg-gray-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Video className="h-6 w-6 text-gray-700" />
              <span>Videos de Inducción</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>Próximamente encontrarás aquí los videos de inducción para el uso del sistema.</p>
            </div>
            {/* Aquí se pueden agregar los videos en el futuro */}
            {/* Ejemplo:
            <div className="mt-4">
              <h3 className="font-semibold">Módulo de Pedidos</h3>
              <div className="aspect-w-16 aspect-h-9">
                <iframe 
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="w-full h-full rounded-lg"
                ></iframe>
              </div>
            </div>
            */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 