import * as React from "react"
import { useState } from "react"
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown } from "lucide-react"

interface Option {
  value: string
  label: string
}

interface ComboboxProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchable?: boolean
}

export const Combobox: React.FC<ComboboxProps> = ({ options, value, onChange, placeholder = "Seleccionar...", searchable = false }) => {
  const [open, setOpen] = useState(false)
  const selected = options.find(opt => opt.value === value)
  const [search, setSearch] = useState("")

  const filteredOptions = searchable && search
    ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected ? selected.label : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 min-w-[220px]">
        <Command>
          {searchable && (
            <CommandInput
              placeholder="Buscar..."
              value={search}
              onValueChange={setSearch}
              autoFocus
            />
          )}
          <CommandList>
            {filteredOptions.length === 0 && (
              <div className="p-2 text-sm text-gray-500">Sin resultados</div>
            )}
            {filteredOptions.map(option => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => {
                  onChange(option.value)
                  setOpen(false)
                  setSearch("")
                }}
                className="flex items-center justify-between"
              >
                {option.label}
                {value === option.value && <Check className="h-4 w-4 text-primary" />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 