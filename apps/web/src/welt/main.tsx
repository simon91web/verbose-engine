import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces/soft.css';
import '@fontsource-variable/nunito';
import '../stil.css';
import './welt.css';
import { Welt } from './Welt';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Welt />
  </StrictMode>,
);
