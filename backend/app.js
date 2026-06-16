import Express from "express";
import cors from "cors";
import banco from "./config/database.js";
import autorizacao from "./controllers/AutorizacaoController.js";
import integracao from "./controllers/IntegracaoController.js";
import auth from "./controllers/AuthController.js";
import { authMiddleware, adminMiddleware } from "./middlewares/authMiddleware.js";
import "./models/relacionamentos.js";

try {
    await banco.authenticate();
} catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
}

const api = Express();
api.use(cors());
api.use(Express.json());

api.get('/teste', (req, res) => {
    res.send('API G13 - Autorização funcionando');
});

// Rotas de autenticação
api.post('/api/auth/login', auth.login);

// Rotas de autorização (protegidas)
api.get('/api/autorizacao', authMiddleware, autorizacao.listar);
api.get('/api/autorizacao/:id', authMiddleware, autorizacao.selecionar);
api.post('/api/autorizacao', authMiddleware, autorizacao.inserir);
api.put('/api/autorizacao/:id', authMiddleware, autorizacao.alterar);
api.delete('/api/autorizacao/:id', authMiddleware, adminMiddleware, autorizacao.excluir);
api.put('/api/autorizacao/:id/decisao', authMiddleware, adminMiddleware, autorizacao.registrarDecisao);
api.put('/api/autorizacao/:id/decisao-automatica', authMiddleware, autorizacao.processarDecisaoAutomatica);

// Rotas de integração (para outros grupos)
api.get('/api/integracao/autorizacoes/exames', integracao.listarParaExames);
api.get('/api/integracao/autorizacoes/internacoes', integracao.listarParaInternacoes);
api.get('/api/integracao/autorizacoes/consulta', integracao.listarParaConsultas);

// Health check
api.get('/api/health', integracao.healthCheck);

export default api;
