import { useEffect, useId, useRef, useState, useMemo, useCallback } from "react"
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
  MoreVertical,
  PenLine,
  Search,
  X,
  Info,
  OctagonMinus,
  Filter,
  PanelRight,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader } from "@/components/ui/loader"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"
import { addCourse, deactiveCourse, updateCourse } from "@/lib/supabase"
import { toast } from "sonner"
import { getUserInfo } from "@/lib/store"

const getRoleBasedLabels = () => {
  const user = getUserInfo()
  const userRole = user?.role || 'Academy'

  switch (userRole) {
    case 'GYM':
      return {
        singular: 'Program',
        plural: 'Programs',
        searchPlaceholder: 'Search by Programs'
      }
    case 'Academy':
    default:
      return {
        singular: 'Course',
        plural: 'Courses',
        searchPlaceholder: 'Search by Courses'
      }
  }
}

// Custom filter function for multi-column searching
const multiColumnFilterFn = (row, columnId, filterValue) => {
  const searchTerm = (filterValue ?? "").toLowerCase();
  if (!searchTerm) return true;

  // Search all stringifiable properties in row.original
  return Object.values(row.original)
    .map(val => (val !== undefined && val !== null ? val.toString().toLowerCase() : ""))
    .some(val => val.includes(searchTerm));
}

// Custom filter function for sport filtering
const sportFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true
  const sport = row.getValue(columnId)
  return filterValue.includes(sport)
}

// Custom filter function for batches filtering
const batchesFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true
  const batches = row.getValue(columnId)
  return filterValue.includes(batches?.toString() || "")
}

// Custom filter function for active status filtering
const activeFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true
  const active = row.getValue(columnId)
  return filterValue.includes(active?.toString() || "")
}

