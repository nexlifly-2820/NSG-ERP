// Premium SaaS Employee Attendance Mock Database

export const shiftInfo = {
  name: 'General Day Shift',
  timing: '09:00 AM - 06:00 PM',
  graceTime: '15 Mins (09:15 AM)',
  weeklyOffs: 'Saturday & Sunday',
  requiredHours: 8.0
};

export const attendanceInsights = {
  punctualityRate: '94%',
  averageWorkHours: '8h 42m',
  attendanceStreak: '15 Days',
  consistencyLevel: 'Excellent',
  overtimeTotal: '12.5 Hrs'
};

export const weeklyHours = [
  { day: 'Mon', hours: 8.5 },
  { day: 'Tue', hours: 9.0 },
  { day: 'Wed', hours: 8.0 },
  { day: 'Thu', hours: 8.8 },
  { day: 'Fri', hours: 8.2 }
];

export const calendarStatusLogs = [
  { date: '2026-05-01', status: 'Present' },
  { date: '2026-05-04', status: 'Present' },
  { date: '2026-05-05', status: 'Late' },
  { date: '2026-05-06', status: 'Present' },
  { date: '2026-05-07', status: 'Present' },
  { date: '2026-05-08', status: 'Leave' },
  { date: '2026-05-11', status: 'Present' },
  { date: '2026-05-12', status: 'Present' },
  { date: '2026-05-13', status: 'Late' },
  { date: '2026-05-14', status: 'Present' },
  { date: '2026-05-15', status: 'Present' },
  { date: '2026-05-18', status: 'Present' },
  { date: '2026-05-19', status: 'Absent' },
  { date: '2026-05-20', status: 'Present' },
  { date: '2026-05-21', status: 'Present' },
  { date: '2026-05-22', status: 'Present' }
];

