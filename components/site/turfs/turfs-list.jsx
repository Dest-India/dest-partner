import { useEffect, useId, useMemo, useRef, useState, useCallback } from "react"
import {
  ArrowUpRight,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Filter,
  ListPlus,
  MapPinned,
  OctagonMinus,
  PenLine,
  Play,
  Plus,
  Search,
  UsersRound,
  XIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { useRouter } from "next/navigation"
import { getUserInfo } from "@/lib/store"
import { activeTurf, addTurf, deactiveTurf, getTurfs, updateTurf } from "@/lib/supabase"
import { ModifyCourtDetails } from "./court"

function TurfCard({ turf, onUpdateTurf, onDeactiveTurf, onAddCourt, onActivateTurf }) {
  const router = useRouter()
  const [openAddCourt, setOpenAddCourt] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDeactivate, setOpenDeactivate] = useState(false)

  const TurfDrawer = () => (
    <DrawerContent className="p-2">
      <div className="h-full overflow-y-auto grid md:grid-cols-2 gap-6 md:gap-16 p-4 md:p-6 md:px-8">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <DrawerHeader className="!text-left p-0">
              <DrawerTitle>{turf.name}</DrawerTitle>
              <DrawerDescription>{getActiveBadge(turf.active)}</DrawerDescription>
            </DrawerHeader>
            <div className="flex items-center gap-2">
              <Button onClick={() => setOpenEdit(true)} variant="outline" size="sm"><PenLine />Edit</Button>
              {turf.active ? <Button onClick={() => setOpenDeactivate(true)} variant="destoutline" size="sm"><OctagonMinus />Deactivate</Button> : <Button onClick={() => setOpenDeactivate(true)} size="sm"><Play />Activate</Button>}
            </div>
            <Dialog open={openDeactivate} onOpenChange={setOpenDeactivate}>
              <DeactivateTurf turf={turf} onSuccess={turf.active ? onDeactiveTurf : onActivateTurf} onOpenChange={setOpenDeactivate} />
            </Dialog>
            <Sheet open={openEdit} onOpenChange={setOpenEdit}>
              <ModifyTurfDetails turf={turf} onSuccess={onUpdateTurf} onOpenChange={setOpenEdit} />
            </Sheet>
          </div>
          <div className="flex items-center gap-2">
            <p className="leading-5">{turf.address.street}, {turf.address.landmark}, {turf.address.city}, {turf.address.state} - {turf.address.pin}</p>
            <a href={turf.address.mapLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="h-7 !px-2 text-xs gap-1 [&>svg]:size-2">Map <ArrowUpRight /></Button>
            </a>
          </div>
          <div className="space-y-0">
            <p className="text-muted-foreground">About</p>
            <p>{turf.about}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-muted-foreground">Courts</h4>
            <Sheet open={openAddCourt} onOpenChange={setOpenAddCourt}>
              <SheetTrigger asChild>
                <Button size="sm"><ListPlus /> Add Court</Button>
              </SheetTrigger>
              <ModifyCourtDetails turf={turf} onSuccess={onAddCourt} onOpenChange={setOpenAddCourt} />
            </Sheet>
          </div>
          <div className="grid rounded-2xl border border-dashed divide-y divide-dashed [&>div]:p-4 [&>div]:md:p-5">
            {turf.courts && turf.courts.length > 0 ? turf.courts.map(court => (
              <div key={court.id} className="flex flex-col gap-1.5">
                <h4 className="hover:text-sky-500 cursor-pointer transition-all" onClick={() => router.push(`/home/turfs/court/${court.id}`)}>{court.name}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{court.sport}</Badge>
                </div>
              </div>
            )) : <div className="col-span-full text-muted-foreground h-20 text-sm flex items-center justify-center">No courts found.</div>}
          </div>
        </div>
      </div>
    </DrawerContent>
  )

  return (
    <div className="flex flex-col gap-2 bg-background border rounded-2xl p-4 hover:shadow-md transition-shadow">
      <div className="w-full flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <Drawer>
            <DrawerTrigger asChild>
              <h4 className="w-full text-wrap line-clamp-1 truncate font-semibold hover:text-sky-500 cursor-pointer transition-all">{turf.name}</h4>
            </DrawerTrigger>
            <TurfDrawer />
          </Drawer>
          <div className="flex items-center gap-1">
            {getActiveBadge(turf.active)}
            <span className="flex items-center [&>span]:first:rounded-r-none [&>span]:first:border-r-0 [&>span]:first:text-muted-foreground [&>span]:last:rounded-l-none">
              <Badge variant="outline">Courts</Badge>
              <Badge variant="outline">{turf.courts?.length || 0}</Badge>
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="leading-5 truncate">{turf.address.street}, {turf.address.landmark}, {turf.address.city}, {turf.address.state} - {turf.address.pin}</p>
        <a href={turf.address.mapLink} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="h-7 !px-2 text-xs gap-1 [&>svg]:size-2">Map <ArrowUpRight /></Button>
        </a>
      </div>
    </div>
  )
}

export default function TurfsList() {
  const id = useId()
  const router = useRouter()
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 9,
  })
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [openAddTurf, setOpenAddTurf] = useState(false)

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const partnerId = getUserInfo()?.id
        if (!partnerId) {
          router.push('/login')
          toast.error("Something went wrong.")
          return
        }
        const turfs = await getTurfs(partnerId)
        setData(turfs || [])
      } catch (error) {
        console.error('Error fetching turfs:', error)
        toast.error('Something went wrong.')
      } finally {
        setLoading(false)
      }
    }
    fetchTurfs()
  }, [router])

  const addTurfToData = useCallback((newTurf) => {
    setData(prevData => {
      const maxId = prevData.length > 0 ? Math.max(...prevData.map(t => t.id), 0) : 0
      const turfWithId = { ...newTurf, id: maxId + 1 }
      return [...prevData, turfWithId]
    })
  }, [])

  const updateTurfInData = useCallback((updatedTurf) => {
    setData(prevData =>
      prevData.map(turf =>
        turf.id === updatedTurf.id ? updatedTurf : turf
      )
    )
  }, [])

  const deactiveTurfFromData = useCallback((turfId) => {
    setData(prevData => prevData.map(turf => turf.id === turfId ? { ...turf, active: false } : turf))
  }, [])

  const activeTurfInData = useCallback((turfId) => {
    setData(prevData => prevData.map(turf => turf.id === turfId ? { ...turf, active: true } : turf))
  }, [])

  const addCourtsToTurfInData = useCallback((turfId, newCourt) => {
    setData(prevData => prevData.map(turf => {
      if (turf.id === turfId) {
        return { ...turf, courts: [...(turf.courts || []), newCourt] }
      }
      return turf
    }))
  }, [])

  // Filter state
  const [nameFilter, setNameFilter] = useState("")
  const [sportFilter, setSportFilter] = useState([])
  const [courtCountFilter, setCourtCountFilter] = useState([])
  const [activeStatusFilter, setActiveStatusFilter] = useState([])

  // Get unique sports for filter
  const uniqueSports = useMemo(() => {
    if (loading || data.length === 0) return []
    const sportCounts = data.reduce((acc, turf) => {
      const courts = turf.courts || []
      courts.forEach(court => {
        const sport = court.sport
        if (sport) {
          acc[sport] = (acc[sport] || 0) + 1
        }
      })
      return acc
    }, {})

    return Object.entries(sportCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sport, count]) => ({ sport, count }))
  }, [data, loading])

  // Get unique court counts for filter
  const uniqueCourtCounts = useMemo(() => {
    if (loading || data.length === 0) return []
    const courtCountCounts = data.reduce((acc, turf) => {
      const courtCount = (turf.courts?.length || 0).toString()
      acc[courtCount] = (acc[courtCount] || 0) + 1
      return acc
    }, {})

    return Object.entries(courtCountCounts)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([count, turfsCount]) => ({ count, turfsCount }))
  }, [data, loading])

  // Get active status counts
  const activeStatusCounts = useMemo(() => {
    if (loading || data.length === 0) return []
    const statusCounts = data.reduce((acc, turf) => {
      const status = turf.active ? 'Active' : 'Inactive'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    return Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }))
  }, [data, loading])

  const handleSportChange = useCallback((checked, value) => {
    const newFilterValue = sportFilter.includes(value)
      ? sportFilter.filter(v => v !== value)
      : [...sportFilter, value]

    setSportFilter(newFilterValue)
  }, [sportFilter])

  const handleCourtCountChange = useCallback((checked, value) => {
    const newFilterValue = courtCountFilter.includes(value)
      ? courtCountFilter.filter(v => v !== value)
      : [...courtCountFilter, value]

    setCourtCountFilter(newFilterValue)
  }, [courtCountFilter])

  const handleActiveStatusChange = useCallback((checked, value) => {
    const newFilterValue = activeStatusFilter.includes(value)
      ? activeStatusFilter.filter(v => v !== value)
      : [...activeStatusFilter, value]

    setActiveStatusFilter(newFilterValue)
  }, [activeStatusFilter])

  const clearAllFilters = useCallback(() => {
    setSportFilter([])
    setCourtCountFilter([])
    setActiveStatusFilter([])
  }, [])

  // Filter and paginate data
  const filteredData = useMemo(() => {
    if (loading) return []
    return data.filter(turf => {
      const matchesName = !nameFilter || turf.name?.toLowerCase().includes(nameFilter.toLowerCase())

      // Check if turf has courts with matching sports
      const matchesSport = sportFilter.length === 0 ||
        (turf.courts?.some(court => sportFilter.includes(court.sport)) ?? false)

      // Check court count
      const courtCount = (turf.courts?.length || 0).toString()
      const matchesCourtCount = courtCountFilter.length === 0 || courtCountFilter.includes(courtCount)

      // Check active status
      const status = turf.active ? 'Active' : 'Inactive'
      const matchesActiveStatus = activeStatusFilter.length === 0 || activeStatusFilter.includes(status)

      return matchesName && matchesSport && matchesCourtCount && matchesActiveStatus
    })
  }, [data, nameFilter, sportFilter, courtCountFilter, activeStatusFilter, loading])

  const paginatedData = useMemo(() => {
    if (loading || filteredData.length === 0) return []
    const startIndex = pagination.pageIndex * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, pagination, loading])

  const totalPages = Math.ceil(filteredData.length / pagination.pageSize)

  if (loading) return (
    <div className="w-full h-48 flex justify-center items-center [&>svg]:size-6">
      <Loader />
    </div>
  )

  if (data.length === 0 && !loading) return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
      <div className="text-muted-foreground space-y-4">
        <UsersRound className="mx-auto size-12 stroke-[1.5px] opacity-50" />
        <h3 className="text-lg font-semibold">No turfs found</h3>
        <p className="text-sm mt-2">Get started by adding your first turf.</p>
      </div>
      <Button onClick={() => setOpenAddTurf(true)}>
        <Plus />
        Add Turf
      </Button>
      <Sheet open={openAddTurf} onOpenChange={setOpenAddTurf}>
        <ModifyTurfDetails onSuccess={addTurfToData} onOpenChange={setOpenAddTurf} />
      </Sheet>
    </div>
  )

  return <>
    <div className="w-full flex items-center justify-between">
      <h2>Turfs</h2>

    </div>
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full relative">
          <Input
            id={`${id}-input`}
            ref={inputRef}
            className={`peer w-full lg:max-w-80 ps-9 ${nameFilter && "pe-9"}`}
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Search turfs"
            type="text"
          />
          <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
            <Search size={16} />
          </div>
          {nameFilter && (
            <button
              className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                setNameFilter("")
                inputRef.current?.focus()
              }}
            >
              <XIcon size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2 [&>button]:w-[calc(50%-4px)] lg:[&>button]:w-fit">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={sportFilter.length > 0 || courtCountFilter.length > 0 || activeStatusFilter.length > 0 ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <Filter className="opacity-60" />
                <span className="hidden md:inline">Filters</span>
                {(sportFilter.length > 0 || courtCountFilter.length > 0 || activeStatusFilter.length > 0) && (
                  <Badge variant="secondary" className="ml-1 h-5 text-xs hidden md:flex">
                    {sportFilter.length + courtCountFilter.length + activeStatusFilter.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-64 p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
              <div className="space-y-4 p-4">
                <div className="space-y-1">
                  <h5 className="font-medium leading-none">Filter Turfs</h5>
                </div>

                {/* Sport Filters */}
                {uniqueSports.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-medium">Sports</Label>
                    <div className="flex gap-2 flex-wrap">
                      {uniqueSports.map(({ sport, count }) => (
                        <Tooltip key={sport}>
                          <TooltipTrigger asChild>
                            <label className="border-input has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative flex h-8 p-3 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
                              <Checkbox
                                id={`sport-${sport}`}
                                value={sport}
                                className="sr-only after:absolute after:inset-0"
                                checked={sportFilter.includes(sport)}
                                onCheckedChange={(checked) => handleSportChange(checked, sport)}
                              />
                              <span aria-hidden="true" className="text-sm font-medium">
                                {sport}
                              </span>
                            </label>
                          </TooltipTrigger>
                          <TooltipContent>{count} Courts</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}

                {/* Court Count Filters */}
                {uniqueCourtCounts.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-medium">Number of Courts</Label>
                    <div className="flex gap-2 flex-wrap">
                      {uniqueCourtCounts.map(({ count, turfsCount }) => (
                        <Tooltip key={count}>
                          <TooltipTrigger asChild>
                            <label className="border-input has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative flex h-8 p-3 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
                              <Checkbox
                                id={`court-count-${count}`}
                                value={count}
                                className="sr-only after:absolute after:inset-0"
                                checked={courtCountFilter.includes(count)}
                                onCheckedChange={(checked) => handleCourtCountChange(checked, count)}
                              />
                              <span aria-hidden="true" className="text-sm font-medium">
                                {count === '0' ? 'No courts' : `${count}`}
                              </span>
                            </label>
                          </TooltipTrigger>
                          <TooltipContent>{turfsCount} Turfs</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Status Filters */}
                {activeStatusCounts.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-medium">Status</Label>
                    <div className="flex gap-2 flex-wrap">
                      {activeStatusCounts.map(({ status, count }) => (
                        <Tooltip key={status}>
                          <TooltipTrigger asChild>
                            <label className="border-input has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative flex h-8 p-3 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
                              <Checkbox
                                id={`status-${status}`}
                                value={status}
                                className="sr-only after:absolute after:inset-0"
                                checked={activeStatusFilter.includes(status)}
                                onCheckedChange={(checked) => handleActiveStatusChange(checked, status)}
                              />
                              <span aria-hidden="true" className="text-sm font-medium">
                                {status}
                              </span>
                            </label>
                          </TooltipTrigger>
                          <TooltipContent>{count} turfs</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}

                {(uniqueSports.length === 0 && uniqueCourtCounts.length === 0 && activeStatusCounts.length === 0) && (
                  <p className="text-muted-foreground text-sm">No data available for filtering</p>
                )}
              </div>

              {(sportFilter.length > 0 || courtCountFilter.length > 0 || activeStatusFilter.length > 0) && (
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
          <Sheet open={openAddTurf} onOpenChange={setOpenAddTurf}>
            <SheetTrigger asChild>
              <Button><ListPlus /> Add Turf</Button>
            </SheetTrigger>
            <ModifyTurfDetails onSuccess={addTurfToData} onOpenChange={setOpenAddTurf} />
          </Sheet>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginatedData.length > 0 ? (
          paginatedData.map((turf) => (
            <TurfCard
              key={turf.id}
              turf={turf}
              onUpdateTurf={updateTurfInData}
              onDeactiveTurf={deactiveTurfFromData}
              onActivateTurf={activeTurfInData}
              onAddCourt={addCourtsToTurfInData}
            />
          ))
        ) : (
          <div className="col-span-full bg-muted text-muted-foreground h-24 text-center text-sm flex items-center justify-center rounded-lg">
            No turfs found.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="w-full flex items-center justify-between gap-3 order-1 lg:order-2">
          <div className="flex items-center gap-3">
            <Label htmlFor={id} className="text-sm whitespace-nowrap">
              <span className="hidden lg:inline">Items per page</span>
              <span className="lg:hidden">Per page</span>
            </Label>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => setPagination(prev => ({ ...prev, pageSize: Number(value), pageIndex: 0 }))}
            >
              <SelectTrigger id={id} className="w-fit h-8 pr-2.5">
                <SelectValue placeholder="Select number of results" />
              </SelectTrigger>
              <SelectContent>
                {[9, 18, 36].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center lg:justify-end text-sm whitespace-nowrap">
            <p className="text-muted-foreground whitespace-nowrap">
              Showing{" "}
              <span className="text-foreground">
                {pagination.pageIndex * pagination.pageSize + 1}
                &nbsp;-&nbsp;
                {Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  filteredData.length
                )}
              </span>{" "}
              of <span className="text-foreground">{filteredData.length}</span>
            </p>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end order-2 lg:order-3">
          <Pagination>
            <PaginationContent className="[&>li>button]:size-8">
              <PaginationItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setPagination(prev => ({ ...prev, pageIndex: 0 }))}
                      disabled={pagination.pageIndex === 0}
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
                      onClick={() => setPagination(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))}
                      disabled={pagination.pageIndex === 0}
                    >
                      <ChevronLeftIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Go to previous page</TooltipContent>
                </Tooltip>
              </PaginationItem>
              <PaginationItem className="flex justify-center lg:justify-end text-sm whitespace-nowrap">
                <p className="px-2 whitespace-nowrap">
                  <span className="text-muted-foreground">Page</span> {pagination.pageIndex + 1} <span className="text-muted-foreground">of</span> {totalPages}
                </p>
              </PaginationItem>
              <PaginationItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setPagination(prev => ({ ...prev, pageIndex: Math.min(totalPages - 1, prev.pageIndex + 1) }))}
                      disabled={pagination.pageIndex >= totalPages - 1}
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
                      onClick={() => setPagination(prev => ({ ...prev, pageIndex: totalPages - 1 }))}
                      disabled={pagination.pageIndex >= totalPages - 1}
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

      <Sheet open={openAddTurf} onOpenChange={setOpenAddTurf}>
        <ModifyTurfDetails onSuccess={addTurfToData} onOpenChange={setOpenAddTurf} />
      </Sheet>
    </div>
  </>
}

function DeactivateTurf({ turf, onSuccess, onOpenChange }) {
  const [deing, setDeing] = useState(false)
  const handleDeactive = async () => {
    try {
      setDeing(true)
      await deactiveTurf(turf.id)
      toast.warning(`Turf deactivated successfully!`)
      onSuccess(turf.id)
      onOpenChange(false)
    } catch (error) {
      console.error(`Error deactivating turf:`, error)
      toast.error('Something went wrong.')
    } finally {
      setDeing(false)
    }
  }

  const handleActive = async () => {
    try {
      setDeing(true)
      await activeTurf(turf.id)
      toast.success(`Turf activated successfully!`)
      onSuccess(turf.id)
      onOpenChange(false)
    } catch (error) {
      console.error(`Error activating turf:`, error)
      toast.error('Something went wrong.')
    } finally {
      setDeing(false)
    }
  }

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>{turf.active ? "Deactivate" : "Activate"} {turf.name}</DialogTitle>
        <DialogDescription>Are you sure? You want to {turf.active ? "deactivate" : "activate"} <b className="text-foreground">{turf.name}</b> from your turfs.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button size="sm" variant="outline">Cancel</Button>
        </DialogClose>
        {turf.active ? <Button size="sm" variant="destructive" onClick={handleDeactive} disabled={deing}>
          {deing && <Loader />}
          {deing ? "Deactivating..." : "Deactivate"}
        </Button> : <Button size="sm" onClick={handleActive} disabled={deing}>
          {deing && <Loader />}
          {deing ? "Activating..." : "Activate"}
        </Button>}
      </DialogFooter>
    </DialogContent>
  )
}

function ModifyTurfDetails({ turf, onSuccess, onOpenChange }) {
  const [name, setName] = useState("")
  const [about, setAbout] = useState("")
  const [street, setStreet] = useState("")
  const [landmark, setLandmark] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [pin, setPin] = useState("")
  const [mapLink, setMapLink] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const originalRef = useRef({ name: "", about: "", street: "", landmark: "", city: "", state: "", pin: "", mapLink: "" })

  const isEdit = Boolean(turf?.name && turf?.about && turf?.address)

  useEffect(() => {
    const n = turf?.name ?? ""
    const a = turf?.about ?? ""
    const s = turf?.address?.street ?? ""
    const l = turf?.address?.landmark ?? ""
    const c = turf?.address?.city ?? ""
    const st = turf?.address?.state ?? ""
    const p = turf?.address?.pin ?? ""
    const m = turf?.address?.mapLink ?? ""

    setName(n)
    setAbout(a)
    setStreet(s)
    setLandmark(l)
    setCity(c)
    setState(st)
    setPin(p)
    setMapLink(m)

    originalRef.current = { name: n, about: a, street: s, landmark: l, city: c, state: st, pin: p, mapLink: m }
  }, [turf])

  const hasChanged =
    name !== originalRef.current.name ||
    about !== originalRef.current.about ||
    street !== originalRef.current.street ||
    landmark !== originalRef.current.landmark ||
    city !== originalRef.current.city ||
    state !== originalRef.current.state ||
    pin !== originalRef.current.pin ||
    mapLink !== originalRef.current.mapLink

  const handleSave = async () => {
    setSubmitting(true)
    try {
      const turfData = {
        name,
        about,
        address: {
          street,
          landmark,
          city,
          state,
          pin,
          mapLink
        },
        updated_at: new Date().toISOString()
      }
      const response = await updateTurf(turf.id, turfData)
      toast.success(`Turf details updated successfully !`)
      onSuccess({ ...turfData, id: turf.id })
      onOpenChange(false)
    } catch (error) {
      console.error(`Error updating turf details:`, error)
      toast.error('Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdd = async () => {
    setSubmitting(true)
    try {
      const partnerId = getUserInfo()?.id
      if (!partnerId) {
        router.push('/login')
        toast.error("Something went wrong.")
        return
      }
      const turfData = {
        name,
        about,
        address: {
          street,
          landmark,
          city,
          state,
          pin,
          mapLink
        },
        active: true,
        partner_id: partnerId,
        created_at: new Date().toISOString()
      }
      const response = await addTurf(turfData)
      toast.success(`Turf added successfully !`)
      onSuccess(response)
      onOpenChange(false)
    } catch (error) {
      console.error(`Error saving turf details:`, error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SheetContent showCloseButton={false}>
      <SheetHeader>
        <SheetTitle>{isEdit ? `Edit Turf` : `Add Turf`}</SheetTitle>
      </SheetHeader>
      <div className="grid gap-6 px-4 md:px-6">
        <div className="grid gap-2">
          <Label>Turf Name</Label>
          <Input
            placeholder="Enter turf name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Address</Label>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Building No. or Street Address"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              disabled={submitting}
            />
            <div className="flex gap-3">
              <Input
                placeholder="Landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                disabled={submitting}
              />
              <Input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={submitting}
              />
              <Input
                type="number"
                placeholder="Pin Code"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="relative">
              <Input
                className="pl-10"
                placeholder="Google Map Link"
                value={mapLink}
                onChange={(e) => setMapLink(e.target.value)}
                disabled={submitting}
              />
              <MapPinned className="absolute size-5 top-2 left-3 stroke-1.5" />
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>About</Label>
          <Textarea
            placeholder="Write about the turf"
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
            <Button onClick={handleSave} disabled={submitting}>
              {submitting && <Loader />}
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          )
        ) : (
          <Button onClick={handleAdd} disabled={!name.trim() || !about.trim() || !street.trim() || !city.trim() || !state.trim() || !pin.trim() || !mapLink.trim() || submitting}>
            {submitting && <Loader />}
            {submitting ? "Adding..." : "Add"}
          </Button>
        )}
      </SheetFooter>
    </SheetContent>
  )
}

function getActiveBadge(active) {
  return active ? (
    <Badge variant="outline" className="flex items-center gap-1.5">
      <span className="shrink-0 size-2 aspect-square rounded-full bg-green-500" />
      Active
    </Badge>
  ) : (
    <Badge variant="destructive" className="flex items-center gap-1.5">
      <span className="shrink-0 size-2 aspect-square rounded-xs bg-current" />
      Inactive
    </Badge>
  )
}