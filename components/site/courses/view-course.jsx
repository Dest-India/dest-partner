"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MoreVertical, OctagonMinus, PenLine, Plus, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { DeactivateCourse, ModifyCourseDetails } from "./courses-table";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { useSidebarStore } from "@/components/sidebar/sidebar-data";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addBatch,
  addBatchPlan,
  deactivateBatch,
  deactivateBatchPlan,
  getCourseById,
  updateBatch,
  updateBatchPlan,
} from "@/lib/supabase";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import { getUserInfo } from "@/lib/store";

const getRoleBasedLabels = () => {
  const user = getUserInfo();
  const userRole = user?.role || "Academy";

  switch (userRole) {
    case "GYM":
      return {
        singular: "Program",
        plural: "Programs",
        searchPlaceholder: "Search by Programs",
        user_singular: "Member",
        user_plural: "Members",
      };
    case "Academy":
    default:
      return {
        singular: "Course",
        plural: "Courses",
        searchPlaceholder: "Search by Courses",
        user_singular: "Student",
        user_plural: "Students",
      };
  }
};

export default function ViewCourse({ courseId }) {
  const [openCourseEdit, setOpenCourseEdit] = useState(false);
  const [openCourseDeactivate, setOpenCourseDeactivate] = useState(false);
  const [openAddBatch, setOpenAddBatch] = useState(false);

  const router = useRouter();
  const setActiveSidebarItem = useSidebarStore(
    (state) => state.setActiveSidebarItem
  );
  const addBreadcrumbItem = useSidebarStore((state) => state.addBreadcrumbItem);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        if (!courseId) {
          router.push(`/home/${getRoleBasedLabels().plural.toLowerCase()}`);
          return;
        }
        const response = await getCourseById(courseId);
        if (response.success === 404) {
          router.push(`/home/${getRoleBasedLabels().plural.toLowerCase()}`);
          toast.error("Something went wrong.");
          return;
        } else {
          setData(response);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [router, courseId]);

  useEffect(() => {
    if (data.title) {
      addBreadcrumbItem(<Badge variant="secondary">{data.title}</Badge>);
    }
  }, [data.title, addBreadcrumbItem]);

  useEffect(() => {
    setActiveSidebarItem(getRoleBasedLabels().plural.toLowerCase());
    addBreadcrumbItem(<Badge variant="secondary">{data.title}</Badge>);
  }, [data, setActiveSidebarItem, addBreadcrumbItem]);

  const updateCourseInData = useCallback(
    (courseData) => {
      setData({ ...data, ...courseData });
    },
    [data]
  );

  const handleBatchAdd = useCallback(
    (newBatch) => {
      setData((prevData) => ({
        ...prevData,
        batches: [...prevData.batches, newBatch],
      }));
    },
    [setData]
  );

  const handleBatchUpdate = useCallback(
    (updatedBatch) => {
      setData((prevData) => ({
        ...prevData,
        batches: prevData.batches.map((batch) =>
          batch.id === updatedBatch.id ? { ...batch, ...updatedBatch } : batch
        ),
      }));
    },
    [setData]
  );

  const handleBatchDeactivation = useCallback(
    (batchId) => {
      setData((prevData) => ({
        ...prevData,
        batches: prevData.batches.map((batch) =>
          batch.id === batchId ? { ...batch, active: false } : batch
        ),
      }));
    },
    [setData]
  );

  const handleBatchPlanAdd = useCallback(
    (batchId, newPlan) => {
      setData((prevData) => ({
        ...prevData,
        batches: prevData.batches.map((batch) => {
          if (batch.id === batchId) {
            return {
              ...batch,
              plans: [...batch.plans, newPlan],
            };
          }
          return batch;
        }),
      }));
    },
    [setData]
  );

  const handleBatchPlanUpdate = useCallback(
    (batchId, updatedPlan) => {
      setData((prevData) => ({
        ...prevData,
        batches: prevData.batches.map((batch) => {
          if (batch.id === batchId) {
            return {
              ...batch,
              plans: batch.plans.map((plan) =>
                plan.id === updatedPlan.id ? { ...plan, ...updatedPlan } : plan
              ),
            };
          }
          return batch;
        }),
      }));
    },
    [setData]
  );

  const handleBatchPlanDeactivation = useCallback(
    (batchId, planId) => {
      setData((prevData) => ({
        ...prevData,
        batches: prevData.batches.map((batch) => {
          if (batch.id === batchId) {
            return {
              ...batch,
              plans: batch.plans.map((plan) =>
                plan.id === planId ? { ...plan, active: false } : plan
              ),
            };
          }
          return batch;
        }),
      }));
    },
    [setData]
  );

  return loading ? (
    <div className="w-full h-48 flex justify-center items-center [&>svg]:size-6">
      <Loader />
    </div>
  ) : (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2>{data.title}</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setOpenCourseEdit(true)}
            variant="outline"
            size="sm"
          >
            <PenLine />
            Edit
          </Button>
          <Button
            onClick={() => setOpenCourseDeactivate(true)}
            variant="destoutline"
            size="sm"
          >
            <OctagonMinus />
            Deactivate {getRoleBasedLabels().singular}
          </Button>
        </div>
        <Dialog
          open={openCourseDeactivate}
          onOpenChange={setOpenCourseDeactivate}
        >
          <DeactivateCourse course={data} />
        </Dialog>
        <Sheet open={openCourseEdit} onOpenChange={setOpenCourseEdit}>
          <ModifyCourseDetails
            course={data}
            onSuccess={updateCourseInData}
            onOpenChange={setOpenCourseEdit}
          />
        </Sheet>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{data.sport || "N/A"}</Badge>
        {getActiveBadge(data.active)}
        <div className="flex items-center [&>span]:first:rounded-r-none [&>span]:first:border-r-0 [&>span]:first:text-muted-foreground [&>span]:last:rounded-l-none">
          <Badge variant="outline">Students</Badge>
          <Badge variant="outline">
            {data.batches?.reduce(
              (total, batch) =>
                total +
                (batch.plans?.reduce(
                  (total, plan) => total + (plan.students?.[0]?.count || 0),
                  0
                ) || 0),
              0
            ) || 0}
          </Badge>
        </div>
      </div>
      <div>
        <h5>Description</h5>
        <p className="text-muted-foreground">
          {data.description || "No description available."}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h5>Batches</h5>
          <Sheet open={openAddBatch} onOpenChange={setOpenAddBatch}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus />
                Add Batch
              </Button>
            </SheetTrigger>
            <ModifyBatches
              course={data}
              onSuccess={handleBatchAdd}
              onOpenChange={setOpenAddBatch}
            />
          </Sheet>
        </div>
        <Accordion type="single" collapsible className="w-full space-y-2">
          {data.batches?.map((batch) => {
            return (
              <BatchAccordionItem
                key={batch.id}
                batch={batch}
                data={data}
                handleBatchUpdate={handleBatchUpdate}
                handleBatchDeactivation={handleBatchDeactivation}
                handleBatchPlanAdd={handleBatchPlanAdd}
                handleBatchPlanUpdate={handleBatchPlanUpdate}
                handleBatchPlanDeactivation={handleBatchPlanDeactivation}
              />
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}

function BatchAccordionItem({
  batch,
  data,
  handleBatchUpdate,
  handleBatchDeactivation,
  handleBatchPlanAdd,
  handleBatchPlanUpdate,
  handleBatchPlanDeactivation,
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDeactivate, setOpenDeactivate] = useState(false);
  const [openAddPlan, setOpenAddPlan] = useState(false);

  // ActionsCell component for plan actions - moved above PlanTable to avoid hoisting issues
  function ActionsCell({ row }) {
    const [openEditPlan, setOpenEditPlan] = useState(false);
    const [openDeactivatePlan, setOpenDeactivatePlan] = useState(false);
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setOpenEditPlan(true)}>
              <PenLine /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setOpenDeactivatePlan(true)}
            >
              <OctagonMinus /> Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Sheet open={openEditPlan} onOpenChange={setOpenEditPlan}>
          <ModifyBatchPlans
            batch={batch}
            plan={row.original}
            onSuccess={handleBatchPlanUpdate}
            onOpenChange={setOpenEditPlan}
          />
        </Sheet>
        <Dialog open={openDeactivatePlan} onOpenChange={setOpenDeactivatePlan}>
          <DeactivateBatchPlan
            batch={batch}
            plan={row.original}
            onSuccess={handleBatchPlanDeactivation}
            onOpenChange={setOpenDeactivatePlan}
          />
        </Dialog>
      </>
    );
  }

  function PlanTable({ plans }) {
    const columns = [
      {
        header: "Status",
        accessorKey: "active",
        cell: ({ row }) => getActiveBadge(row.getValue("active")),
        size: 120,
      },
      {
        header: `Enrolled ${getRoleBasedLabels().user_plural}`,
        accessorKey: "students",
        cell: ({ row }) => (
          <div className="font-medium">
            {row.original.students?.[0]?.count || 0}
          </div>
        ),
        size: 144,
      },
      {
        header: "Duration",
        accessorKey: "duration",
        cell: ({ row }) => <div>{row.getValue("duration")}</div>,
        size: 128,
      },
      {
        header: "Fees",
        accessorKey: "fees",
        cell: ({ row }) => (
          <div className="font-medium">₹ {row.getValue("fees")}</div>
        ),
        size: 128,
      },
      {
        header: "",
        accessorKey: "actions",
        cell: ActionsCell,
        size: 96,
      },
    ];

    const table = useReactTable({
      data: plans,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    return (
      <div className="rounded-lg border overflow-hidden">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-accent text-accent-foreground [&>th]:h-9 hover:bg-accent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
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
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No plans available.{" "}
                  <Sheet open={openAddPlan} onOpenChange={setOpenAddPlan}>
                    <SheetTrigger asChild>
                      <span className="text-sky-500 font-medium hover:underline underline-offset-4 cursor-pointer">
                        Add Plans
                      </span>
                    </SheetTrigger>
                    <ModifyBatchPlans
                      batch={batch}
                      onSuccess={handleBatchPlanAdd}
                      onOpenChange={setOpenAddPlan}
                    />
                  </Sheet>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <AccordionItem
      value={batch.name}
      className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-lg border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px]"
    >
      <AccordionTrigger className="md:justify-start gap-3 py-2 tracking-normal hover:no-underline focus-visible:ring-0 md:[&>svg]:-order-1 [&>svg]:size-5 md:[&>svg]:translate-y-1">
        <h4 className="flex items-center gap-2">
          {batch.name}{" "}
          <Badge variant="secondary">
            {batch.plans?.length || "No"}{" "}
            {batch.plans?.length > 1 ? "Plans" : "Plan"}
          </Badge>
        </h4>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-4 md:gap-3 md:pl-7 py-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {batch.active ? (
              <Badge variant="outline" className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-green-500" />
                Active
              </Badge>
            ) : (
              <Badge
                variant="destructive"
                className="flex items-center gap-1.5"
              >
                <div className="size-2 rounded-xs bg-current" />
                Inactive
              </Badge>
            )}
            <div className="flex items-center [&>span]:first:rounded-r-none [&>span]:first:border-r-0 [&>span]:first:text-muted-foreground [&>span]:last:rounded-l-none">
              <Badge variant="outline">
                Enrolled {getRoleBasedLabels().user_singular}
              </Badge>
              <Badge variant="outline">
                {batch.plans?.reduce(
                  (total, plan) => total + (plan.students?.[0]?.count || 0),
                  0
                ) || 0}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Sheet open={openEdit} onOpenChange={setOpenEdit}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <PenLine />
                  Edit Batch
                </Button>
              </SheetTrigger>
              <ModifyBatches
                course={data}
                batch={batch}
                onSuccess={handleBatchUpdate}
                onOpenChange={setOpenEdit}
              />
            </Sheet>
            <Dialog open={openDeactivate} onOpenChange={setOpenDeactivate}>
              <DialogTrigger asChild>
                <Button variant="destoutline" size="sm">
                  <OctagonMinus />
                  Deactivate
                </Button>
              </DialogTrigger>
              <DeactivateBatch
                batch={batch}
                onSuccess={handleBatchDeactivation}
                onOpenChange={setOpenDeactivate}
              />
            </Dialog>
          </div>
        </div>
        <div>
          <h5>Description</h5>
          <p className="text-muted-foreground">{batch.description}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h5>Plans</h5>
            <Sheet open={openAddPlan} onOpenChange={setOpenAddPlan}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus /> Add Plans
                </Button>
              </SheetTrigger>
              <ModifyBatchPlans
                course={data}
                batch={batch}
                onSuccess={handleBatchPlanAdd}
                onOpenChange={setOpenAddPlan}
              />
            </Sheet>
          </div>
          <PlanTable batch={batch} plans={batch?.plans || []} />
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:gap-2 mb-2">
          <h5>Note</h5>
          <p className="text-muted-foreground">{batch.note}</p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function DeactivateBatch({ batch, onSuccess, onOpenChange }) {
  const [deing, setDeing] = useState(false);
  const handleDeactivate = async () => {
    setDeing(true);
    try {
      const id = batch.id;
      const response = await deactivateBatch(id);
      if (response) {
        onSuccess(id);
        toast.warning(`${batch.name} - batch deactivated !`);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error deactivating:", error);
    } finally {
      setDeing(false);
    }
  };

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Deactivate {batch.name}</DialogTitle>
        <DialogDescription>
          Are you sure? You want to deactivate <b>{batch.name}</b> from your
          batch.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button size="sm" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDeactivate}
          disabled={deing}
        >
          {deing ? <Loader /> : "Deactivate"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ModifyBatches({ course, batch, onSuccess, onOpenChange }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const originalRef = useRef({
    name: "",
    description: "",
    note: "",
  });

  const isEdit = Boolean(
    batch && batch.name && batch.description && batch.note
  );

  useEffect(() => {
    const n = batch?.name ?? "";
    const d = batch?.description ?? "";
    const no = batch?.note ?? "";

    setName(n);
    setDescription(d);
    setNote(no);

    originalRef.current = {
      name: n,
      description: d,
      note: no,
    };
  }, [batch]);

  const hasChanged =
    name !== originalRef.current.name ||
    description !== originalRef.current.description ||
    note !== originalRef.current.note;

  const batchData = {
    name,
    description,
    note,
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const id = batch.id;
      const response = await updateBatch(id, batchData);
      if (response) {
        onSuccess(response);
        toast.success(`${name} - batch updated !`);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      const response = await addBatch({ ...batchData, course_id: course.id });
      if (response) {
        onSuccess(response);
        toast.success(`Batch added !`);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error adding:", error);
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SheetContent showCloseButton={false}>
      <SheetHeader>
        <SheetTitle>{isEdit ? "Edit Batch" : "Add Batch"}</SheetTitle>
        <SheetDescription />
      </SheetHeader>
      <div className="grid gap-4 px-4 md:px-6">
        <div className="grid gap-2">
          <Label>Batch Name</Label>
          <Input
            placeholder="Enter batch name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
        <div className="grid gap-2">
          <Label>Note</Label>
          <Textarea
            placeholder="Enter note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
          <Button
            onClick={handleAdd}
            disabled={
              submitting || !name.trim() || !description.trim() || !note.trim()
            }
          >
            {submitting && <Loader />}
            {submitting ? "Adding..." : "Add Batch"}
          </Button>
        )}
      </SheetFooter>
    </SheetContent>
  );
}

function DeactivateBatchPlan({ batch, plan, onSuccess, onOpenChange }) {
  const [deing, setDeing] = useState(false);
  const handleDeactivate = async () => {
    setDeing(true);
    try {
      const id = plan.id;
      const response = await deactivateBatchPlan(id);
      if (response) {
        onSuccess(batch.id, id);
        toast.warning(`${plan.duration} - plan deactivated !`);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error deactivating:", error);
    } finally {
      setDeing(false);
    }
  };

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Deactivate {plan.duration}</DialogTitle>
        <DialogDescription>
          Are you sure? You want to deactivate <b>{plan.duration}</b> (₹
          {plan.fees}) from your batch.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button size="sm" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDeactivate}
          disabled={deing}
        >
          {deing ? <Loader /> : "Deactivate"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ModifyBatchPlans({ batch, plan, onSuccess, onOpenChange }) {
  const [duration, setDuration] = useState("");
  const [fees, setFees] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const originalRef = useRef({
    duration: "",
    fees: "",
  });

  const isEdit = Boolean(plan && plan.duration && plan.fees);

  useEffect(() => {
    const d = plan?.duration ?? "";
    const f = plan?.fees ?? "";

    setDuration(d);
    setFees(f);

    originalRef.current = {
      duration: d,
      fees: f,
    };
  }, [plan]);

  const hasChanged =
    duration !== originalRef.current.duration ||
    fees !== originalRef.current.fees;

  const planData = {
    duration,
    fees,
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const id = plan.id;
      const response = await updateBatchPlan(id, planData);
      if (response) {
        onSuccess(batch.id, response);
        toast.success(`${duration} - plan updated !`);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      const response = await addBatchPlan({ ...planData, batch_id: batch.id });
      if (response) {
        onSuccess(batch.id, response);
        toast.success(`Plan added !`);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error adding:", error);
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SheetContent showCloseButton={false}>
      <SheetHeader>
        <SheetTitle>{isEdit ? "Edit Plan" : "Add Plan"}</SheetTitle>
        <SheetDescription />
      </SheetHeader>
      <div className="grid gap-4 px-4 md:px-6">
        <div className="grid gap-2">
          <Label>Duration</Label>
          <Input
            placeholder="Enter duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Fees</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="Enter fees"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              className="peer ps-7"
            />
            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 pt-0.5 peer-disabled:opacity-50">
              ₹
            </span>
          </div>
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">Cancel</Button>
        </SheetClose>
        {isEdit ? (
          hasChanged ? (
            <Button
              onClick={handleSave}
              disabled={submitting || !duration.trim() || !fees.trim()}
            >
              {submitting && <Loader />}
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          ) : null
        ) : (
          <Button
            onClick={handleAdd}
            disabled={submitting || !duration.trim() || !fees.trim()}
          >
            {submitting && <Loader />}
            {submitting ? "Adding..." : "Add Plan"}
          </Button>
        )}
      </SheetFooter>
    </SheetContent>
  );
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
  );
}
