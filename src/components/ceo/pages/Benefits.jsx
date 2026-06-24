import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Fingerprint, CheckSquare, Zap, MapPin, 
  Settings, UserPlus, BrainCircuit, FileText, Download, 
  CheckCircle2, Users, CreditCard, MessageSquare, BookOpen,
  ChevronRight, ChevronDown, Sparkles, Star, Workflow, Layers
} from 'lucide-react';

const exhaustiveBenefitsData = [
  {
    id: 'core-security',
    title: 'Enterprise Core & Security',
    icon: <ShieldCheck size={20} />,
    description: 'The robust foundation ensuring absolute data privacy, strict validation, and systematic tracking across all modules.',
    benefits: [
      {
        featureName: 'Role-Based Access Control (RBAC)',
        highlight: 'Impenetrable Data Privacy',
        details: [
          {
            title: '1. Hierarchical Isolation',
            content: 'CEOs, HR Admins, Team Leads, and Employees have strictly isolated workspaces. Sensitive payroll and company data is completely hidden from non-admins.'
          },
          {
            title: '2. Personal Workspaces',
            content: 'Along with global portals, HR and TLs have their own dedicated personal workspaces to track their own attendance and leaves.'
          }
        ]
      },
      {
        featureName: 'Professional Validations & UX',
        highlight: 'Zero Data Entry Errors',
        details: [
          {
            title: '1. Strict Data Validations',
            content: 'Every form ensures users provide complete, perfectly formatted data (e.g., valid Emails, GST, Passwords) to prevent database corruption.'
          },
          {
            title: '2. Unique Custom Toasts',
            content: 'Instant, beautiful real-time feedback notifications inform the user whether an action succeeded or failed, enhancing the premium feel.'
          }
        ]
      }
    ]
  },
  {
    id: 'global-config',
    title: 'Global Configuration & Sync',
    icon: <Settings size={20} />,
    description: 'Centralized command over the entire ERP network from a single settings dashboard.',
    benefits: [
      {
        featureName: 'Dynamic Branding Engine',
        highlight: 'Instant Global Reflection',
        details: [
          {
            title: '1. One-Click Updates',
            content: 'Change the Company Logo, Name, GST, or CIN just once in the CEO portal.'
          },
          {
            title: '2. Instant Synchronization',
            content: 'The branding changes reflect instantaneously across all Employee, HR, and Admin panels without requiring a page reload.'
          }
        ]
      },
      {
        featureName: 'Smart Location Compliance',
        highlight: 'Accurate Field Tracking',
        details: [
          {
            title: '1. GPS Location Constraints',
            content: 'Configure core Office Latitude and Longitude with an allowed radius in meters.'
          },
          {
            title: '2. Secure Check-ins',
            content: 'Prevents employees from checking in if they are physically outside the designated office boundaries.'
          }
        ]
      }
    ]
  },
  {
    id: 'next-gen-hiring',
    title: 'Next-Gen Talent Acquisition',
    icon: <UserPlus size={20} />,
    description: 'Streamlined candidate tracking featuring both Artificial Intelligence and manual human control.',
    benefits: [
      {
        featureName: 'Smart Hiring Workflows',
        highlight: 'AI & Manual Flexibility',
        details: [
          {
            title: '1. AI Resume Analysis',
            content: 'Automatically parse candidate resumes to extract key skills and experience, reducing HR screening time by 80%.'
          },
          {
            title: '2. Manual Hiring Control',
            content: 'Full flexibility to manually track candidates through Kanban stages (Applied -> Interviewing -> Hired).'
          }
        ]
      },
      {
        featureName: 'Professional PDF Generation',
        highlight: 'Beautiful Digital Documents',
        details: [
          {
            title: '1. Premium UI Design',
            content: 'System-generated Offer Letters and Documents feature stunning UI designs instead of plain boring text.'
          },
          {
            title: '2. One-Click Downloading',
            content: 'Generate and download legally compliant, branded PDF documents directly from the portal.'
          }
        ]
      }
    ]
  },
  {
    id: 'org-management',
    title: 'Advanced Org Management',
    icon: <Users size={20} />,
    description: 'Automated payroll and multi-level approval systems powering large-scale organizations.',
    benefits: [
      {
        featureName: 'Systematic Approvals',
        highlight: 'Multi-Level Authority',
        details: [
          {
            title: '1. Chain of Command',
            content: 'Requests (Leaves, Expenses) follow a strict chain: Employee -> Team Lead -> HR -> CEO.'
          },
          {
            title: '2. Centralized Approval Hubs',
            content: 'Each leader has a dedicated Approval Dashboard to quickly review and action pending requests.'
          }
        ]
      },
      {
        featureName: 'Automated Payroll Engine',
        highlight: 'Zero-Error Financials',
        details: [
          {
            title: '1. Automated Deductions',
            content: 'Automatically factors in Leaves, Attendance shortfalls, and Timesheets into the final payout calculation.'
          },
          {
            title: '2. Dynamic Payslips',
            content: 'Instantly generates detailed, professional Payslips for employees every month.'
          }
        ]
      }
    ]
  },
  {
    id: 'communication',
    title: 'Communication & Guidance',
    icon: <MessageSquare size={20} />,
    description: 'Empowering users with integrated manuals and seamless inter-departmental communication.',
    benefits: [
      {
        featureName: 'Feature-Rich Messaging',
        highlight: 'Secure Internal Chat',
        details: [
          {
            title: '1. Direct Employee Chat',
            content: 'Employees can securely message their managers, HR, or peers directly within the ERP.'
          },
          {
            title: '2. Global Announcements',
            content: 'HR and CEOs can pin global broadcast alerts to all user dashboards instantly.'
          }
        ]
      },
      {
        featureName: 'Built-in Instructions Portals',
        highlight: 'Zero Learning Curve',
        details: [
          {
            title: '1. Technical Visual Manuals',
            content: 'Detailed Instruction pages (like the HR Architecture Manual) guide users on exactly how to use specific features.'
          },
          {
            title: '2. Animated Guidance',
            content: 'Flowcharts and step-by-step animations make understanding complex ERP flows incredibly simple.'
          }
        ]
      }
    ]
  }
];

