const fs = require('fs');
let code = fs.readFileSync('src/components/PlanningGrid.tsx', 'utf8');
code = code.replace(
`                      return (
                        <td
                          key={dateStr}
                          onClick={() => {
                            if (!isReadOnly) {
                              onSelectCell(emp, dateStr, asg);
                            }
                          }}
                          className={\`p-1 text-center border-r border-slate-100 transition-all \${
                            isSunday ? 'bg-rose-50/20' : ''
                          } \${
                            !isReadOnly ? 'cursor-pointer hover:bg-indigo-50/50' : 'cursor-default'
                          }\`}
                        >`,
`                      return (
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
                        >`
);
fs.writeFileSync('src/components/PlanningGrid.tsx', code);
