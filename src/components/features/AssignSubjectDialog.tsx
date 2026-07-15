import { useState, useEffect } from 'react';
import type { RemainingSubject } from '@/types';
import { useTimetableStore } from '@/stores/timetableStore';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface AssignSubjectDialogProps {
  open: boolean;
  branchId: string;
  remainingSubjects: RemainingSubject[];
  onClose: () => void;
  onAssign: (subject: RemainingSubject, labRoomName?: string, labRoomShortName?: string) => void;
}

export default function AssignSubjectDialog({ open, branchId, remainingSubjects, onClose, onAssign }: AssignSubjectDialogProps) {
  const labRooms = useTimetableStore((s) => s.labRooms);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedLabRoomId, setSelectedLabRoomId] = useState<string>('');

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setSelectedSubjectId('');
      setSelectedLabRoomId('');
    }
  }, [open]);

  if (!open) return null;

  const selectedSubject = remainingSubjects.find((s) => s.id === selectedSubjectId);

  const handleAssign = () => {
    if (!selectedSubject) return;
    
    let labName, labShortName;
    if (selectedSubject.isLab && selectedLabRoomId) {
      const lab = labRooms.find((l) => l.id === selectedLabRoomId);
      if (lab) {
        labName = lab.name;
        labShortName = lab.shortName;
      }
    }

    onAssign(selectedSubject, labName, labShortName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-md border border-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold font-display">Assign Subject</h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary/20 rounded-md transition-colors text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Select Subject</label>
            <select 
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              <option value="" disabled>-- Select a subject to assign --</option>
              {remainingSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subjectName} ({sub.duration === 2 ? 'Practical' : 'Theory'}) - {sub.remaining} left
                </option>
              ))}
            </select>
          </div>

          {selectedSubject && (
            <div className="space-y-3 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Teacher</p>
                  <p className="text-sm font-medium">{selectedSubject.teacherName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">{selectedSubject.duration} Period{selectedSubject.duration > 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedSubject.isLab} disabled className="rounded border-input text-primary focus:ring-primary" />
                  <span className="text-sm">Practical/Lab Subject</span>
                </label>
              </div>

              {selectedSubject.isLab && (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <label className="text-sm font-medium text-foreground">Assign Lab Room</label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={selectedLabRoomId}
                    onChange={(e) => setSelectedLabRoomId(e.target.value)}
                  >
                    <option value="">-- No specific lab room --</option>
                    {labRooms.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-2 bg-secondary/5 rounded-b-xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md hover:bg-secondary/20 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleAssign}
            disabled={!selectedSubjectId}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Assign Class
          </button>
        </div>
      </div>
    </div>
  );
}