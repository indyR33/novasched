const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const insertLogic = `
  const handleQuickAssign = useCallback((employeeId: string, date: string, shiftCode: string) => {
    if (!currentVersion) return;
    if (currentVersion.status === 'PUBLISHED' && userRole !== 'ADMIN') return;
    if (userRole === 'VIEWER') return;

    const emp = employees.find(e => e.id === employeeId);
    const shift = shifts.find(s => s.code === shiftCode);
    if (!emp || !shift) return;

    // Check Authorization
    let isAuthorized = true;
    if (shift.type !== 'absence' && shift.code !== 'OFF') {
      isAuthorized = emp.qualifications.some(q => q.shiftCode === shift.code && q.status === 'VALID');
    }

    if (!isAuthorized) {
      // For quick assign, if not authorized, we fallback to modal to prompt override reason
      setEditingCell({ employeeId, date });
      return;
    }

    const existingIndex = (currentVersion.assignments || []).findIndex(a => a.employeeId === employeeId && a.date === date);
    
    // Build Assignment
    const newAssignment = {
      id: \`asg-\${employeeId}-\${date}\`,
      employeeId,
      date,
      shiftCode,
      countedHours: shift?.countedHours || 0,
      isOverride: false,
      source: 'manual'
    };

    let updatedAssignments = [...(currentVersion.assignments || [])];
    if (existingIndex >= 0) {
      if (shiftCode === 'OFF') {
        updatedAssignments.splice(existingIndex, 1);
      } else {
        updatedAssignments[existingIndex] = newAssignment;
      }
    } else if (shiftCode !== 'OFF') {
      updatedAssignments.push(newAssignment);
    }

    const updatedVersion = {
      ...currentVersion,
      assignments: updatedAssignments,
      updatedAt: new Date().toISOString()
    };

    const updatedVersions = versions.map(v => (v.id === currentVersion.id ? updatedVersion : v));
    setVersions(updatedVersions);
    StorageService.saveVersions(updatedVersions);
  }, [currentVersion, userRole, employees, shifts, versions]);
`;

code = code.replace(
  "const handleSaveAssignment = useCallback((shiftCode: string, isOverride: boolean, overrideReason: string, comment: string) => {",
  insertLogic + "\n\n  const handleSaveAssignment = useCallback((shiftCode: string, isOverride: boolean, overrideReason: string, comment: string) => {"
);

code = code.replace(
  "onSelectCell={handleSelectCell}",
  "onSelectCell={handleSelectCell}\n            onQuickAssign={handleQuickAssign}"
);

fs.writeFileSync('src/App.tsx', code);
