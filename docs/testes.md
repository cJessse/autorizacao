# Testes de Cenários de Falha - Sistema G13 Autorização

## Documento de Testes Completos para Cenários de Falha

Este documento contém uma lista completa de testes para todos os possíveis cenários de falha do sistema de autorização de procedimentos médicos.

---

## 1. Testes de Autenticação

### 1.1 Login com Credenciais Inválidas
- **Cenário**: Tentativa de login com username incorreto
- **Entrada**: username="usuario_inexistente", password="admin123"
- **Resultado Esperado**: Erro 401 com mensagem "Credenciais inválidas"

### 1.2 Login com Senha Incorreta
- **Cenário**: Tentativa de login com senha incorreta
- **Entrada**: username="admin", password="senha_errada"
- **Resultado Esperado**: Erro 401 com mensagem "Credenciais inválidas"

### 1.3 Login sem Credenciais
- **Cenário**: Tentativa de login sem fornecer username ou password
- **Entrada**: {} ou username="" ou password=""
- **Resultado Esperado**: Erro 400 com mensagem de validação

### 1.4 Token JWT Expirado
- **Cenário**: Tentativa de acesso com token JWT expirado
- **Entrada**: Header Authorization com token expirado
- **Resultado Esperado**: Erro 401 com mensagem "Token expirado"

### 1.5 Token JWT Inválido
- **Cenário**: Tentativa de acesso com token JWT malformado
- **Entrada**: Header Authorization com token inválido
- **Resultado Esperado**: Erro 401 com mensagem "Token inválido"

### 1.6 Token JWT Ausente
- **Cenário**: Tentativa de acesso sem token JWT
- **Entrada**: Sem header Authorization
- **Resultado Esperado**: Erro 401 com mensagem "Token não fornecido"

### 1.7 Token JWT Assinatura Inválida
- **Cenário**: Tentativa de acesso com token assinado com chave diferente
- **Entrada**: Token assinado com chave secreta incorreta
- **Resultado Esperado**: Erro 401 com mensagem "Assinatura inválida"

---

## 2. Testes de Autorização

### 2.1 Acesso sem Permissão de Admin
- **Cenário**: Usuário comum tenta deletar autorização
- **Entrada**: Token de usuário comum, DELETE /api/autorizacao/1
- **Resultado Esperado**: Erro 403 com mensagem "Permissão negada"

### 2.2 Acesso sem Permissão de Aprovação
- **Cenário**: Usuário comum tenta aprovar/rejeitar autorização
- **Entrada**: Token de usuário comum, PUT /api/autorizacao/1/decisao
- **Resultado Esperado**: Erro 403 com mensagem "Permissão negada"

### 2.3 Acesso a Recurso Inexistente
- **Cenário**: Tentativa de acesso a autorização que não existe
- **Entrada**: GET /api/autorizacao/99999
- **Resultado Esperado**: Erro 404 com mensagem "Autorização não encontrada"

---

## 3. Testes de Validação de Dados

### 3.1 Criação sem Campos Obrigatórios
- **Cenário**: Tentativa de criar autorização sem campos obrigatórios
- **Entrada**: POST /api/autorizacao com body incompleto (faltando idpaciente, idconvenio, etc.)
- **Resultado Esperado**: Erro 400 com mensagem de validação detalhada

### 3.2 Criação com CPF Inválido
- **Cenário**: Tentativa de criar autorização com CPF malformado
- **Entrada**: CPF com formato incorreto (ex: "123456", "abc.def.ghi-jk")
- **Resultado Esperado**: Erro 400 com mensagem "CPF inválido"

### 3.3 Criação com Data Inválida
- **Cenário**: Tentativa de criar autorização com data em formato incorreto
- **Entrada**: data_prevista="2024/13/45" ou "texto"
- **Resultado Esperado**: Erro 400 com mensagem "Data inválida"

### 3.4 Criação com Valor Negativo
- **Cenário**: Tentativa de criar autorização com valor_estimado negativo
- **Entrada**: valor_estimado=-100.00
- **Resultado Esperado**: Erro 400 com mensagem "Valor deve ser positivo"