export const attendanceLogs = [
  {
    id: 1,
    date: '2026-05-22',
    shift: 'General Day Shift',
    checkIn: '08:52 AM',
    checkOut: '06:05 PM',
    breakDuration: '48 Mins',
    workingHours: '8.3 Hrs',
    overtime: '0.3 Hrs',
    status: 'Present',
    notes: 'Arrived early, completed sprint handovers.'
  },
  {
    id: 2,
    date: '2026-05-21',
    shift: 'General Day Shift',
    checkIn: '08:58 AM',
    checkOut: '06:10 PM',
    breakDuration: '52 Mins',
    workingHours: '8.2 Hrs',
    overtime: '0.2 Hrs',
    status: 'Present',
    notes: 'Regular check-in, completed tickets.'
  },
  {
    id: 3,
    date: '2026-05-20',
    shift: 'General Day Shift',
    checkIn: '09:02 AM',
    checkOut: '06:02 PM',
    breakDuration: '45 Mins',
    workingHours: '8.0 Hrs',
    overtime: '0.0 Hrs',
    status: 'Present',
    notes: 'Checking in within grace time.'
  },
  {
    id: 4,
    date: '2026-05-19',
    shift: 'General Day Shift',
    checkIn: '—',
    checkOut: '—',
    breakDuration: '0 Mins',
    workingHours: '0.0 Hrs',
    overtime: '0.0 Hrs',
    status: 'Absent',
    notes: 'Unannounced absence. Correction required.'
  },
  {
    id: 5,
    date: '2026-05-18',
    shift: 'General Day Shift',
    checkIn: '08:45 AM',
    checkOut: '06:15 PM',
    breakDuration: '50 Mins',
    workingHours: '8.5 Hrs',
    overtime: '0.5 Hrs',
    status: 'Present',
    notes: 'Early entry, deployed backend fix.'
  },
  {
    id: 6,
    date: '2026-05-15',
    shift: 'General Day Shift',
    checkIn: '08:54 AM',
    checkOut: '06:00 PM',
    breakDuration: '55 Mins',
    workingHours: '8.1 Hrs',
    overtime: '0.1 Hrs',
    status: 'Present',
    notes: 'Completed task summaries.'
  },
  {
    id: 7,
    date: '2026-05-14',
    shift: 'General Day Shift',
    checkIn: '08:50 AM',
    checkOut: '06:12 PM',
    breakDuration: '48 Mins',
    workingHours: '8.4 Hrs',
    overtime: '0.4 Hrs',
    status: 'Present',
    notes: 'Clean session.'
  },
  {
    id: 8,
    date: '2026-05-13',
    shift: 'General Day Shift',
    checkIn: '09:22 AM',
    checkOut: '06:00 PM',
    breakDuration: '58 Mins',
    workingHours: '7.6 Hrs',
    overtime: '0.0 Hrs',
    status: 'Late',
    notes: 'Traffic delay on highway route.'
  },
  {
    id: 9,
    date: '2026-05-12',
    shift: 'General Day Shift',
    checkIn: '08:55 AM',
    checkOut: '06:08 PM',
    breakDuration: '42 Mins',
    workingHours: '8.2 Hrs',
    overtime: '0.2 Hrs',
    status: 'Present',
    notes: 'Standard day logs.'
  },
  {
    id: 10,
    date: '2026-05-11',
    shift: 'General Day Shift',
    checkIn: '08:51 AM',
    checkOut: '06:02 PM',
    breakDuration: '45 Mins',
    workingHours: '8.2 Hrs',
    overtime: '0.2 Hrs',
    status: 'Present',
    notes: 'Sprint kickoff attendance.'
  },
  {
    id: 11,
    date: '2026-05-08',
    shift: 'General Day Shift',
    checkIn: '—',
    checkOut: '—',
    breakDuration: '0 Mins',
    workingHours: '0.0 Hrs',
    overtime: '0.0 Hrs',
    status: 'Leave',
    notes: 'Approved Vacation Leave (Medical recovery).'
  },
  {
    id: 12,
    date: '2026-05-07',
    shift: 'General Day Shift',
    checkIn: '08:57 AM',
    checkOut: '06:00 PM',
    breakDuration: '50 Mins',
    workingHours: '8.0 Hrs',
    overtime: '0.0 Hrs',
    status: 'Present',
    notes: 'Standard log.'
  },
  {
    id: 13,
    date: '2026-05-06',
    shift: 'General Day Shift',
    checkIn: '08:59 AM',
    checkOut: '06:04 PM',
    breakDuration: '45 Mins',
    workingHours: '8.1 Hrs',
    overtime: '0.1 Hrs',
    status: 'Present',
    notes: 'Standard log.'
  },
  {
    id: 14,
    date: '2026-05-05',
    shift: 'General Day Shift',
    checkIn: '09:18 AM',
    checkOut: '06:00 PM',
    breakDuration: '45 Mins',
    workingHours: '7.7 Hrs',
    overtime: '0.0 Hrs',
    status: 'Late',
    notes: 'Carpool coordination delay.'
  },
  {
    id: 15,
    date: '2026-05-04',
    shift: 'General Day Shift',
    checkIn: '08:48 AM',
    checkOut: '06:08 PM',
    breakDuration: '50 Mins',
    workingHours: '8.3 Hrs',
    overtime: '0.3 Hrs',
    status: 'Present',
    notes: 'Regular check-in.'
  },
  {
    id: 16,
    date: '2026-05-01',
    shift: 'General Day Shift',
    checkIn: '08:56 AM',
    checkOut: '06:02 PM',
    breakDuration: '48 Mins',
    workingHours: '8.1 Hrs',
    overtime: '0.1 Hrs',
    status: 'Present',
    notes: 'May Day check-in records.'
  }
];

export const teamAttendanceData = [
  {
    id: 1,
    employeeName: 'Sarah Jenkins',
    role: 'Frontend Engineer',
    status: 'Present',
    checkIn: '08:50 AM',
    avatar: 'SJ'
  },
  {
    id: 2,
    employeeName: 'David Kim',
    role: 'UX Designer',
    status: 'Late',
    checkIn: '09:25 AM',
    avatar: 'DK'
  },
  {
    id: 3,
    employeeName: 'Marcus Johnson',
    role: 'Backend Engineer',
    status: 'On Break',
    checkIn: '08:55 AM',
    avatar: 'MJ'
  },
  {
    id: 4,
    employeeName: 'Emily Chen',
    role: 'Product Manager',
    status: 'Leave',
    checkIn: '—',
    avatar: 'EC'
  },
  {
    id: 5,
    employeeName: 'James Wilson',
    role: 'QA Tester',
    status: 'Present',
    checkIn: '08:58 AM',
    avatar: 'JW'
  }
];
