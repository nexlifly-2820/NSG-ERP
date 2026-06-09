// NSG ERP — Centralized HR Client-Side Simulated Database Seeds
// Seeded with rich, realistic enterprise records to power the frontend interactive dashboard.

export const INITIAL_CANDIDATES = [
  { id: 1, name: 'Vikram Malhotra', email: 'vikram.m@gmail.com', phone: '+91 98765 43210', role: 'Senior React Developer', source: 'LinkedIn', stage: 'interview', resume_url: '#', created_at: '2026-05-10T10:00:00Z' },
  { id: 2, name: 'Ananya Sharma', email: 'ananya.s@yahoo.com', phone: '+91 87654 32109', role: 'Product Manager', source: 'Referral', stage: 'applied', resume_url: '#', created_at: '2026-05-15T14:30:00Z' },
  { id: 3, name: 'Rohan Deshmukh', email: 'rohan.d@gmail.com', phone: '+91 76543 21098', role: 'Junior UI/UX Designer', source: 'Job Board', stage: 'screening', resume_url: '#', created_at: '2026-05-18T09:15:00Z' },
  { id: 4, name: 'Pooja Iyer', email: 'pooja.i@outlook.com', phone: '+91 91234 56789', role: 'QA Automation Engineer', source: 'Direct', stage: 'offer', resume_url: '#', created_at: '2026-05-05T11:45:00Z' },
  { id: 5, name: 'Amit Verma', email: 'amit.v@hotmail.com', phone: '+91 92345 67890', role: 'DevOps Engineer', source: 'LinkedIn', stage: 'joined', resume_url: '#', created_at: '2026-05-01T16:20:00Z' },
];

