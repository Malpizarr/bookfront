// En WebSocketContext.js

import React, { createContext, useContext, useState } from 'react';

export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [webSocket, setWebSocket] = useState(null);


    return (
        <WebSocketContext.Provider value={{ webSocket, setWebSocket }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
