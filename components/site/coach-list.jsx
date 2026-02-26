import { useEffect, useId, useMemo, useRef, useState, useCallback } from "react"
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
  Filter,
  Grid2X2,
  MoreVertical,
  PenLine,
  Plus,
  Rows3,
  Search,
  Trash2,
  UserPlus2,
  UsersRound,
  XIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import PickupProfileImage from "@/components/site/ui/pickup-profile"
import { Textarea } from "@/components/ui/textarea"
import { Loader } from "@/components/ui/loader"
import { addTutor, deleteTutor, getTutors, updateTutor } from "@/lib/supabase"
import { getUserInfo } from "@/lib/store"
import { toast } from "sonner"

const multiColumnFilterFn = (row, columnId, filterValue) => {
  const searchableRowContent = `${row.original.name}`.toLowerCase()
  const searchTerm = (filterValue ?? "").toLowerCase()
  return searchableRowContent.includes(searchTerm)
}

const sportFilterFn = (row, columnId, filterValue) => {
  if (!filterValue?.length) return true
  const sport = row.getValue(columnId)
  return filterValue.includes(sport)
}

const EMPTY_ARRAY = Object.freeze([])

const truncateText = (text, maxWords = 15) => {
  if (!text) return ''
  const words = text.split(' ')
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ') + '...'
}

const getRoleBasedLabels = () => {
  const user = getUserInfo()
  const userRole = user?.role || 'Academy'

  switch (userRole) {
    case 'GYM':
      return {
        singular: 'Trainer',
        plural: 'Trainers',
        searchPlaceholder: 'Search by Trainer name'
      }
    case 'Academy':
    default:
      return {
        singular: 'Coach',
        plural: 'Coaches',
        searchPlaceholder: 'Search by Coach name'
      }
  }
}

function CoachCard({ coach, onUpdateCoach, onRemoveCoach }) {
  const [openEdit, setOpenEdit] = useState(false)
  const [openRemove, setOpenRemove] = useState(false)
  const [openImageZoom, setOpenImageZoom] = useState(false)

  return (
    <div className="flex flex-col gap-2 bg-background border rounded-2xl p-4 hover:shadow-md transition-shadow">
      <div className="w-full flex items-center gap-3">
        <Avatar className="size-12 md:size-16 rounded-md object-cover flex-shrink-0 [&>img]:cursor-pointer">
          <AvatarImage src={coach.profile_image} alt={coach.name} onClick={() => setOpenImageZoom(true)} />
          <AvatarFallback className="rounded-md font-semibold text-2xl">
            {coach.name.split(" ").map(name => name[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className="w-full flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h4 className="w-full text-wrap line-clamp-1 truncate">{coach.name}</h4>
            <Badge variant="secondary">
              {coach.specialization}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setOpenEdit(true)}><PenLine /> Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setOpenRemove(true)}>
                <Trash2 /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <p className="text-muted-foreground text-sm leading-5 mt-2">
        {coach.about}
      </p>
      <Dialog open={openImageZoom} onOpenChange={setOpenImageZoom}>
        <CoachImageZoom src={coach.profile_image} name={coach.name} />
      </Dialog>
      <Dialog open={openRemove} onOpenChange={setOpenRemove}>
        <RemoveCoach coach={coach} onSuccess={onRemoveCoach} onOpenChange={setOpenRemove} />
      </Dialog>
      <Sheet open={openEdit} onOpenChange={setOpenEdit}>
        <ModifyCoachDetails coach={coach} onSuccess={onUpdateCoach} onOpenChange={setOpenEdit} />
      </Sheet>
    </div>
  )
}

// Cell components defined outside to prevent recreation on every render
const NameCell = ({ row }) => {
  const [openImageZoom, setOpenImageZoom] = useState(false)
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8 rounded-md object-cover [&>img]:cursor-pointer">
        <AvatarImage src={row.original.profile_image} alt={row.getValue("name")} onClick={() => setOpenImageZoom(true)} />
        <AvatarFallback className="rounded-md">
          {row.getValue("name").split(" ").map(name => name[0]).join("")}
        </AvatarFallback>
      </Avatar>
      <div className="font-semibold">{row.getValue("name")}</div>
      <Dialog open={openImageZoom} onOpenChange={setOpenImageZoom}>
        <CoachImageZoom src={row.original.profile_image} name={row.getValue("name")} />
      </Dialog>
    </div>
  )
}

