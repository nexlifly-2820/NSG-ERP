import React, { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import { 
  LayoutDashboard, Building, DollarSign, CheckSquare, 
  Briefcase, BarChart2, Settings, Megaphone, 
  Target, Users, MessageSquare, Box, Lock, Network
} from 'lucide-react';

const DEFAULT_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'companySetup', label: 'Company Setup', icon: <Building size={18} /> },
  { id: 'finance', label: 'Finance', icon: <DollarSign size={18} /> },
  { id: 'approvals', label: 'Approvals', icon: <CheckSquare size={18} /> },
  { id: 'projects', label: 'Projects', icon: <Briefcase size={18} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart2 size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  { id: 'announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
  { id: 'strategyOKRs', label: 'Strategy & OKRs', icon: <Target size={18} /> },
  { id: 'people', label: 'People', icon: <Users size={18} /> },
  { id: 'messaging', label: 'Messaging', icon: <MessageSquare size={18} /> },
  { id: 'vendors', label: 'Vendor Management', icon: <Box size={18} /> },
  { id: 'vault', label: 'Document Vault', icon: <Lock size={18} /> },
  { id: 'payroll', label: 'Payroll', icon: <DollarSign size={18} /> },
  { id: 'orgChart', label: 'Org Chart', icon: <Network size={18} /> },
  { id: 'approvalHistory', label: 'Approval History', icon: <Box size={18} /> },
];

export default function CeoSidebar({ activeTab, setActiveTab }) {
  
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('ceoSidebarOrder');
    if (saved) {
      try {
        const parsedIds = JSON.parse(saved);
        const rebuilt = parsedIds.map(id => DEFAULT_ITEMS.find(item => item.id === id)).filter(Boolean);
        const newItems = DEFAULT_ITEMS.filter(item => !parsedIds.includes(item.id));
        return [...rebuilt, ...newItems];
      } catch(e) {}
    }
    return DEFAULT_ITEMS;
  });

  useEffect(() => {
    localStorage.setItem('ceoSidebarOrder', JSON.stringify(items.map(item => item.id)));
  }, [items]);

  return (
    <div className="nav-group">
      <span className="nav-group-title">CEO Modules</span>
      <Reorder.Group axis="y" values={items} onReorder={setItems} as="div" style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Reorder.Item key={item.id} value={item} as="div" style={{ position: 'relative' }}>
              <button
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  cursor: 'grab',
                  ...(isActive ? { 
                    color: '#f59e0b',
                    borderLeftColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)' 
                  } : {})
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
}

