/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  Employee,
  Shift,
  Assignment,
  PlanningVersion,
  PayPeriod
} from '../types/planning';
import { RulesEngine } from '../engine/rulesEngine';

export class ExportService {
  /**
   * Export to Excel (.xlsx) with multiple formatted sheets
   */
  public static exportToExcel(
    version: PlanningVersion,
    employees: Employee[],
    shifts: Shift[],
    dates: string[],
    payPeriod?: PayPeriod
  ): void {
    const wb = XLSX.utils.book_new();
    const shiftMap = new Map<string, Shift>(shifts.map(s => [s.code, s]));
    const asgMap = new Map<string, Assignment>();
    (version.assignments || []).forEach(a => asgMap.set(`${a.employeeId}_${a.date}`, a));

    // 1. Matrix sheet
    const matrixRows: Array<Record<string, string | number>> = [];

    employees.filter(e => e.isActive).forEach(emp => {
      const row: Record<string, string | number> = {
        'Matricule': emp.matricule,
        'Nom Prénom': `${emp.lastName} ${emp.firstName}`,
        'Équipe': emp.team,
        'Groupe': emp.comparisonGroup
      };

      let totalHours = 0;
      let s3Count = 0;
      let sundayCount = 0;

      dates.forEach(d => {
        const asg = asgMap.get(`${emp.id}_${d}`);
        const code = asg ? asg.shiftCode : '-';
        row[d] = code;

        if (asg) {
          totalHours += asg.countedHours;
          if (asg.shiftCode === 'S3') s3Count++;
          if (new Date(d).getDay() === 0 && asg.shiftCode !== 'OFF') sundayCount++;
        }
      });

      row['Total Heures'] = Math.round(totalHours * 10) / 10;
      row['Total S3'] = s3Count;
      row['Dimanches'] = sundayCount;

      matrixRows.push(row);
    });

    const wsMatrix = XLSX.utils.json_to_sheet(matrixRows);
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'Planning');

