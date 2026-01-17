"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);

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

  const renderWeekView = () => null;
  const renderDayView = () => null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
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
          <span className="ml-4 font-semibold">
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
            >
              {m}
            </Button>
          ))}
        </div>
      </div>

      {viewMode === "month" && renderMonthView()}
      {viewMode === "week" && renderWeekView()}
      {viewMode === "day" && renderDayView()}
    </div>
  );
}
