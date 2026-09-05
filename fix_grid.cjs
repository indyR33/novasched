const fs = require('fs');
let code = fs.readFileSync('src/components/PlanningGrid.tsx', 'utf8');

code = code.replace("onSelectCell  onQuickAssign: (employee: Employee, date: string, currentAssignment?: Assignment) => void;", "onSelectCell: (employee: Employee, date: string, currentAssignment?: Assignment) => void;");

code = code.replace("onSelectCell  onQuickAssign}) => {", "onSelectCell,\n  onQuickAssign\n}) => {");

code = code.replace("onSelectCell  onSelectCell(emp, dateStr, asg);", "onSelectCell(emp, dateStr, asg);");

fs.writeFileSync('src/components/PlanningGrid.tsx', code);
