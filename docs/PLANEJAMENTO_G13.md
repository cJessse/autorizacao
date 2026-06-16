# Planejamento Detalhado - Sistema G13 - Autorização

## 1. Visão Geral
Sistema de autorização para procedimentos médicos (exames e internações) que integra com os módulos de Convênios (G9) e Pacientes (G1), fornecendo dados para Consultas (G4), Exames (G7) e Internações (G15).

## 2. Stack Tecnológica
- **Backend**: Node.js + Express
- **Frontend**: React
- **Banco de Dados**: PostgreSQL
- **ORM**: Sequelize
- **Autenticação**: JWT
- **HTTP Client**: Axios

## 3. Estrutura de Diretórios
```
autorizacao/
├── backend/
│   ├── models/
│   │   ├── Autorizacao.js
│   │   ├── Paciente.js (mock para integração G1)
│   │   ├── Convenio.js (mock para integração G9)
│   │   └── relacionamentos.js
│   ├── controllers/
│   │   ├── AutorizacaoController.js
│   │   ├── IntegracaoController.js
│   │   └── AuthController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── services/
│   │   ├── ConvenioService.js (integração G9)
│   │   └── PacienteService.js (integração G1)
│   ├── config/
│   │   └── database.js
│   ├── seeds/
│   │   └── dadosFicticios.js
│   ├── package.json
│   └── index.js
├── frontend/
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
│   │   └── index.js
│   └── package.json
└── README.md
```

## 4. Modelo de Dados

