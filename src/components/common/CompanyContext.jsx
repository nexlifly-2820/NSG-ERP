import React, { createContext, useContext, useState, useEffect } from 'react';

const CompanyContext = createContext(null);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const [companyName, setCompanyName] = useState('HMNS Software');
  const [companyLogo, setCompanyLogo] = useState('/hmns-logo.png');
  const [empIdPrefix, setEmpIdPrefix] = useState('nsg');
  const [loadingConfig, setLoadingConfig] = useState(true);

  const fetchCompanyConfig = async () => {
    try {
      const response = await fetch('/api/auth/company-config');
      if (response.ok) {
        const data = await response.json();
        setCompanyName(data.company_name || 'HMNS Software');
        
        let logoUrl = data.company_logo || '/hmns-logo.png';
        if (logoUrl && logoUrl !== '/hmns-logo.png' && !logoUrl.startsWith('http') && !logoUrl.startsWith('/api/')) {
           // Wait, usually the upload logo endpoint returns something like /api/files/....
           // Let's assume it's stored correctly as per CEO portal. The setup page previews it with "http://localhost:8000" + configs.company_logo.
           // However, if the API is proxied (as seen in frontend fetch), we can just use the relative URL if it starts with /api/ or /uploads/.
           if (!logoUrl.startsWith('/')) {
               logoUrl = '/' + logoUrl;
           }
        }
        setCompanyLogo(logoUrl);
        if (data.emp_id_prefix) setEmpIdPrefix(data.emp_id_prefix);
      }
    } catch (err) {
      console.error('Failed to fetch company config', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchCompanyConfig();
  }, []);

  return (
    <CompanyContext.Provider value={{ companyName, companyLogo, empIdPrefix, refreshCompanyConfig: fetchCompanyConfig, loadingConfig }}>
      {children}
    </CompanyContext.Provider>
  );
};
