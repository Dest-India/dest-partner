import { useEffect, useId, useRef, useState, useMemo } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Search,
  X,
  Filter,
  ClipboardCheck,
  Phone,
  ArrowUpRight,
  XIcon,
  CalendarIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader } from "@/components/ui/loader"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "../../ui/drawer"
import { useRouter } from "next/navigation"
import { getUserInfo } from "@/lib/store"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import { getTurfBookings } from "@/lib/supabase"


// Custom filter function for multi-column searching
const multiColumnFilterFn = (row, columnId, filterValue) => {
  if (!filterValue || filterValue.trim() === '') return true

  const searchableRowContent = `
    ${row.original.user?.name || ''} 
    ${row.original.user?.phone || ''} 
    ${row.original.user?.gender || ''} 
    ${new Date(row.original.date).toLocaleDateString()} 
    ${formatTime12Hour(row.original.start_time)} - ${formatTime12Hour(row.original.end_time)} 
    ${row.original.total_amount} 
    ${row.original.court?.name} 
    ${row.original.court?.sport} 
    ${row.original.court?.rate_per_hour} 
    ${row.original.court?.turf.name}
    ${new Date(row.original.created_at).toLocaleDateString()}
  `.toLowerCase().replace(/\s+/g, ' ').trim()

  const searchTerms = filterValue.toLowerCase().trim().split(/\s+/)

  return searchTerms.every(term => searchableRowContent.includes(term))
}

// Custom filter function for decline status
// const declineStatusFilterFn = (row, columnId, filterValue) => {
//   if (!filterValue || filterValue.length === 0) return true
//   const isDeclined = row.original.declined ? 'Declined' : 'Accepted'
//   return filterValue.includes(isDeclined)
// }

// Custom filter function for date range (booked for date)
const bookedForDateRangeFilterFn = (row, columnId, filterValue) => {
  if (!filterValue || (!filterValue.from && !filterValue.to)) return true

  const rowDate = new Date(row.original.date)
  const fromDate = filterValue.from ? new Date(filterValue.from) : null
  const toDate = filterValue.to ? new Date(new Date(filterValue.to).setHours(23, 59, 59, 999)) : null

  if (fromDate && toDate) {
    return rowDate >= fromDate && rowDate <= toDate
  } else if (fromDate) {
    return rowDate >= fromDate
  } else if (toDate) {
    return rowDate <= toDate
  }

  return true
}

// Helper function to convert 24-hour time to 12-hour format
const formatTime12Hour = (time24) => {
  if (!time24) return ''

  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12

  return `${hour12}:${minutes} ${ampm}`
}

