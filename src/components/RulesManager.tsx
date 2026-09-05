/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, ShieldAlert, AlertTriangle, Info, CheckCircle2, Search, Filter } from 'lucide-react';
import { RuleDefinition, RuleLevel, UserRole } from '../types/planning';

interface RulesManagerProps {
  rules: RuleDefinition[];
  userRole: UserRole;
  onUpdateRule: (rule: RuleDefinition) => void;
}

export const RulesManager: React.FC<RulesManagerProps> = ({
  rules,
  userRole,
  onUpdateRule
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');

  const categories = Array.from(new Set(rules.map(r => r.category))).sort();

  const filteredRules = rules.filter(r => {
    if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
    if (selectedLevel !== 'ALL' && r.currentLevel !== selectedLevel) return false;
    if (searchTerm.trim().length > 0) {
      const q = searchTerm.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleLevelChange = (rule: RuleDefinition, level: RuleLevel) => {
    if (userRole !== 'ADMIN') return;
    onUpdateRule({
      ...rule,
      currentLevel: level
    });
  };

  const handleToggleEnable = (rule: RuleDefinition) => {
    if (userRole !== 'ADMIN') return;
    onUpdateRule({
      ...rule,
      isEnabled: !rule.isEnabled
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1E293B]">Administration du Moteur de Règles Métier (R01 à R40)</h2>
            <p className="text-xs text-[#64748B]">
              Paramétrage dynamique des niveaux de sévérité (HARD, WARNING, OPTIMISATION) et tolérances sans modification de code
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher règle (ex: R01, S3)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs w-48 sm:w-56 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <option value="ALL">Toutes catégories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedLevel}
            onChange={e => setSelectedLevel(e.target.value)}
            className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <option value="ALL">Tous niveaux</option>
            <option value="HARD">HARD</option>
            <option value="WARNING">WARNING</option>
            <option value="OPTIMISATION">OPTIMISATION</option>
            <option value="INFO">INFO</option>
            <option value="A_VALIDER">A_VALIDER</option>
          </select>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center">ID</th>
                <th className="py-2.5 px-3 w-52">Règle & Code</th>
                <th className="py-2.5 px-3">Description Métier & Comportement</th>
                <th className="py-2.5 px-2 w-28 text-center">Catégorie</th>
                <th className="py-2.5 px-3 w-36 text-center">Sévérité Active</th>
                <th className="py-2.5 px-2 w-20 text-center">Statut</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredRules.map(rule => {
                const isHard = rule.currentLevel === 'HARD';
                const isWarning = rule.currentLevel === 'WARNING';
                const isOpt = rule.currentLevel === 'OPTIMISATION';
                const isAValider = rule.currentLevel === 'A_VALIDER';

                return (
                  <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-center text-slate-900 border-r border-slate-100">
                      {rule.id}
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100">
                      <div className="font-bold text-slate-900">{rule.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{rule.code}</div>
                    </td>

                    <td className="py-2.5 px-3 border-r border-slate-100 text-slate-700">
                      <p>{rule.description}</p>
                      {Object.keys(rule.parameters).length > 0 && (
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span>Paramètres:</span>
                          {Object.entries(rule.parameters).map(([k, v]) => (
                            <span key={k} className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-center border-r border-slate-100">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {rule.category}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center border-r border-slate-100">
                      {userRole === 'ADMIN' ? (
                        <select
                          value={rule.currentLevel}
                          onChange={e => handleLevelChange(rule, e.target.value as RuleLevel)}
                          className={`text-xs font-bold px-2 py-1 rounded-md border text-center ${
                            isHard
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : isWarning
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : isOpt
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                              : isAValider
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="HARD">HARD</option>
                          <option value="WARNING">WARNING</option>
                          <option value="OPTIMISATION">OPTIMISATION</option>
                          <option value="INFO">INFO</option>
                          <option value="A_VALIDER">A_VALIDER</option>
                        </select>
                      ) : (
                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md border ${
                          isHard
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : isWarning
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : isOpt
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {rule.currentLevel}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      {userRole === 'ADMIN' ? (
                        <button
                          onClick={() => handleToggleEnable(rule)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rule.isEnabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {rule.isEnabled ? 'Actif' : 'Désactivé'}
                        </button>
                      ) : (
                        <span className={`text-[10px] font-bold ${rule.isEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {rule.isEnabled ? 'Actif' : 'Inactif'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