export default function CoursesTable({ courseData }) {
  const id = useId()
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)

  const [sorting, setSorting] = useState([
    {
      id: "title",
      desc: false,
    },
  ])

  const [data, setData] = useState([])
  const [openAddCourse, setOpenAddCourse] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (courseData && courseData.length > 0) {
      setData(courseData)
      setLoading(false)
    } else if (courseData && courseData.length === 0) {
      setData([])
      setLoading(false)
    }
  }, [courseData])

  const addCourseToData = useCallback((courseData) => {
    setData(prevData => [...prevData, courseData])
  }, [])

  const updateCourseInData = useCallback((courseData) => {
    setData(prevData =>
      prevData.map(course =>
        course.id === courseData.id ? courseData : course
      )
    )
  }, [])

  const deactiveCourseFromData = useCallback((id) => {
    setData(prevData => prevData.map(course =>
      course.id === id ? { ...course, active: false } : course
    ))
  }, [])

  const TitleCell = ({ row }) => {
    const router = useRouter()
    return (
      <div className="relative group font-semibold cursor-pointer">
        <span>{row.getValue("title")}</span>
        <Button variant="outline" className="absolute top-1/2 end-0 -translate-y-1/2 bg-background/25 backdrop-blur-sm md:hidden group-hover:flex h-7 !px-2 [&>svg]:rotate-90" onClick={() => router.replace(`/home/${getRoleBasedLabels().plural.toLowerCase()}/${row.original.id}`)}><PanelRight /> Open</Button>
      </div>
    )
  }

  const ActionsCell = ({ row }) => {
    const [openInfo, setOpenInfo] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [openDeactivate, setOpenDeactivate] = useState(false)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <span className="sr-only">Open menu</span>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenInfo(true)}>
            <Info /> Info
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
            <PenLine /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setOpenDeactivate(true)}>
            <OctagonMinus /> Deactivate
          </DropdownMenuItem>
        </DropdownMenuContent>
        <Dialog open={openInfo} onOpenChange={setOpenInfo}>
          <CourseInfo course={row.original} />
        </Dialog>
        <Sheet open={openEdit} onOpenChange={setOpenEdit}>
          <ModifyCourseDetails course={row.original} onSuccess={updateCourseInData} onOpenChange={setOpenEdit} />
        </Sheet>
        <Dialog open={openDeactivate} onOpenChange={setOpenDeactivate}>
          <DeactivateCourse course={row.original} onSuccess={deactiveCourseFromData} onOpenChange={setOpenDeactivate} />
        </Dialog>
      </DropdownMenu>
    )
  }

  const columns = [
    {
      header: `${getRoleBasedLabels().singular} Title`,
      accessorKey: "title",
      cell: TitleCell,
      size: 256,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Batches",
      accessorKey: "batches",
      cell: ({ row }) => {
        const batchCount = row.getValue("batches") || 0
        return <Badge variant={batchCount === 0 ? "secondary" : undefined}>{batchCount}</Badge>
      },
      size: 80,
      filterFn: batchesFilterFn,
    },
    {
      header: "Status",
      accessorKey: "active",
      cell: ({ row }) => (
        getActiveBadge(row.getValue("active"))
      ),
      size: 100,
      filterFn: activeFilterFn,
    },
    {
      header: "Sport",
      accessorKey: "sport",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.getValue("sport")}</Badge>
      ),
      size: 120,
      filterFn: sportFilterFn,
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: ({ row }) => {
        return <div className="truncate line-clamp-1 text-muted-foreground hover:text-foreground">
          {row.getValue("description")}
        </div>
      },
      size: 192,
      enableSorting: false,
    },
    {
      id: "actions",
      cell: ActionsCell,
      size: 64,
      enableHiding: false,
      enableSorting: false,
    },
  ]

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

  // Get unique values for filters using useMemo for performance
  const uniqueSports = useMemo(() => {
    const sportColumn = table.getColumn("sport")
    if (!sportColumn) return []
    return Array.from(sportColumn.getFacetedUniqueValues().keys()).sort()
  }, [table])

  const uniqueBatches = useMemo(() => {
    const batchesColumn = table.getColumn("batches")
    if (!batchesColumn) return []
    return Array.from(batchesColumn.getFacetedUniqueValues().keys())
      .filter(batch => batch !== undefined && batch !== null && batch !== "")
      .map(batch => Number(batch))
      .filter(batch => !isNaN(batch))
      .sort((a, b) => a - b)
  }, [table])

  const uniqueActiveStatus = useMemo(() => {
    const activeColumn = table.getColumn("active")
    if (!activeColumn) return []
    return Array.from(activeColumn.getFacetedUniqueValues().keys())
      .filter(status => status !== undefined && status !== null)
      .sort()
  }, [table])

  // Get selected filter values
  const selectedSports = useMemo(() => {
    const filterValue = table.getColumn("sport")?.getFilterValue()
    return filterValue ? filterValue : []
  }, [table])

  const selectedBatches = useMemo(() => {
    const filterValue = table.getColumn("batches")?.getFilterValue()
    return filterValue ? filterValue : []
  }, [table])

  const selectedActiveStatus = useMemo(() => {
    const filterValue = table.getColumn("active")?.getFilterValue()
    return filterValue ? filterValue : []
  }, [table])

  // Filter handlers
  const handleSportChange = (checked, value) => {
    const filterValue = table.getColumn("sport")?.getFilterValue() || []
    const newFilterValue = [...filterValue]

    if (checked) {
      newFilterValue.push(value)
    } else {
      const index = newFilterValue.indexOf(value)
      if (index > -1) {
        newFilterValue.splice(index, 1)
      }
    }

    table.getColumn("sport")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  const handleBatchesChange = (checked, value) => {
    const filterValue = table.getColumn("batches")?.getFilterValue() || []
    const newFilterValue = [...filterValue]
    const stringValue = value?.toString() || ""

    if (checked) {
      newFilterValue.push(stringValue)
    } else {
      const index = newFilterValue.indexOf(stringValue)
      if (index > -1) {
        newFilterValue.splice(index, 1)
      }
    }

    table.getColumn("batches")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  const handleActiveChange = (checked, value) => {
    const filterValue = table.getColumn("active")?.getFilterValue() || []
    const newFilterValue = [...filterValue]
    const stringValue = value?.toString() || ""

    if (checked) {
      newFilterValue.push(stringValue)
    } else {
      const index = newFilterValue.indexOf(stringValue)
      if (index > -1) {
        newFilterValue.splice(index, 1)
      }
    }

    table.getColumn("active")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  if (loading) return <div className="w-full h-48 flex justify-center items-center [&>svg]:size-6"><Loader /></div>

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2>{getRoleBasedLabels().plural}</h2>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          {/* Filter by course/program title */}
          <div className="w-full relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={`peer w-full h-9 md:min-w-72 ps-9 ${Boolean(table.getColumn("title")?.getFilterValue()) && "pe-9"
                }`}
              value={
                (table.getColumn("title")?.getFilterValue() ?? "")
              }
              onChange={(e) =>
                table.getColumn("title")?.setFilterValue(e.target.value)
              }
              placeholder={getRoleBasedLabels().searchPlaceholder}
              type="text"
              aria-label={getRoleBasedLabels().searchPlaceholder}
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <Search size={16} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn("title")?.getFilterValue()) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn("title")?.setFilterValue("")
                  if (inputRef.current) {
                    inputRef.current.focus()
                  }
                }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 *:w-1/2 md:*:w-fit">
            {/* Advanced Filters */}
            <Dialog>
              <div className="flex items-center">
                <DialogTrigger asChild>
                  <Button variant="outline" className={`${selectedSports.length > 0 || selectedBatches.length > 0 || selectedActiveStatus.length > 0 ? "rounded-r-none w-[calc(100%-36px)]" : "w-full"}`}>
                    <Filter />
                    Filters
                  </Button>
                </DialogTrigger>
                {selectedSports.length > 0 || selectedBatches.length > 0 || selectedActiveStatus.length > 0 ? <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-l-none -ml-px" onClick={() => {
                      table.getColumn("sport")?.setFilterValue(undefined)
                      table.getColumn("batches")?.setFilterValue(undefined)
                      table.getColumn("active")?.setFilterValue(undefined)
                    }}>
                      <X />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear all filters</TooltipContent>
                </Tooltip> : null
                }
              </div>
              <DialogContent showCloseButton={false} className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Filter {getRoleBasedLabels().plural}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                  {/* Sport Filters */}
                  <div className="space-y-2">
                    <p className="text-muted-foreground font-medium">Sport</p>
                    <div className="flex gap-2 flex-wrap">
                      {uniqueSports.map((sport) => (
                        <label key={sport}
                          className="border-input has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative flex h-8 p-3 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50"
                        >
                          <Checkbox
                            id={`${sport}`}
                            value={sport}
                            className="sr-only after:absolute after:inset-0"
                            checked={selectedSports.includes(sport)}
                            onCheckedChange={(checked) => handleSportChange(checked, sport)}
                          />
                          <span aria-hidden="true" className="text-sm font-medium">
                            {sport}
                          </span>
                          <span className="sr-only">{sport}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Batches Filters */}
                  <div className="space-y-2">
                    <p className="text-muted-foreground font-medium">Number of Batches</p>
                    <div className="flex gap-2">
                      {uniqueBatches.map((batch) => {
                        const batchStr = batch?.toString() || "0"
                        return (
                          <label key={batch}
                            className="border-input has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative flex size-8 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50"
                          >
                            <Checkbox
                              id={`batch-${batch}`}
                              value={batch}
                              className="sr-only after:absolute after:inset-0"
                              checked={selectedBatches.includes(batchStr)}
                              onCheckedChange={(checked) => handleBatchesChange(checked, batchStr)}
                            />
                            <span aria-hidden="true" className="text-sm font-medium">
                              {batch}
                            </span>
                            <span className="sr-only">{batch}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Status Filters */}
                  <div className="space-y-2">
                    <p className="text-muted-foreground font-medium">Status</p>
                    <div className="flex gap-2">
                      {uniqueActiveStatus.map((status) => {
                        const statusStr = status?.toString() || "false"
                        return (
                          <label key={status}
                            className="border-input has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative flex h-8 p-3 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50"
                          >
                            <Checkbox
                              id={`status-${status}`}
                              value={status}
                              className="sr-only after:absolute after:inset-0"
                              checked={selectedActiveStatus.includes(statusStr)}
                              onCheckedChange={(checked) => handleActiveChange(checked, statusStr)}
                            />
                            <span aria-hidden="true" className="text-sm font-medium">
                              {status ? 'Active' : 'Inactive'}
                            </span>
                            <span className="sr-only">{status ? 'Active' : 'Inactive'}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <DialogFooter className="justify-between">
                  {selectedSports.length > 0 || selectedBatches.length > 0 || selectedActiveStatus.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        table.getColumn("sport")?.setFilterValue(undefined)
                        table.getColumn("batches")?.setFilterValue(undefined)
                        table.getColumn("active")?.setFilterValue(undefined)
                      }}
                    >
                      Clear all filters
                    </Button>
                  ) : <div />}
                  <DialogClose asChild>
                    <Button size="sm" variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet open={openAddCourse} onOpenChange={setOpenAddCourse}>
              <SheetTrigger asChild>
                <Button><Plus /> Add {getRoleBasedLabels().singular}</Button>
              </SheetTrigger>
              <ModifyCourseDetails onSuccess={addCourseToData} onOpenChange={setOpenAddCourse} />
            </Sheet>
          </div>
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
                  No {getRoleBasedLabels().plural.toLowerCase()} found.
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
                {[10, 20, 30].map((pageSize) => (
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

function CourseInfo({ course }) {
  return <DialogContent showCloseButton={false}>
    <DialogHeader>
      <DialogTitle>{course.title}</DialogTitle>
      <DialogDescription>{getRoleBasedLabels().singular} Status and Timestamps</DialogDescription>
    </DialogHeader>
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex flex-col gap-1">
        <Label className="text-sm font-medium">Status</Label>
        {getActiveBadge(course.active)}
      </div>
      <div className="grid gap-4 md:px-4">
        <div>
          <Label className="text-sm font-medium">Created At</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(course.created_at).toLocaleString()}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium">Updated At</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(course.updated_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
    <DialogFooter>
      <DialogClose asChild>
        <Button size="sm" variant="outline">Close</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
}

export function DeactivateCourse({ course, onOpenChange, onSuccess }) {
  const [deing, setDeing] = useState(false)
  const handleDeactivate = async () => {
    setDeing(true);
    try {
      const id = course.id;
      const response = await deactiveCourse(id);
      if (response) {
        onSuccess(id);
        toast.warning(`${course.title} - ${getRoleBasedLabels().singular.toLowerCase()} deactivated !`);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error deactivating:", error);
    } finally {
      setDeing(false);
    }
  }

  return <DialogContent showCloseButton={false} >
    <DialogHeader>
      <DialogTitle>Deactivate {course.title}</DialogTitle>
      <DialogDescription>Are you sure? You want to deactivate <b>{course.title}</b> from your {getRoleBasedLabels().plural.toLowerCase()}.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button size="sm" variant="outline">Cancel</Button>
      </DialogClose>
      <Button size="sm" variant="destructive" onClick={handleDeactivate} disabled={deing}>
        {deing ? <Loader /> : "Deactivate"}
      </Button>
    </DialogFooter>
  </DialogContent>
}

export function ModifyCourseDetails({ course, onOpenChange, onSuccess }) {
  const [title, setTitle] = useState("")
  const [sport, setSport] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const originalRef = useRef({
    title: "",
    sport: "",
    description: "",
  })

  const isEdit = Boolean(
    course && course.title && course.sport && course.description
  )

  useEffect(() => {
    const t = course?.title ?? ""
    const s = course?.sport ?? ""
    const d = course?.description ?? ""

    setTitle(t)
    setSport(s)
    setDescription(d)

    originalRef.current = {
      title: t,
      sport: s,
      description: d,
    }
  }, [course])

  const hasChanged =
    title !== originalRef.current.title ||
    sport !== originalRef.current.sport ||
    description !== originalRef.current.description

  const courseData = {
    title,
    sport,
    description,
  }

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const id = course.id;
      const response = await updateCourse(id, courseData);
      if (response) {
        onSuccess(response);
        toast.success(`${title} - ${getRoleBasedLabels().singular.toLowerCase()} updated !`);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      const response = await addCourse({...courseData, partner_id: getUserInfo()?.id });
      if (response) {
        onSuccess(response);
        toast.success(`${title} - ${getRoleBasedLabels().singular.toLowerCase()} added !`);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error adding:", error);
      toast.error('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SheetContent showCloseButton={false}>
      <SheetHeader>
        <SheetTitle>{isEdit ? "Edit" : "Add"} {getRoleBasedLabels().singular}</SheetTitle>
        <SheetDescription />
      </SheetHeader>
      <div className="grid gap-4 px-4 md:px-6">
        <div className="grid gap-2">
          <Label>{getRoleBasedLabels().singular} Title</Label>
          <Input
            placeholder={`Enter ${getRoleBasedLabels().singular.toLowerCase()} title`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Sport</Label>
          <Input
            placeholder="Enter sport"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Write description here"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">Cancel</Button>
        </SheetClose>
        {isEdit ? (
          hasChanged ? (
            <Button onClick={handleSave} disabled={submitting}>
              {submitting && <Loader />}
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          ) : null
        ) : (
          <Button onClick={handleAdd} disabled={submitting || !title.trim() || !sport.trim() || !description.trim()}>
            {submitting && <Loader />}
            {submitting ? "Adding..." : `Add ${getRoleBasedLabels().singular}`}
          </Button>
        )}
      </SheetFooter>
    </SheetContent>
  )
}


function getActiveBadge(active) {
  return active ? (
    <Badge variant="outline" className="flex items-center gap-1.5">
      <div className="size-2 rounded-full bg-green-500" />
      Active
    </Badge>
  ) : (
    <Badge variant="destructive" className="flex items-center gap-1.5">
      <div className="size-2 rounded-xs bg-current" />
      Inactive
    </Badge>
  )
}