export default function TurfsBookingsList() {
  const id = useId()
  const router = useRouter()
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)

  // Filter states
  // const [selectedStatus, setSelectedStatus] = useState([])
  const [selectedDateRange, setSelectedDateRange] = useState(undefined)
  const [todayFilter, setTodayFilter] = useState(false)

  const [sorting, setSorting] = useState([
    {
      id: `customer-name`,
      desc: false,
    },
  ])

  const [data, setData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const partnerId = getUserInfo()?.id
      if (!partnerId) {
        router.push('/login')
        toast.error("Please login first.")
        return
      }
      try {
        const response = await getTurfBookings(partnerId)
        setData(response)
      } catch (error) {
        console.error('Error fetching turf bookings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  // const StatusCell = ({ row, onDecline }) => {
  //   const [openDialog, setOpenDialog] = useState(false)
  //   const [reason, setReason] = useState("")
  //   const [declining, setDeclining] = useState(false)

  //   if (row.original.declined) {
  //     return (
  //       <Tooltip>
  //         <TooltipTrigger asChild>
  //           <Badge variant="destructive">Declined</Badge>
  //         </TooltipTrigger>
  //         <TooltipContent align="end">{row.original.declined_reason}</TooltipContent>
  //       </Tooltip>
  //     )
  //   }

  //   const handleDecline = async () => {
  //     if (!reason.trim()) {
  //       toast.error("Please provide a reason for declining the booking.")
  //       return
  //     }

  //     try {
  //       setDeclining(true)
  //       const id = row.original.id
  //       const response = await declineTurfBooking(id, reason)
  //       if (response?.error) {
  //         throw response.error
  //       }
  //       toast.success("Booking declined successfully.")
  //       onDecline(id, reason)
  //       setOpenDialog(false)
  //     } catch (error) {
  //       console.error('Error declining turf booking:', error)
  //       toast.error("Failed to decline booking.")
  //     } finally {
  //       setDeclining(false)
  //     }
  //   }

  //   return (
  //     <div className="flex items-center gap-2">
  //       <Badge variant="success">Accepted</Badge>
  //       <Dialog open={openDialog} onOpenChange={setOpenDialog}>
  //         <Tooltip>
  //           <TooltipTrigger asChild>
  //             <DialogTrigger asChild>
  //               <Button variant="destructive" size="icon" className="size-7">
  //                 <X className="size-4" />
  //               </Button>
  //             </DialogTrigger>
  //           </TooltipTrigger>
  //           <TooltipContent>Decline Booking</TooltipContent>
  //         </Tooltip>
  //         <DialogContent showCloseButton={false}>
  //           <DialogHeader>
  //             <DialogTitle>Decline Booking</DialogTitle>
  //             <DialogDescription>
  //               Are you sure you want to decline booking of <b>{row.original.user?.name}</b> ?
  //             </DialogDescription>
  //           </DialogHeader>
  //           <Input
  //             id="decline-reason"
  //             className="-my-2"
  //             placeholder="Enter Reason for Decline"
  //             value={reason}
  //             onChange={(e) => setReason(e.target.value)}
  //           />
  //           <DialogFooter>
  //             <DialogClose asChild>
  //               <Button variant="outline" size="sm">
  //                 Cancel
  //               </Button>
  //             </DialogClose>
  //             <Button
  //               variant="destructive"
  //               size="sm"
  //               disabled={declining || !reason.trim()}
  //               onClick={handleDecline}
  //             >
  //               {declining ? <><Loader /> Declining...</> : "Confirm"}
  //             </Button>
  //           </DialogFooter>
  //         </DialogContent>
  //       </Dialog>
  //     </div>
  //   )
  // }

  // const updateDataOnDecline = (id, reason) => {
  //   setData(prev => prev.map(item => (
  //     item.id === id
  //       ? { ...item, declined: true, declined_reason: reason }
  //       : item
  //   )))
  // }

  const CustomerNameCell = ({ row }) => {
    const [openImage, setOpenImage] = useState(false)
    const [open, setOpen] = useState(false)
    return (
      <div className="group flex items-center gap-3">
        <Avatar className="size-8 rounded-md object-cover [&>img]:cursor-pointer">
          <AvatarImage src={row.original.user?.profile_image} alt={row.original.user?.name || 'User'} onClick={() => setOpenImage(true)} />
          <AvatarFallback className="rounded-md">
            {row.original.user?.name?.split(" ").map(name => name[0]).join("") || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="font-semibold group-hover:underline underline-offset-4 cursor-pointer" onClick={() => setOpen(true)}>{row.original.user?.name || 'Unknown'}</div>
        <Dialog open={openImage} onOpenChange={setOpenImage}>
          <ImageZoom src={row.original.user?.profile_image} name={row.original.user?.name} />
        </Dialog>
        <Drawer open={open} onOpenChange={setOpen}>
          <Details data={row.original} />
        </Drawer>
      </div>
    )
  }

  const CourtCell = ({ row }) => {
    const router = useRouter()
    return (
      <div className="group flex items-center justify-between gap-1 [&>button]:size-7">
        <div className="flex gap-2">
          <Badge variant="outline">{row.original.court?.sport}</Badge>
          <div className="text-muted-foreground">
            {row.original.court?.name}
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="hidden group-hover:flex transition-all duration-300" variant="ghost" size="icon" onClick={() => router.push(`/home/turfs/court/${row.original.court?.id}`)}>
              <ArrowUpRight />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View Court</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  const columns = [
    {
      accessorFn: (row) => row.user?.name || '',
      id: `customer-name`,
      header: "Customer Name",
      cell: CustomerNameCell,
      size: 192,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Booked For",
      accessorFn: (row) => new Date(row.date),
      id: "booked_for",
      cell: ({ row }) => {
        const date = new Date(row.original.date)
        return date.toLocaleDateString()
      },
      size: 128,
      filterFn: bookedForDateRangeFilterFn,
    },
    {
      header: "Slot",
      accessorFn: (row) => `${formatTime12Hour(row.start_time)} - ${formatTime12Hour(row.end_time)}`,
      id: "slot",
      cell: ({ row }) => `${formatTime12Hour(row.original.start_time)} - ${formatTime12Hour(row.original.end_time)}`,
      size: 160,
    },
    {
      header: "Court",
      accessorFn: (row) => row.court?.name || '',
      id: "court_name",
      cell: CourtCell,
      size: 256,
    },
    {
      header: "Booking Date",
      accessorFn: (row) => new Date(row.created_at),
      id: "booking_date",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
      },
      size: 140,
    },
    // {
    //   header: "Status",
    //   accessorFn: (row) => row.declined ? 'Declined' : 'Accepted',
    //   id: "status",
    //   cell: ({ row }) => (
    //     <StatusCell
    //       row={row}
    //       onDecline={updateDataOnDecline}
    //     />
    //   ),
    //   size: 128,
    //   enableSorting: false,
    // },
  ]

  // Calculate unique values for filters
  // const uniqueStatuses = useMemo(() => {
  //   const statusCounts = data.reduce((acc, item) => {
  //     const status = item.declined ? 'Declined' : 'Accepted'
  //     acc[status] = (acc[status] || 0) + 1
  //     return acc
  //   }, {})

  //   return Object.entries(statusCounts)
  //     .sort(([a], [b]) => a.localeCompare(b))
  //     .map(([status, count]) => ({ status, count }))
  // }, [data])

  // Filter handler functions
  // const handleStatusChange = (checked, status) => {
  //   setSelectedStatus(prev => {
  //     const newStatuses = checked
  //       ? [...prev, status]
  //       : prev.filter(s => s !== status)

  //     // Update column filter
  //     table.getColumn("status")?.setFilterValue(newStatuses.length > 0 ? newStatuses : undefined)
  //     return newStatuses
  //   })
  // }

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range)
    // Update column filter for booked for date
    table.getColumn("booked_for")?.setFilterValue(range)
  }

  const handleTodayToggle = () => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    if (todayFilter) {
      // Remove today filter
      setTodayFilter(false)
      setSelectedDateRange(undefined)
      table.getColumn("booked_for")?.setFilterValue(undefined)
    } else {
      // Apply today filter
      setTodayFilter(true)
      const todayRange = { from: todayStart, to: todayEnd }
      setSelectedDateRange(todayRange)
      table.getColumn("booked_for")?.setFilterValue(todayRange)
    }
  }

  const clearAllFilters = () => {
    // setSelectedStatus([])
    setSelectedDateRange(undefined)
    setTodayFilter(false)
    // table.getColumn("status")?.setFilterValue(undefined)
    table.getColumn("booked_for")?.setFilterValue(undefined)
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
  })

  if (loading) return <div className="w-full h-32 flex justify-center items-center [&>svg]:size-6"><Loader /></div>

  return (
    <div className="w-full space-y-4">
      <h2>Turfs Bookings</h2>
      {/* Filters */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {/* Global search across all fields */}
        <div className="w-full md:w-fit relative">
          <Input
            id={`${id}-input`}
            ref={inputRef}
            className={`peer w-full h-9 md:min-w-72 ps-9 ${Boolean(table.getColumn(`customer-name`)?.getFilterValue()) && "pe-9"
              }`}
            value={
              (table.getColumn(`customer-name`)?.getFilterValue() ?? "")
            }
            onChange={(e) =>
              table.getColumn(`customer-name`)?.setFilterValue(e.target.value)
            }
            placeholder="Search bookings..."
            type="text"
            aria-label="Search bookings..."
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
            <Search size={16} aria-hidden="true" />
          </div>
          {Boolean(table.getColumn(`customer-name`)?.getFilterValue()) && (
            <button
              className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Clear filter"
              onClick={() => {
                table.getColumn(`customer-name`)?.setFilterValue("")
                if (inputRef.current) {
                  inputRef.current.focus()
                }
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex gap-2 md:items-center [&>button]:w-[calc(50%-4px)] md:[&>button]:w-fit">
          <Button
            variant={todayFilter ? "default" : "outline"}
            onClick={handleTodayToggle}
          >
            Today
          </Button>
          {/* Advanced Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={/* selectedStatus.length > 0 || */ selectedDateRange ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <Filter />
                <span className="hidden md:inline">Filters</span>
                {(/* selectedStatus.length > 0 || */ selectedDateRange) && (
                  <Badge variant="secondary" className="ml-1 h-5 text-xs hidden md:flex">
                    {/* selectedStatus.length + */ (selectedDateRange ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-68 p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
              <div className="space-y-3 p-4">
                <div className="space-y-1">
                  <h5 className="font-medium leading-none">Filter Bookings</h5>
                </div>
                {/* Status Filters */}
                {/* {uniqueStatuses.length > 0 && <div className="space-y-2">
                  <Label className="text-muted-foreground font-medium">Status</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      {uniqueStatuses.map(({ status, count }) => (
                        <Tooltip key={status}>
                          <TooltipTrigger asChild>
                            <label
                              className="border-input has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative flex h-8 p-3 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50"
                            >
                              <Checkbox
                                id={`${status}`}
                                value={status}
                                className="sr-only after:absolute after:inset-0"
                                checked={selectedStatus.includes(status)}
                                onCheckedChange={(checked) => handleStatusChange(checked, status)}
                              />
                              <span aria-hidden="true" className="text-sm font-medium">
                                {status}
                              </span>
                            </label>
                          </TooltipTrigger>
                          <TooltipContent>{count} Bookings</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </div>} */}
                {/* Date Range Filter */}
                <div className="space-y-1">
                  <p className="text-muted-foreground font-medium">Booked Date Range</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full justify-between text-left font-normal",
                          !selectedDateRange && "text-muted-foreground"
                        )}
                      >
                        {selectedDateRange?.from ? (
                          selectedDateRange.to ? (
                            <>
                              {selectedDateRange.from.toLocaleDateString()} - {selectedDateRange.to.toLocaleDateString()}
                            </>
                          ) : (
                            selectedDateRange.from.toLocaleDateString()
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                        <CalendarIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="range"
                        defaultMonth={selectedDateRange?.from}
                        selected={selectedDateRange}
                        onSelect={handleDateRangeChange}
                        captionLayout="dropdown"
                        numberOfMonths={1}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        className="rounded-lg border-0"
                      />
                      {selectedDateRange?.from && selectedDateRange?.to && (
                        <div className="text-muted-foreground text-xs px-4 pb-3">
                          {Math.ceil((selectedDateRange.to - selectedDateRange.from) / (1000 * 60 * 60 * 24))} days selected
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {/* (selectedStatus.length > 0 || selectedDateRange) && ( */}
              {selectedDateRange && (
                <PopoverClose asChild>
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="w-full rounded-none border-0 border-t"
                  >
                    Clear all filters
                  </Button>
                </PopoverClose>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Content */}
      <div className="w-full bg-transparent overflow-hidden rounded-lg border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className="h-10 px-4"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={
                            header.column.getCanSort() &&
                            "flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                          }
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (
                              header.column.getCanSort() &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault()
                              header.column.getToggleSortingHandler()?.(e)
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: (
                              <ChevronUpIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                            desc: (
                              <ChevronDownIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                          }[header.column.getIsSorted()] ?? null}
                        </div>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-transparent">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="pl-4 py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="bg-muted text-muted-foreground h-24 text-center"
                >
                  No Bookings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="w-full flex items-center justify-between gap-3 order-1 md:order-2">
          {/* Results per page */}
          <div className="flex items-center gap-3">
            <Label htmlFor={id} className="text-sm whitespace-nowrap">
              <span className="hidden md:inline">Rows per page</span>
              <span className="md:hidden">Per page</span>
            </Label>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger id={id} className="w-fit h-8 pr-2.5">
                <SelectValue placeholder="Select number of results" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page number information */}
          <div className="flex justify-center md:justify-end text-sm whitespace-nowrap">
            <p className="text-muted-foreground whitespace-nowrap">
              Showing{" "}
              <span className="text-foreground">
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}
                &nbsp;-&nbsp;
                {Math.min(
                  Math.max(
                    table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    table.getState().pagination.pageSize,
                    0
                  ),
                  table.getRowCount()
                )}
              </span>{" "}
              of{" "}
              <span className="text-foreground">
                {table.getRowCount().toString()}
              </span>
            </p>
          </div>
        </div>

        {/* Pagination buttons */}
        <div className="flex justify-center md:justify-end order-2 md:order-3">
          <Pagination>
            <PaginationContent className="[&>li>button]:size-8">
              <PaginationItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => table.firstPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <ChevronFirstIcon aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Go to first page</TooltipContent>
                </Tooltip>
              </PaginationItem>
              <PaginationItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <ChevronLeftIcon aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Go to previous page</TooltipContent>
                </Tooltip>
              </PaginationItem>
              <PaginationItem className="flex justify-center md:justify-end text-sm whitespace-nowrap">
                <p className="px-2 whitespace-nowrap">
                  <span className="text-muted-foreground">Page</span> {table.getState().pagination.pageIndex + 1} <span className="text-muted-foreground">of</span> {Math.ceil(table.getRowCount() / table.getState().pagination.pageSize)}
                </p>
              </PaginationItem>
              <PaginationItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label="Go to next page"
                    >
                      <ChevronRightIcon size={14} aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Go to next page</TooltipContent>
                </Tooltip>
              </PaginationItem>
              <PaginationItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => table.lastPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label="Go to last page"
                    >
                      <ChevronLastIcon size={14} aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Go to last page</TooltipContent>
                </Tooltip>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div >
  )
}

function ImageZoom({ src, name }) {
  return (
    <DialogContent showCloseButton={false} className="p-2 gap-1">
      <DialogHeader>
        <div className="w-full flex justify-between items-center gap-2 p-2 py-1 [&>h2]:w-full [&>h2]:text-ellipsis [&>h2]:line-clamp-1">
          <DialogTitle>{name}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="size-6 flex-shrink-0">
              <XIcon />
            </Button>
          </DialogClose>
        </div>
      </DialogHeader>
      <img src={src} alt={name} className="max-h-full max-w-full border rounded-md" />
    </DialogContent>
  )
}

function Details({ data }) {
  const isMobile = useIsMobile()
  const [openImage, setOpenImage] = useState(false)
  // const [openD, setOpenD] = useState(false)
  // const [reason, setReason] = useState("")
  // const [declining, setDeclining] = useState(false)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast("Copied to clipboard !", { description: text, icon: <ClipboardCheck />, id: 'copy-success', position: "top-right" })
  }

  // const handleDecline = async () => {
  //   if (!reason.trim()) {
  //     toast.error("Please provide a reason for declining the booking.")
  //     return
  //   }

  //   try {
  //     setDeclining(true)
  //     const id = data.id
  //     const response = await declineTurfBooking(id, reason)
  //     if (response.error) {
  //       throw response.error
  //     } else {
  //       toast.success("Booking declined successfully.")
  //       onDecline(id, reason)
  //       setOpenD(false)
  //     }
  //   } catch (error) {
  //     console.error('Error declining turf booking:', error)
  //     toast.error("Failed to decline booking.")
  //   } finally {
  //     setDeclining(false)
  //   }
  // }

  return (
    <DrawerContent className="p-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6 md:px-8">
        <div className="flex items-center gap-4">
          <Avatar className="hidden md:block size-16 rounded-xl object-cover [&>img]:cursor-pointer">
            <AvatarImage src={data.user?.profile_image} alt={data.user?.name || 'User'} onClick={() => setOpenImage(true)} />
            <AvatarFallback className="rounded-md text-2xl font-semibold">
              {data.user?.name?.split(" ").map(name => name[0]).join("") || "?"}
            </AvatarFallback>
          </Avatar>
          <Dialog open={openImage} onOpenChange={setOpenImage}>
            <ImageZoom src={data.user?.profile_image} name={data.user?.name} />
          </Dialog>
          <DrawerHeader className="!text-left p-0">
            <DrawerTitle>{data.user?.name}</DrawerTitle>
            <DrawerDescription>
              {!data.user?.gender && <Badge variant="outline">Unknown</Badge>}
              {data.user?.gender && data.user.gender.toLowerCase() === "male" ? (
                <Badge variant="secondary">Male</Badge>
              ) : (
                <Badge variant="outline">{data.user?.gender}</Badge>
              )}
              {
                data.created_at && <Badge variant="outline" className="ml-2">
                  <span className="text-muted-foreground">Booked on</span> {new Date(data.created_at).toLocaleDateString()} {new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                </Badge>
              }
            </DrawerDescription>
          </DrawerHeader>
        </div>
        <div className={`flex items-center gap-2 ${data.declined ? "flex-row-reverse" : ""}`}>
          {data.user?.phone && <Button variant="outline" size="sm" onClick={() => isMobile ? window.location.href = `tel:${data.user.phone}` : copyToClipboard(data.user.phone)}>
            <Phone /> Call
          </Button>}
          {/* {!data.declined ? <Dialog open={openD} onOpenChange={setOpenD}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <X /> Decline
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Decline Booking</DialogTitle>
                <DialogDescription>
                  Are you sure you want to decline booking of <b>{data.user?.name}</b> ?
                </DialogDescription>
              </DialogHeader>
              <Input id="decline-reason" className="-my-2" placeholder="Enter Reason for Decline" value={reason} onChange={(e) => setReason(e.target.value)} />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                </DialogClose>
                <Button variant="destructive" size="sm" disabled={declining || !reason.trim()} onClick={handleDecline}>
                  {declining ? <><Loader /> Declining...</> : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            : <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive">Declined</Badge>
              </TooltipTrigger>
              <TooltipContent align="end">{data.declined_reason}</TooltipContent>
            </Tooltip>
          } */}
        </div>
      </div>
      <div className="h-full grid md:grid-cols-2 rounded-xl border border-dashed divide-y md:divide-y-0 md:divide-x divide-dashed mx-4 mb-6 md:m-8 md:mt-0 [&>div]:p-4 [&>div]:py-3 [&>div]:md:px-5 overflow-y-auto">
        <div className="space-y-1 font-medium text-foreground [&>p>span]:text-muted-foreground [&>p>span]:inline-block [&>p>span]:w-24">
          <h5>Details</h5>
          <p><span>Date</span> {new Date(data.date).toLocaleDateString()}</p>
          <p><span>Time Slot</span> {formatTime12Hour(data.start_time)} - {formatTime12Hour(data.end_time)}</p>
          <p><span>Amount</span> ₹{data.total_amount}</p>
        </div>
        <div className="space-y-1 font-medium text-foreground [&>p>span]:text-muted-foreground [&>p>span]:inline-block [&>p>span]:w-24">
          <h5>Court Details</h5>
          <p><span>Name</span> {data.court?.name || 'N/A'}</p>
          <p><span>Sport</span> {data.court?.sport || 'N/A'}</p>
          <p><span>Turf</span> {data.court?.turf.name || 'N/A'}</p>
        </div>
      </div>
    </DrawerContent>
  )
}
