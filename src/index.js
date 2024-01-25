// index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { UserProvider } from './Components/UserContext';
import { WebSocketProvider } from './Components/WebSocketContext'; // Importa el proveedor de WebSocket
import { BrowserRouter as Router } from 'react-router-dom';

ReactDOM.render(
    <UserProvider>
        <WebSocketProvider> {/* Envuelve tu App con WebSocketProvider */}
            <Router>
                <App />
            </Router>
        </WebSocketProvider>
    </UserProvider>,
    document.getElementById('root')
);
