import api from './api.js';

export const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usuario', JSON.stringify(response.data));
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const getUsuario = () => {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
};

export const isAuthenticated = () => {
    return !!getToken();
};
