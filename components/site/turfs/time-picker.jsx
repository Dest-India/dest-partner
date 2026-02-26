import { DateInput, TimeField } from '@/components/ui/datefield-rac'
import { useState } from 'react'

export default function TimePicker({ type, value, onChange, ...props }) {
  const [timeValue, setTimeValue] = useState(value || null)

  const handleTimeChange = (newTime) => {
    if (newTime && newTime.minute !== undefined) {
      // Round minutes to nearest 30-minute interval (0 or 30)
      const roundedMinute = newTime.minute < 15 ? 0 : 30
      const adjustedTime = { ...newTime, minute: roundedMinute }
      setTimeValue(adjustedTime)
      onChange?.(adjustedTime)
    } else {
      setTimeValue(newTime)
      onChange?.(newTime)
    }
  }

  return (
    <TimeField
      value={timeValue}
      onChange={handleTimeChange}
      className={`*:not-first:mt-1 md:w-full ${type === "to" ? "max-w-28" : type === "from" ? "max-w-32" : "max-w-28"}`}
      granularity="minute"
      hourCycle={12}
      aria-label={`${type} input`}
      {...props}
    >
      <div className="relative">
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center justify-center ps-2.5 text-xs font-semibold">
          {type === "to" ? "To" : type === "from" ? "From" : "At"}
        </div>
        <DateInput className={`uppercase ${type === "to" ? "ps-7" : type === "from" ? "ps-11" : "ps-7"}`} />
      </div>
    </TimeField>
  )
}