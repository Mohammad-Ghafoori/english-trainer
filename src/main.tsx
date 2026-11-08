import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/600.css';
import './styles.css';
import App from './App';

// Offline support + "install app" on phone and computer.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
