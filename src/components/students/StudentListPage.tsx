"use client";
import React from "react";
import { Student } from "@/lib/student-types";
import { DataPageConfig } from "@/lib/data-page-types";
import { DataPage } from "@/components/ui/DataPage";
import { StudentDetailModal } from "./StudentDetailModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GraduationCap, Users, UserCheck, UserX, Building2, ExternalLink } from "lucide-react";

const DEPT_VARIANT: Record<string, "info" | "success" | "purple"> = {
  Science: "info", Commerce: "success", Arts: "purple",
};
const SEM_COLORS: Record<number, string> = {
  1: "bg-amber-100 text-amber-700", 2: "bg-sky-100 text-sky-700",
  3: "bg-rose-100 text-rose-700",   4: "bg-teal-100 text-teal-700",
  5: "bg-orange-100 text-orange-700", 6: "bg-indigo-100 text-indigo-700",
};



const STUDENT_CONFIG: DataPageConfig<Student> = {
  endpoint:          "/api/students",
  entityLabel:       "students",
  title:             "Student List",
  titleIcon:         <GraduationCap className="h-5 w-5 text-white" />,
  searchPlaceholder: "Search by name, roll no, email, subject…",
  getRowKey:         (s) => s.id,
  defaultPageSize:   10,

  columns: [
    {
      key: "rollNo", label: "Roll No", sortable: true,
      render: (s) => (
        <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md whitespace-nowrap">
          {s.rollNo}
        </span>
      ),
    },
    {
      key: "course", label: "Course", sortable: true,
      render: (s) => <span className="font-medium text-sm">{s.course}</span>,
    },
    {
      key: "department", label: "Department", sortable: true,
      render: (s) => <Badge variant={DEPT_VARIANT[s.department] ?? "secondary"}>{s.department}</Badge>,
    },
    {
      key: "semester", label: "Sem", sortable: true, numeric: true,
      render: (s) => (
        <span className={`inline-flex w-7 h-7 rounded-full text-xs font-bold items-center justify-center ${SEM_COLORS[s.semester] || "bg-gray-100 text-gray-600"}`}>
          {s.semester}
        </span>
      ),
    },
    {
      key: "name", label: "Name", sortable: true,
      render: (s) => <span className="font-semibold text-sm whitespace-nowrap">{s.name}</span>,
    },
    {
      key: "email", label: "Email",
      render: (s) => <span className="text-muted-foreground text-xs">{s.email}</span>,
    },
    {
      key: "contact", label: "Contact",
      render: (s) => <span className="font-mono text-xs text-muted-foreground">{s.contact}</span>,
    },
    {
      key: "status", label: "Status", sortable: true,
      render: (s) => (
        <Badge variant={s.status === "Active" ? "success" : "destructive"} className="gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${s.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`} />
          {s.status}
        </Badge>
      ),
    },
  ],

  filters: [
    { key: "department", label: "Department" },
    { key: "semester",   label: "Semester"   },
    { key: "status",     label: "Status",  staticOptions: ["Active", "Inactive"] },
    { key: "course",     label: "Course"     },
  ],

  statCards: [
    { statKey: "total",       label: "Total Students", icon: Users,     iconBg: "bg-indigo-100",  iconColor: "text-indigo-600",  valueColor: "text-indigo-700"  },
    { statKey: "active",      label: "Active",         icon: UserCheck, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", valueColor: "text-emerald-700" },
    { statKey: "inactive",    label: "Inactive",       icon: UserX,     iconBg: "bg-rose-100",    iconColor: "text-rose-600",    valueColor: "text-rose-700"    },
    { statKey: "departments", label: "Departments",    icon: Building2, iconBg: "bg-violet-100",  iconColor: "text-violet-600",  valueColor: "text-violet-700"  },
  ],

  export: {
    endpoint:     "/api/students/export",
    csvFilename:  "students.csv",
    // excelFilename: "students.xlsx",
  },

  actionColumn: {
    label: "View",
    render: (s) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View details</TooltipContent>
      </Tooltip>
    ),
  },

  renderModal: (selected, onClose) => (
    <StudentDetailModal student={selected} onClose={onClose} />
  ),
};


export function StudentListPage() {
  return <DataPage<Student> config={STUDENT_CONFIG} />;
}
