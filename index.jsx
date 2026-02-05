import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Seleciona o elemento 'root' que está no seu index.html
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Não foi possível encontrar o elemento #root no seu HTML.");
}
