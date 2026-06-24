import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, UserPlus, GraduationCap, CheckSquare, Clock, ShieldCheck, 
  Target, BarChart3, MessageSquare, Briefcase, Settings, DoorOpen, Calendar,
  ChevronRight, ChevronDown, CheckCircle, Fingerprint, ArrowDown
} from 'lucide-react';

const simpleHrData = [
  {
    id: 'dashboard',
    title: 'HR Global Dashboard',
    icon: <LayoutDashboard size={20} />,
    description: 'Your central hub for tracking company metrics and your daily HR tasks.',
    flows: [
      {
        actionName: 'Monitor Headcount and Alerts',
        step1: 'Open the Dashboard from the left menu.',
        step2: 'You will immediately see total active employees, open jobs, and pending alerts.',
        step3: 'Check the "Pending Approvals" box to see if any leaves need your final sign-off.',
        step4: 'Click on any alert to jump straight to the task.'
      }
    ]
  },
  {
    id: 'employees',
    title: 'Employee Registry',
    icon: <Users size={20} />,
    description: 'Add new employees, update details, or deactivate accounts.',
    flows: [
      {
        actionName: 'Add a New Employee',
        step1: 'Go to the Employee Registry and click "Add Employee".',
        step2: 'Fill out their name, role, salary, and assigned manager.',
        step3: 'Click Save.',
        step4: 'The system automatically creates their account and sends them a welcome email!'
      },
      {
        actionName: 'Update Employee Details',
        step1: 'Click on any existing employee\'s card to open their profile.',
        step2: 'Edit their salary, designation, or reporting manager.',
        step3: 'Click Save Changes.',
        step4: 'The updates are immediately sent to the Payroll and Reporting systems.'
      }
    ]
  },
  {
    id: 'recruitment',
    title: 'Recruitment (ATS)',
    icon: <UserPlus size={20} />,
    description: 'Manage job postings and move candidates through the hiring pipeline.',
    flows: [
      {
        actionName: 'Move a Candidate to Hired',
        step1: 'Open the Recruitment & ATS tab.',
        step2: 'Find your candidate in the "Interviewing" column.',
        step3: 'Drag and drop their card into the "Hired" column.',
        step4: 'The system will now allow you to generate an Offer Letter for them in the Onboarding tab.'
      }
    ]
  },
  {
    id: 'onboarding',
    title: 'Offer Letters & Onboarding',
    icon: <Briefcase size={20} />,
    description: 'Generate editable offer letters and manage new hire checklists.',
    flows: [
      {
        actionName: 'Generate & Edit an Offer Letter',
        step1: 'Go to the Onboarding tab and click "Offer" on a new hire.',
        step2: 'A window opens showing the editable Offer Letter document.',
        step3: 'Click directly on the text to make manual changes or type new terms.',
        step4: 'Click "Download PDF" to save the finalized letter and send it to the candidate.'
      },
      {
        actionName: 'Configure Global PDF Format',
        step1: 'In the Offer Letter editor window, look for "⭐ Global Default PDF Format".',
        step2: 'Upload your company\'s official PDF letterhead or design.',
        step3: 'The system converts it into an editable background automatically.',
        step4: 'This background is now saved forever and will apply to all future offer letters!'
      }
    ]
  },
  {
    id: 'leave',
    title: 'Leave & Holidays',
    icon: <Calendar size={20} />,
    description: 'Approve time-off requests and manage the company holiday calendar.',
    flows: [
      {
        actionName: 'Final Approve an Employee Leave',
        step1: 'Go to the Leave Management tab and select the "Requests" view.',
        step2: 'Review requests that have already been approved by the Team Lead.',
        step3: 'Click "Final Approve".',
        step4: 'The employee\'s leave balance is automatically deducted.'
      }
    ]
  },
  {
    id: 'attendance',
    title: 'Attendance Regularization',
    icon: <Clock size={20} />,
    description: 'Override attendance records for biometric errors or special cases.',
    flows: [
      {
        actionName: 'Fix a Missed Punch',
        step1: 'Go to the Attendance tab.',
        step2: 'Find the employee who missed their check-in.',
        step3: 'Click "Override" and mark them as Present.',
        step4: 'This change will reflect immediately in their monthly payroll calculation.'
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
          width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f5f3ff', 
          border: '2px solid #c4b5fd', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', color: '#7c3aed', zIndex: 2, flexShrink: 0 
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{stepNumber}</span>
        </div>
        
        {!isLast && (
          <div style={{ 
            width: '2px', flex: 1, backgroundColor: '#c4b5fd', 
            position: 'relative', marginTop: '4px', marginBottom: '4px' 
          }}>
             <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', color: '#c4b5fd' }}>
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


export default function HrInstructions() {
  const [activeModule, setActiveModule] = useState(simpleHrData[0]);
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
            <div style={{ padding: '8px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
              <Fingerprint size={20} style={{ color: '#8b5cf6' }} />
            </div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px', color: '#f8fafc' }}>
              HR User Guide
            </h1>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
            Simple step-by-step instructions on how to use the HR portal.
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {simpleHrData.map((mod) => (
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
                borderColor: activeModule.id === mod.id ? '#8b5cf6' : 'transparent',
                borderRadius: '12px',
                color: activeModule.id === mod.id ? '#fff' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ color: activeModule.id === mod.id ? '#8b5cf6' : '#64748b' }}>
                {mod.icon}
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', flex: 1 }}>{mod.title}</span>
              {activeModule.id === mod.id && <ChevronRight size={18} style={{ color: '#8b5cf6' }} />}
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
                  <div key={index} style={{ backgroundColor: '#ffffff', border: isExpanded ? '2px solid #8b5cf6' : '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'all 0.3s ease' }}>
                    <button 
                      onClick={() => toggleNode(index)}
                      style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                        <div style={{ padding: '12px', backgroundColor: '#f3e8ff', borderRadius: '12px', color: '#7c3aed' }}>
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
