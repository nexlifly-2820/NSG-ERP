import Expenses from './Expenses';
import Profile from './Profile';
import Resignation from './Resignation';
import Help from './Help';
import Assets from './Assets';
import Messaging from './Messaging';
import Attendance from './Attendance';
import Timesheet from './Timesheet';
import Tasks from './Tasks';
import Leave from './Leave';
import Payroll from './Payroll';

export default function Employee({ activeTab, db, onUpdateDb }) {
  if (activeTab === 'attendance') {
    return <Attendance db={db} onUpdateDb={onUpdateDb} />;
  }

  if (activeTab === 'timesheet') {
    return <Timesheet db={db} onUpdateDb={onUpdateDb} />;
  }

  if (activeTab === 'tasks') {
    return <Tasks db={db} onUpdateDb={onUpdateDb} />;
  }

  if (activeTab === 'leave') {
    return <Leave db={db} onUpdateDb={onUpdateDb} />;
  }

  if (activeTab === 'payroll') {
    return <Payroll db={db} onUpdateDb={onUpdateDb} />;
  }

  if (activeTab === 'expenses') {
    return <Expenses db={db} onUpdateDb={onUpdateDb} />;
  }

  if (activeTab === 'profile') {
    return <Profile db={db} onUpdateDb={onUpdateDb} />;
  }

  if (activeTab === 'resignation') {
    return <Resignation />;
  }

  if (activeTab === 'help') {
    return <Help />;
  }

  if (activeTab === 'assets') {
    return <Assets />;
  }

  if (activeTab === 'messaging') {
    return <Messaging />;
  }

  return (
    <div className="component-container emp-root">
      <div className="component-header">
        <div>
          <h1>Employee Dashboard</h1>
          <p>Organize your day-to-day deliverables, submit your timecards, and review your benefits.</p>
        </div>
      </div>

      <div className="tab-pane" style={{ padding: '60px 40px', textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Staff Workspace Ready</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '480px', margin: '0 auto' }}>
          This is your clean Employee dashboard canvas. Developers can add task checklists, timecards, logging charts, and benefit summaries here.
        </p>
      </div>
    </div>
  );
}