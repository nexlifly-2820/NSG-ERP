import React, { useState, useEffect } from 'react';
import styles from './attendance.module.css';

// Import Mock Database
import { 
  shiftInfo, 
  attendanceInsights, 
  weeklyHours, 
  calendarStatusLogs, 
  attendanceLogs,
  teamAttendanceData
} from './attendanceMockData';

// Import Reusable Sub-components
import AttendanceHero from './AttendanceHero';
import PunchCard from './PunchCard';
import AttendanceStats from './AttendanceStats';
import AttendanceInsights from './AttendanceInsights';
import WeeklyHoursChart from './WeeklyHoursChart';
import AttendanceHeatmap from './AttendanceHeatmap';
import ShiftInfoCard from './ShiftInfoCard';
import BreakTracker from './BreakTracker';
import AttendanceFilters from './AttendanceFilters';
import AttendanceTable from './AttendanceTable';
import MobileAttendanceCard from './MobileAttendanceCard';
import AttendanceCalendar from './AttendanceCalendar';
import TeamAttendance from './TeamAttendance';
import AttendanceDetailsModal from './AttendanceDetailsModal';
import AttendanceCorrectionModal from './AttendanceCorrectionModal';
import LoadingSkeleton from './LoadingSkeleton';

/**
 * Attendance Module (Main Container)
 * 
 * Acts as the centralized dashboard for employee attendance.
 * Handles primary state (active tab, modal visibility) and orchestrates 
 * the responsive grid layout (Hero -> Stats -> Analytics -> History Table).
 */
