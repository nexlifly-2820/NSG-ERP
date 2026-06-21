import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CompanyProvider } from './components/common/CompanyContext.jsx'

// Global fetch override to enforce HttpOnly cookie usage
const originalFetch = window.fetch;
window.fetch = async function() {
  let [resource, config] = arguments;
  if (!config) {
    config = {};
  }
  
  // Ensure cookies are sent with every cross-origin/same-origin request
  config.credentials = 'include';
  
  // Strip manual Authorization Bearer tokens since we use cookies now
  if (config.headers) {
    const headersObj = new Headers(config.headers);
    if (headersObj.has('Authorization')) {
      headersObj.delete('Authorization');
      config.headers = headersObj;
    }
  }
  
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CompanyProvider>
      <App />
    </CompanyProvider>
  </StrictMode>,
)