export const INITIAL_EMPLOYEES = [
  { id: 101, emp_id: 'NSG-0101', name: 'John Doe', email: 'john.doe@hnms.com', phone: '+91 99887 76655', department: 'Engineering', designation: 'Senior Developer', status: 'active', join_date: '2024-03-12', probation_end_date: '2024-09-12', bank_name: 'HDFC Bank', account_number: '50100293847261', ifsc_code: 'HDFC0000012', grade: 4, manager: 'Sarah Jenkins', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80' },
  { id: 102, emp_id: 'NSG-0102', name: 'Jane Smith', email: 'jane.smith@hnms.com', phone: '+91 88776 65544', department: 'IT', designation: 'Systems Executive', status: 'active', join_date: '2025-06-01', probation_end_date: '2025-12-01', bank_name: 'ICICI Bank', account_number: '00040192837465', ifsc_code: 'ICIC0000004', grade: 2, manager: 'Sarah Jenkins', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80' },
  { id: 103, emp_id: 'NSG-0103', name: 'Rahul Roy', email: 'rahul.roy@hnms.com', phone: '+91 77665 54433', department: 'Marketing', designation: 'SEO Specialist', status: 'active', join_date: '2026-01-10', probation_end_date: '2026-07-10', bank_name: 'State Bank of India', account_number: '30291827364', ifsc_code: 'SBIN0000301', grade: 2, manager: 'Vikram Sen', photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&fit=crop&q=80' },
  { id: 104, emp_id: 'NSG-0104', name: 'David Miller', email: 'david.m@hnms.com', phone: '+91 90909 09090', department: 'Engineering', designation: 'React Developer', status: 'probation', join_date: '2026-04-15', probation_end_date: '2026-10-15', bank_name: 'HDFC Bank', account_number: '50100482938472', ifsc_code: 'HDFC0000012', grade: 3, manager: 'John Doe', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop&q=80' },
  { id: 105, emp_id: 'NSG-0105', name: 'Priya Patel', email: 'priya.p@hnms.com', phone: '+91 91919 19191', department: 'Engineering', designation: 'Junior Architect', status: 'active', join_date: '2023-11-20', probation_end_date: '2024-05-20', bank_name: 'Axis Bank', account_number: '91201928374656', ifsc_code: 'UTIB0000091', grade: 5, manager: 'Sarah Jenkins', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&fit=crop&q=80' },
  { id: 106, emp_id: 'NSG-0106', name: 'Amit Sharma', email: 'amit.sharma@hnms.com', phone: '+91 93214 56780', department: 'Sales', designation: 'Field Representative', status: 'active', join_date: '2024-09-01', probation_end_date: '2025-03-01', bank_name: 'HDFC Bank', account_number: '50100923847265', ifsc_code: 'HDFC0000012', grade: 3, manager: 'Vikram Sen', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&fit=crop&q=80' },
];

export const INITIAL_JOB_HISTORY = [
  { id: 1, employee_id: 101, event_type: 'joining', old_dept: null, new_dept: 'Engineering', old_role: null, new_role: 'Senior Developer', old_grade: null, new_grade: 4, manager: 'Sarah Jenkins', effective_date: '2024-03-12', approved_by: 'Sarah Jenkins' },
  { id: 2, employee_id: 102, event_type: 'joining', old_dept: null, new_dept: 'IT', old_role: null, new_role: 'Systems Executive', old_grade: null, new_grade: 2, manager: 'Sarah Jenkins', effective_date: '2025-06-01', approved_by: 'Sarah Jenkins' },
  { id: 3, employee_id: 103, event_type: 'joining', old_dept: null, new_dept: 'Marketing', old_role: null, new_role: 'SEO Specialist', old_grade: null, new_grade: 2, manager: 'Vikram Sen', effective_date: '2026-01-10', approved_by: 'Sarah Jenkins' },
  { id: 4, employee_id: 104, event_type: 'joining', old_dept: null, new_dept: 'Engineering', old_role: null, new_role: 'React Developer', old_grade: null, new_grade: 3, manager: 'John Doe', effective_date: '2026-04-15', approved_by: 'Sarah Jenkins' },
  { id: 5, employee_id: 105, event_type: 'joining', old_dept: null, new_dept: 'Engineering', old_role: null, new_role: 'Junior Architect', old_grade: null, new_grade: 5, manager: 'Sarah Jenkins', effective_date: '2023-11-20', approved_by: 'Sarah Jenkins' },
  { id: 6, employee_id: 101, event_type: 'compensation_change', old_dept: 'Engineering', new_dept: 'Engineering', old_role: 'Senior Developer', new_role: 'Senior Developer', old_grade: 4, new_grade: 4, manager: 'Sarah Jenkins', effective_date: '2025-04-01', approved_by: 'Sarah Jenkins' },
];

export const INITIAL_DISCIPLINARY_TICKETS = [
  { id: 1, employee_id: 103, issued_by: 'Sarah Jenkins', violation_type: 'tardiness', severity: 'written_warning', description: 'Arrived > 30 minutes late on 5 consecutive days without prior notice.', evidence_url: '#', response_deadline: '2026-06-02T16:00:00Z', employee_rebuttal: '', status: 'issued' },
  { id: 2, employee_id: 102, issued_by: 'Sarah Jenkins', violation_type: 'policy_breach', severity: 'final_warning', description: 'Unauthorized sharing of local test environment credentials with external consultants.', evidence_url: '#', response_deadline: '2026-05-25T12:00:00Z', employee_rebuttal: 'I sincerely apologize. The consultant required local logs for troubleshooting. I have revoked their access and reset my credentials.', status: 'resolved' },
];

export const INITIAL_PIPS = [
  { id: 1, employee_id: 103, ticket_id: 1, manager_id: 101, start_date: '2026-06-01', duration_weeks: 4, goals: [{ title: 'On-time Punch-ins', target: '95% over 4 weeks', current: '75%', passed: false }, { title: 'Pending SEO Audits', target: 'Complete all 12 by week 2', current: '4 completed', passed: false }], status: 'ongoing', outcome: 'pending' },
];

export const INITIAL_ATTENDANCE_LOGS = [
  { id: 1, employee_id: 101, date: '2026-05-28', clock_in: '2026-05-28T09:00:00Z', clock_out: '2026-05-28T18:00:00Z', work_mode: 'office', is_late: false, exception_flag: 'none' },
  { id: 2, employee_id: 102, date: '2026-05-28', clock_in: '2026-05-28T09:30:00Z', clock_out: '2026-05-28T18:30:00Z', work_mode: 'office', is_late: true, exception_flag: 'late' },
  { id: 3, employee_id: 103, date: '2026-05-28', clock_in: '2026-05-28T10:05:00Z', clock_out: '2026-05-28T17:00:00Z', work_mode: 'office', is_late: true, exception_flag: 'late' },
  { id: 4, employee_id: 104, date: '2026-05-28', clock_in: '2026-05-28T08:55:00Z', clock_out: '2026-05-28T17:55:00Z', work_mode: 'wfh', is_late: false, exception_flag: 'none' },
  { id: 5, employee_id: 105, date: '2026-05-28', clock_in: '2026-05-28T09:00:00Z', clock_out: '2026-05-28T18:05:00Z', work_mode: 'office', is_late: false, exception_flag: 'none' },
  { id: 6, employee_id: 106, date: '2026-05-28', clock_in: '2026-05-28T09:12:00Z', clock_out: '2026-05-28T18:00:00Z', work_mode: 'field', is_late: true, exception_flag: 'late' },
  
  // Missed punches/anomalies for exceptions
  { id: 7, employee_id: 102, date: '2026-05-27', clock_in: '2026-05-27T09:00:00Z', clock_out: null, work_mode: 'office', is_late: false, exception_flag: 'missed_punchout' },
  { id: 8, employee_id: 103, date: '2026-05-27', clock_in: null, clock_out: null, work_mode: 'office', is_late: false, exception_flag: 'absent' },
];

export const INITIAL_TIMESHEET_EXCEPTIONS = [
  { id: 1, employee_id: 102, week_start_date: '2026-05-25', exception_type: 'underlogged', logged_hours: 3.5, target_hours: 8.0, date: '2026-05-26', tl_rejection_comment: 'Please log individual details of systems setup.', status: 'open', days_overdue: 3 },
  { id: 2, employee_id: 103, week_start_date: '2026-05-25', exception_type: 'unsubmitted', logged_hours: 0.0, target_hours: 8.0, date: '2026-05-27', tl_rejection_comment: '', status: 'open', days_overdue: 2 },
];

export const INITIAL_LEAVE_BALANCES = [
  { id: 1, employee_id: 101, CL: 6.0, SL: 8.0, EL: 12.0, Maternity: 0.0, Paternity: 15.0, year: 2026 },
  { id: 2, employee_id: 102, CL: 4.5, SL: 7.0, EL: 10.0, Maternity: 0.0, Paternity: 0.0, year: 2026 },
  { id: 3, employee_id: 103, CL: 1.0, SL: 3.0, EL: 5.0, Maternity: 0.0, Paternity: 0.0, year: 2026 },
  { id: 4, employee_id: 104, CL: 8.0, SL: 10.0, EL: 15.0, Maternity: 0.0, Paternity: 0.0, year: 2026 },
  { id: 5, employee_id: 105, CL: 7.5, SL: 9.0, EL: 14.0, Maternity: 26.0, Paternity: 0.0, year: 2026 },
];

export const INITIAL_LEAVE_REQUESTS = [
  { id: 1, employee_id: 104, leave_type: 'CL', from_date: '2026-06-03', to_date: '2026-06-04', days: 2.0, reason: 'Family medical checkup.', status: 'tl_approved', tl_approved_at: '2026-05-29T10:00:00Z', hr_approved_at: null },
  { id: 2, employee_id: 102, leave_type: 'EL', from_date: '2026-06-15', to_date: '2026-06-22', days: 6.0, reason: 'Out of station summer trip.', status: 'pending', tl_approved_at: null, hr_approved_at: null },
];

export const INITIAL_PAYROLL_RUNS = [
  { id: 1, month: 4, year: 2026, status: 'bank_transferred', maker_id: 'Sarah Jenkins', maker_signed_at: '2026-04-28T18:00:00Z', checker_id: 'CEO Suite', checker_signed_at: '2026-04-29T11:00:00Z', bank_transfer_at: '2026-04-30T10:00:00Z' },
];

export const INITIAL_PAYSLIPS = [
  { id: 1, payroll_run_id: 1, employee_id: 101, basic: 40000, hra: 16000, da: 5000, allowances: 9000, epf: 4800, tds: 3200, net: 62000, month: 4, year: 2026 },
  { id: 2, payroll_run_id: 1, employee_id: 102, basic: 25000, hra: 10000, da: 3000, allowances: 4000, epf: 3000, tds: 1200, net: 37800, month: 4, year: 2026 },
];

export const INITIAL_LOANS = [
  { id: 1, employee_id: 102, loan_amount: 50000, emi_amount: 5000, tenure: 10, disbursed_at: '2026-01-10T12:00:00Z', outstanding_balance: 30000, status: 'active' },
];

export const INITIAL_EXPENSE_CLAIMS = [
  { id: 1, employee_id: 106, claim_date: '2026-05-20', amount: 1500, category: 'Travel', receipt_url: '#', tl_approval: 'approved', hr_approval: 'pending', status: 'pending' },
];

export const INITIAL_TDS_DECLARATIONS = [
  { id: 1, employee_id: 101, financial_year: '2026-27', declaration_type: '80C', declared_amount: 150000, proof_url: '#', status: 'verified', verified_by: 'Sarah Jenkins' },
  { id: 2, employee_id: 104, financial_year: '2026-27', declaration_type: 'HRA', declared_amount: 120000, proof_url: '#', status: 'pending', verified_by: null },
];

export const INITIAL_TRAINING_TRACKS = [
  { id: 1, name: 'HMNS Corporate Inductions', department: 'All', modules: [{ id: 1, title: 'Company Policies & Handbook', duration: 30, has_quiz: true }, { id: 2, title: 'IT & Security Guidelines', duration: 45, has_quiz: true }], is_mandatory: true },
];

export const INITIAL_TRAINING_PROGRESS = [
  { id: 1, employee_id: 101, track_id: 1, completed_modules: 2, quiz_score: 95, passed: true },
  { id: 2, employee_id: 104, track_id: 1, completed_modules: 1, quiz_score: 0, passed: false }, // Probation employee, induction incomplete
];

export const INITIAL_CHAT_ROOMS = [
  { id: 1, name: 'HR Department Room', type: 'department', is_active: true },
  { id: 2, name: 'John Doe Screenings', type: 'interview', is_active: true },
];

export const INITIAL_AUDIT_LOGS = [
  { id: 1, timestamp: '2026-05-29T18:22:15Z', initiator_id: 'Sarah Jenkins', module: 'Employees', record_id: 101, action_type: 'verify_doc', change_diff: { document_type: 'Pan Card Verification', is_verified: true }, ip_address: '192.168.1.104', client_agent: 'Chrome / Windows' },
  { id: 2, timestamp: '2026-05-29T16:10:02Z', initiator_id: 'Sarah Jenkins', module: 'Leave', record_id: 1, action_type: 'create', change_diff: { leave_policy: 'Accrual rates quick config adjust' }, ip_address: '192.168.1.104', client_agent: 'Chrome / Windows' },
];

export const LEAVE_POLICIES = [
  { id: 1, type: 'CL', accrual_rule: 'monthly', max_balance: 12, carryover_days: 2, is_active: true },
  { id: 2, type: 'SL', accrual_rule: 'monthly', max_balance: 15, carryover_days: 5, is_active: true },
  { id: 3, type: 'EL', accrual_rule: 'monthly', max_balance: 30, carryover_days: 15, is_active: true },
  { id: 4, type: 'Maternity', accrual_rule: 'onetime', max_balance: 180, carryover_days: 0, is_active: true },
  { id: 5, type: 'Paternity', accrual_rule: 'onetime', max_balance: 15, carryover_days: 0, is_active: true },
];

export const HOLIDAYS = [
  { id: 1, date: '2026-01-26', name: 'Republic Day', type: 'national' },
  { id: 2, date: '2026-08-15', name: 'Independence Day', type: 'national' },
  { id: 3, date: '2026-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { id: 4, date: '2026-12-25', name: 'Christmas Day', type: 'national' },
];