const Attendance = () => {
  // Navigation Tab State: 'info', 'breaks', 'sessions', 'calendar', 'heatmap', 'team'
  const [activeTab, setActiveTab] = useState('info');

  // Core State Managers
  const [logs, setLogs] = useState(attendanceLogs);
  const [status, setStatus] = useState('Checked Out'); // 'Checked In', 'Checked Out', 'On Break'
  
  // Timers and Clocks
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workSeconds, setWorkSeconds] = useState(0);
  const [lunchSeconds, setLunchSeconds] = useState(0);
  const [personalSeconds, setPersonalSeconds] = useState(0);
  const [activeBreakType, setActiveBreakType] = useState(null); // 'lunch', 'personal'

  // Filter Panel States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Modals Visibility
  const [selectedLog, setSelectedLog] = useState(null);
  const [correctionDate, setCorrectionDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Clock tick ticker hook
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Active Session Work & Break Tickers
  useEffect(() => {
    let interval = null;
    if (status === 'Checked In') {
      interval = setInterval(() => {
        setWorkSeconds(prev => prev + 1);
      }, 1000);
    } else if (status === 'On Break') {
      interval = setInterval(() => {
        if (activeBreakType === 'lunch') {
          setLunchSeconds(prev => prev + 1);
        } else {
          setPersonalSeconds(prev => prev + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, activeBreakType]);

  // 3. Biometric action handler
  const handlePunchAction = (action) => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const todayStr = '2026-05-24'; // Fixed context date

      if (action === 'in') {
        setStatus('Checked In');
        
        // Register Check-in record
        const checkInHour = new Date().getHours();
        const checkInMin = new Date().getMinutes();
        const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMin > 15);

        const newLog = {
          id: logs.length + 1,
          date: todayStr,
          shift: shiftInfo.name,
          checkIn: timeStr,
          checkOut: '—',
          breakDuration: '0 Mins',
          workingHours: '0.0 Hrs',
          overtime: '0.0 Hrs',
          status: isLate ? 'Late' : 'Present',
          notes: 'Punch-in verified via Face-ID.'
        };

        setLogs(prev => [newLog, ...prev]);

      } else if (action === 'out') {
        setStatus('Checked Out');

        // Update working hours check-out details
        const totalHours = ((workSeconds / 3600) + 8).toFixed(1); // Standard base mock + dynamic
        const totalOvertime = totalHours > 8.0 ? (totalHours - 8.0).toFixed(1) : '0.0';
        const totalBreaks = Math.floor((lunchSeconds + personalSeconds) / 60);

        setLogs(prev => prev.map(log => {
          if (log.date === todayStr) {
            return {
              ...log,
              checkOut: timeStr,
              workingHours: `${totalHours} Hrs`,
              overtime: `${totalOvertime} Hrs`,
              breakDuration: `${totalBreaks} Mins`
            };
          }
          return log;
        }));

        setWorkSeconds(0);
        setLunchSeconds(0);
        setPersonalSeconds(0);
        setActiveBreakType(null);

      } else if (action === 'break_start') {
        setStatus('On Break');
        // Alternates break type dynamically
        setActiveBreakType(lunchSeconds === 0 ? 'lunch' : 'personal');

      } else if (action === 'break_end') {
        setStatus('Checked In');
        setActiveBreakType(null);
      }
    }, 400);
  };

  // 4. Submit manual correction request
  const handleCorrectionSubmit = (requestDetails) => {
    setLogs(prev => prev.map(log => {
      if (log.date === requestDetails.date) {
        return {
          ...log,
          status: 'Pending Correction',
          notes: `Correction request pending: change to ${requestDetails.correctTime}. Reason: ${requestDetails.reason}`
        };
      }
      return log;
    }));

    setCorrectionDate(null);
    alert('Attendance correction request filed successfully and routed to supervisor workflow.');
  };

  // 5. Query Filters execution
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.shift.toLowerCase().includes(search.toLowerCase()) || 
      (log.notes && log.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'All' || 
      log.status === statusFilter;

    const matchesDate = 
      !dateFilter || 
      log.date === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setDateFilter('');
  };

  // Calculate dynamic weekly hours from logs
  const dynamicWeeklyHours = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(dayName => {
    const logForDay = logs.find(log => {
      const dateParts = log.date.split('-');
      const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return names[dateObj.getDay()] === dayName;
    });
    
    return {
      day: dayName,
      hours: logForDay ? parseFloat(logForDay.workingHours) || 0 : 0
    };
  });

  return (
    <div className={styles.attendanceContainer}>
      
      {/* 1. Page Header Section */}
      {activeTab !== 'team' && (
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.headerTitle}>Attendance Portal</h1>
            <p className={styles.headerSubtitle}>
              Manage your daily check-ins, breaks, shift status, and monthly schedules.
            </p>
          </div>

          <div className={styles.headerMetrics}>
            <div className={styles.headerWidget}>
              <span className={styles.widgetLabel}>Clocked Duration</span>
              <span className={styles.widgetVal}>
                {status === 'Checked In' ? 'Active Work' : status === 'On Break' ? 'On Break' : 'Off Duty'}
              </span>
            </div>
            <div className={styles.headerWidget}>
              <span className={styles.widgetLabel}>Target Shift</span>
              <span className={styles.widgetVal} style={{ color: 'var(--att-text-primary)' }}>
                09:00 AM - 06:00 PM
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB NAVIGATION */}
      {activeTab !== 'team' && (
        <div className={styles.tabsNavbar}>
          <button
            className={`${styles.tabButton} ${activeTab === 'info' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Attendance Information
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'breaks' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('breaks')}
          >
            Today's Break Activity
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'sessions' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Daily Work Session Records
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'calendar' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            Attendance Calendar View
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'heatmap' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            Monthly Attendance Heatmap
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'team' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('team')}
          >
            View Team Attendance details
          </button>
        </div>
      )}

      {/* --- TAB CONDITIONAL RENDERING --- */}

      {/* T1: ATTENDANCE INFORMATION */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Dashboard Top Row: Greetings Hero and Punch Controller */}
          <div className={styles.dashboardSection}>
            <AttendanceHero 
              status={status} 
              workSeconds={workSeconds} 
              currentTime={currentTime} 
            />
            
            <PunchCard 
              status={status} 
              onPunchAction={handlePunchAction} 
            />
          </div>

          {/* Summary stats cards */}
          <AttendanceStats stats={attendanceInsights} totalExpected={20} />

          {/* AI Insights & Shift Info Card side-by-side on desktop */}
          <div className={styles.insightsBreakSection}>
            <AttendanceInsights insights={attendanceInsights} />
            <ShiftInfoCard shift={shiftInfo} />
          </div>
        </div>
      )}

      {/* T2: TODAY'S BREAK ACTIVITY */}
      {activeTab === 'breaks' && (
        <div className={styles.contentPanel}>
          <BreakTracker 
            lunchSeconds={lunchSeconds} 
            personalSeconds={personalSeconds} 
            isBreakActive={status === 'On Break'} 
          />
        </div>
      )}

      {/* T3: DAILY WORK SESSION RECORDS */}
      {activeTab === 'sessions' && (
        <div className={styles.contentPanel}>
          <div className={styles.sessionsPanelHeader}>
            <h3 className={styles.insightHeadingText} style={{ margin: '0' }}>
              Daily Work Session Records
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--att-text-secondary)' }}>
              Showing logged work sessions
            </span>
          </div>

          {/* Filter Input panel */}
          <AttendanceFilters 
            search={search}
            setSearch={setSearch}
            status={statusFilter}
            setStatus={setStatusFilter}
            date={dateFilter}
            setDate={setDateFilter}
            onReset={handleResetFilters}
          />

          {/* Loading state skeleton fallback or logs table */}
          {isLoading ? (
            <LoadingSkeleton type="table" />
          ) : (
            <>
              <AttendanceTable 
                logs={filteredLogs} 
                onViewDetails={setSelectedLog} 
                onCorrection={setCorrectionDate} 
              />
              
              {/* Mobile Stack Cards representation */}
              <MobileAttendanceCard 
                logs={filteredLogs} 
                onViewDetails={setSelectedLog} 
                onCorrection={setCorrectionDate} 
              />
            </>
          )}
        </div>
      )}

      {/* T4: ATTENDANCE CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className={styles.contentPanel}>
          <AttendanceCalendar logs={logs} />
        </div>
      )}

      {/* T5: MONTHLY ATTENDANCE HEATMAP */}
      {activeTab === 'heatmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Weekly charts & visual heatmaps */}
          <div className={styles.analyticsSection}>
            <WeeklyHoursChart data={dynamicWeeklyHours} />
            <AttendanceHeatmap logs={logs} />
          </div>
        </div>
      )}

      {/* T6: VIEW TEAM ATTENDANCE DETAILS */}
      {activeTab === 'team' && (
        <TeamAttendance onBack={() => setActiveTab('info')} />
      )}

      {/* --- Overlay Modals controllers --- */}

      {/* Details modal overlay */}
      {selectedLog && (
        <AttendanceDetailsModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}

      {/* Correction form modal overlay */}
      {correctionDate && (
        <AttendanceCorrectionModal 
          date={correctionDate} 
          onSubmit={handleCorrectionSubmit} 
          onClose={() => setCorrectionDate(null)} 
        />
      )}

    </div>
  );
};

export default Attendance;

