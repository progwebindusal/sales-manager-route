import * as React from "react"
import { cn } from "@/lib/utils"

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {}
export const Command = React.forwardRef<HTMLDivElement, CommandProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1 p-2", className)} {...props} />
))
Command.displayName = "Command"

interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void
}
export const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(({ className, onValueChange, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("w-full px-3 py-2 border-b border-gray-200 outline-none text-sm mb-2", className)}
    onChange={e => {
      onValueChange?.(e.target.value)
      props.onChange?.(e)
    }}
    {...props}
  />
))
CommandInput.displayName = "CommandInput"

interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {}
export const CommandList = React.forwardRef<HTMLDivElement, CommandListProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props} />
))
CommandList.displayName = "CommandList"

interface CommandItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  value: string
  onSelect?: (value: string) => void
}
export const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(({ className, value, onSelect, onClick, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("cursor-pointer px-3 py-2 hover:bg-accent rounded flex items-center", className)}
    tabIndex={0}
    role="option"
    aria-selected={false}
    onClick={e => {
      onSelect?.(value)
      onClick?.(e)
    }}
    {...props}
  />
))
CommandItem.displayName = "CommandItem" 