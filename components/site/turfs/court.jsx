"use client";

import { ClockIcon, Dot, Pencil, Plus, Trash2, X } from "lucide-react";
import { useSidebarStore } from "@/components/sidebar/sidebar-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import React, { use, useEffect, useRef, useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import TimePicker from "./time-picker";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addAvailabilityOverride,
  addCourt,
  addWeeklyAvailability,
  getAvailabilityOverrides,
  getCourt,
  getWeeklyAvailability,
  updateAvailabilityOverride,
  updateCourt,
  updateWeeklyAvailability,
} from "@/lib/supabase";
import { toast } from "sonner";
import {
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Sheet,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { getUserInfo } from "@/lib/store";
import { cn } from "@/lib/utils";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_SLOTS = [];
for (let hour = 0; hour <= 23; hour++) {
  TIME_SLOTS.push({ hour, minute: 0 });
}

const SLOT_BG_COLORS = [
  "#7D6C0F",
  "#1170D7",
  "#6B5000",
  "#AA8CF5",
  "#4A1E6B",
  "#E16718",
  "#04151B",
  "#458230",
  "#9B16B1",
  "#300E24",
  "#BA0E0A",
  "#3783B9",
  "#6C3339",
  "#17D06A",
  "#208C86",
  "#BE3C48",
  "#885BCA",
  "#173377",
  "#0AA211",
  "#421266",
  "#24462B",
  "#A96D2C",
  "#BB05A4",
  "#6F4CE4",
  "#065AB9",
  "#C5515C",
  "#7B202C",
  "#1B8509",
  "#428C6C",
  "#851EE0",
  "#7D4C2C",
];

export default function CourtDetails({ courtId }) {
  const router = useRouter();
  const setActiveSidebarItem = useSidebarStore(
    (state) => state.setActiveSidebarItem
  );
  const addBreadcrumbItem = useSidebarStore((state) => state.addBreadcrumbItem);

  // State for weekly availability
  const [data, setData] = useState(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState([]);
  const [availabilityOverrides, setAvailabilityOverrides] = useState([]);
  const [originalAvailability, setOriginalAvailability] = useState([]);

  const [loading, setLoading] = useState(true);
  const [openEditCourt, setOpenEditCourt] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Calendar interaction state
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [selecting, setSelecting] = useState(false);
  const [startCell, setStartCell] = useState(null);
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState({
    from: null,
    to: null,
  });

  // Editing slot state
  const [showEditSlotDialog, setShowEditSlotDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const courtResponse = await getCourt(courtId);
        const waResponse = await getWeeklyAvailability(courtId);
        const aoResponse = await getAvailabilityOverrides(courtId);
        setData(courtResponse);
        setAvailabilityOverrides(aoResponse);

        // Create default weekly structure
        const defaultWeekly = [
          { day_of_week: "Sunday", slots: [] },
          { day_of_week: "Monday", slots: [] },
          { day_of_week: "Tuesday", slots: [] },
          { day_of_week: "Wednesday", slots: [] },
          { day_of_week: "Thursday", slots: [] },
          { day_of_week: "Friday", slots: [] },
          { day_of_week: "Saturday", slots: [] },
        ];

        if (Array.isArray(waResponse) && waResponse.length > 0) {
          const formattedAvailability = defaultWeekly.map((defaultDay) => {
            const fetchedDay = waResponse.find(
              (item) => item.day_of_week === defaultDay.day_of_week
            );

            let slots = [];
            if (fetchedDay?.slots) {
              if (typeof fetchedDay.slots === "string") {
                try {
                  slots = JSON.parse(fetchedDay.slots);
                } catch (e) {
                  console.error(
                    `Error parsing slots for ${defaultDay.day_of_week}:`,
                    e
                  );
                  slots = [];
                }
              } else if (Array.isArray(fetchedDay.slots)) {
                slots = fetchedDay.slots;
              }
            }

            const dayData = {
              id: fetchedDay?.id,
              day_of_week: defaultDay.day_of_week,
              slots: Array.isArray(slots)
                ? slots.map((slot) => ({
                    ...slot,
                    colorIndex: Math.floor(
                      Math.random() * SLOT_BG_COLORS.length
                    ),
                  }))
                : [],
              court_id: courtId,
            };

            return dayData;
          });
          setWeeklyAvailability(formattedAvailability);
          setOriginalAvailability(
            JSON.parse(JSON.stringify(formattedAvailability))
          );
        } else {
          const defaultWithIds = defaultWeekly.map((day) => ({
            ...day,
            court_id: courtId,
          }));
          setWeeklyAvailability(defaultWithIds);
          setOriginalAvailability(JSON.parse(JSON.stringify(defaultWithIds)));
        }
      } catch (error) {
        console.error("Error fetching court details:", error);
        // Use default structure on error
        const defaultWeekly = [
          { day_of_week: "Sunday", slots: [], court_id: courtId },
          { day_of_week: "Monday", slots: [], court_id: courtId },
          { day_of_week: "Tuesday", slots: [], court_id: courtId },
          { day_of_week: "Wednesday", slots: [], court_id: courtId },
          { day_of_week: "Thursday", slots: [], court_id: courtId },
          { day_of_week: "Friday", slots: [], court_id: courtId },
          { day_of_week: "Saturday", slots: [], court_id: courtId },
        ];
        setWeeklyAvailability(defaultWeekly);
        setOriginalAvailability(JSON.parse(JSON.stringify(defaultWeekly)));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courtId]);

  const saveChanges = async () => {
    try {
      // Find days that have changes
      const changedDays = [];

      weeklyAvailability.forEach((day, index) => {
        const originalDay = originalAvailability[index];

        // Compare slots to detect changes
        const slotsChanged =
          JSON.stringify(day.slots) !==
          JSON.stringify(originalDay?.slots || []);

        if (slotsChanged) {
          changedDays.push({
            id: day.id,
            day_of_week: day.day_of_week,
            slots: day.slots,
            court_id: day.court_id,
          });
        }
      });

      if (changedDays.length > 0) {
        await updateWeeklyAvailability(changedDays);
        toast.success(
          `Changes saved for ${changedDays.length} day${
            changedDays.length !== 1 ? "s" : ""
          } !`,
          {
            description: `Updated availability for ${changedDays
              .map((day) => day.day_of_week)
              .join(", ")}`,
            duration: 8000,
          }
        );

        // Update original availability to match current state
        setOriginalAvailability(JSON.parse(JSON.stringify(weeklyAvailability)));
        setHasChanges(false);
      } else {
        toast.info("No changes to save");
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Something went wrong.");
    }
  };

  useEffect(() => {
    const user = getUserInfo();
    if (user?.role !== "Turf") {
      router.push("/home/dashboard");
      return;
    }
    setActiveSidebarItem("turfs");
  }, [setActiveSidebarItem, addBreadcrumbItem, router]);

  useEffect(() => {
    if (data?.name) {
      addBreadcrumbItem(<Badge variant="outline">{data?.turf.name}</Badge>);
      addBreadcrumbItem(<Badge variant="secondary">{data.name}</Badge>);
    }
  }, [data?.turf?.name, data?.name, addBreadcrumbItem]);

  const formatTime = (time) => {
    if (!time) return "";
    let hour = time.hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour} ${ampm}`;
  };

  const handleMouseDown = (e, dayIndex, timeIndex) => {
    e.preventDefault(); // Prevent text selection
    // Check if the cell is in a slot
    const day = weeklyAvailability[dayIndex];
    if (day?.slots) {
      const slotIndex = day.slots.findIndex((slot) => {
        if (!slot.from || !slot.to) return false;
        const start = TIME_SLOTS.findIndex(
          (t) => t.hour === slot.from.hour && t.minute === slot.from.minute
        );
        const end = TIME_SLOTS.findIndex(
          (t) => t.hour === slot.to.hour && t.minute === slot.to.minute
        );
        return start <= timeIndex && timeIndex < end;
      });
      if (slotIndex !== -1) {
        setEditingSlot({ dayIndex, slotIndex, slot: day.slots[slotIndex] });
        setShowEditSlotDialog(true);
        return;
      }
    }
    // Otherwise, start selection
    setSelecting(true);
    setStartCell({ dayIndex, timeIndex });
    setSelectedCells(new Set([`${dayIndex}-${timeIndex}`]));
  };

  const handleMouseEnter = (dayIndex, timeIndex) => {
    if (!selecting) return;
    const newSelected = new Set();
    const start = startCell;
    if (start.dayIndex !== dayIndex) return;
    const minTime = Math.min(start.timeIndex, timeIndex);
    const maxTime = Math.max(start.timeIndex, timeIndex);
    let hasOverlap = false;
    for (let t = minTime; t <= maxTime; t++) {
      // Check if this cell is in any slot
      const day = weeklyAvailability[dayIndex];
      if (day?.slots) {
        const inSlot = day.slots.some((slot) => {
          if (!slot.from || !slot.to) return false;
          const startIdx = TIME_SLOTS.findIndex(
            (ts) => ts.hour === slot.from.hour && ts.minute === slot.from.minute
          );
          const endIdx = TIME_SLOTS.findIndex(
            (ts) => ts.hour === slot.to.hour && ts.minute === slot.to.minute
          );
          return startIdx <= t && t < endIdx;
        });
        if (inSlot) {
          hasOverlap = true;
          break;
        }
      }
      newSelected.add(`${dayIndex}-${t}`);
    }
    if (!hasOverlap) {
      setSelectedCells(newSelected);
    }
  };

  const handleMouseUp = () => {
    if (!selecting) return;
    setSelecting(false);
    if (selectedCells.size > 0) {
      const cells = Array.from(selectedCells).map((key) => {
        const [d, t] = key.split("-").map(Number);
        return { dayIndex: d, timeIndex: t };
      });
      const dayIndex = cells[0].dayIndex;
      const timeIndices = cells.map((c) => c.timeIndex).sort((a, b) => a - b);
      const from = TIME_SLOTS[timeIndices[0]];
      const to = {
        hour: TIME_SLOTS[timeIndices[timeIndices.length - 1]].hour + 1,
        minute: 0,
      };
      setSelectedDayIndex(dayIndex);
      setSelectedTimeRange({ from, to });
      setShowAddSlotDialog(true);
    }
  };

  const addSlotToDay = (dayIndex, slot) => {
    setWeeklyAvailability((prev) => {
      const newAvail = [...prev];
      newAvail[dayIndex].slots.push({
        ...slot,
        colorIndex: Math.floor(Math.random() * SLOT_BG_COLORS.length),
      });
      return newAvail;
    });
    setHasChanges(true);
    setSelectedCells(new Set());
  };

  const editSlot = (dayIndex, slotIndex) => {
    setWeeklyAvailability((prev) => {
      const newAvail = [...prev];
      newAvail[dayIndex].slots.splice(slotIndex, 1);
      return newAvail;
    });
    setHasChanges(true);
  };

  const updateCourtData = (updatedData) => {
    setData((currentData) => ({ ...currentData, ...updatedData }));
  };

  const onOverrideEdit = (id, updatedData) => {
    setAvailabilityOverrides((currentOverrides) => {
      const newOverrides = [...currentOverrides];
      const overrideIndex = newOverrides.findIndex(
        (override) => override.id === id
      );
      if (overrideIndex !== -1) {
        newOverrides[overrideIndex] = {
          ...newOverrides[overrideIndex],
          ...updatedData,
        };
      }
      return newOverrides;
    });
  };

  const onOverrideAdd = (newOverride) => {
    setAvailabilityOverrides((currentOverrides) => {
      const newOverrides = [...currentOverrides, newOverride];
      return newOverrides;
    });
  };

  if (loading)
    return (
      <div className="w-full h-48 flex justify-center items-center [&>svg]:size-6">
        <Loader />
      </div>
    );

  if (!data)
    return (
      <div className="w-full h-48 flex justify-center items-center">
        <p className="text-muted-foreground">Court not found</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-2">
          <h2>{data.name}</h2>
          <div className="flex gap-2">
            <Badge variant="secondary">{data.sport}</Badge>
          </div>
        </div>
        <Sheet open={openEditCourt} onOpenChange={setOpenEditCourt}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Pencil /> Edit
            </Button>
          </SheetTrigger>
          <ModifyCourtDetails
            court={data}
            onSuccess={updateCourtData}
            onOpenChange={setOpenEditCourt}
          />
        </Sheet>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem
          value="about"
          className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-lg border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px]"
        >
          <AccordionTrigger className="md:justify-start gap-3 py-2 text-muted-foreground tracking-normal hover:no-underline focus-visible:ring-0 md:[&>svg]:-order-1">
            Turf Details
          </AccordionTrigger>
          <AccordionContent className="md:ps-7 pt-1 pb-3 space-y-3">
            <h4>{data.turf?.name}</h4>
            {getActiveBadge(data.turf?.active)}
            <div className="flex flex-col md:flex-row items-start gap-0 md:gap-4 mb-1">
              <p className="shrink-0 text-muted-foreground w-20">About</p>
              <p className="leading-5">{data.turf?.about}</p>
            </div>
            <div className="flex flex-col md:flex-row items-start gap-0 md:gap-4">
              <p className="shrink-0 text-muted-foreground w-20">Address</p>
              <div className="space-y-1">
                <p className="leading-5">
                  {data.turf?.address.street}, {data.turf?.address.landmark},{" "}
                  {data.turf?.address.city}, {data.turf?.address.state} -{" "}
                  {data.turf?.address.pin}
                </p>
                <a
                  href={data.turf?.address.mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline underline-offset-4"
                >
                  View on map
                </a>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="w-full">
          <div className="flex items-center justify-between bg-muted rounded-lg gap-4 p-2">
            <p className="font-semibold mx-2">Weekly Availability</p>
            {hasChanges && (
              <Button size="sm" onClick={saveChanges} disabled={!hasChanges}>
                Save Changes
              </Button>
            )}
          </div>
          <div className="relative overflow-auto text-sm">
            <table className="w-full min-w-2xl weekly-calendar table-fixed select-none">
              <thead>
                <tr className="h-10">
                  <th
                    className="bg-background"
                    style={{
                      width: "60px",
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                    }}
                  ></th>
                  {DAYS.map((d) => (
                    <th key={d} style={{ minWidth: "100px" }}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time, timeIndex) => (
                  <tr key={timeIndex} className="h-10">
                    <td
                      className="time-label text-left pl-2 sticky left-0 bg-background z-10"
                      style={{ width: "60px" }}
                    >
                      <span className="absolute -top-2 right-2">
                        {formatTime(time)}
                      </span>
                    </td>
                    {DAYS.map((day, dayIndex) => {
                      const cellKey = `${dayIndex}-${timeIndex}`;
                      const isSelected = selectedCells.has(cellKey);
                      const slotInfo = weeklyAvailability[dayIndex]?.slots.find(
                        (slot) => {
                          if (!slot.from || !slot.to) return false;
                          const start = TIME_SLOTS.findIndex(
                            (t) =>
                              t.hour === slot.from.hour &&
                              t.minute === slot.from.minute
                          );
                          const end = TIME_SLOTS.findIndex(
                            (t) =>
                              t.hour === slot.to.hour &&
                              t.minute === slot.to.minute
                          );
                          return start <= timeIndex && timeIndex < end;
                        }
                      );
                      const isInSlot = !!slotInfo;
                      const colorIndex = slotInfo?.colorIndex ?? 0;
                      const slotBgColor = isInSlot
                        ? SLOT_BG_COLORS[colorIndex]
                        : null;
                      const isSlotStart =
                        isInSlot &&
                        slotInfo &&
                        slotInfo.from &&
                        timeIndex ===
                          TIME_SLOTS.findIndex(
                            (t) =>
                              t.hour === slotInfo.from.hour &&
                              t.minute === slotInfo.from.minute
                          );
                      let borderStyles = {};
                      if (isInSlot) {
                        const start = TIME_SLOTS.findIndex(
                          (t) =>
                            t.hour === slotInfo.from.hour &&
                            t.minute === slotInfo.from.minute
                        );
                        const end = TIME_SLOTS.findIndex(
                          (t) =>
                            t.hour === slotInfo.to.hour &&
                            t.minute === slotInfo.to.minute
                        );
                        if (timeIndex === start) {
                          borderStyles = `rounded-t-lg`;
                        } else if (timeIndex === end - 1) {
                          borderStyles = `rounded-b-lg`;
                        }
                      }
                      return (
                        <td
                          key={cellKey}
                          className={cn(
                            "day-cell min-w-24 h-10 text-sm text-white text-center align-middle select-none",
                            isInSlot ? "cursor-pointer" : "cursor-ns-resize",
                            isInSlot ? "" : "border border-border",
                            borderStyles
                          )}
                          style={{
                            backgroundColor: isInSlot
                              ? slotBgColor
                              : isSelected
                              ? "var(--color-muted)"
                              : "var(--color-background)",
                          }}
                          onMouseDown={(e) =>
                            handleMouseDown(e, dayIndex, timeIndex)
                          }
                          onMouseEnter={() =>
                            handleMouseEnter(dayIndex, timeIndex)
                          }
                          onMouseUp={handleMouseUp}
                        >
                          {isSlotStart ? `₹${slotInfo.rate}` : ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="w-fit">
          <div className="flex items-center justify-between bg-muted rounded-lg gap-4 p-2 mb-4">
            <p className="font-semibold mx-2">Override Availability</p>
          </div>
          <Calendar
            mode="single"
            pagedNavigation
            showOutsideDays={false}
            className="rounded-md border-0 p-0 mx-auto"
            classNames={{
              day_button:
                "size-11 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-md cursor-pointer",
            }}
            components={{
              DayButton: (props) => (
                <DayButton
                  {...props}
                  court={data}
                  overrideData={availabilityOverrides}
                  onOverrideEdit={onOverrideEdit}
                  onOverrideAdd={onOverrideAdd}
                  weeklyAvailability={weeklyAvailability}
                />
              ),
            }}
          />
        </div>
      </div>
      <AddSlotDialog
        open={showAddSlotDialog}
        onOpenChange={setShowAddSlotDialog}
        dayIndex={selectedDayIndex}
        timeRange={selectedTimeRange}
        onAdd={addSlotToDay}
      />
      <EditSlotDialog
        open={showEditSlotDialog}
        onOpenChange={setShowEditSlotDialog}
        slot={editingSlot}
        onSave={(newRate) => {
          setWeeklyAvailability((prev) => {
            const newAvail = [...prev];
            newAvail[editingSlot.dayIndex].slots[editingSlot.slotIndex].rate =
              parseInt(newRate);
            return newAvail;
          });
          setHasChanges(true);
          setShowEditSlotDialog(false);
        }}
        onDelete={() => {
          editSlot(editingSlot.dayIndex, editingSlot.slotIndex);
          setShowEditSlotDialog(false);
        }}
      />
    </div>
  );
}

function AddSlotDialog({ open, onOpenChange, dayIndex, timeRange, onAdd }) {
  const [rate, setRate] = useState("");

  const handleAdd = () => {
    onAdd(dayIndex, {
      from: timeRange.from,
      to: timeRange.to,
      rate: parseInt(rate),
    });
    setRate("");
    onOpenChange(false);
  };

  const formatTime = (time) => {
    if (!time) return "";
    let hour = time.hour;
    const minute = time.minute.toString().padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minute} ${ampm}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Add Slot</DialogTitle>
          <DialogDescription>
            From {formatTime(timeRange.from)} to {formatTime(timeRange.to)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Rate per Hour</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="peer ps-7 pe-12"
            />
            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 pt-0.5 peer-disabled:opacity-50">
              ₹
            </span>
            <span className="text-muted-foreground text-sm pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 pt-0.5 peer-disabled:opacity-50">
              /hour
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!rate}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditSlotDialog({ open, onOpenChange, slot, onSave, onDelete }) {
  const [rate, setRate] = useState("");

  useEffect(() => {
    if (slot?.slot?.rate) {
      setRate(slot.slot.rate.toString());
    }
  }, [slot]);

  const handleSave = () => {
    onSave(rate);
  };

  const handleDelete = () => {
    onDelete();
  };

  const formatTime = (time) => {
    if (!time) return "";
    let hour = time.hour;
    const minute = time.minute.toString().padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minute} ${ampm}`;
  };

  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Edit Slot</DialogTitle>
          <DialogDescription>
            From {formatTime(slot.slot.from)} to {formatTime(slot.slot.to)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Rate per Hour</Label>
          <div className="relative">
            <Input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="peer ps-7 pe-12"
            />
            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 pt-0.5 peer-disabled:opacity-50">
              ₹
            </span>
            <span className="text-muted-foreground text-sm pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 pt-0.5 peer-disabled:opacity-50">
              /hour
            </span>
          </div>
        </div>
        <DialogFooter className="justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!rate}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
  );
}

function DayButton({
  overrideData,
  court,
  onOverrideEdit,
  onOverrideAdd,
  weeklyAvailability,
  ...props
}) {
  const { day, modifiers, ...buttonProps } = props;
  const dateString = format(day.date, "yyyy-MM-dd");
  const overrideItem = overrideData?.find((d) => d.date === dateString);

  // Parse slots properly - handle both string and array formats
  let slots = [];
  if (overrideItem?.slots) {
    if (typeof overrideItem.slots === "string") {
      try {
        slots = JSON.parse(overrideItem.slots);
      } catch (e) {
        console.error("Error parsing override slots for DayButton:", e);
        slots = [];
      }
    } else if (Array.isArray(overrideItem.slots)) {
      slots = overrideItem.slots;
    }
  }

  const [openOverride, setOpenOverride] = useState(false);
  const isDateGone = day.date < new Date(new Date().setHours(0, 0, 0, 0));

  const dayName = format(day.date, "EEEE");
  const weeklySlots =
    weeklyAvailability.find((d) => d.day_of_week === dayName)?.slots || [];

  return (
    <Dialog open={openOverride} onOpenChange={setOpenOverride}>
      <button
        {...buttonProps}
        aria-label={`${format(day.date, "MMMM d, yyyy")}${
          slots
            ? ` - ${slots.length} slot${
                slots.length !== 1 ? "s" : ""
              } configured`
            : " - Configure availability"
        }`}
        onClick={() => {
          if (!isDateGone) {
            setOpenOverride(true);
          } else if (isDateGone && Array.isArray(slots) && slots.length > 0) {
            setOpenOverride(true);
          }
        }}
      >
        <span
          className={`flex flex-col items-center ${
            isDateGone
              ? "text-muted-foreground [&>div>*]:bg-muted-foreground"
              : ""
          }`}
        >
          {props.children}
          {slots && (
            <div className="flex justify-center gap-1">
              {Array.isArray(slots) &&
                slots.map((_, index) => (
                  <div key={index} className="size-1 rounded-full bg-primary" />
                ))}
            </div>
          )}
        </span>
      </button>
      <OverrideDialog
        date={day.date}
        court={court}
        data={overrideItem}
        onEdit={onOverrideEdit}
        onAdd={onOverrideAdd}
        onOpenChange={setOpenOverride}
        weeklySlots={weeklySlots}
      />
    </Dialog>
  );
}

function OverrideDialog({
  date,
  court,
  data,
  onEdit,
  onAdd,
  onOpenChange,
  weeklySlots,
}) {
  const [submitting, setSubmitting] = useState(false);
  const isDateGone = date < new Date(new Date().setHours(0, 0, 0, 0));
  const slots = data?.slots;

  // Parse slots properly - handle both string and array formats
  const parsedSlots = useMemo(() => {
    if (!slots) return [];

    if (typeof slots === "string") {
      try {
        return JSON.parse(slots);
      } catch (e) {
        console.error("Error parsing override slots:", e);
        return [];
      }
    }

    if (Array.isArray(slots)) {
      return slots;
    }

    return [];
  }, [slots]);

  const [overrideSlots, setOverrideSlots] = useState(
    data
      ? parsedSlots.map((slot) => ({
          ...slot,
          colorIndex: Math.floor(Math.random() * SLOT_BG_COLORS.length),
        }))
      : weeklySlots.map((slot) => ({
          ...slot,
          colorIndex: Math.floor(Math.random() * SLOT_BG_COLORS.length),
        }))
  );

  // Format time for display in table
  const formatTime = (time) => {
    if (!time) return "";
    let hour = time.hour;
    const minute = time.minute.toString().padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12;

    return `${hour}:${minute} ${ampm}`;
  };

  const addOverrideSlot = () => {
    if (overrideSlots.length >= 4) return;
    const newSlot = {
      from: { hour: 9, minute: 0 },
      to: { hour: 17, minute: 0 },
      rate: 500,
      colorIndex: Math.floor(Math.random() * SLOT_BG_COLORS.length),
    };
    setOverrideSlots([...overrideSlots, newSlot]);
  };

  const removeOverrideSlot = (slotIndex) => {
    const newSlots = overrideSlots.filter((_, index) => index !== slotIndex);
    setOverrideSlots(newSlots);
  };

  const updateOverrideSlotTime = (slotIndex, timeType, newTime) => {
    const newSlots = [...overrideSlots];
    newSlots[slotIndex][timeType] = newTime;
    setOverrideSlots(newSlots);
  };

  const updateOverrideSlotRate = (slotIndex, newRate) => {
    const newSlots = [...overrideSlots];
    newSlots[slotIndex].rate = parseInt(newRate);
    setOverrideSlots(newSlots);
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const id = data.id;
      const overrideData = { slots: overrideSlots };
      const response = await updateAvailabilityOverride(id, overrideData);
      if (response.error) {
        toast.error("Something went wrong.");
      } else {
        toast.success(`Override updated for ${format(date, "dd-MM-yyyy")} !`);
        onEdit(id, overrideData);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating override slot:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = async () => {
    try {
      setSubmitting(true);
      const overrideData = {
        date: format(date, "yyyy-MM-dd"),
        court_id: court.id,
        slots: overrideSlots,
      };
      const response = await addAvailabilityOverride(overrideData);
      if (response.error) {
        toast.error("Something went wrong.");
      } else {
        toast.success(`Override added for ${format(date, "dd-MM-yyyy")} !`);
        onAdd(response);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error adding override slot:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>
          {isDateGone ? "View" : data ? "Edit" : "Add"} Override
        </DialogTitle>
        <DialogDescription>
          {format(date, "dd-MM-yyyy")} | {format(date, "EEEE")}
        </DialogDescription>
      </DialogHeader>

      {isDateGone ? (
        // Show as table for past dates
        <div className="space-y-4">
          {parsedSlots && parsedSlots.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table className="w-full border-collapse">
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="border-r">From</TableHead>
                    <TableHead className="border-r">To</TableHead>
                    <TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedSlots.map((slot, index) => (
                    <TableRow key={index}>
                      <TableCell className="border-r">
                        {formatTime(slot.from)}
                      </TableCell>
                      <TableCell className="border-r">
                        {formatTime(slot.to)}
                      </TableCell>
                      <TableCell>₹{slot.rate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No slots were configured for this date
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {overrideSlots.length === 0 ? (
            <div className="flex items-end gap-2">
              <TimePicker
                type="from"
                value={null}
                onChange={(newTime) => {
                  if (newTime) {
                    setOverrideSlots([
                      {
                        from: newTime,
                        to: { hour: 17, minute: 0 },
                        rate: 500,
                      },
                    ]);
                  }
                }}
              />
              <TimePicker
                type="to"
                value={null}
                onChange={(newTime) => {
                  if (newTime && overrideSlots.length > 0) {
                    updateOverrideSlotTime(0, "to", newTime);
                  }
                }}
              />
              <div className="relative w-full">
                <Input
                  type="number"
                  placeholder="0"
                  value=""
                  onChange={(e) => {
                    if (overrideSlots.length > 0) {
                      updateOverrideSlotRate(0, e.target.value);
                    }
                  }}
                  className="peer ps-7 pe-12"
                />
                <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 pt-0.5 peer-disabled:opacity-50">
                  ₹
                </span>
                <span className="text-muted-foreground text-sm pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 pt-0.5 peer-disabled:opacity-50">
                  /hour
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={addOverrideSlot}
                  >
                    <Plus />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Slot (Max 4)</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            Array.isArray(overrideSlots) &&
            overrideSlots.map((slot, slotIndex) => (
              <div
                key={slotIndex}
                className="flex flex-col md:flex-row md:items-end gap-2"
              >
                <div className="w-full flex items-center gap-2 [&>div]:w-full [&>div]:max-w-full">
                  <TimePicker
                    type="from"
                    value={slot.from}
                    onChange={(newTime) =>
                      updateOverrideSlotTime(slotIndex, "from", newTime)
                    }
                  />
                  <TimePicker
                    type="to"
                    value={slot.to}
                    onChange={(newTime) =>
                      updateOverrideSlotTime(slotIndex, "to", newTime)
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full">
                    <Input
                      type="number"
                      placeholder="0"
                      value={slot.rate || ""}
                      onChange={(e) =>
                        updateOverrideSlotRate(slotIndex, e.target.value)
                      }
                      className="peer ps-7 pe-12"
                    />
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 pt-0.5 peer-disabled:opacity-50">
                      ₹
                    </span>
                    <span className="text-muted-foreground text-sm pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 pt-0.5 peer-disabled:opacity-50">
                      /hour
                    </span>
                  </div>
                  {overrideSlots.length > 1 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => removeOverrideSlot(slotIndex)}
                        >
                          <Trash2 />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove This Slot</TooltipContent>
                    </Tooltip>
                  )}
                  {overrideSlots.length - 1 === slotIndex &&
                    overrideSlots.length < 4 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={addOverrideSlot}
                          >
                            <Plus />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add Slot (Max 4)</TooltipContent>
                      </Tooltip>
                    )}
                </div>
              </div>
            ))
          )}
          {overrideSlots.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No slots configured - this day will be unavailable (holiday)
            </div>
          )}
        </div>
      )}

      {isDateGone ? (
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      ) : (
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </DialogClose>
          {!data ? (
            <Button size="sm" onClick={handleAdd}>
              {submitting ? (
                <>
                  <Loader />{" "}
                  {overrideSlots.length === 0
                    ? "Making Holiday..."
                    : "Adding..."}
                </>
              ) : overrideSlots.length === 0 ? (
                "Make Holiday"
              ) : (
                "Add"
              )}
            </Button>
          ) : (
            <Button size="sm" onClick={handleSave}>
              {submitting ? (
                <>
                  <Loader /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </DialogFooter>
      )}
    </DialogContent>
  );
}

export function ModifyCourtDetails({ turf, court, onSuccess, onOpenChange }) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [rate, setRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const originalRef = useRef({ name: "", sport: "", rate: "" });

  const isEdit = Boolean(court?.name && court?.sport);

  useEffect(() => {
    const n = court?.name ?? "";
    const s = court?.sport ?? "";
    const r = court?.rate_per_hour ?? "";

    setName(n);
    setSport(s);
    setRate(r);

    originalRef.current = { name: n, sport: s, rate: r };
  }, [court, isEdit]);

  const hasChanged =
    name !== originalRef.current.name ||
    sport !== originalRef.current.sport ||
    rate !== originalRef.current.rate;

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const courtData = {
        name,
        sport,
        rate_per_hour: parseFloat(rate),
      };
      const id = court.id;
      const response = await updateCourt(id, courtData);
      if (response.error) {
        throw response.error;
      } else {
        toast.success(`Court details updated successfully !`);
        onSuccess({ ...courtData, id });
        onOpenChange(false);
      }
    } catch (error) {
      console.error(`Error updating court details:`, error);
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = async () => {
    setSubmitting(true);
    toast.loading("Adding court...", { id: "court-status" });
    try {
      const turfId = turf?.id;
      const courtData = {
        name,
        sport,
        rate_per_hour: parseFloat(rate),
        turf_id: turfId,
      };
      const response = await addCourt(courtData);
      toast.success("Court added successfully !", { id: "court-status" });

      try {
        toast.loading("Setting court details...", { id: "court-status" });
        const courtId = response.id;
        const avresponse = await addWeeklyAvailability(courtId);
        if (avresponse && avresponse.length === 7) {
          toast.success("Court is ready to use !", { id: "court-status" });
        }
      } catch (error) {
        console.error(`Error setting court details:`, error);
        toast.error("Something went wrong.", { id: "court-status" });
      }
      onSuccess(turfId, response);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error saving court details:`, error);
      toast.error("Something went wrong.", { id: "court-status" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SheetContent showCloseButton={false}>
      <SheetHeader>
        <SheetTitle>{isEdit ? `Edit Court` : `Add Court`}</SheetTitle>
      </SheetHeader>
      <div className="grid gap-6 px-4 md:px-6">
        <div className="grid gap-2">
          <Label>Court Name</Label>
          <Input
            placeholder="Enter court name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          <Label>Rate Per Hour (₹)</Label>
          <Input
            type="number"
            placeholder="Enter rate per hour"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">Cancel</Button>
        </SheetClose>
        {isEdit ? (
          hasChanged && (
            <Button
              onClick={handleSave}
              disabled={
                submitting ||
                !name.trim() ||
                !sport.trim() ||
                !rate ||
                rate <= 0
              }
            >
              {submitting && <Loader />}
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          )
        ) : (
          <Button
            onClick={handleAdd}
            disabled={
              !name.trim() || !sport.trim() || !rate || rate <= 0 || submitting
            }
          >
            {submitting && <Loader />}
            {submitting ? "Adding..." : "Add"}
          </Button>
        )}
      </SheetFooter>
    </SheetContent>
  );
}
