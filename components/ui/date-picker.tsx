"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type DatePickerProps = {
  date?: Date
  onChange?: (date?: Date) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
}

export function DatePicker({ date, onChange, placeholder = "Pick a date", disabled, className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className={cn(
            "w-[280px] h-9 px-3 justify-start text-left font-normal text-xs data-[empty=true]:text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange?.(d ?? undefined)}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
