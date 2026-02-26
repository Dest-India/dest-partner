"use client"

import React, { useState } from "react"
import { ChevronDownIcon, Earth, Check } from 'lucide-react'
import * as RPNInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export default function PhoneNumberInput({value, onChange, disabled, readOnly}) {

  return (
    <RPNInput.default
      className="flex rounded-md shadow-xs"
      international
      flagComponent={FlagComponent}
      countrySelectComponent={CountrySelect}
      countryCallingCodeEditable={false}
      inputComponent={PhoneInput}
      placeholder="Enter number here"
      value={value}
      onChange={(newValue) => onChange(newValue ?? "")}
      disabled={disabled}
      readOnly={readOnly}
    />
  )
}

const PhoneInput = ({ className, ...props }) => {
  return (
    <Input
      data-slot="phone-input"
      className={cn(
        "-ms-px rounded-s-none shadow-none focus-visible:z-10 disabled:opacity-100",
        className
      )}
      {...props}
    />
  )
}

PhoneInput.displayName = "PhoneInput"

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
  readOnly,
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={readOnly ? false : open} onOpenChange={readOnly ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="has-aria-invalid:border-destructive/60 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 px-3 rounded-s-md rounded-e-none border-e-0 focus-visible:z-10 focus-visible:ring-[3px] disabled:opacity-100"
        >
          <div className="inline-flex items-center gap-2">
            <FlagComponent country={value} countryName={value} />
            {!readOnly && !disabled && <ChevronDownIcon size={16} className="text-muted-foreground/80" />}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search Country" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter((option) => option.value)
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label + " " + RPNInput.getCountryCallingCode(option.value)}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-3 pl-1">
                      <FlagComponent
                        country={option.value}
                        countryName={option.label}
                      />
                      <span>{option.label}</span>
                      {option.value && (
                        <span className="text-muted-foreground text-xs -ml-1">
                          +{RPNInput.getCountryCallingCode(option.value)}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const FlagComponent = ({ country, countryName }) => {
  const Flag = flags[country]

  return (
    <>
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <Earth size={16} aria-hidden="true" className="opacity-60" />
      )}
    </>
  )
}
