// UserContext.js
import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({ isAuthenticated: false, id: null, token: null });

    const updateUser = (newUserData) => {
        setUser({ ...user, ...newUserData });
    };

    return (
        <UserContext.Provider value={{ user, setUser, updateUser }}>
            {children}
        </UserContext.Provider>
    );
};
