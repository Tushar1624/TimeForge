import type { TimetableCell, GeneralConfig, Branch } from '@/types';
import { parseTime, formatTime } from '@/lib/utils';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function calculateTimeSlots(config: GeneralConfig) {
  const slots: { start: string; end: string }[] = [];
  let currentMinutes = parseTime(config.startTime);
  for (let p = 0; p < config.periodsPerDay; p++) {
    if (p === config.recessAfterPeriod) currentMinutes += config.recessDuration;
    const start = formatTime(currentMinutes);
    currentMinutes += config.periodDuration;
    slots.push({ start, end: formatTime(currentMinutes) });
  }
  return slots;
}

export function exportPDF() { window.print(); }

export function exportExcel(
  timetables: Record<string, (TimetableCell | null)[][]>,
  branches: Branch[],
  config: GeneralConfig
) {
  const workbook = XLSX.utils.book_new();
  const timeSlots = calculateTimeSlots(config);

  for (const branch of branches) {
    const grid = timetables[branch.id];
    if (!grid) continue;

    const data: any[][] = [];

    // Title
    data.push([`${branch.name} (${branch.shortName}) Timetable`]);
    data.push([]);

    // Header
    const header: any[] = ["Day"];

    for (let p = 0; p < config.periodsPerDay; p++) {
      if (p === config.recessAfterPeriod) {
        header.push("Recess");
      }

      header.push(
        `P${p + 1}\n${timeSlots[p].start}-${timeSlots[p].end}`
      );
    }

    data.push(header);

    // Rows
    for (let d = 0; d < config.workingDays.length; d++) {
      const row: any[] = [];

      row.push(config.workingDays[d]);

      for (let p = 0; p < config.periodsPerDay; p++) {
        if (p === config.recessAfterPeriod) {
          row.push("Recess");
        }

        const cell = grid[d]?.[p];

        if (!cell) {
          row.push("");
        } else if (cell.isLabContinuation) {
          continue;
        } else {
          let value = cell.subjectShortName;

// Show teacher beside subject in ()
if (cell.teacherName) {
  value += ` (${cell.teacherName})`;
}

// Show lab room on next line
if (cell.labRoomShortName) {
  value += `\n${cell.labRoomShortName}`;
}

row.push(value);
        }
      }

      data.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);

    ws["!cols"] = [
      { wch: 15 },
      ...Array(header.length - 1).fill({ wch: 25 })
    ];

    // Add this branch's worksheet
    XLSX.utils.book_append_sheet(
      workbook,
      ws,
      branch.shortName.substring(0, 31) // Excel sheet name limit
    );
  }

const master: any[][] = [];

// Title
master.push(["All Departments - Master Timetable"]);
master.push([]);

// Header
const masterHeader: any[] = ["Day", "Branch"];

for (let p = 0; p < config.periodsPerDay; p++) {
  if (p === config.recessAfterPeriod) {
    masterHeader.push("Recess");
  }

  masterHeader.push(
    `P${p + 1}\n${timeSlots[p].start}-${timeSlots[p].end}`
  );
}

master.push(masterHeader);

// Data
for (let d = 0; d < config.workingDays.length; d++) {

  for (const branch of branches) {

    const grid = timetables[branch.id];

    if (!grid) continue;

    const row: any[] = [];

    row.push(config.workingDays[d]);
    row.push(branch.shortName);

    for (let p = 0; p < config.periodsPerDay; p++) {

      if (p === config.recessAfterPeriod) {
        row.push("Recess");
      }

      const cell = grid[d]?.[p];

      if (!cell) {
        row.push("");
      }
      else if (cell.isLabContinuation) {
        continue;
      }
      else {

        let value = cell.subjectShortName;

// Show teacher beside subject in ()
if (cell.teacherName) {
  value += ` (${cell.teacherName})`;
}

// Show lab room on next line
if (cell.labRoomShortName) {
  value += `\n${cell.labRoomShortName}`;
}

row.push(value);
      }
    }

    master.push(row);
  }
}

const masterSheet = XLSX.utils.aoa_to_sheet(master);

masterSheet["!cols"] = [
  { wch: 15 },
  { wch: 12 },
  ...Array(masterHeader.length - 2).fill({ wch: 25 })
];

XLSX.utils.book_append_sheet(
  workbook,
  masterSheet,
  "All Departments"
);

  // Export workbook
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  saveAs(
    new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `Timetable_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

export function extractTeachers(
  timetables: Record<string, (TimetableCell | null)[][]>,
  branches: Branch[]
): string[] {
  const set = new Set<string>();
  for (const branch of branches) {
    const grid = timetables[branch.id];
    if (!grid) continue;
    for (const daySlots of grid) {
      for (const cell of daySlots) {
        if (cell && !cell.isLabContinuation) set.add(cell.teacherName);
      }
    }
  }
  return Array.from(set).sort();
}

export function extractSubjects(
  timetables: Record<string, (TimetableCell | null)[][]>,
  branches: Branch[]
): string[] {
  const set = new Set<string>();
  for (const branch of branches) {
    const grid = timetables[branch.id];
    if (!grid) continue;
    for (const daySlots of grid) {
      for (const cell of daySlots) {
        if (cell && !cell.isLabContinuation) set.add(cell.subjectName);
      }
    }
  }
  return Array.from(set).sort();
}