### 3.5 Criação com Tipo de Procedimento Inválido
- **Cenário**: Tentativa de criar autorização com tipo não permitido
- **Entrada**: tipo_procedimento="CIRURGIA" (deve ser EXAME ou INTERNACAO)
- **Resultado Esperado**: Erro 400 com mensagem "Tipo de procedimento inválido"

### 3.6 Criação com CRM Inválido
- **Cenário**: Tentativa de criar autorização com CRM malformado
- **Entrada**: crm_medico="123" (formato incorreto)
- **Resultado Esperado**: Erro 400 com mensagem "CRM inválido"

### 3.7 Atualização com Status Inválido
- **Cenário**: Tentativa de atualizar autorização com status não permitido
- **Entrada**: status="EM_ANALISE" (deve ser PENDENTE, APROVADO ou REJEITADO)
- **Resultado Esperado**: Erro 400 com mensagem "Status inválido"

---

## 4. Testes de Integração - API G1 (Pacientes)

### 4.1 API G1 Indisponível
- **Cenário**: API G1 está fora do ar durante criação de autorização
- **Entrada**: Criar autorização quando API G1 não responde
- **Resultado Esperado**: Sistema usa fallback mock local, log de erro, autorização criada com dados mock

### 4.2 API G1 Timeout
- **Cenário**: API G1 demora mais de 5 segundos para responder
- **Entrada**: Criar autorização quando API G1 excede timeout
- **Resultado Esperado**: Sistema usa fallback mock local após timeout, log de warning

### 4.3 API G1 Retorna Dados Corrompidos
- **Cenário**: API G1 retorna JSON malformado ou schema incorreto
- **Entrada**: API G1 retorna dados fora do schema esperado
- **Resultado Esperado**: Sistema rejeita dados, usa fallback mock, log de erro

### 4.4 API G1 Retorna Erro 500
- **Cenário**: API G1 retorna erro interno do servidor
- **Entrada**: API G1 retorna status 500
- **Resultado Esperado**: Sistema usa fallback mock local, log de erro

### 4.5 API G1 Retorna Erro 404
- **Cenário**: API G1 não encontra o paciente solicitado
- **Entrada**: idpaciente=999 (não existe na API G1)
- **Resultado Esperado**: Erro 404 com mensagem "Paciente não encontrado"

### 4.6 Circuit Breaker Aberto
- **Cenário**: Circuit breaker para API G1 está aberto após 5 falhas consecutivas
- **Entrada**: Tentar acessar API G1 enquanto circuit breaker está aberto
- **Resultado Esperado**: Rejeição imediata sem tentar conexão, usa fallback mock

### 4.7 Retry Excedido
- **Cenário**: API G1 falha em todas as 3 tentativas de retry
- **Entrada**: API G1 falha consistentemente
- **Resultado Esperado**: Após 3 retries, usa fallback mock, log de erro

---

## 5. Testes de Integração - API G9 (Convênios)

### 5.1 API G9 Indisponível
- **Cenário**: API G9 está fora do ar durante criação de autorização
- **Entrada**: Criar autorização quando API G9 não responde
- **Resultado Esperado**: Sistema usa fallback mock local, log de erro, autorização criada com dados mock

### 5.2 API G9 Timeout
- **Cenário**: API G9 demora mais de 5 segundos para responder
- **Entrada**: Criar autorização quando API G9 excede timeout
- **Resultado Esperado**: Sistema usa fallback mock local após timeout, log de warning

### 5.3 API G9 Retorna Dados Corrompidos
- **Cenário**: API G9 retorna JSON malformado ou schema incorreto
- **Entrada**: API G9 retorna dados fora do schema esperado
- **Resultado Esperado**: Sistema rejeita dados, usa fallback mock, log de erro

### 5.4 API G9 Retorna Erro 500
- **Cenário**: API G9 retorna erro interno do servidor
- **Entrada**: API G9 retorna status 500
- **Resultado Esperado**: Sistema usa fallback mock local, log de erro