### 4.1 Tabela: autorizacao
```sql
CREATE TABLE autorizacao (
    idautorizacao BIGSERIAL PRIMARY KEY,
    numero_protocolo VARCHAR(50) UNIQUE NOT NULL,
    idpaciente BIGINT NOT NULL,
    idconvenio BIGINT NOT NULL,
    tipo_procedimento VARCHAR(20) NOT NULL, -- 'EXAME' ou 'INTERNACAO'
    codigo_procedimento VARCHAR(20) NOT NULL,
    descricao_procedimento TEXT NOT NULL,
    data_solicitacao DATE NOT NULL,
    data_prevista DATE,
    medico_solicitante VARCHAR(100) NOT NULL,
    crm_medico VARCHAR(20) NOT NULL,
    valor_estimado DECIMAL(10,2),
    status VARCHAR(20) NOT NULL, -- 'PENDENTE', 'APROVADO', 'REJEITADO'
    data_decisao DATE,
    decisao_motivo TEXT,
    usuario_decisao VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Tabela: paciente (mock para integração G1)
```sql
CREATE TABLE paciente (
    idpaciente BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100)
);
```

### 4.3 Tabela: convenio (mock para integração G9)
```sql
CREATE TABLE convenio (
    idconvenio BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'PARTICIPAR', 'NAO_PARTICIPAR'
    cobertura_exames DECIMAL(5,2), -- percentual de cobertura
    cobertura_internacoes DECIMAL(5,2), -- percentual de cobertura
    valor_maximo_automatico DECIMAL(10,2),
    requer_autorizacao BOOLEAN DEFAULT true
);
```

### 4.4 Tabela: regra_convenio (regras de aprovação automática)
```sql
CREATE TABLE regra_convenio (
    idregra BIGSERIAL PRIMARY KEY,
    idconvenio BIGINT NOT NULL,
    tipo_procedimento VARCHAR(20) NOT NULL,
    valor_maximo DECIMAL(10,2) NOT NULL,
    descricao TEXT
);
```

## 5. Funcionalidades

### 5.1 Solicitação de Autorização
- **Endpoint**: POST /api/autorizacao
- **Campos**:
  - idpaciente
  - idconvenio
  - tipo_procedimento (EXAME/INTERNACAO)
  - codigo_procedimento
  - descricao_procedimento
  - data_prevista
  - medico_solicitante
  - crm_medico
  - valor_estimado
- **Validações**:
  - Verificar se paciente existe (API G1)
  - Verificar se convênio é válido (API G9)
  - Verificar se procedimento requer autorização
  - Gerar número de protocolo único

### 5.2 Processamento da Decisão
- **Endpoint**: PUT /api/autorizacao/:id/decisao
- **Campos**:
  - status (APROVADO/REJEITADO)
  - decisao_motivo
  - usuario_decisao
- **Regras de Decisão**:
  - Valores abaixo do limite automático do convênio → APROVADO
  - Paciente com cobertura total → APROVADO
  - Procedimento não coberto → REJEITADO
  - Valor acima do limite → REJEITADO (requer análise manual)
- **Imutabilidade**: Decisão não pode ser alterada após definida

### 5.3 Consulta de Autorizações
- **Endpoint**: GET /api/autorizacao
- **Filtros**:
  - status
  - idpaciente
  - idconvenio
  - tipo_procedimento
  - data_solicitacao (intervalo)
- **Endpoint**: GET /api/autorizacao/:id

### 5.4 Integração com APIs Externas

#### 5.4.1 Consumo API G1 - Pacientes
- **Endpoint**: GET http://localhost:3001/api/paciente/:id
- **Endpoint**: GET http://localhost:3001/api/paciente/cpf/:cpf
- **Mock local**: Caso API não esteja disponível

#### 5.4.2 Consumo API G9 - Convênios
- **Endpoint**: GET http://localhost:3009/api/convenio/:id
- **Endpoint**: GET http://localhost:3009/api/convenio/validar-cobertura
- **Mock local**: Caso API não esteja disponível

### 5.5 Tratamento de Erros e Validação de Integrações

#### 5.5.1 Tratamento de Falhas em APIs Externas

**Timeout e Retry Logic:**
```javascript
const axiosConfig = {
    timeout: 5000, // 5 segundos timeout
    retry: 3,      // 3 tentativas
    retryDelay: 1000 // 1 segundo entre tentativas
};
```

**Circuit Breaker Pattern:**
- Após 5 falhas consecutivas em uma API externa, abrir circuito por 60 segundos
- Durante circuito aberto, usar dados mock locais automaticamente
- Tentar reestabelecer conexão após período de cooldown
- Log de transições de estado do circuit breaker

**Fallback Automático:**
- Se API G1 falhar → usar tabela paciente local
- Se API G9 falhar → usar tabela convenio local
- Se ambas falharem → retornar erro amigável com mensagem específica
- Registrar fallback em logs para monitoramento

#### 5.5.2 Validação de Dados Recebidos

**Validação de Schema (API G1 - Pacientes):**
```javascript
const pacienteSchema = {
    idpaciente: { required: true, type: 'number' },
    nome: { required: true, type: 'string', minLength: 3, maxLength: 100 },
    cpf: { required: true, type: 'string', pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/ },
    data_nascimento: { required: true, type: 'string', format: 'YYYY-MM-DD' },
    telefone: { required: false, type: 'string', pattern: /^\d{10,11}$/ },
    email: { required: false, type: 'string', format: 'email' }
};
```

**Validação de Schema (API G9 - Convênios):**
```javascript
const convenioSchema = {
    idconvenio: { required: true, type: 'number' },
    nome: { required: true, type: 'string', minLength: 3, maxLength: 100 },
    cnpj: { required: true, type: 'string', pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/ },
    tipo: { required: true, type: 'string', enum: ['PARTICIPAR', 'NAO_PARTICIPAR'] },
    cobertura_exames: { required: true, type: 'number', min: 0, max: 100 },
    cobertura_internacoes: { required: true, type: 'number', min: 0, max: 100 },
    valor_maximo_automatico: { required: true, type: 'number', min: 0 },
    requer_autorizacao: { required: true, type: 'boolean' }
};
```

**Tratamento de Dados Corrompidos:**
- Se campo obrigatório estiver ausente → rejeitar dados e usar mock
- Se tipo de dado estiver incorreto → tentar converter, se falhar usar mock
- Se valor fora do intervalo esperado → usar valor padrão ou mock
- Se formato inválido (CPF, CNPJ, email) → rejeitar e usar mock
- Registrar todos os dados corrompidos em log com timestamp

#### 5.5.3 Cache de Dados Externos

**Estratégia de Cache:**
- Cache em memória com TTL de 30 minutos para dados de pacientes
- Cache em memória com TTL de 1 hora para dados de convênios
- Invalidar cache manualmente ao detectar dados inconsistentes
- Persistir cache em arquivo para recuperação após restart

**Implementação:**
```javascript
const cacheConfig = {
    paciente: { ttl: 1800000 }, // 30 minutos
    convenio: { ttl: 3600000 }  // 1 hora
};
```

#### 5.5.4 Logs e Monitoramento

**Tipos de Log:**
- **INFO**: Chamadas bem-sucedidas para APIs externas
- **WARN**: Uso de dados mock (fallback ativado)
- **ERROR**: Falha na chamada de API após retries
- **DEBUG**: Dados recebidos para debugging

**Estrutura de Log:**
```javascript
{
    timestamp: '2024-01-15T10:30:00Z',
    level: 'ERROR',
    api: 'G1-Pacientes',
    endpoint: '/api/paciente/1',
    error: 'Connection timeout',
    retryCount: 3,
    fallbackUsed: true,
    dataSource: 'local_mock'
}
```

**Monitoramento de Saúde:**
- Health check endpoint: GET /api/health
- Verificar conectividade com APIs G1 e G9
- Retornar status de cada integração
- Incluir tempo de resposta das APIs

#### 5.5.5 Validação de Integridade de Dados

**Verificações Automáticas:**
- Validar CPF usando algoritmo de dígito verificador
- Validar CNPJ usando algoritmo de dígito verificador
- Validar data de nascimento (não pode ser futura, razoável para idade)
- Validar percentuais de cobertura (0-100)
- Validar valores monetários (não negativos)

**Sanitização de Dados:**
- Remover caracteres especiais de CPF/CNPJ antes de validação
- Trim de strings
- Normalizar datas para formato ISO
- Arredondar valores monetários para 2 casas decimais

#### 5.5.6 Tratamento de Erros no Fluxo de Autorização

**Erro ao Validar Paciente:**
- Se API G1 falhar e mock local também falhar → Retornar erro 400
- Mensagem: "Não foi possível validar os dados do paciente. Tente novamente."
- Não criar autorização sem paciente válido

**Erro ao Validar Convênio:**
- Se API G9 falhar e mock local também falhar → Retornar erro 400
- Mensagem: "Não foi possível validar o convênio. Tente novamente."
- Não criar autorização sem convênio válido

**Erro ao Processar Decisão:**
- Se regras de convênio estiverem indisponíveis → Manter status PENDENTE
- Notificar usuário que decisão manual será necessária
- Registrar erro para análise posterior

#### 5.5.7 Serviço de Integração Robusto

**Classe BaseService:**
```javascript
class BaseService {
    constructor(apiUrl, mockData, schema) {
        this.apiUrl = apiUrl;
        this.mockData = mockData;
        this.schema = schema;
        this.circuitBreaker = new CircuitBreaker();
        this.cache = new Cache();
    }

