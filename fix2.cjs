const fs = require('fs');
let code = fs.readFileSync('src/components/PlanningGrid.tsx', 'utf8');

code = code.replace(/onSelectCell\s*onQuickAssign: \(/g, "onSelectCell: (");
code = code.replace(/onSelectCell\s*onQuickAssign\s*}\) => {/g, "onSelectCell,\n  onQuickAssign\n}) => {");

fs.writeFileSync('src/components/PlanningGrid.tsx', code);
