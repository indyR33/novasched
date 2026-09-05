/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Plus, Edit2, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Employee, Shift, Qualification, QualificationStatus, UserRole } from '../types/planning';
import { TEAMS_EN, GROUPS_EN } from '../utils/i18nData';

interface EmployeeManagerProps {
  employees: Employee[];
  shifts: Shift[];
  qualifications: Qualification[];
  userRole: UserRole;
  onUpdateEmployee: (emp: Employee) => void;
  onAddEmployee: (emp: Employee) => void;
  onUpdateQualification: (employeeId: string, shiftCode: string, status: QualificationStatus, note?: string) => void;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  employees,
  shifts,
  qualifications,
  userRole,
  onUpdateEmployee,
  onAddEmployee,
  onUpdateQualification
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const filteredEmployees = employees.filter(e => {
    if (selectedTeam !== 'ALL' && e.team !== selectedTeam) return false;
    return true;
  });

  const rawTeams: string[] = Array.from(new Set<string>(employees.map(e => e.team))).sort();
  const workShifts = shifts.filter(s => s.type === 'travail');

  const getTeamLabel = (team: string) => {
    return isEn && TEAMS_EN[team] ? TEAMS_EN[team] : team;
  };

  const getGroupLabel = (group: string) => {
    return isEn && GROUPS_EN[group] ? GROUPS_EN[group] : group;
  };

  const getQualStatus = (empId: string, shiftCode: string) => {
    const q = qualifications.find(x => x.employeeId === empId && x.shiftCode === shiftCode);
    return q?.status || 'NOT_AUTHORIZED';
  };

  const getQualNote = (empId: string, shiftCode: string) => {
    const q = qualifications.find(x => x.employeeId === empId && x.shiftCode === shiftCode);
    return q?.conditionNote;
  };

