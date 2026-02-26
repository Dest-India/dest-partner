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
  Plus,
  Search,
  X,
  Filter,
  ClipboardCheck,
  Phone,
  Mail,
  XIcon,
  CalendarIcon,
  PanelRight,
  ArrowUpRight,
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
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"
import { useRouter } from "next/navigation"
import { getUserInfo } from "@/lib/store"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import { getEnrollments, getCoursesWithPlans, getBatchesWithPlans, getPlansByBatch, createStudentMember, addEnrollment } from "@/lib/supabase"

const getRoleBasedLabels = () => {
  const user = getUserInfo()
  const userRole = user?.role || 'Academy'

  switch (userRole) {
    case 'GYM':
      return {
        singular: 'Member',
        plural: 'Members',
        searchPlaceholder: 'Search by members',
        product: 'programs'
      }
    case 'Academy':
    default:
      return {
        singular: 'Student',
        plural: 'Students',
        searchPlaceholder: 'Search by students',
        product: 'courses'
      }
  }
}


// Custom filter function for multi-column searching
const multiColumnFilterFn = (row, columnId, filterValue) => {
  if (!filterValue || filterValue.trim() === '') return true

  const searchableRowContent = `
    ${row.original.user?.name || ''} 
    ${row.original.user?.phone || ''} 
    ${row.original.user?.email || ''} 
    ${row.original.user?.gender || ''} 
    ${row.original.plan?.duration || ''} 
    ${row.original.plan?.fees || ''} 
    ${row.original.plan?.addons || ''} 
    ${row.original.plan?.batch?.name || ''} 
    ${row.original.plan?.batch?.description || ''} 
    ${row.original.plan?.batch?.course?.title || ''} 
    ${row.original.plan?.batch?.course?.sport || ''} 
    ${row.original.plan?.batch?.course?.description || ''}
    ${new Date(row.original.created_at).toLocaleDateString()}
  `.toLowerCase().replace(/\s+/g, ' ').trim()

  const searchTerms = filterValue.toLowerCase().trim().split(/\s+/)

  return searchTerms.every(term => searchableRowContent.includes(term))
}

// Custom filter function for gender
const genderFilterFn = (row, columnId, filterValue) => {
  if (!filterValue || filterValue.length === 0) return true
  const gender = row.original.user?.gender || 'Unknown'
  return filterValue.includes(gender)
}

