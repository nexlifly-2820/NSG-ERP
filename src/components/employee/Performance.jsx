import React, { useState } from 'react';
import useSWR from 'swr';
import { Target, CheckCircle, Award, UserCheck, Download, Search, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCompany } from '../common/CompanyContext';
import './Performance.css';

export default function Performance({ currentUser }) {
  const { companyName, companyLogo } = useCompany();
  const token = localStorage.getItem('nsg_jwt_token');
  const [acknowledging, setAcknowledging] = useState(null);

  // Filtering & Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [filterTL, setFilterTL] = useState('');
  const [filterRating, setFilterRating] = useState('All');

  const fetcher = (url) => 
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch performance data');
      return res.json();
    });

  // Fetch scorecards
  const { data, error, isLoading, mutate } = useSWR('/api/employee-portal/performance/my-scorecards?limit=50', fetcher);

  const handleAcknowledge = async (id) => {
    try {
      setAcknowledging(id);
      const res = await fetch(`/api/employee-portal/performance/scorecards/${id}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to acknowledge scorecard');
      }
      
      alert('Scorecard acknowledged successfully. Your Team Lead has been notified.');
      mutate();
    } catch (err) {
      alert(err.message);
    } finally {
      setAcknowledging(null);
    }
  };

  const getRatingClass = (rating) => {
    const r = (rating || '').toLowerCase();
    if (r.includes('excellent') || r === 'a') return 'rating-excellent';
    if (r.includes('good') || r === 'b') return 'rating-good';
    if (r.includes('average') || r === 'c') return 'rating-average';
    return 'rating-poor';
  };

  if (isLoading) return <div className="perf-loading">Loading Performance Data...</div>;
  if (error) return <div className="perf-error">Error: {error.message}</div>;

  const scorecards = data?.items || [];

  // Filter Logic
  const filteredScorecards = scorecards.filter(sc => {
    const matchTL = sc.tl_name.toLowerCase().includes(filterTL.toLowerCase());
    const matchRating = filterRating === 'All' || sc.rating.startsWith(filterRating.charAt(0));
    return matchTL && matchRating;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredScorecards.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentScorecards = filteredScorecards.slice(indexOfFirstItem, indexOfLastItem);

  const exportPDF = () => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = companyLogo || '/hmns-logo.png';
    
    const renderPDF = () => {
      // Premium White Header
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 110, 'F');
      
      try {
        const imgRatio = img.width / img.height;
        const logoHeight = 45;
        const logoWidth = logoHeight * imgRatio;
        doc.addImage(img, 'PNG', 40, 25, logoWidth, logoHeight);
      } catch (e) {
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text(companyName, 40, 50);
      }
      
      // Divider Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(1);
      doc.line(40, 100, doc.internal.pageSize.getWidth() - 40, 100);
      
      // Report Title
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.text('MY APPRAISALS REPORT', doc.internal.pageSize.getWidth() - 40, 45, { align: 'right' });
      
      // Timestamp
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, 65, { align: 'right' });

      // Filter info
      let filterText = `Filters: `;
      if (filterTL) filterText += `Evaluator (TL): ${filterTL} | `;
      filterText += `Rating: ${filterRating}`;
      
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(filterText, 40, 85);

      // Table Data
      const tableColumn = ['ID', 'Evaluator (TL)', 'Rating', 'Feedback Comments', 'My Acknowledgment', 'HR Approved'];
      const tableRows = [];

      filteredScorecards.forEach(sc => {
        tableRows.push([
          `#${sc.id}`,
          sc.tl_name, 
          sc.rating, 
          sc.comments, 
          sc.emp_acknowledged ? 'Yes' : 'Pending', 
          sc.hr_acknowledged ? 'Yes' : 'Pending'
        ]);
      });

      autoTable(doc, {
        startY: 120,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { 
          fillColor: [79, 70, 229], // indigo-600
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          halign: 'left',
          valign: 'middle'
        },
        styles: { 
          fontSize: 10, 
          cellPadding: 8,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
          lineWidth: 0.5
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
        columnStyles: {
          4: { halign: 'center', fontStyle: 'bold' },
          5: { halign: 'center', fontStyle: 'bold' }
        },
        margin: { top: 120, left: 40, right: 40, bottom: 40 },
        didDrawPage: function (data) {
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
        }
      });

      doc.save(`My_Appraisals_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    img.onload = renderPDF;
    img.onerror = renderPDF;
  };

  return (
    <div className="perf-container">
      <div className="perf-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2>Performance Appraisals</h2>
            <p>Review your performance scorecards, ratings, and feedback from your Team Lead.</p>
          </div>
          <button onClick={exportPDF} className="btn-export">
            <Download size={16} /> Export PDF
          </button>
        </div>

        {scorecards.length > 0 && (
          <div className="perf-filters">
            <div className="filter-group">
              <Search size={16} className="filter-icon" />
              <input 
                type="text" 
                placeholder="Search by Evaluator (TL)..." 
                value={filterTL}
                onChange={(e) => { setFilterTL(e.target.value); setCurrentPage(1); }}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <Filter size={16} className="filter-icon" />
              <select 
                value={filterRating}
                onChange={(e) => { setFilterRating(e.target.value); setCurrentPage(1); }}
                className="filter-select"
              >
                <option value="All">All Ratings</option>
                <option value="A">A Band</option>
                <option value="B">B Band</option>
                <option value="C">C Band</option>
                <option value="D">D Band</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {filteredScorecards.length === 0 ? (
        <div className="perf-empty">
          <Target size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
          <h3>No Appraisals Match Criteria</h3>
          <p>You don't have any performance scorecards matching your current filters.</p>
        </div>
      ) : (
        <>
          <div className="scorecard-grid">
            {currentScorecards.map((card) => (
              <div key={card.id} className="scorecard-card">
                <div className="scorecard-header">
                  <div className="scorecard-title">
                    <Award size={18} color="#4f46e5" />
                    Appraisal #{card.id}
                  </div>
                  <div className={`scorecard-rating ${getRatingClass(card.rating)}`}>
                    {card.rating}
                  </div>
                </div>
                
                <div className="scorecard-body">
                  <div className="scorecard-tl">
                    <UserCheck size={14} /> Evaluator: <strong>{card.tl_name}</strong>
                  </div>
                  <div className="scorecard-comments">
                    "{card.comments}"
                  </div>

                  <div className="scorecard-status-badges">
                    {card.emp_acknowledged && <span className="badge badge-success">✅ My Acknowledgment</span>}
                    {card.hr_acknowledged && <span className="badge badge-success">✅ HR Approved</span>}
                    {!card.emp_acknowledged && !card.hr_acknowledged && <span className="badge badge-warning">⏳ Pending Action</span>}
                  </div>
                </div>
                
                <div className="scorecard-footer">
                  {card.emp_acknowledged ? (
                    <button className="btn-acknowledge acknowledged" disabled>
                      <CheckCircle size={16} />
                      ✅ Acknowledged
                    </button>
                  ) : (
                    <button 
                      className="btn-acknowledge" 
                      onClick={() => handleAcknowledge(card.id)}
                      disabled={acknowledging === card.id}
                    >
                      <CheckCircle size={16} />
                      {acknowledging === card.id ? 'Acknowledging...' : 'Acknowledge Now'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {filteredScorecards.length > 0 && (
            <div className="perf-pagination">
              <div className="pagination-info">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredScorecards.length)} of {filteredScorecards.length} entries
              </div>
              <div className="pagination-buttons">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-page"
                >
                  Previous
                </button>
                <span className="page-current">Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
