import React, { useState, lazy, Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';

const Dashboard = lazy(() => import('./Dashboard/dashboard.module'));
const Team = lazy(() => import('./Team/team.module'));
const Projects = lazy(() => import('./Projects/projects.index'));
const Tasks = lazy(() => import('./Tasks/index'));
const Attendance = lazy(() => import('./Attendance/TeamAttendance'));
const Timesheets = lazy(() => import('./Timesheets/index'));
const Reports = lazy(() => import('./Reports/index'));
const Escalations = lazy(() => import('./Escalations/index'));
const Approvals = lazy(() => import('./Approvals/index'));
const MessagingAndMeet = lazy(() => import('./Messaging & Meet/messages.module.index'));
const Performance = lazy(() => import('./Performance/index'));

export default function Tl({ activeTab, setActiveTab, currentUser }) {
  const [selectedChatUser, setSelectedChatUser] = useState(null);

  const fallbackLoader = (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
      <div className="animate-spin" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', width: '40px', height: '40px' }}></div>
    </div>
  );

  return (
    <div className="component-container">
      <Suspense fallback={fallbackLoader}>
        {activeTab === 'dashboard' && (
          <ErrorBoundary><Dashboard setActiveTab={setActiveTab} setSelectedChatUser={setSelectedChatUser} /></ErrorBoundary>
        )}
        {activeTab === 'team' && (
          <ErrorBoundary><Team setActiveTab={setActiveTab} /></ErrorBoundary>
        )}
        {activeTab === 'projects' && (
          <ErrorBoundary><Projects /></ErrorBoundary>
        )}
        {activeTab === 'tasks' && (
          <ErrorBoundary><Tasks currentUser={currentUser} /></ErrorBoundary>
        )}
        {activeTab === 'attendance' && (
          <ErrorBoundary><Attendance /></ErrorBoundary>
        )}
        {activeTab === 'timesheets' && (
          <ErrorBoundary><Timesheets /></ErrorBoundary>
        )}
        {activeTab === 'approvals' && (
          <ErrorBoundary><Approvals /></ErrorBoundary>
        )}
        {activeTab === 'reports' && (
          <ErrorBoundary><Reports /></ErrorBoundary>
        )}
        {activeTab === 'escalations' && (
          <ErrorBoundary><Escalations /></ErrorBoundary>
        )}
        {activeTab === 'messaging' && (
          <ErrorBoundary><MessagingAndMeet initialSelectedChannel={selectedChatUser} currentUser={currentUser} /></ErrorBoundary>
        )}
        {activeTab === 'performance' && (
          <ErrorBoundary><Performance currentUser={currentUser} /></ErrorBoundary>
        )}
      </Suspense>
      
      {activeTab !== 'dashboard' && activeTab !== 'team' && activeTab !== 'projects' && activeTab !== 'tasks' && activeTab !== 'attendance' && activeTab !== 'timesheets' && activeTab !== 'approvals' && activeTab !== 'reports' && activeTab !== 'escalations' && activeTab !== 'messaging' && activeTab !== 'performance' && (
        <>
          <div className="component-header">
            <div>
              <h1>Team Lead Dashboard</h1>
              <p>Supervise scrum pipelines, sprint reviews, team workloads, and software build timelines.</p>
            </div>
          </div>
          
          <div className="tab-pane" style={{ padding: '60px 40px', textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Sprint Engineering Workspace Ready</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '480px', margin: '0 auto' }}>
              This is your clean Team Lead dashboard canvas. Developers can add Kanban boards, sprint charts, code reviews, and milestone timelines here.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
