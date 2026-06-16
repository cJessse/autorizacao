import jwt from 'jsonwebtoken';

const JWT_SECRET = 'autorizacao_secret_key_2024';

function authMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        if (error.name === 'JsonWebTokenError') {
            if (error.message.includes('signature')) {
                return res.status(401).json({ error: 'Assinatura inválida' });
            }
            return res.status(401).json({ error: 'Token inválido' });
        }
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

function adminMiddleware(req, res, next) {
    if (req.usuario?.role !== 'admin') {
        return res.status(403).json({ error: 'Permissão negada' });
    }
    next();
}

export { authMiddleware, adminMiddleware };
