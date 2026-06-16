# Sistema G13 - Autorização de Procedimentos Médicos

Sistema de autorização para procedimentos médicos (exames e internações) que integra com os módulos de Convênios (G9) e Pacientes (G1), fornecendo dados para Consultas (G4), Exames (G7) e Internações (G15).

## Tecnologias Utilizadas

- **Backend**: Node.js + Express
- **Frontend**: React
- **Banco de Dados**: PostgreSQL
- **ORM**: Sequelize
- **Autenticação**: JWT
- **HTTP Client**: Axios

## Estrutura do Projeto

```
autorizacao/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuração do PostgreSQL
│   ├── controllers/
│   │   ├── AutorizacaoController.js
│   │   ├── IntegracaoController.js
│   │   └── AuthController.js
│   ├── middlewares/
│   │   └── authMiddleware.js    # Middleware de autenticação JWT
│   ├── models/
│   │   ├── Autorizacao.js
│   │   ├── Paciente.js          # Mock para integração G1
│   │   ├── Convenio.js          # Mock para integração G9
│   │   ├── RegraConvenio.js
│   │   └── relacionamentos.js
│   ├── services/
│   │   ├── PacienteService.js   # Integração com API G1
│   │   └── ConvenioService.js   # Integração com API G9
│   ├── seeds/
│   │   └── dadosFicticios.js    # Dados de teste
│   ├── package.json
│   └── index.js                 # Ponto de entrada da API
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── componentes/
│   │   │   ├── Menu.js
│   │   │   ├── PaginaAutorizacaoLista.js
│   │   │   ├── PaginaAutorizacaoCadastro.js
│   │   │   ├── PaginaAutorizacaoDetalhe.js
│   │   │   └── PaginaLogin.js
│   │   ├── servicos/
│   │   │   ├── api.js
│   │   │   └── authService.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── PLANEJAMENTO_G13.md
├── PROMPT_INICIAL.md
└── README.md
```

## Instalação e Configuração

### Pré-requisitos

- Node.js (v18 ou superior)
- PostgreSQL (v12 ou superior)
- npm ou yarn

### Configuração do Banco de Dados

1. Criar banco de dados PostgreSQL:
```sql
CREATE DATABASE autorizacao_db;
```

2. Configurar conexão em `backend/config/database.js`:
```javascript
const banco = new Sequelize({
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'autorizacao_db',
    username: 'postgres',
    password: 'sua_senha',
    // ...
});
```

### Instalação do Backend

```bash
cd backend
npm install
```

### Instalação do Frontend

```bash
cd frontend
npm install
```

### Executar Seeds (Dados Fictícios)

```bash
cd backend
npm run seed
```

## Executando o Projeto

### Backend

```bash
cd backend
npm start
```

A API estará disponível em: `http://localhost:3013`

### Frontend

```bash
cd frontend
npm start
```

O frontend estará disponível em: `http://localhost:3014`

## Documentação da API

### Autenticação

#### POST /api/auth/login
Realiza login do usuário.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin",
  "role": "admin"
}
```

### Autorizações

#### GET /api/autorizacao
Lista todas as autorizações (requer autenticação).

**Query Params:**
- `status`: Filtrar por status (PENDENTE, APROVADO, REJEITADO)
- `idpaciente`: Filtrar por paciente
- `idconvenio`: Filtrar por convênio
- `tipo_procedimento`: Filtrar por tipo (EXAME, INTERNACAO)

#### GET /api/autorizacao/:id
Busca autorização por ID (requer autenticação).

#### POST /api/autorizacao
Cria nova autorização (requer autenticação).

**Request Body:**
```json
{
  "idpaciente": 1,
  "idconvenio": 1,
  "tipo_procedimento": "EXAME",
  "codigo_procedimento": "EX001",
  "descricao_procedimento": "Ressonância Magnética",
  "data_prevista": "2024-01-20",
  "medico_solicitante": "Dr. Carlos Mendes",
  "crm_medico": "12345-SP",
  "valor_estimado": 1500.00
}
```

#### PUT /api/autorizacao/:id
Altera autorização (requer autenticação).

#### DELETE /api/autorizacao/:id
Exclui autorização (requer autenticação e perfil admin).

#### PUT /api/autorizacao/:id/decisao
Registra decisão manual (requer autenticação e perfil admin).

**Request Body:**
```json
{
  "status": "APROVADO",
  "decisao_motivo": "Procedimento aprovado conforme critérios"
}
```

#### PUT /api/autorizacao/:id/decisao-automatica
Processa decisão automática baseada em regras (requer autenticação).

### Integração (para outros grupos)

#### GET /api/integracao/autorizacoes/exames
Retorna autorizações aprovadas para exames (consumo G7).

#### GET /api/integracao/autorizacoes/internacoes
Retorna autorizações aprovadas para internações (consumo G15).

#### GET /api/integracao/autorizacoes/consulta
Retorna autorizações aprovadas para consultas (consumo G4).

### Health Check

#### GET /api/health
Verifica saúde da API e status das integrações.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "integrations": {
    "g1_pacientes": "healthy",
    "g9_convenios": "healthy"
  }
}
```

## Credenciais de Teste

- **Admin**: `admin` / `admin123` (pode aprovar/rejeitar autorizações)
- **Usuário**: `usuario` / `usuario123` (pode apenas consultar)

## Funcionalidades

### Solicitação de Autorização
- Criação de solicitações para exames e internações
- Validação automática de paciente (API G1) e convênio (API G9)
- Geração automática de número de protocolo

### Processamento da Decisão
- Decisão automática baseada em regras de convênio
- Decisão manual por administrador
- Imutabilidade da decisão após definida

### Consulta de Autorizações
- Listagem com filtros (status, paciente, convênio, tipo)
- Visualização detalhada de cada autorização
- Histórico completo de decisões

### Integração com APIs Externas
- **Circuit Breaker**: Proteção contra falhas em APIs externas
- **Cache**: Cache em memória para reduzir chamadas
- **Fallback**: Uso de dados mock locais quando APIs indisponíveis
- **Validação de Schema**: Validação rigorosa de dados recebidos
- **Logs**: Monitoramento detalhado de integrações

## Regras de Decisão Automática

1. **Cobertura Total**: Se convênio tem 100% de cobertura → APROVADO
2. **Valor Abaixo do Limite**: Se valor <= valor_maximo_automatico → APROVADO
3. **Valor Acima do Limite**: Se valor > valor_maximo_automatico → REJEITADO (requer análise manual)

## Tratamento de Erros

O sistema implementa tratativas robustas para integrações:

- **Timeout**: 5 segundos para chamadas de API
- **Retry**: 3 tentativas com delay de 1 segundo
- **Circuit Breaker**: Abre após 5 falhas consecutivas por 60 segundos
- **Fallback Automático**: Usa dados mock locais quando APIs falham
- **Validação de Schema**: Rejeita dados corrompidos ou fora do padrão
- **Logs Detalhados**: INFO, WARN, ERROR, DEBUG para monitoramento

## Portas

- **Backend**: 3013
- **Frontend**: 3014
- **Database**: PostgreSQL localhost:5432
- **API G1 (Pacientes)**: http://localhost:3001
- **API G9 (Convênios)**: http://localhost:3009

## Desenvolvimento

Este projeto foi desenvolvido seguindo a estrutura do projeto lanchonete, adaptando para o contexto de autorização de procedimentos médicos conforme os requisitos do G13 do projeto integrador 2026.

## Documentação Adicional

- [Planejamento Detalhado](./PLANEJAMENTO_G13.md)
- [Prompt Inicial](./PROMPT_INICIAL.md)
