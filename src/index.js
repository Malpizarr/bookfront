import React from 'react';
import {createRoot} from 'react-dom/client'; // Importa createRoot
import App from './App';
import { UserProvider } from './Components/UserContext';
import {WebSocketProvider} from './Components/WebSocketContext';
import { BrowserRouter as Router } from 'react-router-dom';

// Accede a la raíz del DOM donde tu aplicación será montada
const container = document.getElementById('root');

// Crea una raíz con createRoot
const root = createRoot(container);

root.render(
    <UserProvider>
        <WebSocketProvider>
            <Router>
                <App />
            </Router>
        </WebSocketProvider>
    </UserProvider>
);
