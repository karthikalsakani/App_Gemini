import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import your Tailwind CSS
import App from './App'; // Assuming your main App component is in App.js

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);