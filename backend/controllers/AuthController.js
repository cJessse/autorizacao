import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'autorizacao_secret_key_2024';
const usuarios = [
    { username: 'admin', password: '$2a$10$oyNdAQLT5ORLuOSN7Hy9MOu06DRR8f9QQvHkqjceZq0bVe4niKNDO' }, // admin123
    { username: 'usuario', password: '$2a$10$b1qIG3wHAU4sZ1.FqSos7OUX6Ww0WBj3XLX6B1tpBSm8rDJnqpON6' } // usuario123
];

async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password são obrigatórios' });
        }

        const usuario = usuarios.find(u => u.username === username);
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const passwordValid = await bcrypt.compare(password, usuario.password);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { username, role: username === 'admin' ? 'admin' : 'usuario' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.json({ token, username, role: username === 'admin' ? 'admin' : 'usuario' });
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ error: error.message });
    }
}

export default { login };
