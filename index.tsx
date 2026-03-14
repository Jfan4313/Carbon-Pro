import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ProjectProvider } from './context/ProjectContext';
import { UserProvider } from './context/UserContext';
import { AdminProvider } from './context/AdminContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <UserProvider>
      <AdminProvider>
        <ProjectProvider>
          <App />
        </ProjectProvider>
      </AdminProvider>
    </UserProvider>
  </React.StrictMode>
);