// Visual Flowchart Step Component
const BenefitStep = ({ title, content, isLast }) => {
  return (
    <div style={{ display: 'flex', gap: '20px', minHeight: '80px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px' }}>
        {/* Node Circle */}
        <div style={{ 
          width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0fdf4', 
          border: `2px solid #86efac`, display: 'flex', alignItems: 'center', 
          justifyContent: 'center', color: '#16a34a', zIndex: 2, flexShrink: 0 
        }}>
          <CheckCircle2 size={16} />
        </div>
        
        {/* Connecting Line */}
        {!isLast && (
          <div style={{ 
            width: '2px', flex: 1, backgroundColor: '#86efac', 
            position: 'relative', marginTop: '4px', marginBottom: '4px' 
          }}>
          </div>
        )}
      </div>

      <div style={{ flex: 1, paddingBottom: isLast ? '0' : '24px', paddingTop: '4px' }}>
        <div style={{ 
          backgroundColor: '#ffffff', border: `1px solid #e2e8f0`, borderRadius: '12px', 
          padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' 
        }}>
          <div style={{
            position: 'absolute', left: '-6px', top: '10px', width: '10px', height: '10px',
            backgroundColor: '#ffffff', borderLeft: `1px solid #e2e8f0`, borderBottom: `1px solid #e2e8f0`,
            transform: 'rotate(45deg)'
          }}></div>
          
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
            {title}
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};


export default function Benefits() {
  const [activeModule, setActiveModule] = useState(exhaustiveBenefitsData[0]);
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

  const nodeVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } }
  };

  const contentVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: { opacity: 1, height: 'auto', marginTop: '16px', transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      
      {/* LEFT SIDEBAR */}
      <div style={{ width: '360px', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', zIndex: 10 }}>
        
        <div style={{ padding: '32px 24px', borderBottom: '1px solid #1e293b', background: 'linear-gradient(to bottom, rgba(30, 41, 59, 0.5), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '8px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
              <Star size={20} style={{ color: '#eab308', fill: '#eab308' }} />
            </div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px', color: '#f8fafc' }}>
              System Benefits
            </h1>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
            Explore the premium capabilities and automated advantages of this ERP.
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {exhaustiveBenefitsData.map((mod) => (
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
                borderColor: activeModule.id === mod.id ? '#eab308' : 'transparent',
                borderRadius: '12px',
                color: activeModule.id === mod.id ? '#fff' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ color: activeModule.id === mod.id ? '#eab308' : '#64748b' }}>
                {mod.icon}
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', flex: 1 }}>{mod.title}</span>
              {activeModule.id === mod.id && <ChevronRight size={18} style={{ color: '#eab308' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT CANVAS: Interactive Flowchart */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '48px', position: 'relative', backgroundColor: '#f1f5f9' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ maxWidth: '900px', margin: '0 auto' }}
          >
            {/* Header section for the Canvas */}
            <div style={{ marginBottom: '48px', paddingBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <div style={{ padding: '12px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  {React.cloneElement(activeModule.icon, { size: 32, color: '#eab308' })}
                </div>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
                  {activeModule.title}
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: '16px', color: '#475569', lineHeight: '1.6' }}>
                {activeModule.description}
              </p>
            </div>

            {/* THE FLOWCHART (Collapsible Nodes) */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
              
              {activeModule.benefits.map((benefit, index) => {
                const isExpanded = expandedNodes.includes(index);
                return (
                  <motion.div key={index} variants={nodeVariants} style={{ display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                    
                    {/* Main Interactive Action Node Box */}
                    <div style={{ backgroundColor: '#ffffff', border: isExpanded ? '2px solid #eab308' : '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: isExpanded ? '0 10px 25px -5px rgba(234, 179, 8, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'all 0.3s ease' }}>
                      
                      {/* Action Header (Clickable) */}
                      <button 
                        onClick={() => toggleNode(index)}
                        style={{ display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                          <div style={{ padding: '12px', backgroundColor: isExpanded ? '#fefce8' : '#f8fafc', borderRadius: '12px', color: isExpanded ? '#ca8a04' : '#475569', transition: 'all 0.3s ease' }}>
                            <Sparkles size={20} />
                          </div>
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#eab308', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
                              {benefit.highlight}
                            </p>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                              {benefit.featureName}
                            </h3>
                          </div>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} style={{ color: '#94a3b8', padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '50%' }}>
                          <ChevronDown size={24} />
                        </motion.div>
                      </button>

                      {/* TRUE VISUAL FLOWCHART inside the expander */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            variants={contentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ paddingTop: '32px', marginTop: '24px', borderTop: '1px dashed #cbd5e1', paddingLeft: '16px', paddingRight: '16px' }}>
                              
                              {benefit.details.map((detail, dIndex) => (
                                <BenefitStep 
                                  key={dIndex}
                                  title={detail.title} 
                                  content={detail.content} 
                                  isLast={dIndex === benefit.details.length - 1} 
                                />
                              ))}

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
