"use client";

import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface LocationSearchableSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export function LocationSearchableSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  searchPlaceholder,
  disabled,
}: LocationSearchableSelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel className="font-medium text-base text-black">
            {label}
          </FormLabel>
          <SearchableSelect
            value={field.value || ""}
            onValueChange={field.onChange}
            options={options}
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            triggerClassName="h-[60px] border border-[#737373] bg-white text-[#737373] text-xs font-normal"
            contentClassName="bg-white"
            disabled={disabled}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

