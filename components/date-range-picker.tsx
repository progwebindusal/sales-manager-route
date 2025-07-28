"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "lucide-react"

interface DateRangePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDateRangeSelect: (startDate: string, endDate: string) => void
}

export default function DateRangePicker({ open, onOpenChange, onDateRangeSelect }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleApply = () => {
    if (startDate && endDate) {
      onDateRangeSelect(startDate, endDate)
      onOpenChange(false)
    }
  }

  const setQuickRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    setStartDate(start.toISOString().split("T")[0])
    setEndDate(end.toISOString().split("T")[0])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seleccionar Rango de Fechas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rangos Rápidos</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>
                Últimos 7 días
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>
                Últimos 30 días
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(90)}>
                Últimos 3 meses
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(365)}>
                Último año
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApply} disabled={!startDate || !endDate}>
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