// Custom filter function for date range
const dateRangeFilterFn = (row, columnId, filterValue) => {
  if (!filterValue || (!filterValue.from && !filterValue.to)) return true

  const rowDate = new Date(row.original.created_at)
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

const NameCell = ({ row }) => {
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

const CourseDetailsCell = ({ row }) => {
  const router = useRouter()
  return (
    <div className="group flex items-center justify-between gap-1 [&>button]:size-7">
      <div className="flex gap-2">
        <Badge variant="outline">{row.original.plan?.batch?.course?.sport}</Badge>
        <div className="text-muted-foreground">
          {row.original.plan?.batch?.course?.title}
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="hidden group-hover:flex transition-all duration-300" size="icon" variant="ghost" onClick={() => router.replace(`/home/${getRoleBasedLabels().product.toLowerCase()}/${row.original.plan?.batch?.course?.id}`)}>
            <ArrowUpRight />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Course</TooltipContent>
      </Tooltip>
    </div>
  )
}

const columns = [
  {
    header: `${getRoleBasedLabels().singular} Name`,
    accessorFn: (row) => row.user?.name || '',
    id: `${getRoleBasedLabels().singular.toLowerCase()}-name`,
    cell: NameCell,
    size: 192,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
  },
  {
    header: "Gender",
    accessorFn: (row) => row.user?.gender || '',
    id: "gender",
    cell: ({ row }) => {
      const gender = row.original.user?.gender
      if (!gender) return <Badge variant="outline">Unknown</Badge>
      return gender.toLowerCase() === "male" ?
        <Badge variant="secondary">Male</Badge> :
        <Badge variant="outline">{gender}</Badge>
    },
    size: 88,
    filterFn: genderFilterFn,
  },
  {
    header: "Joining Date",
    accessorFn: (row) => new Date(row.created_at),
    id: "joining_date",
    cell: ({ row }) => {
      const date = new Date(row.original.created_at)
      return date.toLocaleDateString()
    },
    size: 140,
    filterFn: dateRangeFilterFn,
  },
  {
    header: "Plan Details",
    accessorFn: (row) => row.plan?.duration || '',
    id: "plan_duration",
    cell: ({ row }) => row.original.plan?.duration,
    size: 128,
  },
  {
    header: "Batch Name",
    accessorFn: (row) => row.plan?.batch?.name || '',
    id: "batch_name",
    cell: ({ row }) => <Tooltip>
      <TooltipTrigger>
        {row.original.plan?.batch?.name}
      </TooltipTrigger>
      <TooltipContent>{row.original.plan?.batch?.description}</TooltipContent>
    </Tooltip>,
    size: 144,
  },
  {
    header: "Course Details",
    id: "course_title",
    cell: CourseDetailsCell,
    size: 320,
    enableSorting: false,
  },
]

const AddStudentMemberForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [plans, setPlans] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    courseId: '',
    batchId: '',
    planId: '',
  })

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const partnerId = getUserInfo()?.id
        if (!partnerId) return

        const coursesData = await getCoursesWithPlans(partnerId)
        setCourses(coursesData || [])
      } catch (error) {
        console.error('Error fetching courses:', error)
        toast.error('Something went wrong.')
      }
    }
    fetchCourses()
  }, [])

  // Fetch batches when course is selected
  useEffect(() => {
    const fetchBatches = async () => {
      if (!formData.courseId) {
        setBatches([])
        return
      }

      try {
        const batchesData = await getBatchesWithPlans(formData.courseId)
        setBatches(batchesData || [])
      } catch (error) {
        console.error('Error fetching batches:', error)
        toast.error('Something went wrong.')
      }
    }
    fetchBatches()
  }, [formData.courseId])

  // Fetch plans when batch is selected
  useEffect(() => {
    const fetchPlans = async () => {
      if (!formData.batchId) {
        setPlans([])
        return
      }

      try {
        const plansData = await getPlansByBatch(formData.batchId)
        setPlans(plansData || [])
      } catch (error) {
        console.error('Error fetching plans:', error)
        toast.error('Something went wrong.')
      }
    }
    fetchPlans()
  }, [formData.batchId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = getUserInfo()
      const partnerId = user?.id

      if (!partnerId) {
        toast.error('Something went wrong.')
        return
      }

      // Create the user first
      const userData = {
        id: crypto.randomUUID(),
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        gender: formData.gender || null
      }

      const createdUser = await createStudentMember(userData)

      // Create the enrollment
      const enrollmentData = {
        user_id: createdUser.id,
        plan_id: formData.planId,
        partner_id: partnerId,
        created_at: new Date().toISOString()
      }

      await addEnrollment(enrollmentData)

      toast.success(`${getRoleBasedLabels().singular} added successfully!`)
      onSuccess()
      setFormData({
        name: '',
        email: '',
        phone: '',
        gender: '',
        courseId: '',
        batchId: '',
        planId: ''
      })
    } catch (error) {
      console.error('Error adding student/member:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mx-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={`Enter ${getRoleBasedLabels().singular.toLowerCase()} name`}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Enter email address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="Enter phone number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="course">Course *</Label>
        <Select 
          value={formData.courseId} 
          onValueChange={(value) => setFormData(prev => ({ 
            ...prev, 
            courseId: value,
            batchId: '', // Reset batch when course changes
            planId: '' // Reset plan when course changes
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title} - {course.sport}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.courseId && (
        <div className="space-y-2">
          <Label htmlFor="batch">Batch *</Label>
          <Select 
            value={formData.batchId} 
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              batchId: value,
              planId: '' // Reset plan when batch changes
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {formData.batchId && (
        <div className="space-y-2">
          <Label htmlFor="plan">Plan *</Label>
          <Select 
            value={formData.planId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, planId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.duration} months - ₹{plan.fees}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" disabled={loading || !formData.courseId || !formData.batchId || !formData.planId} className="w-full">
        {loading ? <Loader /> : `Add ${getRoleBasedLabels().singular}`}
      </Button>
    </form>
  )
}

export default function StudentMemberList() {
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
  const [selectedGenders, setSelectedGenders] = useState([])
  const [selectedDateRange, setSelectedDateRange] = useState(undefined)

  const [sorting, setSorting] = useState([
    {
      id: `${getRoleBasedLabels().singular.toLowerCase()}-name`,
      desc: false,
    },
  ])

  const [data, setData] = useState([])

  const fetchData = async () => {
    setLoading(true)
    const partnerId = getUserInfo()?.id
    if (!partnerId) {
      router.push('/login')
      toast.error("Something went wrong.")
      return
    }
    try {
      const response = await getEnrollments(partnerId)
      setData(response.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || [])
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [router])

  const handleFormSuccess = useCallback(() => {
    fetchData()
  }, [])

  // Calculate unique values for filters
  const uniqueGenders = useMemo(() => {
    const genderCounts = data.reduce((acc, item) => {
      const gender = item.user?.gender || 'Unknown'
      acc[gender] = (acc[gender] || 0) + 1
      return acc
    }, {})

    return Object.entries(genderCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([gender, count]) => ({ gender, count }))
  }, [data])

  // Filter handler functions
  const handleGenderChange = (checked, gender) => {
    setSelectedGenders(prev => {
      const newGenders = checked
        ? [...prev, gender]
        : prev.filter(g => g !== gender)

      // Update column filter
      table.getColumn("gender")?.setFilterValue(newGenders.length > 0 ? newGenders : undefined)
      return newGenders
    })
  }

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range)
    // Update column filter for joining date
    table.getColumn("joining_date")?.setFilterValue(range)
  }

  const clearAllFilters = () => {
    setSelectedGenders([])
    setSelectedDateRange(undefined)
    table.getColumn("gender")?.setFilterValue(undefined)
    table.getColumn("joining_date")?.setFilterValue(undefined)
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
      {/* Filters */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2>{getRoleBasedLabels().plural}</h2>
        <div className="flex gap-2 md:items-center">
          {/* Global search across all fields */}
          <div className="w-full relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={`peer w-full h-9 md:min-w-72 ps-9 ${Boolean(table.getColumn(`${getRoleBasedLabels().singular.toLowerCase()}-name`)?.getFilterValue()) && "pe-9"
                }`}
              value={
                (table.getColumn(`${getRoleBasedLabels().singular.toLowerCase()}-name`)?.getFilterValue() ?? "")
              }
              onChange={(e) =>
                table.getColumn(`${getRoleBasedLabels().singular.toLowerCase()}-name`)?.setFilterValue(e.target.value)
              }
              placeholder={getRoleBasedLabels().searchPlaceholder}
              type="text"
              aria-label={getRoleBasedLabels().searchPlaceholder}
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <Search size={16} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn(`${getRoleBasedLabels().singular.toLowerCase()}-name`)?.getFilterValue()) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn(`${getRoleBasedLabels().singular.toLowerCase()}-name`)?.setFilterValue("")
                  if (inputRef.current) {
                    inputRef.current.focus()
                  }
                }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={selectedGenders.length > 0 || selectedDateRange ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <Filter />
                <span className="hidden md:inline">Filters</span>
                {(selectedGenders.length > 0 || selectedDateRange) && (
                  <Badge variant="secondary" className="ml-1 h-5 text-xs hidden md:flex">
                    {selectedGenders.length + (selectedDateRange ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-68 p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
              <div className="space-y-3 p-4">
                <div className="space-y-1">
                  <h5 className="font-medium leading-none">Filter {getRoleBasedLabels().plural}</h5>
                </div>
                {/* Gender Filters */}
                {uniqueGenders.length > 0 && <div className="space-y-2">
                  <Label className="text-muted-foreground font-medium">Gender</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      {uniqueGenders.map(({ gender, count }) => (
                        <Tooltip key={gender}>
                          <TooltipTrigger asChild>
                            <label
                              className="border-input has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary has-data-[state=checked]:text-primary-foreground has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative flex h-8 p-3 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50"
                            >
                              <Checkbox
                                id={`${gender}`}
                                value={gender}
                                className="sr-only after:absolute after:inset-0"
                                checked={selectedGenders.includes(gender)}
                                onCheckedChange={(checked) => handleGenderChange(checked, gender)}
                              />
                              <span aria-hidden="true" className="text-sm font-medium">
                                {gender}
                              </span>
                            </label>
                          </TooltipTrigger>
                          <TooltipContent>{count} {getRoleBasedLabels().plural}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </div>}
                {/* Date Range Filter */}
                {uniqueGenders.length > 0 ? <div className="space-y-1">
                  <p className="text-muted-foreground font-medium">Joining Date Range</p>
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
                </div> : <p className="text-muted-foreground">No data available</p>}
              </div>
              {(selectedGenders.length > 0 || selectedDateRange) && (
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

          {/* Add Student/Member Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus />
                <span className="hidden md:inline">Add {getRoleBasedLabels().singular}</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Add {getRoleBasedLabels().singular}</SheetTitle>
                <SheetDescription>
                  Manually add a new {getRoleBasedLabels().singular.toLowerCase()} to your {getRoleBasedLabels().product}.
                </SheetDescription>
              </SheetHeader>
              <AddStudentMemberForm onSuccess={handleFormSuccess} />
            </SheetContent>
          </Sheet>
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
  const router = useRouter()
  const [openImage, setOpenImage] = useState(false)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast("Copied to clipboard !", { description: text, icon: <ClipboardCheck />, id: 'copy-success', position: "top-right" })
  }

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
                  <span className="text-muted-foreground">Joined on</span> {new Date(data.created_at).toLocaleDateString()}
                </Badge>
              }
            </DrawerDescription>
          </DrawerHeader>
        </div>
        <div className="flex items-center gap-2">
          {data.user?.phone && <Button variant="outline" size="sm" onClick={() => isMobile ? window.location.href = `tel:${data.user.phone}` : copyToClipboard(data.user.phone)}>
            <Phone /> Call
          </Button>}
          {data.user?.email && <Button variant="outline" size="sm" onClick={() => isMobile ? window.location.href = `mailto:${data.user.email}` : copyToClipboard(data.user.email)}>
            <Mail /> Email
          </Button>}
        </div>
      </div>
      <div className="h-full grid md:grid-cols-3 rounded-xl border border-dashed divide-y md:divide-y-0 md:divide-x divide-dashed mx-4 mb-6 md:m-8 md:mt-0 [&>div]:p-4 [&>div]:py-3 [&>div]:md:px-5 overflow-y-auto">
        <div>
          <p className="font-medium text-muted-foreground">Plan Details</p>
          <h4>{data.plan?.duration}</h4>
          <div className="flex items-center gap-1 mt-1">
            <Badge>₹ {data.plan?.fees}</Badge>
            {!data.plan?.active && <Badge variant="destructive">Inactive Now</Badge>}
          </div>
        </div>
        <div>
          <p className="font-medium text-muted-foreground">Batch Details</p>
          <h4>{data.plan?.batch?.name}</h4>
          {!data.plan?.batch?.active && <Badge variant="destructive" className="mt-1">Inactive Now</Badge>}
          <p className="font-medium text-muted-foreground mt-2 -mb-1">Description</p>
          <p>{data.plan?.batch?.description}</p>
        </div>
        <div>
          <p className="font-medium text-muted-foreground">Course Details</p>
          <h4 className="hover:underline underline-offset-5 hover:decoration-1 cursor-pointer" onClick={() => router.push(`/home/${getRoleBasedLabels().product}/${data.plan?.batch?.course?.id}`)}>{data.plan?.batch?.course?.title}</h4>
          <div className="flex items-center gap-1 mt-2">
            <Badge variant="outline">{data.plan?.batch?.course?.sport}</Badge>
            {!data.plan?.batch?.course?.active && <Badge variant="destructive">Inactive Now</Badge>}
          </div>
          <p className="font-medium text-muted-foreground mt-2 -mb-1">Description</p>
          <p>{data.plan?.batch?.course?.description}</p>
        </div>
      </div>
    </DrawerContent>
  )
}