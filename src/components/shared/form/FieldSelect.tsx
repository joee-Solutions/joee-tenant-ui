import { Control, FieldValues, Path } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FieldSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  placeholder?: string;
  labelText?: string;
  options: string[];
  fieldDescription?: string;
  bgSelectClass?: string;
  defaultOption?: string;
  disabled?: boolean;
  /** Remount Select when this changes (fixes Radix not showing value after programmatic reset, e.g. in modals). */
  selectKey?: string | number;
}

/** Map form value to an entry in `options` (exact, then case/underscore-normalized). */
export function matchSelectValueToOption(
  value: unknown,
  options: string[]
): string | undefined {
  if (value == null) return undefined;
  const v = String(value).trim();
  if (!v) return undefined;
  if (options.includes(v)) return v;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "_");
  const nv = norm(v);
  const found = options.find((o) => norm(o) === nv);
  return found;
}

function FieldSelect<T extends FieldValues>({
  control,
  name,
  placeholder,
  labelText,
  options,
  fieldDescription,
  bgSelectClass,
  defaultOption,
  disabled = false,
  selectKey,
}: FieldSelectProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full">
          {labelText && (
            <FormLabel className="font-medium text-base text-black">
              {labelText}
            </FormLabel>
          )}
          <Select
            key={selectKey}
            onValueChange={field.onChange}
            disabled={disabled}
            value={matchSelectValueToOption(field.value, options)}
          >
            <FormControl>
              <SelectTrigger
                className={`h-[60px] border border-[#737373] focus:ring-transparent text-[#737373] text-xs font-normal ${
                  bgSelectClass ? bgSelectClass : "bg-white"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={disabled}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-white" defaultValue={defaultOption}>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldDescription && (
            <FormDescription>{fieldDescription}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
export default FieldSelect;
