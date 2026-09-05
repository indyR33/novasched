/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileSpreadsheet, Download, Upload, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Employee, Shift, PlanningVersion, PayPeriod, UserRole } from '../types/planning';
import { ExportService } from '../services/exportService';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: PlanningVersion;
  employees: Employee[];
  shifts: Shift[];
  payPeriods: PayPeriod[];
  userRole: UserRole;
  onImportData: (imported: any) => void;
}

export interface ImportReport {
  timestamp: string;
  totalLines: number;
  importedLines: number;
  rejectedLines: number;
  orphanRecords: string[];
  anomalies: string[];
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  version,
  employees,
  shifts,
  payPeriods,
  userRole,
  onImportData
}) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const [activeTab, setActiveTab] = useState<'EXPORT' | 'IMPORT'>('EXPORT');
  const [report, setReport] = useState<ImportReport | null>(null);

  if (!isOpen) return null;

  // Generate date list for export
  const allDates: string[] = [];
  const curr = new Date(version.startDate);
  const end = new Date(version.endDate);
  while (curr <= end) {
    allDates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }

  const currentPayPeriod = payPeriods.find(p => p.id === version.periodId);

  const handleExportExcel = () => {
    ExportService.exportToExcel(version, employees, shifts, allDates, currentPayPeriod);
  };

  const handleExportPDF = () => {
    ExportService.exportToPDF(version, employees, allDates, currentPayPeriod);
  };

  const handleExportCSV = () => {
    ExportService.exportToCSV(version, employees, shifts);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Validate data integrity (R37)
        const orphanRecords: string[] = [];
        const anomalies: string[] = [];
        let imported = 0;
        let rejected = 0;

        if (Array.isArray(parsed.assignments)) {
          const empIds = new Set(employees.map(x => x.id));
          const shiftCodes = new Set(shifts.map(s => s.code));

          parsed.assignments.forEach((a: any) => {
            if (!empIds.has(a.employeeId)) {
              orphanRecords.push(isEn ? `Unknown employee ${a.employeeId} on ${a.date}` : `Employé inconnu ${a.employeeId} le ${a.date}`);
              rejected++;
            } else if (!shiftCodes.has(a.shiftCode)) {
              anomalies.push(isEn ? `Unknown shift code ${a.shiftCode} on ${a.date}` : `Code shift inconnu ${a.shiftCode} le ${a.date}`);
              rejected++;
            } else {
              imported++;
            }
          });
        }

        setReport({
          timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'fr-FR'),
          totalLines: imported + rejected,
          importedLines: imported,
          rejectedLines: rejected,
          orphanRecords,
          anomalies
        });

        if (imported > 0) {
          onImportData(parsed);
        }
      } catch (err: any) {
        alert(isEn ? 'File read error: invalid JSON format.' : 'Erreur de lecture du fichier : format JSON invalide.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEn ? 'Certified Import & Export' : 'Importation & Exportation Certifiée'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEn
                  ? 'Formats Excel (.xlsx), PDF, CSV and integrity control (R37)'
                  : "Formats Excel (.xlsx), PDF, CSV et contrôle d'intégrité (R37)"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-5 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`py-3 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'EXPORT' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isEn ? 'Export Schedule' : 'Exporter le Planning'}</span>
          </button>
          <button
            onClick={() => setActiveTab('IMPORT')}
            className={`py-3 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'IMPORT' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isEn ? 'Import Historical Data' : 'Importer Données Historiques'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[65vh] overflow-y-auto text-xs space-y-4">
          {activeTab === 'EXPORT' ? (
            <div className="space-y-3">
              <p className="text-slate-600 text-xs">
                {isEn
                  ? `Download operational assignments for ${version.name} in your preferred format:`
                  : `Téléchargez les affectations opérationnelles de ${version.name} au format de votre choix :`}
              </p>

              {/* Excel XLSX */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 transition-all flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>{isEn ? 'Microsoft Excel Workbook (.xlsx)' : 'Classeur Microsoft Excel (.xlsx)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isEn
                      ? 'Contains 3 sheets: Schedule Matrix, Payroll & Accruals Summary, Shift Reference.'
                      : 'Contient 3 feuilles : Matrice de Planning, Synthèse Paie & Cumuls, Référentiel des Shifts.'}
                  </p>
                </div>
                <button
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>XLSX</span>
                </button>
              </div>

              {/* PDF Document */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-rose-400 bg-white hover:bg-rose-50/20 transition-all flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>{isEn ? 'Printable PDF Schedule (Landscape A4)' : 'Planning Imprimable PDF (Paysage A4)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isEn
                      ? 'Compact layout, family visual color markers, and certified hours totals.'
                      : "Mise en page compacte, repères visuels par famille et totaux d'heures certifiés."}
                  </p>
                </div>
                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>

              {/* CSV Raw Data */}
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 transition-all flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>{isEn ? 'Tabular CSV Data File (RFC 4180)' : 'Fichier de données tabulaires CSV (RFC 4180)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isEn
                      ? 'Semicolon separator with UTF-8 BOM encoding for HRIS / ERP integration.'
                      : 'Séparateur point-virgule avec encodage UTF-8 BOM pour intégration SI RH ou ERP.'}
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 shadow-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          ) : (
            /* Import Tab */
            <div className="space-y-4">
              <p className="text-slate-600 text-xs">
                {isEn
                  ? 'Import a structured JSON data file or history records for data migration.'
                  : 'Importez un fichier de données JSON structuré ou des historiques pour migration de données.'}
              </p>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <label className="cursor-pointer">
                  <span className="font-bold text-indigo-600 hover:underline">
                    {isEn ? 'Select a JSON file' : 'Sélectionner un fichier JSON'}
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isEn ? 'Drag and drop or click to browse' : 'Glissez-déposez ou cliquez pour parcourir'}
                </p>
              </div>

              {/* Migration / Validation Report (Section 21 & R37) */}
              {report && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                    <span>{isEn ? 'Migration Integrity Report (R37)' : "Rapport d'Intégrité de Migration (R37)"}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{report.timestamp}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-slate-400 text-[9px]">{isEn ? 'Lines parsed' : 'Lignes analysées'}</div>
                      <div className="font-bold text-slate-800">{report.totalLines}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-emerald-200">
                      <div className="text-emerald-600 text-[9px]">{isEn ? 'Lines imported' : 'Lignes intégrées'}</div>
                      <div className="font-bold text-emerald-700">{report.importedLines}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-rose-200">
                      <div className="text-rose-600 text-[9px]">{isEn ? 'Lines rejected' : 'Lignes rejetées'}</div>
                      <div className="font-bold text-rose-700">{report.rejectedLines}</div>
                    </div>
                  </div>

                  {report.orphanRecords.length > 0 && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-800 space-y-0.5">
                      <div className="font-bold">{isEn ? 'Rejected orphan records:' : 'Références orphelines rejetées :'}</div>
                      {report.orphanRecords.map((rec, i) => (
                        <div key={i}>• {rec}</div>
                      ))}
                    </div>
                  )}

                  {report.anomalies.length > 0 && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 space-y-0.5">
                      <div className="font-bold">{isEn ? 'Code anomalies:' : 'Anomalies de codes :'}</div>
                      {report.anomalies.map((ano, i) => (
                        <div key={i}>• {ano}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {isEn ? 'Close' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
