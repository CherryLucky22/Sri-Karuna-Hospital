import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setUser({ ...res.data, token });
                } catch (error) {
                    console.error("Token invalid or expired", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const login = async (email, password, role) => {
        const res = await api.post('/auth/login', { email, password, role });
        localStorage.setItem('token', res.data.token);
        setUser(res.data);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
