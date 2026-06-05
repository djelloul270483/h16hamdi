import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import PasswordGuard from './components/PasswordGuard.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PasswordGuard>
      <App />
    </PasswordGuard>
  </StrictMode>
);
