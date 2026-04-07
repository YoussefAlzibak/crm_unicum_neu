import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { OrgProvider } from './contexts/OrgContext.tsx'
import App from './App.tsx'
import './index.css'
import './i18n' // Ensure i18n is initialized

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <OrgProvider>
        <App />
      </OrgProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
