import { Link } from 'react-router-dom';
import { getUsuario, logout } from '../servicos/authService.js';

function Menu() {
    const usuario = getUsuario();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <nav style={styles.nav}>
            <div style={styles.container}>
                <h1 style={styles.title}>Sistema G13 - Autorização</h1>
                <div style={styles.links}>
                    <span style={styles.userInfo}>{usuario?.username}</span>
                    <button onClick={handleLogout} style={styles.button}>Sair</button>
                </div>
            </div>
        </nav>
    );
}

const styles = {
    nav: {
        backgroundColor: '#2c3e50',
        padding: '1rem 0',
        color: 'white'
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        margin: 0,
        fontSize: '1.5rem'
    },
    links: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    },
    link: {
        color: 'white',
        textDecoration: 'none',
        fontSize: '1rem'
    },
    userInfo: {
        fontSize: '0.9rem',
        color: '#ecf0f1'
    },
    button: {
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.9rem'
    }
};

export default Menu;
