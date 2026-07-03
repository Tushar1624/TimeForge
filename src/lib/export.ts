import type { TimetableCell, GeneralConfig, Branch } from '@/types';
import { parseTime, formatTime } from '@/lib/utils';
import * as XLSX from "xlsx-js-style";
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

  // Helper to construct correctly styled cells for xlsx-js-style
  const createStyledCell = (value: string | number, isBold: boolean = false) => ({
    v: String(value),
    t: "s",
    s: {
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      font: { bold: isBold },
    }
  });

  // 1. Process Individual Branch Sheets
  for (const branch of branches) {
    const grid = timetables[branch.id];
    if (!grid) continue;

    const data: any[][] = [];
    const merges: XLSX.Range[] = [];

    // Header Construction
    const headerRow: any[] = [createStyledCell("Day", true)];
    for (let p = 0; p < config.periodsPerDay; p++) {
      if (p === config.recessAfterPeriod) {
        headerRow.push(createStyledCell("Recess", true));
      }
      headerRow.push(
        createStyledCell(`P${p + 1} (${timeSlots[p].start}-${timeSlots[p].end})`, true)
      );
    }
    const totalColumns = headerRow.length;

    // Title Row (Merged across all columns)
    data.push([createStyledCell(`${branch.name} (${branch.shortName}) Timetable`, true)]);
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalColumns - 1 } });
    
    // Empty Spacing Row
    data.push([]); 
    
    // Header Row
    data.push(headerRow);

    // Data Rows
    for (let d = 0; d < config.workingDays.length; d++) {
      const row: any[] = [];
      row.push(createStyledCell(config.workingDays[d], false));

      let excelColumn = 1; // Track active column starting after 'Day'

      for (let p = 0; p < config.periodsPerDay; p++) {
        // Insert Recess statically
        if (p === config.recessAfterPeriod) {
          row.push(createStyledCell("Recess", false));
          excelColumn++;
        }

        const cell = grid[d]?.[p];

        if (!cell || cell.isLabContinuation) {
          row.push(createStyledCell("", false));
        } else {
          // Format Subject and Details
          let cellValue = cell.subjectShortName;
          if (cell.teacherName) cellValue += ` (${cell.teacherName})`;
          if (cell.labRoomShortName) cellValue += `\n${cell.labRoomShortName}`;

          row.push(createStyledCell(cellValue, false));

          // Calculate Lab Merges inline accurately
          if (cell.isLab) {
            merges.push({
              s: { r: data.length, c: excelColumn },
              e: { r: data.length, c: excelColumn + 1 }
            });
          }
        }
        excelColumn++;
      }
      data.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!merges"] = merges;
    ws["!cols"] = [
      { wch: 15 }, // Day column width
      ...Array(totalColumns - 1).fill({ wch: 25 })
    ];
    ws["!rows"] = Array(data.length).fill({ hpt: 50 }); // Proper row heights

    XLSX.utils.book_append_sheet(
      workbook,
      ws,
      branch.shortName.substring(0, 31) // Safe sheet name truncation
    );
  }

  // 2. Process "All Departments" Master Sheet
  const masterData: any[][] = [];
  const masterMerges: XLSX.Range[] = [];

  // Master Header Construction
  const masterHeader: any[] = [createStyledCell("Day", true), createStyledCell("Branch", true)];
  for (let p = 0; p < config.periodsPerDay; p++) {
    if (p === config.recessAfterPeriod) {
      masterHeader.push(createStyledCell("Recess", true));
    }
    masterHeader.push(
      createStyledCell(`P${p + 1} (${timeSlots[p].start}-${timeSlots[p].end})`, true)
    );
  }
  const masterTotalColumns = masterHeader.length;

  // Master Title
  masterData.push([createStyledCell("All Departments - Master Timetable", true)]);
  masterMerges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: masterTotalColumns - 1 } });
  
  // Empty Spacing Row & Header
  masterData.push([]);
  masterData.push(masterHeader);

  // Master Data Rows
  for (let d = 0; d < config.workingDays.length; d++) {
    for (const branch of branches) {
      const grid = timetables[branch.id];
      if (!grid) continue;

      const row: any[] = [];
      row.push(createStyledCell(config.workingDays[d], false));
      row.push(createStyledCell(branch.shortName, false));

      let excelColumn = 2; // Track active column starting after 'Day' & 'Branch'

      for (let p = 0; p < config.periodsPerDay; p++) {
        if (p === config.recessAfterPeriod) {
          row.push(createStyledCell("Recess", false));
          excelColumn++;
        }

        const cell = grid[d]?.[p];

        if (!cell || cell.isLabContinuation) {
          row.push(createStyledCell("", false));
        } else {
          let cellValue = cell.subjectShortName;
          if (cell.teacherName) cellValue += ` (${cell.teacherName})`;
          if (cell.labRoomShortName) cellValue += `\n${cell.labRoomShortName}`;

          row.push(createStyledCell(cellValue, false));

          if (cell.isLab) {
            masterMerges.push({
              s: { r: masterData.length, c: excelColumn },
              e: { r: masterData.length, c: excelColumn + 1 }
            });
          }
        }
        excelColumn++;
      }
      masterData.push(row);
    }
  }

  const masterSheet = XLSX.utils.aoa_to_sheet(masterData);
  masterSheet["!merges"] = masterMerges;
  masterSheet["!cols"] = [
    { wch: 15 }, // Day
    { wch: 12 }, // Branch
    ...Array(masterTotalColumns - 2).fill({ wch: 25 })
  ];
  masterSheet["!rows"] = Array(masterData.length).fill({ hpt: 50 });

  XLSX.utils.book_append_sheet(workbook, masterSheet, "All Departments");

  // 3. Export as buffer and download
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  saveAs(
    new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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