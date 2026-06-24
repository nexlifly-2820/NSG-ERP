import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, CheckSquare, Clock, Calendar, 
  Target, BarChart3, MessageSquare, Briefcase, ChevronRight, 
  ChevronDown, CheckCircle, Fingerprint, ArrowDown
} from 'lucide-react';

const simpleTlData = [
  {
    id: 'dashboard',
    title: 'Team Lead Dashboard',
    icon: <LayoutDashboard size={20} />,
    description: 'Your control center for monitoring your team\'s daily activities.',
    flows: [
      {
        actionName: 'Monitor Your Team',
        step1: 'Open the Dashboard from the left menu.',
        step2: 'You can immediately see who is present, absent, or on leave today.',
        step3: 'Check the "Pending Approvals" box to see what needs your attention.',
        step4: 'Click any alert to jump straight to the task.'
      }
    ]
  },
  {
    id: 'attendance',
    title: 'Attendance Approvals',
    icon: <Clock size={20} />,
    description: 'Review and approve attendance corrections requested by your team.',
    flows: [
      {
        actionName: 'Approve a Missed Punch',
        step1: 'Go to the Attendance tab.',
        step2: 'Review any "Regularization Requests" from team members who forgot to clock in.',
        step3: 'Click "Approve" or "Reject" based on their reason.',
        step4: 'The system updates their attendance record instantly.'
      }
    ]
  },
  {
    id: 'leave',
    title: 'Leave Approvals',
    icon: <Calendar size={20} />,
    description: 'Review time-off requests from your team members.',
    flows: [
      {
        actionName: 'Approve Team Leaves',
        step1: 'Open the Leave Management tab.',
        step2: 'You will see a list of all pending leave requests from your team.',
        step3: 'Click "Approve" (which forwards it to HR) or "Reject".',
        step4: 'The employee is notified immediately via email.'
      }
    ]
  },
  {
    id: 'timesheets',
    title: 'Timesheet Approvals',
    icon: <CheckSquare size={20} />,
    description: 'Review and approve the weekly hours logged by your team.',
    flows: [
      {
        actionName: 'Approve Weekly Timesheets',
        step1: 'Go to the Timesheets tab at the end of the week.',
        step2: 'Review the hours your team logged against specific projects.',
        step3: 'Click "Approve" to lock the hours, or "Reject" to send them back for correction.',
        step4: 'Approved hours are sent to Finance for billing.'
      }
    ]
  },
  {
    id: 'tasks',
    title: 'Task Management',
    icon: <Briefcase size={20} />,
    description: 'Assign work and track project progress.',
    flows: [
      {
        actionName: 'Assign a New Task',
        step1: 'Open the Tasks & Projects tab.',
        step2: 'Click "Create Task" and enter the details and deadline.',
        step3: 'Select a team member from the dropdown to assign it to them.',
        step4: 'Click Save. The employee will see it on their personal dashboard.'
      }
    ]
  }
];

// Simple Step Component
const GuideStep = ({ stepNumber, title, content, isLast }) => {
  return (
    <div style={{ display: 'flex', gap: '20px', minHeight: '70px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px' }}>
        <div style={{ 
          width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#eff6ff', 
          border: '2px solid #93c5fd', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', color: '#3b82f6', zIndex: 2, flexShrink: 0 
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{stepNumber}</span>
        </div>
        
        {!isLast && (
          <div style={{ 
            width: '2px', flex: 1, backgroundColor: '#93c5fd', 
            position: 'relative', marginTop: '4px', marginBottom: '4px' 
          }}>
             <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', color: '#93c5fd' }}>
               <ArrowDown size={10} />
             </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, paddingBottom: isLast ? '0' : '24px', paddingTop: '4px' }}>
        <div style={{ 
          backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', 
          padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
        }}>
          <p style={{ margin: 0, fontSize: '15px', color: '#334155', lineHeight: '1.6' }}>
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};


export default function TlInstructions() {
  const [activeModule, setActiveModule] = useState(simpleTlData[0]);
  const [expandedNodes, setExpandedNodes] = useState([]);

  const toggleNode = (index) => {
    setExpandedNodes(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const contentVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: { opacity: 1, height: 'auto', marginTop: '16px', transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      
      {/* LEFT SIDEBAR */}
      <div style={{ width: '340px', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', zIndex: 10 }}>
        
        <div style={{ padding: '32px 24px', borderBottom: '1px solid #1e293b', background: 'linear-gradient(to bottom, rgba(30, 41, 59, 0.5), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <Users size={20} style={{ color: '#3b82f6' }} />
            </div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px', color: '#f8fafc' }}>
              Team Lead Guide
            </h1>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
            Simple step-by-step instructions on how to manage your team.
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {simpleTlData.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                marginBottom: '8px',
                backgroundColor: activeModule.id === mod.id ? '#1e293b' : 'transparent',
                border: '1px solid',
                borderColor: activeModule.id === mod.id ? '#3b82f6' : 'transparent',
                borderRadius: '12px',
                color: activeModule.id === mod.id ? '#fff' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ color: activeModule.id === mod.id ? '#3b82f6' : '#64748b' }}>
                {mod.icon}
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', flex: 1 }}>{mod.title}</span>
              {activeModule.id === mod.id && <ChevronRight size={18} style={{ color: '#3b82f6' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT CANVAS */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '48px', position: 'relative', backgroundColor: '#f1f5f9' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ maxWidth: '800px', margin: '0 auto' }}
          >
            <div style={{ marginBottom: '48px', paddingBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
                {activeModule.title}
              </h2>
              <p style={{ margin: 0, fontSize: '16px', color: '#475569', lineHeight: '1.6' }}>
                {activeModule.description}
              </p>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {activeModule.flows.map((flow, index) => {
                const isExpanded = expandedNodes.includes(index);
                return (
                  <div key={index} style={{ backgroundColor: '#ffffff', border: isExpanded ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'all 0.3s ease' }}>
                    <button 
                      onClick={() => toggleNode(index)}
                      style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                        <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '12px', color: '#3b82f6' }}>
                          <CheckCircle size={24} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                            {flow.actionName}
                          </h3>
                        </div>
                      </div>
                      <div style={{ color: '#94a3b8', padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '50%' }}>
                        <ChevronDown size={24} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div variants={contentVariants} initial="hidden" animate="visible" exit="hidden" style={{ overflow: 'hidden' }}>
                          <div style={{ paddingTop: '24px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                            
                            <GuideStep stepNumber={1} content={flow.step1} />
                            <GuideStep stepNumber={2} content={flow.step2} />
                            <GuideStep stepNumber={3} content={flow.step3} />
                            <GuideStep stepNumber={4} content={flow.step4} isLast={true} />

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