    // 2. Summary & Pay sheet
    const summaryRows = employees.filter(e => e.isActive).map(emp => {
      const empAsgs = (version.assignments || []).filter(a => a.employeeId === emp.id);
      let workCount = 0;
      let restCount = 0;
      let s3Count = 0;
      let sunCount = 0;
      let cpCount = 0;
      let hours = 0;

      empAsgs.forEach(a => {
        const s = shiftMap.get(a.shiftCode);
        hours += a.countedHours;
        if (s?.type === 'travail') workCount++;
        else if (s?.type === 'repos') restCount++;
        else if (a.shiftCode === 'CP') cpCount++;
        if (a.shiftCode === 'S3') s3Count++;
        if (new Date(a.date).getDay() === 0 && a.shiftCode !== 'OFF') sunCount++;
      });

      return {
        'Matricule': emp.matricule,
        'Nom': emp.lastName,
        'Prénom': emp.firstName,
        'Équipe': emp.team,
        'Période Paie': payPeriod ? payPeriod.label : 'N/A',
        'Heures Comptabilisées': Math.round(hours * 10) / 10,
        'Jours Travaillés': workCount,
        'Jours Repos (OFF)': restCount,
        'Congés Payés (CP)': cpCount,
        'Fermetures S3': s3Count,
        'Dimanches Travaillés': sunCount
      };
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Synthèse & Paie');

    // 3. Shifts Dictionary sheet
    const shiftRows = shifts.map(s => ({
      'Code': s.code,
      'Libellé': s.label,
      'Début': s.startTime,
      'Fin': s.endTime,
      'Traverse Minuit': s.isOvernight ? 'Oui' : 'Non',
      'Durée Théorique (h)': s.theoreticalDuration,
      'Durée Comptabilisée (h)': s.countedHours,
      'Famille': s.family,
      'Sous-Famille': s.subFamily || s.code,
      'Type': s.type
    }));

    const wsShifts = XLSX.utils.json_to_sheet(shiftRows);
    XLSX.utils.book_append_sheet(wb, wsShifts, 'Référentiel Shifts');

    // Write file
    const filename = `smart_Planning_${version.name.replace(/\s+/g, '_')}_${version.startDate}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  /**
   * Export to CSV (RFC 4180 format)
   */
  public static exportToCSV(
    version: PlanningVersion,
    employees: Employee[],
    shifts: Shift[]
  ): void {
    const empMap = new Map<string, Employee>(employees.map(e => [e.id, e]));
    const shiftMap = new Map<string, Shift>(shifts.map(s => [s.code, s]));

    const headers = [
      'Date',
      'Matricule',
      'Nom',
      'Prenom',
      'Equipe',
      'CodeShift',
      'LibelleShift',
      'HeuresComptabilisees',
      'Source',
      'EstOverride',
      'MotifOverride',
      'Commentaire'
    ];

    const lines: string[] = [headers.join(';')];

    (version.assignments || []).forEach(a => {
      const emp = empMap.get(a.employeeId);
      const shift = shiftMap.get(a.shiftCode);

      const row = [
        a.date,
        emp?.matricule || '',
        `"${emp?.lastName || ''}"`,
        `"${emp?.firstName || ''}"`,
        `"${emp?.team || ''}"`,
        a.shiftCode,
        `"${shift?.label || ''}"`,
        a.countedHours.toString(),
        a.source,
        a.isOverride ? '1' : '0',
        `"${a.overrideReason || ''}"`,
        `"${a.comment || ''}"`
      ];

      lines.push(row.join(';'));
    });

    const csvContent = '\uFEFF' + lines.join('\n'); // UTF-8 BOM
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smart_Planning_${version.startDate}_${version.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export to PDF via jsPDF
   */
  public static exportToPDF(
    version: PlanningVersion,
    employees: Employee[],
    dates: string[],
    payPeriod?: PayPeriod
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const asgMap = new Map<string, Assignment>();
    (version.assignments || []).forEach(a => asgMap.set(`${a.employeeId}_${a.date}`, a));

    // Title & Header
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('smart Planning — Planning Opérationnel d’Équipe', 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Version : ${version.name} (v${version.versionNumber}) | Statut : ${version.status} | Période : ${version.startDate} au ${version.endDate}`, 14, 21);
    if (payPeriod) {
      doc.text(`Rattachement Période de Paie : ${payPeriod.label}`, 14, 26);
    }

    // Grid representation (first 14 days or current selection to fit cleanly)
    const displayDates = dates.slice(0, 16); // Fit cleanly on landscape A4

    let y = 34;
    const colW = 12;
    const nameColW = 45;

    // Header row
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 4, nameColW + displayDates.length * colW + 20, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');

    doc.text('Collaborateur', 16, y);
    displayDates.forEach((d, idx) => {
      const dayNum = d.split('-')[2];
      doc.text(dayNum, 14 + nameColW + idx * colW + 3, y);
    });
    doc.text('Total', 14 + nameColW + displayDates.length * colW + 2, y);

    y += 7;

    // Employees rows
    doc.setFont('helvetica', 'normal');
    employees.filter(e => e.isActive).forEach(emp => {
      if (y > 185) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(30, 41, 59);
      doc.text(`${emp.lastName} ${emp.firstName.charAt(0)}.`, 16, y);

      let totalH = 0;
      displayDates.forEach((d, idx) => {
        const asg = asgMap.get(`${emp.id}_${d}`);
        const code = asg ? asg.shiftCode : '-';
        if (asg) totalH += asg.countedHours;

        if (code === 'S3') doc.setTextColor(109, 40, 217);
        else if (code === 'M1' || code === 'M2') doc.setTextColor(180, 83, 9);
        else if (code === 'CP') doc.setTextColor(190, 18, 60);
        else doc.setTextColor(71, 85, 105);

        doc.text(code, 14 + nameColW + idx * colW + 2, y);
      });

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${Math.round(totalH)}h`, 14 + nameColW + displayDates.length * colW + 2, y);
      doc.setFont('helvetica', 'normal');

      // Light separator
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 2, 14 + nameColW + displayDates.length * colW + 20, y + 2);
      y += 6;
    });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Généré par smart Planning — Système certifié avec moteur de règles métier indépendant.', 14, 200);

    doc.save(`smart_Planning_${version.name.replace(/\s+/g, '_')}.pdf`);
  }
}