    async getData(id) {
        // 1. Verificar cache
        const cached = this.cache.get(id);
        if (cached) return cached;

        // 2. Verificar circuit breaker
        if (this.circuitBreaker.isOpen()) {
            return this.getMockData(id);
        }

        // 3. Tentar chamada de API com retry
        try {
            const data = await this.callApiWithRetry(id);
            const validated = this.validateSchema(data);
            this.cache.set(id, validated);
            this.circuitBreaker.recordSuccess();
            return validated;
        } catch (error) {
            this.circuitBreaker.recordFailure();
            this.logError(error);
            return this.getMockData(id);
        }
    }
}
```

### 5.6 Fornecimento de Dados para Outros Grupos

#### 5.6.1 Para Consultas (G4)
- **Endpoint**: GET /api/integracao/autorizacoes/consulta
- Retorna autorizações aprovadas para consultas
- **Tratamento de erros**: Se não houver dados, retornar array vazio com status 200

#### 5.6.2 Para Exames (G7)
- **Endpoint**: GET /api/integracao/autorizacoes/exames
- Retorna autorizações aprovadas para exames
- **Tratamento de erros**: Se não houver dados, retornar array vazio com status 200

#### 5.6.3 Para Internações (G15)
- **Endpoint**: GET /api/integracao/autorizacoes/internacoes
- Retorna autorizações aprovadas para internações
- **Tratamento de erros**: Se não houver dados, retornar array vazio com status 200

#### 5.6.4 Validação de Dados Fornecidos
- Validar que autorizações retornadas estão em status APROVADO
- Sanitizar dados sensíveis (não enviar dados de decisão interna)
- Incluir timestamp da última atualização
- Limitar quantidade de registros por página (pagination)

### 5.7 Autenticação
- **Endpoint**: POST /api/auth/login
- **Middleware**: JWT para proteger rotas sensíveis
- **Usuários de teste**:
  - admin/admin123 (administrador)
  - usuario/usuario123 (operador)

#### 5.7.1 Tratamento de Erros de Autenticação
- Validar formato de email/username
- Limitar tentativas de login (5 tentativas em 15 minutos)
- Hash de senhas com bcrypt
- Token JWT com expiração de 1 hora
- Refresh token opcional
- Log de tentativas falhas para segurança

## 6. Dados Fictícios para Testes

### 6.1 Pacientes (Mock G1)
```javascript
[
    { idpaciente: 1, nome: 'João Silva', cpf: '123.456.789-00', data_nascimento: '1980-01-15', telefone: '11999999999', email: 'joao@email.com' },
    { idpaciente: 2, nome: 'Maria Santos', cpf: '987.654.321-00', data_nascimento: '1990-05-20', telefone: '11888888888', email: 'maria@email.com' },
    { idpaciente: 3, nome: 'Pedro Oliveira', cpf: '456.789.123-00', data_nascimento: '1975-10-30', telefone: '11777777777', email: 'pedro@email.com' }
]
```

### 6.2 Convênios (Mock G9)
```javascript
[
    { idconvenio: 1, nome: 'Unimed', cnpj: '12.345.678/0001-90', tipo: 'PARTICIPAR', cobertura_exames: 80.00, cobertura_internacoes: 90.00, valor_maximo_automatico: 5000.00, requer_autorizacao: true },
    { idconvenio: 2, nome: 'Bradesco Saúde', cnpj: '98.765.432/0001-10', tipo: 'PARTICIPAR', cobertura_exames: 100.00, cobertura_internacoes: 100.00, valor_maximo_automatico: 10000.00, requer_autorizacao: false },
    { idconvenio: 3, nome: 'SulAmérica', cnpj: '45.678.912/0001-23', tipo: 'NAO_PARTICIPAR', cobertura_exames: 70.00, cobertura_internacoes: 80.00, valor_maximo_automatico: 3000.00, requer_autorizacao: true }
]
```

### 6.3 Regras de Convênio
```javascript
[
    { idregra: 1, idconvenio: 1, tipo_procedimento: 'EXAME', valor_maximo: 2000.00, descricao: 'Exames simples até R$ 2.000,00' },
    { idregra: 2, idconvenio: 1, tipo_procedimento: 'INTERNACAO', valor_maximo: 5000.00, descricao: 'Internações até R$ 5.000,00' },
    { idregra: 3, idconvenio: 2, tipo_procedimento: 'EXAME', valor_maximo: 10000.00, descricao: 'Exames até R$ 10.000,00' }
]
```

### 6.4 Autorizações de Exemplo
```javascript
[
    {
        idautorizacao: 1,
        numero_protocolo: 'AUT-2024-0001',
        idpaciente: 1,
        idconvenio: 1,
        tipo_procedimento: 'EXAME',
        codigo_procedimento: 'EX001',
        descricao_procedimento: 'Ressonância Magnética',
        data_solicitacao: '2024-01-15',
        data_prevista: '2024-01-20',
        medico_solicitante: 'Dr. Carlos Mendes',
        crm_medico: '12345-SP',
        valor_estimado: 1500.00,
        status: 'APROVADO',
        data_decisao: '2024-01-15',
        decisao_motivo: 'Dentro do limite automático do convênio',
        usuario_decisao: 'admin'
    },
    {
        idautorizacao: 2,
        numero_protocolo: 'AUT-2024-0002',
        idpaciente: 2,
        idconvenio: 1,
        tipo_procedimento: 'INTERNACAO',
        codigo_procedimento: 'INT001',
        descricao_procedimento: 'Cirurgia Cardíaca',
        data_solicitacao: '2024-01-16',
        data_prevista: '2024-01-25',
        medico_solicitante: 'Dr. Ana Pereira',
        crm_medico: '54321-SP',
        valor_estimado: 25000.00,
        status: 'REJEITADO',
        data_decisao: '2024-01-16',
        decisao_motivo: 'Valor acima do limite automático, requer análise manual',
        usuario_decisao: 'admin'
    }
]
```

## 7. Cenários de Teste

### Cenário 1: Autorização Automática Aprovada
- Paciente João Silva (id: 1)
- Convênio Unimed (id: 1)
- Exame Ressonância Magnética (R$ 1.500,00)
- **Resultado**: APROVADO (valor abaixo de R$ 2.000,00)

### Cenário 2: Autorização Automática Rejeitada
- Paciente Maria Santos (id: 2)
- Convênio Unimed (id: 1)
- Internação Cirurgia Cardíaca (R$ 25.000,00)
- **Resultado**: REJEITADO (valor acima de R$ 5.000,00)

### Cenário 3: Cobertura Total
- Paciente Pedro Oliveira (id: 3)
- Convênio Bradesco Saúde (id: 2)
- Exame qualquer valor
- **Resultado**: APROVADO (cobertura 100%, não requer autorização)

### Cenário 4: Decisão Manual
- Solicitação acima do limite automático
- Usuário admin aprova manualmente
- **Resultado**: APROVADO (decisão manual)

## 8. Documentação da API

### 8.1 Endpoints Principais

#### POST /api/autorizacao
Criar nova solicitação de autorização

#### GET /api/autorizacao
Listar todas as autorizações (com filtros)

#### GET /api/autorizacao/:id
Buscar autorização por ID

#### PUT /api/autorizacao/:id/decisao
Registrar decisão de aprovação/rejeição

#### GET /api/integracao/autorizacoes/exames
Retorna autorizações aprovadas para exames (consumo G7)

#### GET /api/integracao/autorizacoes/internacoes
Retorna autorizações aprovadas para internações (consumo G15)

#### POST /api/auth/login
Autenticação de usuário

### 8.2 Formato de Resposta
```json
{
    "idautorizacao": 1,
    "numero_protocolo": "AUT-2024-0001",
    "status": "APROVADO",
    "paciente": { "idpaciente": 1, "nome": "João Silva" },
    "convenio": { "idconvenio": 1, "nome": "Unimed" },
    "procedimento": {
        "tipo": "EXAME",
        "codigo": "EX001",
        "descricao": "Ressonância Magnética",
        "valor_estimado": 1500.00
    }
}
```

## 9. Ordem de Implementação

1. ✅ Estrutura de diretórios
2. ⬜ Configuração do banco de dados (PostgreSQL + Sequelize)
3. ⬜ Criação dos models (Autorizacao, Paciente, Convenio, RegraConvenio)
4. ⬜ Criação dos seeds (dados fictícios)
5. ⬜ Criação dos controllers (AutorizacaoController)
6. ⬜ Implementação de serviços de integração (ConvenioService, PacienteService)
7. ⬜ Configuração das rotas da API
8. ⬜ Implementação de autenticação JWT
9. ⬜ Criação do frontend React
10. ⬜ Implementação dos componentes React
11. ⬜ Testes de integração com APIs externas (mock)
12. ⬜ Documentação da API
13. ⬜ Deploy e testes finais

## 10. Portas e Configurações

- **Backend**: Porta 3013
- **Frontend**: Porta 3014
- **Database**: PostgreSQL localhost:5432, database: autorizacao_db
- **API G1 (Pacientes)**: http://localhost:3001
- **API G9 (Convênios)**: http://localhost:3009
