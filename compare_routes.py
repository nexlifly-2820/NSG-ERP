import os, re

backend_routes = set()

# Scan backend routers
for root, _, files in os.walk(r'c:\Users\vivek chamanthula\Desktop\Nsg Erp\NSG-ERP\backend\app\routers'):
    for f in files:
        if f.endswith('.py'):
            prefix = ""
            with open(os.path.join(root, f), 'r', encoding='utf-8') as file:
                content = file.read()
                # Find prefix
                prefix_match = re.search(r'prefix="([^"]+)"', content)
                if prefix_match:
                    prefix = prefix_match.group(1)
                
                # Find routes
                route_matches = re.findall(r'@router\.(?:get|post|patch|delete|put)\("([^"]+)"', content)
                for route in route_matches:
                    full_route = f"/api{prefix}{route}".replace('//', '/')
                    # Replace path params {id} etc with a generic regex or just keep them for visual diff
                    backend_routes.add(full_route)

# Read frontend urls from the previous command output (pasted as string for simplicity here)
frontend_urls = """
/api/attendance/all-logs
/api/attendance/clock-in
/api/attendance/clock-out
/api/attendance/correction
/api/attendance/corrections
/api/attendance/corrections/${id}/${action}
/api/attendance/geofence-settings
/api/attendance/my-logs
/api/attendance/my-notifications
/api/auth/login
/api/ceo-portal/announcements
/api/ceo-portal/approvals/pending
/api/ceo-portal/audit-trail
/api/ceo-portal/configs
/api/ceo-portal/dashboard/summary
/api/ceo-portal/expenses/${item.dbId}/approve
/api/ceo-portal/finance/budgets/${id}/${action}
/api/ceo-portal/finance/data
/api/ceo-portal/finance/salary-structure
/api/ceo-portal/leaves/${item.dbId}/approve
/api/ceo-portal/loans/${item.dbId}/approve
/api/ceo-portal/okrs
/api/ceo-portal/okrs/key-results/${krId}/progress
/api/ceo-portal/payroll/runs/${item.dbId}/sign-checker
/api/ceo-portal/payroll/runs/${runId}/transfer-bank
/api/ceo-portal/projects
/api/ceo-portal/projects/${editProject.id}
/api/ceo-portal/projects/${signoffProject.id}/signoff
/api/ceo-portal/projects/escalations
/api/ceo-portal/reports/analytics
/api/employee-portal/announcements
/api/employee-portal/chat/channels
/api/employee-portal/chat/channels/${c.id}/messages
/api/employee-portal/chat/channels/${selectedChannel}/members
/api/employee-portal/chat/my-channels
/api/employee-portal/expenses/claim
/api/employee-portal/expenses/my-claims
/api/employee-portal/helpdesk/my-tickets
/api/employee-portal/helpdesk/ticket
/api/employee-portal/leave/my-balances
/api/employee-portal/leave/my-requests
/api/employee-portal/leave/request
/api/employee-portal/leave/request/${id}/cancel
/api/employee-portal/payroll/ctc
/api/employee-portal/payroll/my-payslips
/api/employee-portal/payroll/tds-declarations
/api/employee-portal/resignation/my-assets
/api/employee-portal/tasks/my-tasks
/api/hr-portal/appraisal-cycles
/api/hr-portal/appraisal-scorecards
/api/hr-portal/appraisal-scorecards/${sc.id}/acknowledge
/api/hr-portal/candidates
/api/hr-portal/candidates/${id}/join
/api/hr-portal/candidates/${id}/stage
/api/hr-portal/candidates/analyze-resume
/api/hr-portal/employees
/api/hr-portal/employees/${editEmp.id}
/api/hr-portal/employees/${id}
/api/hr-portal/employees/${id}/confirm-probation
/api/hr-portal/employees/${id}/extend-probation
/api/hr-portal/employees/${id}/terminate
/api/hr-portal/employees/${resetEmp.id}/reset-password
/api/hr-portal/exits/resignations
/api/hr-portal/exits/resignations/${selectedResignId}/approve
/api/hr-portal/holidays
/api/hr-portal/holidays/${id}
/api/hr-portal/increment-proposals
/api/hr-portal/interviews
/api/hr-portal/leave/policies
/api/hr-portal/leave/policies/${p.id}
/api/hr-portal/leaves/balances
/api/hr-portal/leaves/balances/${editingBalance.id}
/api/hr-portal/leaves/on-behalf
/api/hr-portal/leaves/requests
/api/hr-portal/leaves/requests/${editingRequest.id}
/api/hr-portal/leaves/requests/${id}
/api/hr-portal/leaves/requests/${id}/approve
/api/hr-portal/leaves/requests/${id}/deny
/api/hr-portal/lnd/progress
/api/hr-portal/lnd/tracks
/api/hr-portal/offers
/api/hr-portal/onboarding/esign-requests
/api/hr-portal/onboarding/esign-requests/${requestId}
/api/hr-portal/onboarding/esign-requests/${requestId}/simulate-sign
/api/hr-portal/onboarding/tasks
/api/hr-portal/onboarding/tasks/${taskId}/toggle
/api/hr-portal/payroll/claims
/api/hr-portal/payroll/claims/${claimId}/approve
/api/hr-portal/payroll/claims/${claimId}/reject
/api/hr-portal/payroll/runs
/api/hr-portal/payroll/runs/${activeRun.id}/sign-maker
/api/hr-portal/payroll/tds-declarations
/api/hr-portal/payroll/tds-declarations/${declId}/verify
/api/hr-portal/promotions
/api/hr-portal/promotions/${id}/decide
/api/hr-portal/schemas
/api/hr-portal/schemas/${selectedDept}
/api/hr-portal/tickets
/api/hr-portal/tickets/${id}/resolve
/api/team-lead/attendance
/api/team-lead/escalations
/api/team-lead/escalations/${id}/resolve
/api/team-lead/expenses/${id}/${action}
/api/team-lead/expenses/pending
/api/team-lead/leaves/${id}/${action}
/api/team-lead/leaves/pending
/api/team-lead/projects
/api/team-lead/reports
/api/team-lead/scorecards
/api/team-lead/tasks
/api/team-lead/tasks/${reassignTaskId}/reassign
/api/team-lead/tasks/${rejectTaskId}/reject-pr
/api/team-lead/tasks/${taskId}/approve-pr
/api/team-lead/team-members
/api/timesheets/${activeSelected.id}/approve
/api/timesheets/${activeSelected.id}/reject
/api/timesheets/pending
/api/employee-portal/learning/progress
/api/employee-portal/profile/update-bank
/api/employee-portal/resignation/my-assets
/api/employee-portal/resignation/status
/api/employee-portal/resignation/submit
/api/employee-portal/resignation/withdraw
/api/employee-portal/tasks/${id}/submit-pr
/api/employee-portal/tasks/${id}/subtasks/${changedSubtask.id}/toggle
/api/employee-portal/tasks/my-tasks
/api/employee-portal/tasks/schema
/api/hr-portal/timesheets/exceptions
/api/hr-portal/timesheets/exceptions/${id}/resolve
/api/timesheets/my-timesheets?week_start_date=${weekStartDateStr}
/api/timesheets/save
/api/timesheets/submit
"""

def normalize_path(path):
    # Convert ${var} to {id} for matching
    path = re.sub(r'\$\{.*?\}', '{id}', path)
    # Remove query strings
    path = path.split('?')[0]
    return path

normalized_fe = {normalize_path(url.strip()) for url in frontend_urls.split('\n') if url.strip()}
normalized_be = {normalize_path(url) for url in backend_routes}

print("MISSING IN BACKEND (Frontend calls this but Backend doesn't have it):")
missing = sorted(normalized_fe - normalized_be)
for m in missing:
    print(m)