### 5.5 API G9 Retorna Erro 404
- **Cenário**: API G9 não encontra o convênio solicitado
- **Entrada**: idconvenio=999 (não existe na API G9)
- **Resultado Esperado**: Erro 404 com mensagem "Convênio não encontrado"

### 5.6 Circuit Breaker Aberto
- **Cenário**: Circuit breaker para API G9 está aberto após 5 falhas consecutivas
- **Entrada**: Tentar acessar API G9 enquanto circuit breaker está aberto
- **Resultado Esperado**: Rejeição imediata sem tentar conexão, usa fallback mock

### 5.7 Retry Excedido
- **Cenário**: API G9 falha em todas as 3 tentativas de retry
- **Entrada**: API G9 falha consistentemente
- **Resultado Esperado**: Após 3 retries, usa fallback mock, log de erro

---

## 6. Testes de Banco de Dados

### 6.1 Conexão com Banco Falha
- **Cenário**: PostgreSQL está indisponível
- **Entrada**: Tentar acessar qualquer endpoint com banco desconectado
- **Resultado Esperado**: Erro 500 com mensagem "Erro de conexão com banco de dados"

### 6.2 Query Timeout
- **Cenário**: Query demora mais que o tempo limite
- **Entrada**: Query complexa que excede timeout
- **Resultado Esperado**: Erro 500 com mensagem "Query timeout"

### 6.3 Constraint Violation - Unique
- **Cenário**: Tentar inserir registro com chave duplicada
- **Entrada**: Criar autorização com numero_protocolo duplicado
- **Resultado Esperado**: Erro 409 com mensagem "Violação de constraint única"

### 6.4 Constraint Violation - Foreign Key
- **Cenário**: Tentar inserir registro com foreign key inexistente
- **Entrada**: Criar autorização com idpaciente ou idconvenio inexistente
- **Resultado Esperado**: Erro 400 com mensagem "Violação de foreign key"

### 6.5 Constraint Violation - Not Null
- **Cenário**: Tentar inserir registro com campo obrigatório nulo
- **Entrada**: Criar autorização sem campo obrigatório
- **Resultado Esperado**: Erro 400 com mensagem "Campo obrigatório ausente"

### 6.6 Transação Rollback
- **Cenário**: Erro durante transação deve causar rollback
- **Entrada**: Operação que falha no meio de transação
- **Resultado Esperado**: Nenhuma alteração persistida, estado anterior mantido

### 6.7 Pool de Conexões Esgotado
- **Cenário**: Todas as conexões do pool estão em uso
- **Entrada**: Múltiplas requisições simultâneas
- **Resultado Esperado**: Erro 500 com mensagem "Pool de conexões esgotado" ou fila de espera

---

## 7. Testes de Lógica de Negócios

### 7.1 Decisão Automática - Valor Acima do Limite
- **Cenário**: Procedimento com valor acima do limite automático
- **Entrada**: valor_estimado=15000, convênio com valor_maximo_automatico=5000
- **Resultado Esperado**: Status REJEITADO automaticamente, motivo="Valor acima do limite automático"

### 7.2 Decisão Automática - Valor Abaixo do Limite
- **Cenário**: Procedimento com valor abaixo do limite automático
- **Entrada**: valor_estimado=3000, convênio com valor_maximo_automatico=5000
- **Resultado Esperado**: Status APROVADO automaticamente, motivo="Dentro do limite automático"

### 7.3 Decisão Automática - Cobertura Total
- **Cenário**: Convênio com 100% de cobertura
- **Entrada**: Convênio com cobertura_exames=100, qualquer valor
- **Resultado Esperado**: Status APROVADO automaticamente, motivo="Cobertura total do convênio"

### 7.4 Tentativa de Alterar Decisão Já Definida
- **Cenário**: Tentar alterar autorização já aprovada/rejeitada
- **Entrada**: PUT /api/autorizacao/1 com status já definido
- **Resultado Esperado**: Erro 400 com mensagem "Decisão já definida, não pode ser alterada"

### 7.5 Decisão Manual sem Permissão
- **Cenário**: Usuário comum tenta aprovar manualmente
- **Entrada**: Token de usuário comum, PUT /api/autorizacao/1/decisao
- **Resultado Esperado**: Erro 403 com mensagem "Permissão negada"

