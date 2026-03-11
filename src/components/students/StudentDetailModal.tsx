"use client";
import { Student } from "@/lib/types";
import { Mail, Phone, BookOpen, Building2, GraduationCap, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
}

const DEPT_VARIANT: Record<string, "info" | "success" | "purple"> = {
  Science:  "info",
  Commerce: "success",
  Arts:     "purple",
};

const SEM_COLORS: Record<number, string> = {
  1: "bg-amber-100 text-amber-700", 2: "bg-sky-100 text-sky-700",
  3: "bg-rose-100 text-rose-700",   4: "bg-teal-100 text-teal-700",
  5: "bg-orange-100 text-orange-700", 6: "bg-indigo-100 text-indigo-700",
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-foreground break-all">{value}</div>
      </div>
    </div>
  );
}

export function StudentDetailModal({ student, onClose }: StudentDetailModalProps) {
  if (!student) return null;

  const subjectList = student.subjects.split(",").map((s) => s.trim());

  return (
    <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 rounded-t-2xl p-6 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
                {student.name.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-white text-lg">{student.name}</DialogTitle>
                <DialogDescription className="text-indigo-200 text-sm mt-0">
                  {student.rollNo}
                </DialogDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={student.status === "Active" ? "success" : "destructive"} className="gap-1 bg-white/20 text-white border-white/30 hover:bg-white/25">
                <span className={`w-1.5 h-1.5 rounded-full ${student.status === "Active" ? "bg-emerald-300" : "bg-red-300"}`} />
                {student.status}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/25">
                Semester {student.semester}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/25">
                {student.course}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Info rows */}
          <div className="space-y-1">
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Department" value={
              <Badge variant={DEPT_VARIANT[student.department] ?? "secondary"}>{student.department}</Badge>
            } />
            <Separator />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={student.email} />
            <Separator />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Contact" value={student.contact} />
            <Separator />
            <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Course" value={student.course} />
            <Separator />
            <InfoRow icon={<Hash className="h-4 w-4" />} label="Semester" value={
              <span className={`inline-flex w-7 h-7 rounded-full text-xs font-bold items-center justify-center ${SEM_COLORS[student.semester] || "bg-gray-100 text-gray-600"}`}>
                {student.semester}
              </span>
            } />
          </div>

          {/* Subjects */}
          <Card className="border-dashed">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold">Subjects <span className="text-muted-foreground font-normal">({subjectList.length})</span></span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {subjectList.map((subj, i) => {
                  const code = subj.split(" - ")[1];
                  return (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {code || subj}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
