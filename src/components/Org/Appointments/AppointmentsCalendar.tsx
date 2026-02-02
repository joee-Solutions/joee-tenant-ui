"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, List, Plus } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addDays,
  addMonths,
  subMonths,
} from "date-fns";

export type ViewMode = "month" | "week" | "day";

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: "Approved" | "Upcoming" | "Pending" | "Canceled";
  description?: string;
  age?: number;
  appointmentDate: Date;
}

interface AppointmentCalendarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  appointments: Appointment[];
  onViewAppointment: (appointment: Appointment) => void;
  onAddAppointment: () => void;
  onShowList?: () => void;
}

const getStatusColor = (status: Appointment["status"]) => {
  switch (status) {
    case "Approved":
      return "bg-green-200 text-green-800";
    case "Upcoming":
      return "bg-blue-200 text-blue-800";
    case "Pending":
      return "bg-yellow-200 text-yellow-800";
    case "Canceled":
      return "bg-red-200 text-red-800";
    default:
      return "bg-gray-200 text-gray-800";
  }
};

export default function AppointmentCalendar({
  viewMode,
  setViewMode,
  selectedDate,
  setSelectedDate,
  appointments,
  onViewAppointment,
  onAddAppointment,
  onShowList,
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  // Sync currentDate with selectedDate prop changes
  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  const handlePrevious = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getAppointmentsForDate = (date: Date) =>
    appointments.filter((apt) => isSameDay(apt.appointmentDate, date));

  const hours = Array.from({ length: 13 }, (_, i) => 5 + i); // 5am - 5pm

  const formatHourLabel = (hour: number) => {
    const suffix = hour >= 12 ? "pm" : "am";
    const normalized = ((hour + 11) % 12) + 1;
    return `${normalized}:00 ${suffix}`;
  };

  // Very simple hour matching based on the start of the time string (e.g. "09:00")
  const getAppointmentsForDateAndHour = (date: Date, hour: number) => {
    const hourPrefix = `${hour.toString().padStart(2, "0")}:`;
    return getAppointmentsForDate(date).filter((apt) =>
      apt.time?.startsWith(hourPrefix)
    );
  };

  /* ---------------- Month View ---------------- */

  const renderMonthView = () => {
    const days = eachDayOfInterval({
      start: startOfWeek(startOfMonth(currentDate)),
      end: endOfWeek(endOfMonth(currentDate)),
    });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d) => (
            <div key={d} className="text-center font-semibold text-gray-700 py-2">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const daily = getAppointmentsForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`min-h-[100px] border rounded-lg p-2 cursor-pointer ${
                  !isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"
                } ${isSelected ? "ring-2 ring-blue-500" : ""} ${
                  isToday ? "bg-blue-50" : ""
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, "d")}
                </div>
                {daily.slice(0, 2).map((apt) => (
                  <div
                    key={apt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewAppointment(apt);
                    }}
                    className={`text-xs p-1 rounded truncate ${getStatusColor(
                      apt.status
                    )}`}
                  >
                    {apt.time} {apt.patientName}
                  </div>
                ))}
                {daily.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{daily.length - 2} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ---------------- Week & Day Views (unchanged logic) ---------------- */
  /* ---------------- Week & Day Views ---------------- */

  const renderWeekView = () => {
    const start = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    return (
      <div className="bg-white rounded-lg shadow-md p-4 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header row with days */}
          <div className="grid grid-cols-[100px,repeat(7,1fr)] mb-2">
            <div></div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className="text-center font-semibold text-gray-700 py-2 border-b"
              >
                <div>{format(day, "dd EEE")}</div>
              </div>
            ))}
          </div>

          {/* Time rows */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[100px,repeat(7,1fr)] border-t last:border-b"
            >
              <div className="text-xs text-gray-500 py-4 pr-2 text-right border-r">
                {formatHourLabel(hour)}
              </div>
              {days.map((day) => {
                const slotAppointments = getAppointmentsForDateAndHour(
                  day,
                  hour
                );
                return (
                  <div
                    key={day.toISOString()}
                    className="relative h-16 border-r last:border-r-0 bg-white"
                  >
                    {slotAppointments.map((apt) => (
                      <button
                        key={apt.id}
                        type="button"
                        onClick={() => onViewAppointment(apt)}
                        className={`absolute inset-1 rounded-md text-[10px] leading-tight px-2 py-1 text-left ${getStatusColor(
                          apt.status
                        )}`}
                      >
                        <div className="font-semibold">
                          {apt.time || "Appointment"}
                        </div>
                        <div className="truncate">{apt.patientName}</div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const day = currentDate;

    return (
      <div className="bg-white rounded-lg shadow-md p-4 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-[100px,1fr] mb-2">
            <div></div>
            <div className="text-center font-semibold text-gray-700 py-2 border-b">
              {format(day, "EEEE, MMM d")}
            </div>
          </div>

          {/* Time rows */}
          {hours.map((hour) => {
            const slotAppointments = getAppointmentsForDateAndHour(day, hour);
            return (
              <div
                key={hour}
                className="grid grid-cols-[100px,1fr] border-t last:border-b"
              >
                <div className="text-xs text-gray-500 py-4 pr-2 text-right border-r">
                  {formatHourLabel(hour)}
                </div>
                <div className="relative h-16 bg-white">
                  {slotAppointments.map((apt) => (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => onViewAppointment(apt)}
                      className={`absolute inset-1 rounded-md text-[10px] leading-tight px-2 py-1 text-left ${getStatusColor(
                        apt.status
                      )}`}
                    >
                      <div className="font-semibold">
                        {apt.time || "Appointment"}
                      </div>
                      <div className="truncate">{apt.patientName}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 relative">
      {/* Header + controls */}
      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
        <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Button size="sm" variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
            <span className="ml-4 font-semibold text-gray-900">
            {format(currentDate, "MMMM yyyy")}
          </span>
        </div>

        <div className="flex gap-2">
          {(["month", "week", "day"] as ViewMode[]).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={viewMode === m ? "default" : "outline"}
              onClick={() => setViewMode(m)}
                className={
                  viewMode === m
                    ? "bg-[#003465] text-white border-[#003465]"
                    : ""
                }
              >
                {m === "month"
                  ? "Month"
                  : m === "week"
                  ? "Week"
                  : "Day"}
            </Button>
          ))}
        </div>
        </div>
      </div>

      {/* Views */}
      {viewMode === "month" && renderMonthView()}
      {viewMode === "week" && renderWeekView()}
      {viewMode === "day" && renderDayView()}

    </div>
  );
}
