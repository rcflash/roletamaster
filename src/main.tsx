import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  const defaultRect = function (this: any) {
    return {
      top: 0,
      left: 0,
      width: this?.width || window.innerWidth || 300,
      height: this?.height || window.innerHeight || 150,
      right: (this?.left || 0) + (this?.width || window.innerWidth || 300),
      bottom: (this?.top || 0) + (this?.height || window.innerHeight || 150),
      x: 0,
      y: 0,
      toJSON: () => {},
    };
  };

  if (window.Element && !window.Element.prototype.getBoundingClientRect) {
    window.Element.prototype.getBoundingClientRect = defaultRect;
  }
  if (window.HTMLElement && !window.HTMLElement.prototype.getBoundingClientRect) {
    window.HTMLElement.prototype.getBoundingClientRect = defaultRect;
  }
  if (window.HTMLCanvasElement && !window.HTMLCanvasElement.prototype.getBoundingClientRect) {
    window.HTMLCanvasElement.prototype.getBoundingClientRect = defaultRect;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

