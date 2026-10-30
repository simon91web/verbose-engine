import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fraunces/soft.css';
import '@fontsource-variable/nunito';
import './stil.css';
import { TagwerkAnsicht } from './TagwerkAnsicht';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TagwerkAnsicht />
  </StrictMode>,
);
