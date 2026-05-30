import React, { useState } from 'react';
import styles from './team.module.css';
import { Users, CalendarDays, BarChart2, Lightbulb, AlertTriangle, Search } from 'lucide-react';

const TeamDirectory = () => {
  const [activeView, setActiveView] = useState('members'); // 'members', 'calendar', 'workload', 'skills'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTeam, setShowAllTeam] = useState(false);

  // --- Mock Data ---
  const teamMembers = [
    { 
      id: 1, name: 'Alice Chen', role: 'Frontend Developer', 
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
      currentTask: 'Dashboard Redesign (TASK-102)', utilization: 85, skills: ['React', 'CSS', 'Figma']
    },
    { 
      id: 2, name: 'Fiona Gallagher', role: 'UX Designer', 
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
      currentTask: 'User Research (TASK-105)', utilization: 70, skills: ['Figma', 'Sketch', 'UserTesting']
    },
    { 
      id: 3, name: 'Hannah Lee', role: 'Product Manager', 
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
      currentTask: 'Sprint Planning (TASK-110)', utilization: 90, skills: ['Jira', 'Agile', 'Scrum']
    },
    { 
      id: 4, name: 'Bob Smith', role: 'Backend Engineer', 
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      currentTask: 'Payment API Integration (TASK-108)', utilization: 105, skills: ['Node.js', 'PostgreSQL', 'AWS']
    },
    { 
      id: 5, name: 'George Hale', role: 'DevOps Engineer', 
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      currentTask: 'CI/CD Pipeline Fix (TASK-115)', utilization: 80, skills: ['Docker', 'Kubernetes', 'AWS']
    },
    { 
      id: 6, name: 'Charlie Davis', role: 'Fullstack Developer', 
      avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=150',
      currentTask: 'User Profile Page (TASK-120)', utilization: 65, skills: ['React', 'Node.js', 'MongoDB']
    },
    { 
      id: 7, name: 'Diana Prince', role: 'Security Analyst', 
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      currentTask: 'Penetration Testing (TASK-125)', utilization: 110, skills: ['Cybersecurity', 'Python', 'Linux']
    },
    { 
      id: 8, name: 'Evan Wright', role: 'QA Engineer', 
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
      currentTask: 'E2E Testing Suite (TASK-112)', utilization: 60, skills: ['Cypress', 'Python', 'Testing']
    },
    { 
      id: 9, name: 'Ivy Green', role: 'Data Scientist', 
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=150',
      currentTask: 'Machine Learning Model (TASK-130)', utilization: 95, skills: ['Python', 'TensorFlow', 'SQL']
    },
    { 
      id: 10, name: 'Jack White', role: 'Frontend Developer', 
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=150',
      currentTask: 'Landing Page Updates (TASK-135)', utilization: 75, skills: ['Vue.js', 'CSS', 'JavaScript']
    },
    { 
      id: 11, name: 'Kevin Taylor', role: 'Mobile Developer', 
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
      currentTask: 'iOS App Build (TASK-140)', utilization: 88, skills: ['Swift', 'React Native', 'Firebase']
    }
  ];

  const calendarEvents = [
    { day: 12, type: 'leave', label: 'Alice (Leave)' },
    { day: 13, type: 'leave', label: 'Alice (Leave)' },
    { day: 20, type: 'leave', label: 'Diana (Leave)' },
    { day: 20, type: 'leave', label: 'Fiona (Leave)' },
    { day: 20, type: 'leave', label: 'George (Leave)' },
    { day: 20, type: 'leave', label: 'Hannah (Leave)' },
    { day: 14, type: 'wfh', label: 'Bob (WFH)' },
    { day: 25, type: 'holiday', label: 'Public Holiday' }
  ];

  const workloadData = [
    { name: 'Alice Chen', tasks: 4, estHours: 32, actHours: 28, util: 85 },
    { name: 'Fiona Gallagher', tasks: 3, estHours: 24, actHours: 20, util: 70 },
    { name: 'Hannah Lee', tasks: 5, estHours: 40, actHours: 36, util: 90 },
    { name: 'Bob Smith', tasks: 6, estHours: 40, actHours: 42, util: 105 },
    { name: 'George Hale', tasks: 4, estHours: 32, actHours: 28, util: 80 },
    { name: 'Charlie Davis', tasks: 3, estHours: 24, actHours: 16, util: 65 },
    { name: 'Diana Prince', tasks: 6, estHours: 40, actHours: 46, util: 110 },
    { name: 'Evan Wright', tasks: 3, estHours: 24, actHours: 14, util: 60 },
    { name: 'Ivy Green', tasks: 5, estHours: 40, actHours: 38, util: 95 },
    { name: 'Jack White', tasks: 4, estHours: 32, actHours: 26, util: 75 },
    { name: 'Kevin Taylor', tasks: 5, estHours: 40, actHours: 35, util: 88 },
  ];

  const skillMatrix = [
    { name: 'Alice Chen', React: 5, Node: 2, AWS: 1, Python: 1, SQL: 3 },
    { name: 'Fiona Gallagher', React: 1, Node: 1, AWS: 1, Python: 1, SQL: 1 },
    { name: 'Hannah Lee', React: 2, Node: 2, AWS: 2, Python: 2, SQL: 3 },
    { name: 'Bob Smith', React: 3, Node: 5, AWS: 4, Python: 3, SQL: 5 },
    { name: 'George Hale', React: 2, Node: 3, AWS: 5, Python: 4, SQL: 3 },
    { name: 'Charlie Davis', React: 4, Node: 4, AWS: 3, Python: 2, SQL: 4 },
    { name: 'Diana Prince', React: 1, Node: 2, AWS: 4, Python: 5, SQL: 4 },
    { name: 'Evan Wright', React: 2, Node: 2, AWS: 2, Python: 5, SQL: 4 },
    { name: 'Ivy Green', React: 1, Node: 2, AWS: 3, Python: 5, SQL: 5 },
    { name: 'Jack White', React: 4, Node: 2, AWS: 1, Python: 2, SQL: 2 },
    { name: 'Kevin Taylor', React: 3, Node: 1, AWS: 2, Python: 1, SQL: 2 },
  ];

  // Helpers
  const getWorkloadColor = (util) => {
    if (util > 100) return 'var(--danger)';
    if (util >= 80) return 'var(--warning)';
    return 'var(--success)';
  };

  const renderDots = (score) => {
    return (
      <div className={styles.skillScore}>
        {[1, 2, 3, 4, 5].map(v => (
          <div key={v} className={`${styles.dot} ${v <= score ? styles.active : ''}`} />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Navigation Toolbar */}
      <div className={styles.topToolbar}>
        <button 
          className={`${styles.navTab} ${activeView === 'members' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('members')}
        >
          <Users size={16} /> Members
        </button>
        <button 
          className={`${styles.navTab} ${activeView === 'workload' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('workload')}
        >
          <BarChart2 size={16} /> Workload
        </button>
        <button 
          className={`${styles.navTab} ${activeView === 'calendar' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('calendar')}
        >
          <CalendarDays size={16} /> Availability
        </button>
        <button 
          className={`${styles.navTab} ${activeView === 'skills' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('skills')}
        >
          <Lightbulb size={16} /> Skill Matrix
        </button>
      </div>

      <div className={styles.viewContainer}>
        
        {/* View 1: My Team Members List */}
        {activeView === 'members' && (
          <div>
            <div className={styles.topToolbar} style={{ marginBottom: '24px', justifyContent: 'flex-end', padding: '12px 24px' }}>
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search employees..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', 
                    border: '1px solid var(--border-input)', background: 'transparent', 
                    color: 'var(--text-main)', fontSize: '14px', outline: 'none'
                  }} 
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className={styles.sectionTitle} style={{ margin: 0 }}>Team Profile Overview</div>
              {!searchQuery && (
                <button 
                  onClick={() => setShowAllTeam(!showAllTeam)} 
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  {showAllTeam ? 'Show less' : 'View all team'}
                </button>
              )}
            </div>
            <div className={styles.cardGrid}>
              {teamMembers
                .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, (showAllTeam || searchQuery) ? teamMembers.length : 3)
                .map(member => (
                <div key={member.id} className={styles.teamCard}>
                  <img src={member.avatar} alt={member.name} className={styles.avatar} />
                  <div className={styles.empName}>{member.name}</div>
                  <div className={styles.empRole}>{member.role}</div>
                  
                  <div className={styles.currentTask}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Current Task</div>
                    {member.currentTask}
                  </div>

                  <div className={styles.utilizationWrap}>
                    <div className={styles.utilizationLabel}>
                      <span>Utilization</span>
                      <span>{member.utilization}%</span>
                    </div>
                    <div className={styles.utilBarBg}>
                      <div 
                        className={styles.utilBarFill} 
                        style={{ 
                          width: `${Math.min(member.utilization, 100)}%`,
                          background: getWorkloadColor(member.utilization)
                        }} 
                      />
                    </div>
                  </div>

                  <div className={styles.skillsWrap}>
                    {member.skills.map((skill, idx) => (
                      <span key={idx} className={styles.skillTag}>{skill}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View 2: Team Availability Calendar */}
        {activeView === 'calendar' && (
          <div>
            <div className={styles.sectionTitle}>May 2026 Availability Tracker</div>
            
            <div className={styles.overlapWarning}>
              <AlertTriangle size={18} />
              Warning: High overlap on May 20. 4 out of 10 team members (40%) are on leave.
            </div>

            <div className={styles.calendarGrid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className={styles.calHeader}>{d}</div>
              ))}
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const events = calendarEvents.filter(e => e.day === day);
                // May 2026 starts on Friday (idx 5)
                const isOffset = i === 0 ? { gridColumnStart: 6 } : {};
                
                return (
                  <div key={day} className={styles.calCell} style={isOffset}>
                    <div className={styles.calDayNum}>{day}</div>
                    {events.map((ev, idx) => (
                      <div key={idx} className={`${styles.calBadge} ${styles[ev.type]}`}>
                        {ev.label}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View 3: Workload View */}
        {activeView === 'workload' && (
          <div>
            <div className={styles.sectionTitle}>Current Sprint Workload Distribution</div>
            <div className={styles.workloadList}>
              {workloadData.map((data, idx) => (
                <div key={idx} className={styles.workloadItem}>
                  <div className={styles.wlHeader}>
                    <div className={styles.wlName}>{data.name}</div>
                    <div className={styles.wlStats}>
                      <span>Tasks: <strong>{data.tasks}</strong></span>
                      <span>Est: <strong>{data.estHours}h</strong></span>
                      <span>Act: <strong>{data.actHours}h</strong></span>
                      <span>Util: <strong style={{ color: getWorkloadColor(data.util) }}>{data.util}%</strong></span>
                    </div>
                  </div>
                  <div className={styles.wlBarBg}>
                    <div 
                      className={styles.wlBarFill} 
                      style={{ 
                        width: `${Math.min(data.util, 100)}%`,
                        background: getWorkloadColor(data.util)
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View 4: Skill Matrix Table */}
        {activeView === 'skills' && (
          <div>
            <div className={styles.sectionTitle}>Team Skill Matrix Overview</div>
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>React</th>
                  <th>Node.js</th>
                  <th>AWS</th>
                  <th>Python</th>
                  <th>SQL</th>
                </tr>
              </thead>
              <tbody>
                {skillMatrix.map((emp, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td>{renderDots(emp.React)}</td>
                    <td>{renderDots(emp.Node)}</td>
                    <td>{renderDots(emp.AWS)}</td>
                    <td>{renderDots(emp.Python)}</td>
                    <td>{renderDots(emp.SQL)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default TeamDirectory;
