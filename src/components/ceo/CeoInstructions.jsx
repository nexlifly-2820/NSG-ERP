import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Building, ShieldCheck, DollarSign, Wallet, 
  Target, Users, FileLock, Briefcase, Megaphone, BarChart3, Settings, MessageSquare,
  ChevronRight, ChevronDown, CheckCircle, ArrowDown, Crown
} from 'lucide-react';

const simpleCeoData = [
  {
    id: 'dashboard',
    title: 'Executive Dashboard',
    icon: <LayoutDashboard size={20} />,
    description: 'Your central hub for company-wide metrics and pending approvals.',
    flows: [
      {
        actionName: 'View Company Health',
        step1: 'Open the Dashboard from the left menu.',
        step2: 'The system instantly calculates Total Headcount, Payroll, and active tasks.',
        step3: 'You can see exactly how many employees are active or on probation.',
        step4: 'Click any red "Pending" alert to jump straight to the approval page.'
      }
    ]
  },
  {
    id: 'company-setup',
    title: 'Company Setup & Logo',
    icon: <Building size={20} />,
    description: 'Update your company branding and details globally.',
    flows: [
      {
        actionName: 'Update Company Logo',
        step1: 'Navigate to "Company Setup" in the menu.',
        step2: 'Click on the logo upload area and select your company\'s logo image.',
        step3: 'Click Save.',
        step4: 'Your new logo will instantly appear on the sidebar and all official documents like payslips.'
      }
    ]
  },
  {
    id: 'payroll',
    title: 'Payroll & Payslips',
    icon: <Wallet size={20} />,
    description: 'Authorize salaries, edit payslips, and configure global PDF formats.',
    flows: [
      {
        actionName: 'Edit & Process Employee Payslips',
        step1: 'Go to the "Payroll" tab and select the current month.',
        step2: 'Click "Process Payment" next to any employee.',
        step3: 'A window opens showing the editable Payslip document.',
        step4: 'Click directly on the document text to make any manual changes before saving.'
      },
      {
        actionName: 'Configure Global PDF Format',
        step1: 'In the Payslip editor window, look for "⭐ Global Default PDF Format".',
        step2: 'Upload your company\'s official PDF letterhead or design.',
        step3: 'The system converts it into an editable background automatically.',
        step4: 'This background is now saved forever and will apply to all future payslips!'
      }
    ]
  },
  {
    id: 'approvals',
    title: 'Reviewing Approvals',
    icon: <ShieldCheck size={20} />,
    description: 'Final authorization for expenses, leaves, and resignations.',
    flows: [
      {
        actionName: 'Authorize Requests',
        step1: 'Go to the "Pending Approvals" section.',
        step2: 'Review the details submitted by HR or Team Leads.',
        step3: 'Click "Approve" or "Reject".',
        step4: 'The system automatically notifies the employee and updates their records.'
      }
    ]
  },
  {
    id: 'announcements',
    title: 'Global Announcements',
    icon: <Megaphone size={20} />,
    description: 'Broadcast important messages to the entire company.',
    flows: [
      {
        actionName: 'Send an Announcement',
        step1: 'Go to the "Announcements" section.',
        step2: 'Type your message and select the priority level.',
        step3: 'Click Publish.',
        step4: 'Every employee will immediately see the alert on their personal dashboard.'
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
          width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0fdf4', 
          border: '2px solid #86efac', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', color: '#16a34a', zIndex: 2, flexShrink: 0 
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{stepNumber}</span>
        </div>
        
        {!isLast && (
          <div style={{ 
            width: '2px', flex: 1, backgroundColor: '#86efac', 
            position: 'relative', marginTop: '4px', marginBottom: '4px' 
          }}>
             <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', color: '#86efac' }}>
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


export default function CeoInstructions() {
  const [activeModule, setActiveModule] = useState(simpleCeoData[0]);
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
      <div style={{ width: '340px', backgroundColor: '#09090b', color: '#f8fafc', display: 'flex', flexDirection: 'column', borderRight: '1px solid #27272a', zIndex: 10 }}>
        
        <div style={{ padding: '32px 24px', borderBottom: '1px solid #27272a', background: 'linear-gradient(to bottom, rgba(24, 24, 27, 0.8), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '8px', background: 'rgba(217, 119, 6, 0.15)', borderRadius: '8px', border: '1px solid rgba(217, 119, 6, 0.3)' }}>
              <Crown size={20} style={{ color: '#d97706' }} />
            </div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px', color: '#f8fafc' }}>
              CEO User Guide
            </h1>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5' }}>
            Simple step-by-step instructions on how to use the portal.
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {simpleCeoData.map((mod) => (
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
                backgroundColor: activeModule.id === mod.id ? '#27272a' : 'transparent',
                border: '1px solid',
                borderColor: activeModule.id === mod.id ? '#d97706' : 'transparent',
                borderRadius: '12px',
                color: activeModule.id === mod.id ? '#fff' : '#a1a1aa',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ color: activeModule.id === mod.id ? '#d97706' : '#52525b' }}>
                {mod.icon}
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', flex: 1 }}>{mod.title}</span>
              {activeModule.id === mod.id && <ChevronRight size={18} style={{ color: '#d97706' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT CANVAS */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '48px', position: 'relative', backgroundColor: '#f4f4f5' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ maxWidth: '800px', margin: '0 auto' }}
          >
            <div style={{ marginBottom: '48px', paddingBottom: '24px', borderBottom: '2px solid #e4e4e7' }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: '800', color: '#09090b', letterSpacing: '-0.5px' }}>
                {activeModule.title}
              </h2>
              <p style={{ margin: 0, fontSize: '16px', color: '#52525b', lineHeight: '1.6' }}>
                {activeModule.description}
              </p>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {activeModule.flows.map((flow, index) => {
                const isExpanded = expandedNodes.includes(index);
                return (
                  <div key={index} style={{ backgroundColor: '#ffffff', border: isExpanded ? '2px solid #d97706' : '1px solid #d4d4d8', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'all 0.3s ease' }}>
                    <button 
                      onClick={() => toggleNode(index)}
                      style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                        <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '12px', color: '#d97706' }}>
                          <CheckCircle size={24} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#09090b' }}>
                            {flow.actionName}
                          </h3>
                        </div>
                      </div>
                      <div style={{ color: '#a1a1aa', padding: '8px', backgroundColor: '#f4f4f5', borderRadius: '50%' }}>
                        <ChevronDown size={24} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div variants={contentVariants} initial="hidden" animate="visible" exit="hidden" style={{ overflow: 'hidden' }}>
                          <div style={{ paddingTop: '24px', marginTop: '24px', borderTop: '1px solid #e4e4e7', paddingLeft: '8px' }}>
                            
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