### 7.6 Decisão Manual com Motivo Ausente
- **Cenário**: Admin tenta aprovar sem fornecer motivo
- **Entrada**: PUT /api/autorizacao/1/decisao sem decisao_motivo
- **Resultado Esperado**: Erro 400 com mensagem "Motivo da decisão é obrigatório"

### 7.7 Procedimento Não Requer Autorização
- **Cenário**: Convênio marcado como não requer autorização
- **Entrada**: Convênio com requer_autorizacao=false
- **Resultado Esperado**: Status APROVADO automaticamente sem validações adicionais

### 7.8 Regra de Convênio Não Encontrada
- **Cenário**: Tipo de procedimento sem regra definida para o convênio
- **Entrada**: tipo_procedimento sem regra correspondente
- **Resultado Esperado**: Erro 400 com mensagem "Regra de convênio não encontrada"

---

## 8. Testes de Concorrência

### 8.1 Criação Simultânea de Autorizações
- **Cenário**: Múltiplos usuários criam autorizações ao mesmo tempo
- **Entrada**: 10 requisições POST simultâneas
- **Resultado Esperado**: Todas as autorizações criadas com sucesso, números de protocolo únicos

### 8.2 Atualização Simultânea da Mesma Autorização
- **Cenário**: Dois usuários tentam atualizar a mesma autorização
- **Entrada**: 2 requisições PUT simultâneas para /api/autorizacao/1
- **Resultado Esperado**: Uma succeeds, outra falha com erro de concorrência ou última escrita prevalece

### 8.3 Decisão Simultânea na Mesma Autorização
- **Cenário**: Dois admins tentam aprovar a mesma autorização
- **Entrada**: 2 requisições PUT simultâneas para /api/autorizacao/1/decisao
- **Resultado Esperado**: Uma succeeds, outra falha com erro "Decisão já definida"

### 8.4 Race Condition em Número de Protocolo
- **Cenário**: Geração simultânea de números de protocolo
- **Entrada**: Múltiplas criações simultâneas
- **Resultado Esperado**: Números de protocolo únicos, sem duplicação

---

## 9. Testes de Performance

### 9.1 Lista com Muitos Registros
- **Cenário**: Listar autorizações com 10.000+ registros
- **Entrada**: GET /api/autorizacao com banco populado
- **Resultado Esperado**: Resposta em < 3 segundos, paginação funcionando

### 9.2 Filtro Complexo
- **Cenário**: Aplicar múltiplos filtros simultaneamente
- **Entrada**: GET /api/autorizacao?status=APROVADO&idpaciente=1&idconvenio=2
- **Resultado Esperado**: Resposta em < 2 segundos, resultados corretos

### 9.3 Alta Carga de Requisições
- **Cenário**: 100 requisições por segundo durante 1 minuto
- **Entrada**: Load test com 6000 requisições
- **Resultado Esperado**: < 1% de erro, tempo médio de resposta < 500ms

### 9.4 Consulta Detalhada Pesada
- **Cenário**: Buscar autorização com muitos relacionamentos
- **Entrada**: GET /api/autorizacao/1 com joins complexos
- **Resultado Esperado**: Resposta em < 1 segundo

---

## 10. Testes de Segurança

### 10.1 SQL Injection
- **Cenário**: Tentativa de injeção de SQL via parâmetros
- **Entrada**: idpaciente="1' OR '1'='1"
- **Resultado Esperado**: Rejeição ou tratamento seguro, sem exposição de dados

### 10.2 XSS via Campos de Texto
- **Cenário**: Tentativa de injeção de script via campos
- **Entrada**: descricao_procedimento="<script>alert('XSS')</script>"
- **Resultado Esperado**: Script sanitizado ou escapado, não executado

### 10.3 CSRF Attack
- **Cenário**: Tentativa de requisição cross-site sem token CSRF
- **Entrada**: POST de origem diferente sem token válido
- **Resultado Esperado**: Rejeição da requisição

