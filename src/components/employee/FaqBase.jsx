import { useState, useEffect } from 'react';
import { Search, ThumbsUp, Check } from 'lucide-react';

const faqQuestions = [
  {
    id: 1,
    category: 'Leave',
    q: 'How is maternity leave calculated?',
    a: 'Maternity leave offers 26 weeks of paid time off, requiring 8 weeks prior manager notice.'
  },
  {
    id: 2,
    category: 'Leave',
    q: 'Do unused annual leaves carry forward?',
    a: 'Yes, up to 15 unused annual leaves will be automatically carried forward to the next calendar year.'
  },
  {
    id: 3,
    category: 'Payroll',
    q: 'When is the monthly salary disbursed?',
    a: 'Salary disbursements occur on the last working day of every calendar month. Bank updates must be done 10 days prior.'
  },
  {
    id: 4,
    category: 'Payroll',
    q: 'Where can I download my tax Form 16?',
    a: 'Form 16 can be downloaded under the Benefits & Tax Declarations section inside your Staff Portal dashboard by mid-June.'
  },
  {
    id: 5,
    category: 'Attendance',
    q: 'What is the daily attendance log cutoff time?',
    a: 'Attendance logs close daily at 10:30 AM. Failure to check in before the cutoff requires a late punch justification request.'
  },
  {
    id: 6,
    category: 'IT',
    q: 'How do I request software license renewals?',
    a: 'You can request software renewals by submitting an IT Ticket selecting Access & Permissions with manager approval.'
  }
];

export default function FaqBase() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Filtered faqs state
  const [filteredFaqs, setFilteredFaqs] = useState(faqQuestions);
  
  // Fade animation state
  const [isFading, setIsFading] = useState(false);

  // Helpful status states tracking card IDs
  const [helpfulFaqs, setHelpfulFaqs] = useState({});

  // Helper functions to trigger fade out before filtering state updates
  const handleSearchChange = (val) => {
    setIsFading(true);
    setSearch(val);
  };

  const handleCategoryChange = (cat) => {
    setIsFading(true);
    setSelectedCategory(cat);
  };

  // Filter FAQs when search or category changes with 200ms fade transition
  useEffect(() => {
    const timer = setTimeout(() => {
      const match = faqQuestions.filter((item) => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch = item.q.toLowerCase().includes(search.toLowerCase()) || 
                              item.a.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      });
      
      setFilteredFaqs(match);
      setIsFading(false);
    }, 150); // short timeout to let fadeOut complete

    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const handleHelpfulClick = (id) => {
    setHelpfulFaqs((prev) => ({
      ...prev,
      [id]: true
    }));
  };

  return (
    <div 
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          FAQ Knowledge Base
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
          Quickly resolve generic queries relating to leave applications, payout calendars, or WiFi access credentials.
        </p>
      </div>

      {/* FaqSearchBar and Categories Row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '10px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)' 
              }} 
            />
            <input 
              type="text"
              placeholder="Search by keywords (e.g. salary, leave)..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Categories tab filters */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['All', 'Leave', 'Payroll', 'Attendance', 'IT'].map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    backgroundColor: isActive ? 'var(--text-primary)' : 'var(--bg-primary)',
                    color: isActive ? 'var(--bg-secondary)' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Grid: 3-column layout */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', // Spacing & Layout Token: FAQ card: 240px min-width
          gap: '16px',
          opacity: isFading ? 0 : 1, // Search FAQ: Cards filter with fadeOut/fadeIn transition (200ms)
          transition: 'opacity 0.2s ease-in-out' // 200ms transition
        }}
      >
        {filteredFaqs.map((faq) => {
          const isHelpful = helpfulFaqs[faq.id];
          return (
            <div 
              key={faq.id}
              style={{
                backgroundColor: 'hsl(240, 20%, 11%)', // --faq-card-bg HSL dark slate
                border: isHelpful ? '1px solid hsl(150, 70%, 50%)' : '1px solid transparent', // --checklist-done green border on helpful click
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'border 0.3s ease, transform 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
              }}
            >
              {/* Question: 13px / 600 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span 
                  style={{ 
                    fontSize: '9px', 
                    fontWeight: '700', 
                    color: 'var(--text-muted)', 
                    textTransform: 'uppercase',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    width: 'fit-content'
                  }}
                >
                  {faq.category}
                </span>
                
                <h4 
                  style={{ 
                    margin: 0, 
                    fontSize: '13px', // Typography Token: FAQ question: 13px / 600
                    fontWeight: '600', 
                    color: '#f9fafb', // bright text for dark cards
                    lineHeight: '1.4' 
                  }}
                >
                  {faq.q}
                </h4>

                {/* Answer: 12px / 400 / line-height 1.6 */}
                <p 
                  style={{ 
                    margin: 0, 
                    fontSize: '12px', // Typography Token: FAQ answer: 12px / 400
                    fontWeight: '400',
                    lineHeight: '1.6', // line-height 1.6
                    color: '#d1d5db' // gray text
                  }}
                >
                  {faq.a}
                </p>
              </div>

              {/* Helpful footer */}
              <div 
                style={{ 
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
                  paddingTop: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between' 
                }}
              >
                {isHelpful ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(150, 70%, 50%)', fontSize: '10px', fontWeight: '700' }}>
                    <Check size={12} strokeWidth={3} />
                    <span>Thanks for your feedback!</span>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
                      Was this helpful?
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleHelpfulClick(faq.id)}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#f3f4f6',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <ThumbsUp size={10} />
                        <span>Yes</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredFaqs.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          No FAQs match your search keyword.
        </div>
      )}
    </div>
  );
}
