import os

files = [
    'src/components/ceo/pages/Dashboard.jsx',
    'src/components/ceo/pages/Finance.jsx',
    'src/components/ceo/pages/People.jsx',
    'src/components/ceo/pages/Reports.jsx',
    'src/components/ceo/pages/Vendors.jsx',
    'src/components/ceo/pages/DocumentVault.jsx',
    
    'src/components/hr/modules/employees/EmployeeRegistryView.jsx',
    'src/components/hr/modules/attendance/AttendanceRegisterView.jsx',
    'src/components/hr/modules/appraisals/AppraisalsView.jsx',
    'src/components/hr/modules/leave/LeaveManagementView.jsx',
    'src/components/hr/modules/onboarding/OnboardingView.jsx',
    'src/components/hr/modules/lnd/LearningLndView.jsx',
    'src/components/hr/modules/exits/ExitFnFView.jsx',
    'src/components/hr/modules/timesheets/ApprovedTimesheetsView.jsx',
    'src/components/hr/modules/timesheets/ManageApprovals.jsx',
    'src/components/hr/modules/reports/ReportsEngineView.jsx',
    
    'src/components/tl/Attendance/TeamAttendance.jsx',
    'src/components/tl/Timesheets/TeamTimesheets.jsx',
    'src/components/tl/Timesheets/TeamTimesheetsHistory.jsx',
    'src/components/tl/Tasks/index.jsx',
    'src/components/tl/Performance/index.jsx',
    'src/components/tl/Escalations/index.jsx',
    'src/components/tl/Reports/index.jsx',
    
    'src/components/employee/Expenses.jsx',
    'src/components/employee/Leave.jsx',
    'src/components/employee/Attendance.jsx',
    'src/components/employee/Payroll.jsx',
    'src/components/employee/Timesheet.jsx'
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.read().split('\n')
        
    new_lines = []
    i = 0
    changed = False
    
    while i < len(lines):
        line = lines[i]
        
        # Check if this line is the added wrapper
        if '<div className="table-responsive-wrapper">' in line:
            # Check if next line is a table
            if i + 1 < len(lines) and '<table' in lines[i+1]:
                changed = True
                i += 1
                continue # Skip the wrapper line
                
        # Check if this line is </table>
        if '</table' in line:
            new_lines.append(line)
            # Check if next line is the added closing div
            if i + 1 < len(lines) and '</div>' in lines[i+1]:
                # In my previous script, I matched indent length and added exactly '</div>' or spaces + '</div>'
                # Let's be careful. Let's assume if the next line is </div>, we skip it.
                # But wait! What if it's a legitimate </div>?
                # My previous script output: `indent = len(line) - len(line.lstrip()); new_lines.append(' ' * indent + '</div>')`
                # So if `lines[i+1].strip() == '</div>'`, and we just closed a table, let's remove it if `changed` is True.
                if changed and lines[i+1].strip() == '</div>':
                    i += 2
                    continue
        
        new_lines.append(line)
        i += 1
        
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        print(f"Undid: {filepath}")