### 10.4 Brute Force Login
- **Cenário**: Múltiplas tentativas de login consecutivas
- **Entrada**: 100 tentativas de login com senhas incorretas
- **Resultado Esperado**: Bloqueio temporário ou rate limiting após tentativas excessivas

### 10.5 Enumeração de Usuários
- **Cenário**: Tentativa de descobrir usuários válidos
- **Entrada**: Múltiplas tentativas de login com diferentes usernames
- **Resultado Esperado**: Mensagens genéricas que não revelam existência de usuários

---

## 11. Testes de Integração com Outros Módulos

### 11.1 Consumo G7 - Exames
- **Cenário**: G7 tenta consumir autorizações de exames
- **Entrada**: GET /api/integracao/autorizacoes/exames
- **Resultado Esperado**: Retorna apenas autorizações APROVADAS do tipo EXAME

### 11.2 Consumo G15 - Internações
- **Cenário**: G15 tenta consumir autorizações de internações
- **Entrada**: GET /api/integracao/autorizacoes/internacoes
- **Resultado Esperado**: Retorna apenas autorizações APROVADAS do tipo INTERNACAO

### 11.3 Consumo G4 - Consultas
- **Cenário**: G4 tenta consumir autorizações de consultas
- **Entrada**: GET /api/integracao/autorizacoes/consulta
- **Resultado Esperado**: Retorna apenas autorizações APROVADAS do tipo CONSULTA

### 11.4 Health Check - Integrações Falhando
- **Cenário**: Verificar health quando APIs externas estão falhando
- **Entrada**: GET /api/health com APIs G1/G9 fora do ar
- **Resultado Esperado**: Status "degraded" ou "unhealthy" com detalhes das integrações falhando

---

## 12. Testes de Edge Cases

### 12.1 Data Prevista no Passado
- **Cenário**: Criar autorização com data_prevista anterior à data atual
- **Entrada**: data_prevista="2020-01-01"
- **Resultado Esperado**: Erro 400 com mensagem "Data prevista não pode ser no passado"

### 12.2 Valor Zero
- **Cenário**: Criar autorização com valor_estimado=0
- **Entrada**: valor_estimado=0.00
- **Resultado Esperado**: Erro 400 com mensagem "Valor deve ser maior que zero"

### 12.3 Nome de Médico Vazio
- **Cenário**: Criar autorização sem nome do médico
- **Entrada**: medico_solicitante=""
- **Resultado Esperado**: Erro 400 com mensagem "Nome do médico é obrigatório"

### 12.4 Código de Procedimento Muito Longo
- **Cenário**: Criar autorização com código_procedimento excessivamente longo
- **Entrada**: codigo_procedimento="EX" + 1000 caracteres
- **Resultado Esperado**: Erro 400 com mensagem "Código muito longo"

### 12.5 Descrição com Caracteres Especiais
- **Cenário**: Criar autorização com caracteres especiais na descrição
- **Entrada**: descricao_procedimento com emojis, unicode, etc.
- **Resultado Esperado**: Aceito e armazenado corretamente, ou sanitizado

### 12.6 Paciente e Convênio Incompatíveis
- **Cenário**: Paciente não tem vínculo com o convênio informado
- **Entrada**: idpaciente=1, idconvenio=999 (sem vínculo)
- **Resultado Esperado**: Erro 400 com mensagem "Paciente não possui este convênio"

### 12.7 Deletar Autorização com Decisão
- **Cenário**: Tentar deletar autorização já decidida
- **Entrada**: DELETE /api/autorizacao/1 onde status=APROVADO
- **Resultado Esperado**: Erro 400 com mensagem "Não é possível deletar autorização já decidida"

---

## 13. Testes de Logs e Monitoramento

### 13.1 Log de Erro de Integração
- **Cenário**: Verificar se erros de integração são logados corretamente
- **Entrada**: Forçar falha na API G1
- **Resultado Esperado**: Log com nível ERROR contendo detalhes da falha

### 13.2 Log de Decisão Automática
- **Cenário**: Verificar se decisões automáticas são logadas
- **Entrada**: Criar autorização que gera decisão automática
- **Resultado Esperado**: Log com nível INFO contendo motivo da decisão

