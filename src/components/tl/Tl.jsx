import React, { useState } from 'react';
import Dashboard from './Dashboard/dashboard.module';
import Team from './Team/team.module';
import Projects from './Projects/projects.index';
import Tasks from './Tasks/index';
import Attendance from './Attendance/TeamAttendance';
import ErrorBoundary from './ErrorBoundary';
import Timesheets from './Timesheets/index';
import Reports from './Reports/index';
import Escalations from './Escalations/index';
import Approvals from './Approvals/index';
import MessagingAndMeet from './Messaging & Meet/messages.module.index';
import Performance from './Performance/index';

export default function Tl({ activeTab, setActiveTab, currentUser }) {
  const [selectedChatUser, setSelectedChatUser] = useState(null);

  return (
    <div className="component-container">
      <ErrorBoundary>
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} setSelectedChatUser={setSelectedChatUser} />}
        {activeTab === 'team' && <Team setActiveTab={setActiveTab} />}
        {activeTab === 'projects' && <Projects />}
        {activeTab === 'tasks' && <Tasks currentUser={currentUser} />}
        {activeTab === 'attendance' && <Attendance />}
        {activeTab === 'timesheets' && <Timesheets />}
        {activeTab === 'approvals' && <Approvals />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'escalations' && <Escalations />}
        {activeTab === 'messaging' && <MessagingAndMeet initialSelectedChannel={selectedChatUser} currentUser={currentUser} />}
        {activeTab === 'performance' && <Performance currentUser={currentUser} />}
      </ErrorBoundary>
      
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
