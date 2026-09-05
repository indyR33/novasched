const fs = require('fs');
let code = fs.readFileSync('src/components/PlanningGrid.tsx', 'utf8');

const replacement = `                    {/* Employee sticky cell */}
                    <td className="sticky left-0 bg-white z-10 p-2 border-r-2 border-[#E2E8F0] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center font-bold text-xs text-[#64748B]">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#1E293B] text-xs uppercase tracking-tight">{emp.lastName}</div>
                          <div className="text-[10px] text-[#94A3B8] font-medium flex items-center gap-1">
                            {emp.contractType} <span className="w-1 h-1 rounded-full bg-[#CBD5E1]"></span> {emp.weeklyHours}h
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stats cells */}
                    <td className="p-2 border-r border-[#E2E8F0] text-center bg-[#F8FAFC]/50">
                      <span className={\`text-xs font-bold \${(stats?.totalCountedHours || 0) < emp.weeklyHours ? 'text-amber-500' : 'text-[#3B82F6]'}\`}>
                        {stats?.totalCountedHours || 0}h
                      </span>
                    </td>
                    <td className="p-2 border-r-2 border-[#E2E8F0] text-center bg-[#F8FAFC]/50">
                      <span className="text-[10px] font-bold text-[#64748B] bg-white px-1.5 py-0.5 rounded-md border border-[#E2E8F0]">
                        {stats?.weekendShifts || 0}
                      </span>
                    </td>

                    {/* Days */}
                    {headers.map(h => {
                      const dateStr = h.dateStr;
                      const asgKey = \`\${emp.id}-\${dateStr}\`;
                      const asg = assignmentsMap.get(asgKey);
                      const cellIssues = issuesMap.get(asgKey) || [];
                      const hasHardIssue = cellIssues.some(i => i.level === 'HARD');
                      const hasWarning = cellIssues.some(i => i.level === 'WARNING');
                      const shift = asg ? shiftMap.get(asg.shiftCode) : undefined;
                      const isSunday = new Date(dateStr).getDay() === 0;

                      return (
                        <td
                          key={dateStr}
                          onMouseDown={() => {
                            if (!isReadOnly) {
                              setIsPainting(true);
                              if (activeBrush && onQuickAssign) {
                                onQuickAssign(emp.id, dateStr, activeBrush);
                              }
                            }
                          }}
                          onMouseEnter={() => {
                            if (!isReadOnly && isPainting && activeBrush && onQuickAssign) {
                              onQuickAssign(emp.id, dateStr, activeBrush);
                            }
                          }}
                          onClick={() => {
                            if (!isReadOnly && !activeBrush) {
                              onSelectCell(emp, dateStr, asg);
                            }
                          }}
                          className={\`p-1 text-center border-r border-slate-100 transition-all \${
                            isSunday ? 'bg-rose-50/20' : ''
                          } \${
                            !isReadOnly ? 'cursor-pointer hover:bg-indigo-50/50' : 'cursor-default'
                          } \${activeBrush ? 'select-none' : ''}\`}
                        >`;

const regex = /<td[\s\S]*?key=\{dateStr\}[\s\S]*?onMouseDown=\{\(\) => \{[\s\S]*?className=\{`p-1 text-center border-r border-slate-100 transition-all[\s\S]*?>/;
code = code.replace(regex, replacement);
fs.writeFileSync('src/components/PlanningGrid.tsx', code);
