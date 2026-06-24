import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, CheckSquare, Clock, Calendar, Wallet,
  Briefcase, DoorOpen, ChevronRight, ChevronDown, 
  CheckCircle, Fingerprint, ArrowDown
} from 'lucide-react';

const simpleEmployeeData = [
  {
    id: 'dashboard',
    title: 'Employee Dashboard',
    icon: <LayoutDashboard size={20} />,
    description: 'Your central hub for tracking your work, attendance, and tasks.',
    flows: [
      {
        actionName: 'Clocking In and Out',
        step1: 'Open your Dashboard when you start working.',
        step2: 'Click the large green "Check In" button to record your start time.',
        step3: 'At the end of your shift, click the red "Check Out" button.',
        step4: 'Your attendance is automatically sent to your Team Lead.'
      }
    ]
  },
  {
    id: 'leave',
    title: 'Leave & Holidays',
    icon: <Calendar size={20} />,
    description: 'Request time off and view upcoming company holidays.',
    flows: [
      {
        actionName: 'Apply for Leave',
        step1: 'Go to the Leave tab and click "New Leave Request".',
        step2: 'Select the leave type (Sick, Casual, etc.) and enter the dates.',
        step3: 'Write a brief reason and click Submit.',
        step4: 'It goes to your Team Lead for approval. You will receive an email once approved!'
      }
    ]
  },
  {
    id: 'timesheets',
    title: 'Timesheets',
    icon: <Clock size={20} />,
    description: 'Log the hours you worked each day.',
    flows: [
      {
        actionName: 'Log Your Hours',
        step1: 'Open the Timesheets tab at the end of the day or week.',
        step2: 'Select the project you worked on.',
        step3: 'Enter the number of hours you spent on it and add a small description.',
        step4: 'Click Save. Your Team Lead will review it at the end of the week.'
      }
    ]
  },
  {
    id: 'payroll',
    title: 'Payroll & Payslips',
    icon: <Wallet size={20} />,
    description: 'View your salary details and download payslips.',
    flows: [
      {
        actionName: 'Download Your Payslip',
        step1: 'Go to the Payroll tab.',
        step2: 'You will see a list of all your past salaries.',
        step3: 'Find the month you want and click the "Download" or "View" button.',
        step4: 'A PDF of your official payslip will be downloaded to your device.'
      }
    ]
  },
  {
    id: 'tasks',
    title: 'Your Tasks',
    icon: <CheckSquare size={20} />,
    description: 'View and update the tasks assigned to you.',
    flows: [
      {
        actionName: 'Update Task Status',
        step1: 'Open the Tasks tab to see your To-Do list.',
        step2: 'Click on a task you are currently working on.',
        step3: 'Change the status from "To-Do" to "In Progress" or "Completed".',
        step4: 'Your Team Lead will automatically see your progress!'
      }
    ]
  },
  {
    id: 'resignation',
    title: 'Resignation',
    icon: <DoorOpen size={20} />,
    description: 'Submit a formal notice if you decide to leave the company.',
    flows: [
      {
        actionName: 'Submit Resignation Notice',
        step1: 'Go to the Resignation tab.',
        step2: 'Fill out your official reason for leaving.',
        step3: 'Click Submit Notice.',
        step4: 'HR will be notified immediately to start your offboarding and final settlement.'
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
          width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ecfdf5', 
          border: '2px solid #6ee7b7', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', color: '#10b981', zIndex: 2, flexShrink: 0 
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{stepNumber}</span>
        </div>
        
        {!isLast && (
          <div style={{ 
            width: '2px', flex: 1, backgroundColor: '#6ee7b7', 
            position: 'relative', marginTop: '4px', marginBottom: '4px' 
          }}>
             <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', color: '#6ee7b7' }}>
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


export default function EmployeeInstructions() {
  const [activeModule, setActiveModule] = useState(simpleEmployeeData[0]);
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
            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <Fingerprint size={20} style={{ color: '#10b981' }} />
            </div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px', color: '#f8fafc' }}>
              Employee Guide
            </h1>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
            Simple step-by-step instructions on how to use the portal.
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {simpleEmployeeData.map((mod) => (
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
                borderColor: activeModule.id === mod.id ? '#10b981' : 'transparent',
                borderRadius: '12px',
                color: activeModule.id === mod.id ? '#fff' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ color: activeModule.id === mod.id ? '#10b981' : '#64748b' }}>
                {mod.icon}
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', flex: 1 }}>{mod.title}</span>
              {activeModule.id === mod.id && <ChevronRight size={18} style={{ color: '#10b981' }} />}
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
                  <div key={index} style={{ backgroundColor: '#ffffff', border: isExpanded ? '2px solid #10b981' : '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'all 0.3s ease' }}>
                    <button 
                      onClick={() => toggleNode(index)}
                      style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                        <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '12px', color: '#10b981' }}>
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
