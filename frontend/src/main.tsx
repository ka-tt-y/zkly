import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { BtcWalletProvider } from './contexts/BtcWalletContext';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <BtcWalletProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BtcWalletProvider>
    </BrowserRouter>
  </StrictMode>,
);
