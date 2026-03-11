"use client";
import { FilterState } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterBarProps {
  filters: FilterState;
  onChange: (key: keyof FilterState, value: string) => void;
  departments: string[];
  semesters: string[];
  courses: string[];
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
      <SelectTrigger className="w-[150px] bg-white border-indigo-200 focus:ring-indigo-400 text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}s</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FilterBar({ filters, onChange, departments, semesters, courses }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <FilterSelect label="Department" value={filters.department} onChange={(v) => onChange("department", v)} options={departments} placeholder="Department" />
      <FilterSelect label="Semester"   value={filters.semester}   onChange={(v) => onChange("semester", v)}   options={semesters}   placeholder="Semester" />
      <FilterSelect label="Status"     value={filters.status}     onChange={(v) => onChange("status", v)}     options={["Active", "Inactive"]} placeholder="Status" />
      <FilterSelect label="Course"     value={filters.course}     onChange={(v) => onChange("course", v)}     options={courses}     placeholder="Course" />
    </div>
  );
}
