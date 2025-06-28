"use client"

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import {
  DayPicker,
  labelNext,
  labelPrevious,
  useDayPicker,
  type DayPickerProps,
} from "react-day-picker";

export type CalendarProps = DayPickerProps & {
  /**
   * In the year view, the number of years to display at once.
   * @default 12
   */
  yearRange?: number;

  /**
   * Wether to show the year switcher in the caption.
   * @default true
   */
  showYearSwitcher?: boolean;

  monthsClassName?: string;
  monthCaptionClassName?: string;
  weekdaysClassName?: string;
  weekdayClassName?: string;
  monthClassName?: string;
  captionClassName?: string;
  captionLabelClassName?: string;
  buttonNextClassName?: string;
  buttonPreviousClassName?: string;
  navClassName?: string;
  monthGridClassName?: string;
  weekClassName?: string;
  dayClassName?: string;
  dayButtonClassName?: string;
  rangeStartClassName?: string;
  rangeEndClassName?: string;
  selectedClassName?: string;
  todayClassName?: string;
  outsideClassName?: string;
  disabledClassName?: string;
  rangeMiddleClassName?: string;
  hiddenClassName?: string;
};

type NavView = "days" | "years";

/**
 * A custom calendar component built on top of react-day-picker.
 * @param props The props for the calendar.
 * @default yearRange 12
 * @returns
 */
function Calendar({
  className,
  showOutsideDays = true,
  showYearSwitcher = true,
  yearRange = 12,
  numberOfMonths,
  components,
  ...props
}: CalendarProps) {
  const [navView, setNavView] = React.useState<NavView>("days");
  const [displayYears, setDisplayYears] = React.useState<{
    from: number;
    to: number;
  }>(
    React.useMemo(() => {
      const currentYear = new Date().getFullYear();
      return {
        from: currentYear - Math.floor(yearRange / 2 - 1),
        to: currentYear + Math.ceil(yearRange / 2),
      };
    }, [yearRange])
  );

  const { onNextClick, onPrevClick, startMonth, endMonth } = props;

  const columnsDisplayed = navView === "years" ? 1 : numberOfMonths;

  const _monthsClassName = cn("relative flex", props.monthsClassName);
  const _monthCaptionClassName = cn(
    "relative mx-10 flex h-7 items-center justify-center",
    props.monthCaptionClassName
  );
  const _weekdaysClassName = cn("flex flex-row", props.weekdaysClassName);
  const _weekdayClassName = cn(
    "w-8 text-sm font-normal text-muted-foreground",
    props.weekdayClassName
  );
  const _monthClassName = cn("w-full", props.monthClassName);
  const _captionClassName = cn(
    "relative flex items-center justify-center pt-1",
    props.captionClassName
  );
  const _captionLabelClassName = cn(
    "truncate text-sm font-medium",
    props.captionLabelClassName
  );
  const buttonNavClassName = buttonVariants({
    variant: "outline",
    className:
      "absolute h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
  });
  const _buttonNextClassName = cn(
    buttonNavClassName,
    "right-0",
    props.buttonNextClassName
  );
  const _buttonPreviousClassName = cn(
    buttonNavClassName,
    "left-0",
    props.buttonPreviousClassName
  );
  const _navClassName = cn("flex items-start", props.navClassName);
  const _monthGridClassName = cn("mx-auto mt-4", props.monthGridClassName);
  const _weekClassName = cn("mt-2 flex w-max items-start", props.weekClassName);
  const _dayClassName = cn(
    "flex size-8 flex-1 items-center justify-center p-0 text-sm",
    props.dayClassName
  );
  const _dayButtonClassName = cn(
    buttonVariants({ variant: "ghost" }),
    "size-8 rounded-md p-0 font-normal transition-none aria-selected:opacity-100",
    props.dayButtonClassName
  );
  const buttonRangeClassName =
    "bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground";
  const _rangeStartClassName = cn(
    buttonRangeClassName,
    "day-range-start rounded-s-md",
    props.rangeStartClassName
  );
  const _rangeEndClassName = cn(
    buttonRangeClassName,
    "day-range-end rounded-e-md",
    props.rangeEndClassName
  );
  const _rangeMiddleClassName = cn(
    "bg-accent !text-foreground [&>button]:bg-transparent [&>button]:!text-foreground [&>button]:hover:bg-transparent [&>button]:hover:!text-foreground",
    props.rangeMiddleClassName
  );
  const _selectedClassName = cn(
    "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
    props.selectedClassName
  );
  const _todayClassName = cn(
    "[&>button]:bg-accent [&>button]:text-accent-foreground",
    props.todayClassName
  );
  const _outsideClassName = cn(
    "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
    props.outsideClassName
  );
  const _disabledClassName = cn(
    "text-muted-foreground opacity-50",
    props.disabledClassName
  );
  const _hiddenClassName = cn("invisible flex-1", props.hiddenClassName);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      style={{
        width: 248.8 * (columnsDisplayed ?? 1) + "px",
      }}
      classNames={{
        months: _monthsClassName,
        month_caption: _monthCaptionClassName,
        weekdays: _weekdaysClassName,
        weekday: _weekdayClassName,
        month: _monthClassName,
        caption: _captionClassName,
        caption_label: _captionLabelClassName,
        button_next: _buttonNextClassName,
        button_previous: _buttonPreviousClassName,
        nav: _navClassName,
        month_grid: _monthGridClassName,
        week: _weekClassName,
        day: _dayClassName,
        day_button: _dayButtonClassName,
        range_start: _rangeStartClassName,
        range_middle: _rangeMiddleClassName,
        range_end: _rangeEndClassName,
        selected: _selectedClassName,
        today: _todayClassName,
        outside: _outsideClassName,
        disabled: _disabledClassName,
        hidden: _hiddenClassName,
      }}
      components={{
        Chevron: ({ orientation }) => {
          return orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          );
        },
        CaptionLabel: (props) => (
          <CaptionLabel
            {...props}
            showYearSwitcher={showYearSwitcher}
            navView={navView}
            setNavView={setNavView}
            displayYears={displayYears}
          />
        ),
        Nav: (props) => (
          <Nav
            {...props}
            navView={navView}
            startMonth={startMonth}
            endMonth={endMonth}
            displayYears={displayYears}
            setDisplayYears={setDisplayYears}
            onPrevClick={onPrevClick}
            onNextClick={onNextClick}
          />
        ),
        MonthGrid: (props) => (
          <MonthGrid
            {...props}
            displayYears={displayYears}
            startMonth={startMonth}
            endMonth={endMonth}
            navView={navView}
            setNavView={setNavView}
          />
        ),
        ...components,
      }}
      {...props}
    />
  );
}

