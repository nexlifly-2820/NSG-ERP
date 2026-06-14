import React, { useState } from 'react';
import styles from './team.module.css';
import { Users, CalendarDays, BarChart2, Lightbulb, AlertTriangle, Search } from 'lucide-react';

const TeamDirectory = () => {
  const [activeView, setActiveView] = useState('members'); // 'members', 'calendar', 'workload', 'skills'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTeam, setShowAllTeam] = useState(false);

  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const [empRes, tasksRes, leavesRes, skillsRes] = await Promise.all([
          fetch('/api/team-lead/team-members', { headers }),
          fetch('/api/team-lead/tasks', { headers }),
          fetch('/api/team-lead/team-availability', { headers }),
          fetch('/api/team-lead/team-skills', { headers })
        ]);
        
        if (empRes.ok) {
          const rawEmps = await empRes.json();
          setTeamMembers(rawEmps.map(emp => ({
            id: emp.id,
            name: emp.name,
            role: emp.designation || emp.role || 'Team Member',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`
          })));
        }
        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (leavesRes.ok) setLeaves(await leavesRes.json());
        if (skillsRes.ok) setSkills(await skillsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const workloadData = React.useMemo(() => {
    return teamMembers.map(emp => {
      const empTasks = tasks.filter(t => t.assignee_id === emp.id || t.user_id === emp.id);
      const estHours = empTasks.reduce((acc, t) => acc + ((t.sp || 1) * 4), 0);
      const actHours = estHours > 0 ? Math.round(estHours * 0.8) : 0;
      const util = estHours > 0 ? Math.round((actHours / estHours) * 100) : 0;
      return {
        name: emp.name,
        tasks: empTasks.length,
        estHours,
        actHours,
        util: util
      };
    });
  }, [teamMembers, tasks]);

  const displayMembers = teamMembers.map(emp => {
    const activeTask = tasks.find(t => (t.assignee_id === emp.id || t.user_id === emp.id) && t.status !== 'Done');
    const empWl = workloadData.find(w => w.name === emp.name);
    const empSkills = skills.filter(s => s.user_id === emp.id).map(s => s.skill_name);
    return {
      ...emp,
      currentTask: activeTask ? `${activeTask.title} (${activeTask.project})` : 'No active tasks',
      utilization: empWl ? empWl.util : 0,
      skills: empSkills.length > 0 ? empSkills : ['General']
    };
  });

  const calendarEvents = [];
  leaves.forEach(leave => {
    const start = new Date(leave.from_date);
    const end = new Date(leave.to_date);
    let current = new Date(start);
    while (current <= end) {
      calendarEvents.push({
        day: current.getDate(),
        month: current.getMonth(),
        year: current.getFullYear(),
        type: leave.leave_type === 'WFH' ? 'wfh' : 'leave',
        label: `${leave.leave_type} - Emp #${leave.user_id}`
      });
      current.setDate(current.getDate() + 1);
    }
  });

  const currentDate = new Date();
  const currentMonthEvents = calendarEvents.filter(e => e.month === currentDate.getMonth() && e.year === currentDate.getFullYear());

  // Calculate if there are overlapping leaves on any given day this month
  const hasOverlap = React.useMemo(() => {
    const daysMap = {};
    for (const ev of currentMonthEvents) {
      if (!daysMap[ev.day]) daysMap[ev.day] = 0;
      daysMap[ev.day]++;
      if (daysMap[ev.day] > 1) return true;
    }
    return false;
  }, [currentMonthEvents]);

  const skillMatrix = teamMembers.map(emp => {
    const empSkills = skills.filter(s => s.user_id === emp.id);
    return {
      name: emp.name,
      React: empSkills.find(s => s.skill_name === 'React')?.proficiency_level || 0,
      Node: empSkills.find(s => s.skill_name === 'Node.js')?.proficiency_level || 0,
      AWS: empSkills.find(s => s.skill_name === 'AWS')?.proficiency_level || 0,
      Python: empSkills.find(s => s.skill_name === 'Python')?.proficiency_level || 0,
      SQL: empSkills.find(s => s.skill_name === 'SQL')?.proficiency_level || 0,
    };
  });

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

      {activeView === 'members' && (
        <div style={{ position: 'relative', width: '100%', background: 'white', borderRadius: '12px', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
          <Search size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search employees..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '18px 24px 18px 52px', borderRadius: '12px', 
              border: 'none', background: 'transparent', 
              color: 'var(--text-primary)', fontSize: '15px', outline: 'none'
            }} 
          />
        </div>
      )}

      <div className={styles.viewContainer}>
        
        {/* View 1: My Team Members List */}
        {activeView === 'members' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className={styles.sectionTitle} style={{ margin: 0 }}>Team Profile Overview</div>
              {!searchQuery && displayMembers.length > 0 && (
                <button 
                  onClick={() => setShowAllTeam(!showAllTeam)} 
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  {showAllTeam ? 'Show less' : 'View all team'}
                </button>
              )}
            </div>
            {displayMembers.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-sm)' }}>
                <Users size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '18px' }}>No Team Members Assigned</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                  It looks like HR hasn't assigned any employees to your team yet. Once they are assigned, their profiles, workload, and skills will appear here.
                </p>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {displayMembers
                  .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, (showAllTeam || searchQuery) ? displayMembers.length : 3)
                  .map(member => (
                  <div key={member.id} className={styles.teamCard}>
                    <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={member.avatar} alt={member.name} className={styles.avatar}  />
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
            )}
          </div>
        )}

        {/* View 2: Team Availability Calendar */}
        {activeView === 'calendar' && (
          <div>
            <div className={styles.sectionTitle}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })} Availability Tracker</div>
            
            {hasOverlap && (
              <div className={styles.overlapWarning}>
                <AlertTriangle size={18} />
                Warning: Overlap detected. Multiple team members have approved leaves on the same day this month.
              </div>
            )}

            <div className={styles.calendarGrid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className={styles.calHeader}>{d}</div>
              ))}
              {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                const day = i + 1;
                const events = currentMonthEvents.filter(e => e.day === day);
                const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
                const isOffset = i === 0 ? { gridColumnStart: firstDayOfMonth + 1 } : {};
                
                return (
                  <div key={day} className={styles.calCell} style={isOffset}>
                    <div className={styles.calDayNum}>{day}</div>
                    {events.map((ev, idx) => (
                      <div key={idx} className={`${styles.calBadge} ${styles[ev.type]}`} title={ev.label}>
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
