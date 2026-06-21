import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import './OrgChart.css';
import AvatarFallback from '../common/AvatarFallback';
import { ZoomIn, ZoomOut, RefreshCcw } from 'lucide-react';

export default function OrgChart({ currentUser }) {
  const token = localStorage.getItem('nsg_jwt_token');
  const [zoom, setZoom] = useState(1);
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));
  const handleResetZoom = () => setZoom(1);

  const fetcher = (url) => 
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch org chart data');
      return res.json();
    });

  const { data: employees, error, isLoading } = useSWR('/api/employee-portal/org-chart', fetcher);

  // Build the hierarchical tree based on Role Flow: CEO -> HRs -> TLs -> Employees
  const treeData = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return null;

    // 1. Separate users by role
    const ceos = employees.filter(e => e.role.toLowerCase() === 'ceo' || e.role.toLowerCase().includes('chief executive'));
    const hrs = employees.filter(e => e.role.toLowerCase() === 'hr' || e.role.toLowerCase().includes('human resource'));
    const tls = employees.filter(e => e.role.toLowerCase() === 'tl' || e.role.toLowerCase().includes('team lead'));
    const others = employees.filter(e => !ceos.includes(e) && !hrs.includes(e) && !tls.includes(e));

    // 2. Map TLs and attach their employees
    const tlMap = {};
    tls.forEach(tl => {
      tlMap[tl.id] = { ...tl, children: [] };
    });

    const unassignedEmployees = [];

    others.forEach(emp => {
      if (emp.manager_id && tlMap[emp.manager_id]) {
        tlMap[emp.manager_id].children.push({ ...emp, children: [] });
      } else {
        // If an employee doesn't report to a TL (maybe newly added or reports to HR/CEO)
        // Check if their manager is in the DB but not categorized as TL
        const mgr = employees.find(e => e.id === emp.manager_id);
        if (mgr && (mgr.role.toLowerCase() === 'tl' || mgr.role.toLowerCase().includes('team lead'))) {
            if (!tlMap[mgr.id]) tlMap[mgr.id] = { ...mgr, children: [] };
            tlMap[mgr.id].children.push({ ...emp, children: [] });
        } else {
            unassignedEmployees.push({ ...emp, children: [] });
        }
      }
    });

    // 3. Construct the Role-based hierarchy
    const tlNodes = Object.values(tlMap);

    // If there are unassigned employees, we can group them under a "General Team" or just append them to TLs level.
    // We'll append them as direct children of HR Group to match the flow.
    const hrChildren = [...tlNodes, ...unassignedEmployees];

    const hrGroupNode = {
      id: 'hr_group_pseudo',
      isGroup: true,
      role: 'Human Resources Department',
      members: hrs.map(hr => ({ ...hr, children: [] })),
      children: hrChildren
    };

    // Enforce single root to avoid duplicate trees if there are multiple CEO accounts in test data
    if (ceos.length > 0) {
      // Pick the main CEO (first one)
      const mainCeo = ceos[0];
      return [{
        ...mainCeo,
        children: hrs.length > 0 ? [hrGroupNode] : hrChildren
      }];
    }

    // Fallback if no CEO is found, HRs become roots
    if (hrs.length > 0) return [hrGroupNode];
    return hrChildren;
  }, [employees]);

  if (isLoading) return <div className="org-loading"><div className="loader-spinner"></div> Loading Organization Chart...</div>;
  if (error) return <div className="org-error">Error: {error.message}</div>;
  if (!treeData || treeData.length === 0) return <div className="org-error">No organizational data available.</div>;

  const renderSingleCard = (node) => (
    <div className={`org-node ${node.role.toLowerCase().includes('ceo') ? 'ceo-node' : node.role.toLowerCase().includes('hr') ? 'hr-node' : node.role.toLowerCase().includes('tl') || node.role.toLowerCase().includes('team lead') ? 'tl-node' : 'emp-node'}`}>
      {node.photo && !node.photo.includes('unsplash') ? (
        <img src={`${node.photo}`} alt={node.name} className="org-avatar" onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(node.name)}&background=random`; }} />
      ) : (
        <AvatarFallback src={node.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(node.name)}&background=random`} alt={node.name} className="org-avatar" />
      )}
      <div className="org-name">{node.name}</div>
      <div className="org-role">{node.designation || node.role}</div>
      {node.department && <div className="org-dept">{node.department}</div>}
    </div>
  );

  const renderNode = (node) => {
    if (node.isGroup) {
      return (
        <li key={node.id}>
          <div className="org-group-container">
            <div className="org-group-label">Human Resources</div>
            <div className="org-group-node">
              {node.members.map(member => (
                <div key={member.id} className="org-group-member">
                  {renderSingleCard(member)}
                </div>
              ))}
              {node.members.length === 0 && <div style={{padding: '20px', color: '#94a3b8'}}>No HRs assigned</div>}
            </div>
          </div>
          {node.children && node.children.length > 0 && (
            <ul>
              {node.children.map(child => renderNode(child))}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={node.id}>
        {renderSingleCard(node)}
        {node.children && node.children.length > 0 && (
          <ul>
            {node.children.map(child => renderNode(child))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* Zoom Controls */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px', background: '#fff', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 50 }}>
        <button onClick={handleZoomOut} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }} title="Zoom Out" onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#475569'; }}>
          <ZoomOut size={20} />
        </button>
        <button onClick={handleResetZoom} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }} title="Reset Zoom" onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#475569'; }}>
          <RefreshCcw size={20} />
        </button>
        <button onClick={handleZoomIn} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }} title="Zoom In" onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#475569'; }}>
          <ZoomIn size={20} />
        </button>
      </div>

      <div className="org-chart-container">
        <div className="org-chart-wrapper">
          <div className="org-chart-header">
            <h2>Organization Chart</h2>
            <p>Explore the reporting structure and team hierarchies across the company.</p>
          </div>

          <div className="tree" style={{ zoom: zoom, padding: '40px 0' }}>
            <ul>
              {treeData.map(root => renderNode(root))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
