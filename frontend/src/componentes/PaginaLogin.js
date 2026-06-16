import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../servicos/authService.js';

function PaginaLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.username || !formData.password) {
            setError('Preencha todos os campos');
            return;
        }

        try {
            setLoading(true);
            await login(formData.username, formData.password);
            navigate('/');
        } catch (error) {
            console.error('Erro no login:', error);
            setError('Credenciais inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Sistema G13 - Autorização</h1>
                <h2 style={styles.subtitle}>Login</h2>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {error && (
                        <div style={styles.error}>
                            {error}
                        </div>
                    )}

                    <div style={styles.field}>
                        <label style={styles.label}>Usuário</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="admin ou usuario"
                            required
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Senha</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            style={styles.input}
                            placeholder="admin123 ou usuario123"
                            required
                        />
                    </div>

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ecf0f1'
    },
    card: {
        backgroundColor: 'white',
        padding: '3rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
    },
    title: {
        textAlign: 'center',
        marginBottom: '0.5rem',
        color: '#2c3e50'
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: '2rem',
        color: '#7f8c8d',
        fontWeight: 'normal'
    },
    form: {
        marginBottom: '1.5rem'
    },
    field: {
        marginBottom: '1.5rem'
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 'bold',
        color: '#2c3e50'
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1rem',
        boxSizing: 'border-box'
    },
    button: {
        width: '100%',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        padding: '0.75rem',
        borderRadius: '4px',
        fontSize: '1rem',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    error: {
        backgroundColor: '#e74c3c',
        color: 'white',
        padding: '0.75rem',
        borderRadius: '4px',
        marginBottom: '1rem',
        textAlign: 'center'
    },
    info: {
        backgroundColor: '#f8f9fa',
        padding: '1rem',
        borderRadius: '4px',
        fontSize: '0.9rem',
        color: '#6c757d'
    }
};

export default PaginaLogin;
