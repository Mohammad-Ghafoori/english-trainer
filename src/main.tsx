import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/600.css';
import './styles.css';
import App from './App';
import { initWords } from './data/words';

// Offline support + "install app" on phone and computer.
registerSW({ immediate: true });

// Load the word lists, then show the app.
initWords().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
