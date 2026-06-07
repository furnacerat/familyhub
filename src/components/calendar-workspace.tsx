"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  Filter,
  MapPin,
  Plus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calendarCategories, calendarPeople } from "@/lib/calendar-data";
import {
  createCalendarEventId,
  filterCalendarEvents,
  formatEventDate,
  formatEventTime,
  getCategoryLabel,
  getEventsForDate,
  getUniquePeople,
  getWeekDays,
  type CalendarEvent,
  type CalendarEventCategory,
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";

type CalendarWorkspaceProps = {
  initialEvents: CalendarEvent[];
};

type EventFormState = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  person: string;
  location: string;
  category: CalendarEventCategory;
  notes: string;
};

const weekStart = "2026-06-06";

const emptyForm: EventFormState = {
  title: "",
  date: weekStart,
  startTime: "09:00",
  endTime: "",
  person: "Family",
  location: "",
  category: "family",
  notes: "",
};

export function CalendarWorkspace({ initialEvents }: CalendarWorkspaceProps) {
  const [events, setEvents] = useState(initialEvents);
  const [selectedDate, setSelectedDate] = useState(weekStart);
  const [personFilter, setPersonFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<
    CalendarEventCategory | "all"
  >("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<EventFormState>(emptyForm);

  const weekDays = useMemo(() => getWeekDays(weekStart), []);
  const people = useMemo(() => getUniquePeople(events), [events]);
  const visibleEvents = filterCalendarEvents(events, {
    person: personFilter,
    category: categoryFilter,
  });
  const selectedEvents = getEventsForDate(visibleEvents, selectedDate);
  const nextEvent = visibleEvents[0];

  function updateForm<K extends keyof EventFormState>(
    key: K,
    value: EventFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      return;
    }

    const newEvent: CalendarEvent = {
      id: createCalendarEventId({
        title,
        date: form.date,
        startTime: form.startTime,
      }),
      title,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime || undefined,
      person: form.person,
      location: form.location.trim() || undefined,
      category: form.category,
      notes: form.notes.trim() || undefined,
      requiresAdultApproval: form.person !== "Family" && form.person !== "Jordan",
    };

    setEvents((current) => filterCalendarEvents([...current, newEvent], {
      person: "all",
      category: "all",
    }));
    setSelectedDate(newEvent.date);
    setForm({ ...emptyForm, date: newEvent.date });
    setDialogOpen(false);
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-lg border border-white/80 bg-white/84 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-3 rounded-md">
            Shared family calendar
          </Badge>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Everyone&apos;s schedule in one place.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Add events, filter by family member, and see what each day needs
            without digging through messages.
          </p>
        </div>
        <AddEventDialog
          form={form}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={submitEvent}
          onUpdate={updateForm}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-4">
          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <CardDescription>Week view</CardDescription>
              <CardTitle>June 6-12</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
              {weekDays.map((day) => {
                const dayEvents = getEventsForDate(visibleEvents, day.date);
                const isSelected = selectedDate === day.date;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className={cn(
                      "min-h-28 rounded-lg border border-border/70 bg-background/70 p-3 text-left transition hover:bg-muted",
                      isSelected && "border-primary bg-secondary shadow-sm",
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      {day.dayLabel}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xl font-semibold">{day.dayNumber}</p>
                      {dayEvents.length ? (
                        <Badge variant="secondary">{dayEvents.length}</Badge>
                      ) : null}
                    </div>
                    <div className="mt-4 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <span
                          key={event.id}
                          className={cn(
                            "block h-2 rounded-full",
                            getCategoryColor(event.category),
                          )}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Filter className="size-5" />
              </div>
              <CardDescription>Filters</CardDescription>
              <CardTitle>Focus the family view</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Select value={personFilter} onValueChange={setPersonFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  {people.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={categoryFilter}
                onValueChange={(value) =>
                  setCategoryFilter(value as CalendarEventCategory | "all")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {calendarCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {getCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-white/80 bg-slate-950 text-white shadow-sm">
            <CardHeader>
              <CardDescription className="text-slate-300">
                Next up
              </CardDescription>
              <CardTitle className="text-2xl">
                {nextEvent ? nextEvent.title : "No events found"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              {nextEvent ? (
                <>
                  <p>
                    {formatEventDate(nextEvent.date)} at{" "}
                    {formatEventTime(nextEvent)}
                  </p>
                  <p>{nextEvent.person}</p>
                  {nextEvent.location ? <p>{nextEvent.location}</p> : null}
                </>
              ) : (
                <p>Clear filters to see more of the family schedule.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/84 shadow-sm backdrop-blur">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardDescription>{formatEventDate(selectedDate)}</CardDescription>
                <CardTitle>Day agenda</CardTitle>
              </div>
              <Badge variant="secondary" className="rounded-md">
                {selectedEvents.length} events
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedEvents.length ? (
                selectedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-background/60 p-6 text-center">
                  <CalendarPlus className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">Nothing scheduled here.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add an event or choose another day.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

function AddEventDialog({
  form,
  open,
  onOpenChange,
  onSubmit,
  onUpdate,
}: {
  form: EventFormState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: <K extends keyof EventFormState>(
    key: K,
    value: EventFormState[K],
  ) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add calendar event</DialogTitle>
            <DialogDescription>
              Events added here stay in this browser session until database
              persistence is added.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={form.title}
                onChange={(event) => onUpdate("title", event.target.value)}
                placeholder="Practice, appointment, school event"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => onUpdate("date", event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-start">Start</Label>
                <Input
                  id="event-start"
                  type="time"
                  value={form.startTime}
                  onChange={(event) => onUpdate("startTime", event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-end">End</Label>
                <Input
                  id="event-end"
                  type="time"
                  value={form.endTime}
                  onChange={(event) => onUpdate("endTime", event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Person</Label>
                <Select
                  value={form.person}
                  onValueChange={(value) => onUpdate("person", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {calendarPeople.map((person) => (
                      <SelectItem key={person} value={person}>
                        {person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    onUpdate("category", value as CalendarEventCategory)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {calendarCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {getCategoryLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={form.location}
                onChange={(event) => onUpdate("location", event.target.value)}
                placeholder="Home, school, field, office"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-notes">Notes</Label>
              <Textarea
                id="event-notes"
                value={form.notes}
                onChange={(event) => onUpdate("notes", event.target.value)}
                placeholder="Anything the family needs to know"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 sm:grid-cols-[6.5rem_1fr_auto]">
      <div>
        <p className="font-semibold">{formatEventTime(event)}</p>
        <Badge variant="secondary" className="mt-2 rounded-md">
          {getCategoryLabel(event.category)}
        </Badge>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span
            className={cn("size-2 rounded-full", getCategoryColor(event.category))}
          />
          <p className="font-medium">{event.title}</p>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {event.person}
          </span>
          {event.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {event.location}
            </span>
          ) : null}
        </div>
        {event.notes ? (
          <p className="mt-2 text-sm text-muted-foreground">{event.notes}</p>
        ) : null}
      </div>
      {event.requiresAdultApproval ? (
        <Badge variant="outline" className="h-fit rounded-md">
          Needs adult
        </Badge>
      ) : (
        <Badge variant="secondary" className="h-fit rounded-md">
          <CheckCircle2 className="size-3" />
          Shared
        </Badge>
      )}
    </div>
  );
}

function getCategoryColor(category: CalendarEventCategory): string {
  const colors: Record<CalendarEventCategory, string> = {
    school: "bg-sky-500",
    sports: "bg-emerald-500",
    appointment: "bg-violet-500",
    meal: "bg-amber-500",
    errand: "bg-rose-500",
    family: "bg-teal-500",
    work: "bg-slate-500",
    other: "bg-zinc-500",
  };

  return colors[category];
}
