import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import './index.css';
import { AdminPortalView } from './pages/AdminPortalView';
import { initMobileKeyboardHelper } from './utils/mobileKeyboardHelper';

initMobileKeyboardHelper();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <AdminPortalView />
    </AppProvider>
  </StrictMode>
);
