import React, { useMemo } from 'react';
import useSWR from 'swr';
import './OrgChart.css';
import AvatarFallback from '../common/AvatarFallback';

export default function OrgChart({ currentUser }) {
  const token = localStorage.getItem('nsg_jwt_token');

  const fetcher = (url) => 
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch org chart data');
      return res.json();
    });

  const { data: employees, error, isLoading } = useSWR('/api/employee-portal/org-chart', fetcher);

  // Build the hierarchical tree
  const treeData = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return null;

    const map = {};
    const roots = [];

    // Initialize map
    employees.forEach(emp => {
      map[emp.id] = { ...emp, children: [] };
    });

    // Populate children
    employees.forEach(emp => {
      if (emp.manager_id && map[emp.manager_id]) {
        map[emp.manager_id].children.push(map[emp.id]);
      } else {
        roots.push(map[emp.id]);
      }
    });

    return roots;
  }, [employees]);

  if (isLoading) return <div className="org-loading">Loading Organization Chart...</div>;
  if (error) return <div className="org-error">Error: {error.message}</div>;
  if (!treeData || treeData.length === 0) return <div className="org-error">No organizational data available.</div>;

  const renderNode = (node) => {
    return (
      <li key={node.id}>
        <div className="org-node">
          {node.photo && !node.photo.includes('unsplash') ? (
            <img src={node.photo} alt={node.name} className="org-avatar" />
          ) : (
            <div className="org-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', color: '#475569', fontSize: '20px', fontWeight: 'bold' }}>
              {node.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="org-name">{node.name}</div>
          <div className="org-role">{node.designation || node.role}</div>
          {node.department && <div className="org-dept">{node.department}</div>}
        </div>
        {node.children && node.children.length > 0 && (
          <ul>
            {node.children.map(child => renderNode(child))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="org-chart-container">
      <div className="org-chart-header">
        <h2>Organization Chart</h2>
        <p>Explore the reporting structure and team hierarchies across the company.</p>
      </div>

      <div className="tree">
        <ul>
          {treeData.map(root => renderNode(root))}
        </ul>
      </div>
    </div>
  );
}