### 13.3 Log de Acesso Não Autorizado
- **Cenário**: Verificar se tentativas de acesso não autorizado são logadas
- **Entrada**: Tentar acessar endpoint sem permissão
- **Resultado Esperado**: Log com nível WARN contendo IP, usuário, endpoint

### 13.4 Log de Performance
- **Cenário**: Verificar se operações lentas são logadas
- **Entrada**: Executar operação que demora > 1 segundo
- **Resultado Esperado**: Log com nível WARN contendo tempo de execução

---

## 14. Testes de Cache

### 14.1 Cache Hit
- **Cenário**: Segunda requisição para mesmo dado deve usar cache
- **Entrada**: Duas requisições GET /api/autorizacao/1 consecutivas
- **Resultado Esperado**: Segunda requisição mais rápida, usando cache

### 14.2 Cache Miss
- **Cenário**: Primeira requisição para dado não cacheado
- **Entrada**: GET /api/autorizacao/999 (não cacheado)
- **Resultado Esperado**: Busca na fonte, popula cache

### 14.3 Cache Invalidation
- **Cenário**: Atualização de dado deve invalidar cache
- **Entrada**: PUT /api/autorizacao/1 após cache populado
- **Resultado Esperado**: Cache invalidado, próxima requisição busca na fonte

### 14.4 Cache Expiration
- **Cenário**: Cache expira após TTL
- **Entrada**: Aguardar expiração do TTL, fazer nova requisição
- **Resultado Esperado**: Cache expirado, busca na fonte novamente

---

## 15. Testes de Configuração

### 15.1 Configuração de Banco Incorreta
- **Cenário**: Configuração de banco com credenciais erradas
- **Entrada**: database.js com senha incorreta
- **Resultado Esperado**: Erro ao iniciar, mensagem clara sobre falha de conexão

### 15.2 Porta Já em Uso
- **Cenário**: Tentar iniciar servidor em porta já ocupada
- **Entrada**: Porta 3013 já em uso
- **Resultado Esperado**: Erro ao iniciar, mensagem "Porta já em uso"

### 15.3 Variáveis de Ambiente Ausentes
- **Cenário**: Variáveis de ambiente obrigatórias não definidas
- **Entrada**: Iniciar sem JWT_SECRET, DB_PASSWORD, etc.
- **Resultado Esperado**: Erro ao iniciar, mensagem sobre variável ausente

---

## Resumo de Cobertura

- **Total de Cenários de Teste**: 85+
- **Categorias de Teste**: 15
- **Pontos Críticos Cobertos**: Autenticação, Autorização, Integrações, Banco de Dados, Lógica de Negócios, Concorrência, Performance, Segurança

## Priorização de Testes

### Críticos (Must Have)
- Todos os testes de Autenticação (1.1-1.7)
- Testes de Autorização (2.1-2.3)
- Testes de Validação de Dados (3.1-3.7)
- Testes de Integração - APIs Externas (4.1-4.7, 5.1-5.7)
- Testes de Lógica de Negócios (7.1-7.8)

### Importantes (Should Have)
- Testes de Banco de Dados (6.1-6.7)
- Testes de Concorrência (8.1-8.4)
- Testes de Segurança (10.1-10.5)
- Testes de Integração com Outros Módulos (11.1-11.4)

### Desejáveis (Nice to Have)
- Testes de Performance (9.1-9.4)
- Testes de Edge Cases (12.1-12.7)
- Testes de Logs e Monitoramento (13.1-13.4)
- Testes de Cache (14.1-14.4)
- Testes de Configuração (15.1-15.3)

## Ferramentas Sugeridas

- **Testes Unitários**: Jest, Mocha, Chai
- **Testes de Integração**: Supertest, Axios
- **Testes de Carga**: Artillery, k6
- **Testes de Segurança**: OWASP ZAP, Burp Suite
- **Mock de APIs**: Nock, MSW (Mock Service Worker)
- **Testes E2E**: Cypress, Playwright