function Nav({
  className,
  navView,
  startMonth,
  endMonth,
  displayYears,
  setDisplayYears,
  onPrevClick,
  onNextClick,
}: {
  className?: string;
  navView: NavView;
  startMonth?: Date;
  endMonth?: Date;
  displayYears: { from: number; to: number };
  setDisplayYears: React.Dispatch<
    React.SetStateAction<{ from: number; to: number }>
  >;
  onPrevClick?: (date: Date) => void;
  onNextClick?: (date: Date) => void;
}) {
  const { fromDate, toDate } = useDayPicker();

  const handlePrevClick = () => {
    if (navView === "years") {
      setDisplayYears((prev) => ({
        from: prev.from - 12,
        to: prev.to - 12,
      }));
    } else {
      if (startMonth && onPrevClick) {
        onPrevClick(startMonth);
      }
    }
  };

  const handleNextClick = () => {
    if (navView === "years") {
      setDisplayYears((prev) => ({
        from: prev.from + 12,
        to: prev.to + 12,
      }));
    } else {
      if (endMonth && onNextClick) {
        onNextClick(endMonth);
      }
    }
  };

  const isPrevDisabled = () => {
    if (navView === "years") {
      return false;
    }
    if (!startMonth || !fromDate) {
      return false;
    }
    return differenceInCalendarDays(startMonth, fromDate) <= 0;
  };

  const isNextDisabled = () => {
    if (navView === "years") {
      return false;
    }
    if (!endMonth || !toDate) {
      return false;
    }
    return differenceInCalendarDays(endMonth, toDate) >= 0;
  };

  return (
    <div className={cn("flex items-start", className)}>
      <Button
        variant="outline"
        className="absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        onClick={handlePrevClick}
        disabled={isPrevDisabled()}
        aria-label={
          navView === "years"
            ? labelPrevious("years")
            : labelPrevious("month")
        }
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        className="absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        onClick={handleNextClick}
        disabled={isNextDisabled()}
        aria-label={
          navView === "years" ? labelNext("years") : labelNext("month")
        }
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CaptionLabel({
  children,
  showYearSwitcher,
  navView,
  setNavView,
  displayYears,
  ...props
}: {
  showYearSwitcher?: boolean;
  navView: NavView;
  setNavView: React.Dispatch<React.SetStateAction<NavView>>;
  displayYears: { from: number; to: number };
} & React.HTMLAttributes<HTMLSpanElement>) {
  if (!showYearSwitcher) {
    return <span {...props}>{children}</span>;
  }

  return (
    <button
      {...props}
      className={cn(
        "truncate text-sm font-medium hover:underline focus:underline",
        props.className
      )}
      onClick={() => setNavView(navView === "days" ? "years" : "days")}
    >
      {children}
    </button>
  );
}

function MonthGrid({
  className,
  children,
  displayYears,
  startMonth,
  endMonth,
  navView,
  setNavView,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  displayYears: { from: number; to: number };
  startMonth?: Date;
  endMonth?: Date;
  navView: NavView;
  setNavView: React.Dispatch<React.SetStateAction<NavView>>;
} & React.TableHTMLAttributes<HTMLTableElement>) {
  if (navView === "years") {
    return (
      <YearGrid
        displayYears={displayYears}
        startMonth={startMonth}
        endMonth={endMonth}
        setNavView={setNavView}
        navView={navView}
      />
    );
  }

  return (
    <table className={cn("mx-auto mt-4", className)} {...props}>
      {children}
    </table>
  );
}

function YearGrid({
  className,
  displayYears,
  startMonth,
  endMonth,
  setNavView,
  navView,
  ...props
}: {
  className?: string;
  displayYears: { from: number; to: number };
  startMonth?: Date;
  endMonth?: Date;
  setNavView: React.Dispatch<React.SetStateAction<NavView>>;
  navView: NavView;
} & React.HTMLAttributes<HTMLDivElement>) {
  const years = Array.from(
    { length: displayYears.to - displayYears.from },
    (_, i) => displayYears.from + i
  );

  const handleYearClick = (year: number) => {
    const newDate = new Date(year, 0, 1);
    if (startMonth) {
      newDate.setMonth(startMonth.getMonth());
      newDate.setDate(startMonth.getDate());
    }
    setNavView("days");
  };

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-2 p-3",
        className
      )}
      {...props}
    >
      {years.map((year) => (
        <Button
          key={year}
          variant="ghost"
          className="h-8 text-sm"
          onClick={() => handleYearClick(year)}
        >
          {year}
        </Button>
      ))}
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar }; 