  const handleToggleQual = (empId: string, shiftCode: string) => {
    if (userRole === 'VIEWER') return;
    const current = getQualStatus(empId, shiftCode);
    let next: QualificationStatus = 'AUTHORIZED';
    if (current === 'AUTHORIZED') next = 'NOT_AUTHORIZED';
    else if (current === 'NOT_AUTHORIZED') next = 'AUTHORIZED';

    onUpdateQualification(empId, shiftCode, next);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1E293B]">{t('employees.title')}</h2>
            <p className="text-xs text-[#64748B]">{t('employees.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="ALL">{t('employees.allTeams')}</option>
              {rawTeams.map(t => (
                <option key={t} value={t}>{getTeamLabel(t)}</option>
              ))}
            </select>
          </div>

          {userRole === 'ADMIN' && (
            <button
              onClick={() => {
                setEditingEmployee({
                  id: `emp-${Date.now()}`,
                  matricule: `MAT-${Math.floor(100 + Math.random() * 900)}`,
                  lastName: '',
                  firstName: '',
                  arrivalDate: '2026-09-01',
                  isActive: true,
                  team: 'Équipe A',
                  weeklyContractHours: 35,
                  comparisonGroup: 'Opérateurs Polyvalents'
                });
                setIsNewModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3B82F6] text-white font-semibold text-xs shadow-xs hover:bg-[#2563EB] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('employees.newEmployee')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Qualifications Matrix Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-3 w-56 sticky left-0 bg-[#F8FAFC] z-10 border-r border-[#E2E8F0]">
                  {t('employees.colEmployee')}
                </th>
                <th className="py-2.5 px-2 w-32 border-r border-[#E2E8F0]">{t('employees.colContract')}</th>
                <th className="py-2.5 px-2 w-36 border-r border-[#E2E8F0]">{t('employees.colTeamGroup')}</th>
                {workShifts.map(s => (
                  <th key={s.code} className="py-2 px-2 text-center border-r border-[#E2E8F0] min-w-[55px]">
                    <div className="font-bold text-[#1E293B]">{s.code}</div>
                    <div className="text-[10px] text-[#94A3B8] font-normal">{s.family}</div>
                  </th>
                ))}
                {userRole === 'ADMIN' && <th className="py-2.5 px-2 text-center w-16">{t('employees.colActions')}</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Name cell - Agent names preserved as required */}
                  <td className="py-2.5 px-3 sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-200">
                    <div className="font-semibold text-slate-900">
                      {emp.lastName} {emp.firstName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {emp.matricule} {!emp.isActive && `• (${t('employees.inactiveBadge')})`}
                    </div>
                  </td>

                  {/* Contract Dates */}
                  <td className="py-2 px-2 border-r border-slate-200 font-mono text-[11px] text-slate-600">
                    <div>{isEn ? 'From:' : 'Du :'} {emp.arrivalDate}</div>
                    {emp.departureDate && <div className="text-rose-600">{isEn ? 'To:' : 'Au :'} {emp.departureDate}</div>}
                  </td>

                  {/* Group & Team */}
                  <td className="py-2 px-2 border-r border-slate-200 text-[11px] text-slate-600">
                    <div className="font-medium text-slate-800">{getTeamLabel(emp.team)}</div>
                    <div className="text-[10px] text-slate-500">{getGroupLabel(emp.comparisonGroup)}</div>
                  </td>

                  {/* Shift Qualifications */}
                  {workShifts.map(s => {
                    const status = getQualStatus(emp.id, s.code);
                    const note = getQualNote(emp.id, s.code);
                    const isAuth = status === 'AUTHORIZED';

                    return (
                      <td
                        key={s.code}
                        onClick={() => handleToggleQual(emp.id, s.code)}
                        className={`py-2 px-1 text-center border-r border-slate-200 select-none ${
                          userRole !== 'VIEWER' ? 'cursor-pointer hover:bg-indigo-50/60' : 'cursor-default'
                        }`}
                        title={note || (isAuth ? (isEn ? 'Authorized' : 'Habilité') : (isEn ? 'Not authorized' : 'Non habilité'))}
                      >
                        <div className="inline-flex items-center justify-center">
                          {isAuth ? (
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                              ✓
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center text-xs font-bold">
                              ✕
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Edit action */}
                  {userRole === 'ADMIN' && (
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => {
                          setEditingEmployee({ ...emp });
                          setIsNewModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        title={t('common.edit')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Employee Modal */}
      {isNewModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">
              {(employees || []).some(e => e.id === editingEmployee.id) ? t('employees.editEmployee') : t('employees.newEmployee')}
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('employees.modalLastName')}</label>
                  <input
                    type="text"
                    value={editingEmployee.lastName}
                    onChange={e => setEditingEmployee({ ...editingEmployee, lastName: e.target.value })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('employees.modalFirstName')}</label>
                  <input
                    type="text"
                    value={editingEmployee.firstName}
                    onChange={e => setEditingEmployee({ ...editingEmployee, firstName: e.target.value })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('employees.modalMatricule')}</label>
                  <input
                    type="text"
                    value={editingEmployee.matricule}
                    onChange={e => setEditingEmployee({ ...editingEmployee, matricule: e.target.value })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('employees.modalTeam')}</label>
                  <input
                    type="text"
                    value={editingEmployee.team}
                    onChange={e => setEditingEmployee({ ...editingEmployee, team: e.target.value })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('employees.modalArrival')} (R02)</label>
                  <input
                    type="date"
                    value={editingEmployee.arrivalDate}
                    onChange={e => setEditingEmployee({ ...editingEmployee, arrivalDate: e.target.value })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('employees.modalDeparture')} (R03)</label>
                  <input
                    type="date"
                    value={editingEmployee.departureDate || ''}
                    onChange={e => setEditingEmployee({ ...editingEmployee, departureDate: e.target.value || undefined })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('employees.modalGroup')}</label>
                <input
                  type="text"
                  value={editingEmployee.comparisonGroup}
                  onChange={e => setEditingEmployee({ ...editingEmployee, comparisonGroup: e.target.value })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingEmployee.isActive}
                  onChange={e => setEditingEmployee({ ...editingEmployee, isActive: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-800">{t('employees.modalActiveInStaff')}</span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if ((employees || []).some(e => e.id === editingEmployee.id)) {
                    onUpdateEmployee(editingEmployee);
                  } else {
                    onAddEmployee(editingEmployee);
                  }
                  setIsNewModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
