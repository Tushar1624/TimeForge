import { useEffect, useState } from "react";
import type { TimetableCell } from "@/types";

interface EditClassDialogProps {
  open: boolean;
  cell: TimetableCell | null;
  onClose: () => void;
  onSave: (updates: Partial<TimetableCell>) => void;
}

export default function EditClassDialog({
  open,
  cell,
  onClose,
  onSave,
}: EditClassDialogProps) {
  const [subjectName, setSubjectName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [shortName, setShortName] = useState("");
  const [labRoomName, setLabRoomName] = useState("");
  const [duration, setDuration] = useState<1 | 2>(1);

  useEffect(() => {
    if (!cell) return;

    setSubjectName(cell.subjectName);
    setTeacherName(cell.teacherName);
    setShortName(cell.subjectShortName);
    setLabRoomName(cell.labRoomName ?? "");
    setDuration(cell.duration ?? (cell.isLab ? 2 : 1));
  }, [cell]);

  if (!open || !cell) return null;

  const handleSave = () => {
    onSave({
      subjectName,
      teacherName,
      subjectShortName: shortName,
      labRoomName,
      duration,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
      
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/60 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-100 tracking-tight">
            Edit Class Details
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-5">
          
          {/* Subject Name */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Subject Name
            </label>
            <input
              className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Computer Graphics"
            />
          </div>

          {/* Short Name & Duration Side-by-Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Short Name
              </label>
              <input
                className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="e.g. CGM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Duration
              </label>
              <select
                className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all appearance-none cursor-pointer"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) as 1 | 2)}
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, 
                  backgroundPosition: `right 1rem center`, 
                  backgroundRepeat: `no-repeat`, 
                  backgroundSize: `1.2em 1.2em` 
                }}
              >
                <option value={1}>1 Period</option>
                <option value={2}>2 Periods</option>
              </select>
            </div>
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Teacher
            </label>
            <input
              className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g. SS"
            />
          </div>

          {/* Conditional Lab Room */}
          {cell.isLab && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Lab Room
              </label>
              <input
                className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
                value={labRoomName}
                onChange={(e) => setLabRoomName(e.target.value)}
                placeholder="e.g. Lab 304"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-800/60 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}