const ActionsCell = ({ row, updateCoachInData, removeCoachFromData }) => {
  const [openEdit, setOpenEdit] = useState(false)
  const [openRemove, setOpenRemove] = useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenEdit(true)}><PenLine /> Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setOpenRemove(true)}>
            <Trash2 /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet open={openEdit} onOpenChange={setOpenEdit}>
        <ModifyCoachDetails coach={row.original} onSuccess={updateCoachInData} onOpenChange={setOpenEdit} />
      </Sheet>
      <Dialog open={openRemove} onOpenChange={setOpenRemove}>
        <RemoveCoach coach={row.original} onSuccess={removeCoachFromData} onOpenChange={setOpenRemove} />
      </Dialog>
    </>
  )
}

export default function CoachList() {
  const labels = useMemo(() => getRoleBasedLabels(), [])
  const id = useId()
  const [columnFilters, setColumnFilters] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 6,
  })
  const [viewMode, setViewMode] = useState("table")
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [sorting, setSorting] = useState([{ id: "name", desc: false }])
  const [data, setData] = useState([])
  const [openAddCoach, setOpenAddCoach] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const effectiveViewMode = isMobile ? "cards" : viewMode

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      const partnerId = getUserInfo()?.id
      if (!partnerId) {
        router.push('/login')
        toast.error("Something went wrong.")
        return
      }
      try {
        const response = await getTutors(partnerId)
        setData(response || [])
      } catch (error) {
        console.error('Error fetching tutors:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  const addCoachToData = useCallback((newCoach) => {
    setData(prevData => [...prevData, newCoach])
  }, [])

  const updateCoachInData = useCallback((updatedCoach) => {
    setData(prevData =>
      prevData.map(coach =>
        coach.id === updatedCoach.id ? updatedCoach : coach
      )
    )
  }, [])

  const removeCoachFromData = useCallback((coachId) => {
    setData(prevData => prevData.filter(coach => coach.id !== coachId))
  }, [])

  const columns = useMemo(() => [
    {
      header: () => labels.singular,
      accessorKey: "name",
      cell: NameCell,
      size: 220,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Specialization",
      accessorKey: "specialization",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.getValue("specialization")}
        </Badge>
      ),
      size: 160,
      filterFn: sportFilterFn,
    },
    {
      header: "About",
      accessorKey: "about",
      cell: ({ row }) => {
        const fullText = row.getValue("about")
        const truncatedText = truncateText(fullText)
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="line-clamp-1 text-muted-foreground hover:text-foreground">
                {truncatedText}
              </TooltipTrigger>
              <TooltipContent className="max-w-md leading-5">{fullText}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
      size: 300,
      enableSorting: false,
    },
    {
      id: "actions",
      cell: ({ row }) => <ActionsCell row={row} updateCoachInData={updateCoachInData} removeCoachFromData={removeCoachFromData} />,
      size: 64,
      enableHiding: false,
      enableSorting: false,
    },
  ], [labels.singular, updateCoachInData, removeCoachFromData])

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
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: { sorting, pagination, columnFilters },
  })

  const sportColumn = table.getColumn("specialization")
  const uniqueSportValues = sportColumn
    ? Array.from(sportColumn.getFacetedUniqueValues().keys()).sort()
    : []
  const sportCounts = sportColumn ? sportColumn.getFacetedUniqueValues() : new Map()
  const selectedSports = sportColumn?.getFilterValue() ?? EMPTY_ARRAY

  const handleSportChange = useCallback((checked, value) => {
    if (!sportColumn) return

    const newFilterValue = selectedSports.includes(value)
      ? selectedSports.filter(v => v !== value)
      : [...selectedSports, value]

    sportColumn.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }, [sportColumn, selectedSports])

  const filteredData = table.getRowModel().rows.map(row => row.original)

  if (loading) return (
    <div className="w-full h-48 flex justify-center items-center [&>svg]:size-6">
      <Loader />
    </div>
  )

  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
      <div className="text-muted-foreground space-y-4">
        <UsersRound className="mx-auto size-12 stroke-[1.5px] opacity-50" />
        <h3 className="text-lg font-semibold">No {labels.plural.toLowerCase()} found</h3>
        <p className="text-sm mt-2">Get started by adding your first {labels.singular.toLowerCase()}.</p>
      </div>
      <Button onClick={() => setOpenAddCoach(true)}>
        <Plus />
        Add {labels.singular}
      </Button>
      <Sheet open={openAddCoach} onOpenChange={setOpenAddCoach}>
        <ModifyCoachDetails onSuccess={addCoachToData} onOpenChange={setOpenAddCoach} />
      </Sheet>
    </div>
  )

  return <>
    <div className="w-full flex items-center justify-between">
      <h2>{labels.plural}</h2>
      <Sheet open={openAddCoach} onOpenChange={setOpenAddCoach}>
        <SheetTrigger asChild>
          <Button size="sm"><UserPlus2 /> Add {labels.singular}</Button>
        </SheetTrigger>
        <ModifyCoachDetails onSuccess={addCoachToData} onOpenChange={setOpenAddCoach} />
      </Sheet>
    </div>
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 md:items-center">
          <div className="w-full relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={`peer w-full md:min-w-72 ps-9 ${table.getColumn("name")?.getFilterValue() && "pe-9"}`}
              value={table.getColumn("name")?.getFilterValue() ?? ""}
              onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
              placeholder={labels.searchPlaceholder}
              type="text"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <Search size={16} />
            </div>
            {table.getColumn("name")?.getFilterValue() && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  table.getColumn("name")?.setFilterValue("")
                  inputRef.current?.focus()
                }}
              >
                <XIcon size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="opacity-60" />
                  <span className="hidden md:inline">Filter</span>
                  {selectedSports.length > 0 && (
                    <Badge variant="outline" className="px-1.5">
                      {selectedSports.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto min-w-40 p-0 overflow-hidden" align="end" sideOffset={6}>
                <div className="space-y-3 p-3">
                  <div className="text-muted-foreground text-xs font-medium">
                    Filter
                  </div>
                  <div className="space-y-3">
                    {uniqueSportValues.map((value, i) => (
                      <div key={value} className="flex items-center gap-2">
                        <Checkbox
                          id={`${id}-${i}`}
                          checked={selectedSports.includes(value)}
                          onCheckedChange={(checked) => handleSportChange(checked, value)}
                        />
                        <Label htmlFor={`${id}-${i}`} className="flex grow justify-between gap-2 font-normal">
                          {value}
                          <span className="text-muted-foreground ms-2 text-xs">
                            {sportCounts.get(value)}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedSports.length > 0 && (
                  <PopoverClose asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full border-t rounded-none py-4"
                      onClick={() => sportColumn?.setFilterValue(undefined)}
                    >
                      Clear Filters
                    </Button>
                  </PopoverClose>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={setViewMode} className="hidden md:block">
          <TabsList>
            <TabsTrigger value="table">
              <Rows3 />Table
            </TabsTrigger>
            <TabsTrigger value="cards">
              <Grid2X2 />Cards
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="block md:hidden">
        <div className="grid grid-cols-1 gap-4">
          {filteredData.length > 0 ? (
            filteredData.map((coach) => (
              <CoachCard
                key={coach.id}
                coach={coach}
                onUpdateCoach={updateCoachInData}
                onRemoveCoach={removeCoachFromData}
              />
            ))
          ) : (
            <div className="bg-muted text-muted-foreground h-24 text-center text-sm flex items-center justify-center rounded-lg">
              No {labels.plural.toLowerCase()} found.
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:block">
        {effectiveViewMode === "table" ? (
          <div className="bg-transparent overflow-hidden rounded-lg border">
            <Table className="table-fixed overflow-x-auto">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{ width: `${header.getSize()}px` }}
                        className="h-10 px-4"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className="flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                            onClick={header.column.getToggleSortingHandler()}
                            onKeyDown={(e) => {
                              if ((e.key === "Enter" || e.key === " ")) {
                                e.preventDefault()
                                header.column.getToggleSortingHandler()?.(e)
                              }
                            }}
                            tabIndex={header.column.getCanSort() ? 0 : undefined}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <ChevronUpIcon className="shrink-0 opacity-60" size={16} />,
                              desc: <ChevronDownIcon className="shrink-0 opacity-60" size={16} />,
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-transparent">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="bg-muted text-muted-foreground h-24 text-center">
                      No {labels.plural.toLowerCase()} found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filteredData.length > 0 ? (
              filteredData.map((coach) => (
                <CoachCard
                  key={coach.id}
                  coach={coach}
                  onUpdateCoach={updateCoachInData}
                  onRemoveCoach={removeCoachFromData}
                />
              ))
            ) : (
              <div className="col-span-full bg-muted text-muted-foreground h-24 text-center text-sm flex items-center justify-center rounded-lg">
                No {labels.plural.toLowerCase()} found.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="w-full flex items-center justify-between gap-3 order-1 md:order-2">
          <div className="flex items-center gap-3">
            <Label htmlFor={id} className="text-sm whitespace-nowrap">
              <span className="hidden md:inline">Rows per page</span>
              <span className="md:hidden">Per page</span>
            </Label>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger id={id} className="w-fit h-8 pr-2.5">
                <SelectValue placeholder="Select number of results" />
              </SelectTrigger>
              <SelectContent>
                {[6, 10, 25].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center md:justify-end text-sm whitespace-nowrap">
            <p className="text-muted-foreground whitespace-nowrap">
              Showing{" "}
              <span className="text-foreground">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                &nbsp;-&nbsp;
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getRowCount()
                )}
              </span>{" "}
              of <span className="text-foreground">{table.getRowCount()}</span>
            </p>
          </div>
        </div>

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
                      <ChevronFirstIcon />
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
                      <ChevronLeftIcon />
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
                    >
                      <ChevronRightIcon size={14} />
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
                    >
                      <ChevronLastIcon size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Go to last page</TooltipContent>
                </Tooltip>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <Sheet open={openAddCoach} onOpenChange={setOpenAddCoach}>
        <ModifyCoachDetails onSuccess={addCoachToData} onOpenChange={setOpenAddCoach} />
      </Sheet>
    </div>
  </>
}

function RemoveCoach({ coach, onSuccess, onOpenChange }) {
  const labels = useMemo(() => getRoleBasedLabels(), [])

  const handleRemove = async () => {
    try {
      const response = await deleteTutor(coach.id)
      if (response) {
        toast.warning(`${labels.singular} removed successfully !`)
        onSuccess(coach.id)
        onOpenChange(false)
      }
    } catch (error) {
      console.error(`Error removing ${labels.singular.toLowerCase()}:`, error)
    }
  }

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Remove {coach.name}</DialogTitle>
        <DialogDescription>Are you sure ? You want to remove <b>{coach.name}</b> from your {labels.plural}.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button size="sm" variant="outline">Cancel</Button>
        </DialogClose>
        <Button size="sm" variant="destructive" onClick={handleRemove}>Remove</Button>
      </DialogFooter>
    </DialogContent>
  )
}

function ModifyCoachDetails({ coach, onSuccess, onOpenChange }) {
  const labels = useMemo(() => getRoleBasedLabels(), [])
  const [profileImage, setProfileImage] = useState("")
  const [name, setName] = useState("")
  const [spec, setSpec] = useState("")
  const [about, setAbout] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const originalRef = useRef({ profileImage: "", name: "", spec: "", about: "" })

  const isEdit = Boolean(coach?.profile_image && coach?.name && coach?.specialization && coach?.about)

  useEffect(() => {
    const p = coach?.profile_image ?? ""
    const n = coach?.name ?? ""
    const s = coach?.specialization ?? ""
    const a = coach?.about ?? ""

    setProfileImage(p)
    setName(n)
    setSpec(s)
    setAbout(a)

    originalRef.current = { profileImage: p, name: n, spec: s, about: a }
  }, [coach])

  const hasChanged =
    profileImage !== originalRef.current.profileImage ||
    name !== originalRef.current.name ||
    spec !== originalRef.current.spec ||
    about !== originalRef.current.about

  const handleSave = async () => {
    setSubmitting(true)
    try {
      const tutorData = {
        partner_id: getUserInfo()?.id,
        profile_image: profileImage,
        name,
        specialization: spec,
        about,
      }
      const response = await updateTutor(coach.id, tutorData)
      if (response) {
        toast(`${labels.singular} details updated successfully !`)
        onSuccess({ ...coach, ...tutorData })
        onOpenChange(false)
      }
    } catch (error) {
      console.error(`Error saving ${labels.singular.toLowerCase()} details:`, error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdd = async () => {
    setSubmitting(true)
    try {
      const tutorData = {
        partner_id: getUserInfo()?.id,
        profile_image: profileImage,
        name,
        specialization: spec,
        about,
      }
      const response = await addTutor(tutorData)
      if (response) {
        toast(`${labels.singular} added successfully !`)
        onSuccess(response)
        onOpenChange(false)
      }
    } catch (error) {
      console.error(`Error saving ${labels.singular.toLowerCase()} details:`, error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SheetContent showCloseButton={false}>
      <SheetHeader>
        <SheetTitle>{isEdit ? `Edit ${labels.singular}` : `Add ${labels.singular}`}</SheetTitle>
      </SheetHeader>
      <div className="grid gap-4 px-4 md:px-6">
        <div className="flex flex-row-reverse items-center gap-3">
          <div className="w-full grid gap-2">
            <Label>{labels.singular} Name</Label>
            <Input
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <PickupProfileImage value={profileImage} onChange={setProfileImage} />
        </div>
        <div className="grid gap-2">
          <Label>Specialization</Label>
          <Input
            placeholder="Enter sport name"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>About</Label>
          <Textarea
            placeholder="Write here"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
          />
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">Cancel</Button>
        </SheetClose>
        {isEdit ? (
          hasChanged && (
            <Button onClick={handleSave}>
              {submitting && <Loader />}
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          )
        ) : (
          <Button onClick={handleAdd}>
            {submitting && <Loader />}
            {submitting ? "Adding..." : "Add"}
          </Button>
        )}
      </SheetFooter>
    </SheetContent>
  )
}

function CoachImageZoom({ src, name }) {
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