import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../servicos/api.js';
import { getUsuario } from '../servicos/authService.js';

function PaginaAutorizacaoDetalhe() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [autorizacao, setAutorizacao] = useState(null);
    const [loading, setLoading] = useState(true);
    const [decisaoForm, setDecisaoForm] = useState({ status: '', decisao_motivo: '' });
    const [mostrarDecisao, setMostrarDecisao] = useState(false);
    const usuario = getUsuario();

    useEffect(() => {
        carregarAutorizacao();
    }, [id]);

    const carregarAutorizacao = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/autorizacao/${id}`);
            setAutorizacao(response.data);
        } catch (error) {
            console.error('Erro ao carregar autorização:', error);
            alert('Erro ao carregar autorização');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleDecisaoChange = (e) => {
        const { name, value } = e.target;
        setDecisaoForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitDecisao = async (e) => {
        e.preventDefault();
        
        if (!decisaoForm.status) {
            alert('Selecione o status da decisão');
            return;
        }

        if (!decisaoForm.decisao_motivo || decisaoForm.decisao_motivo.trim() === '') {
            alert('O motivo da decisão é obrigatório');
            return;
        }

        try {
            await api.put(`/autorizacao/${id}/decisao`, decisaoForm);
            alert('Decisão registrada com sucesso!');
            setMostrarDecisao(false);
            carregarAutorizacao();
        } catch (error) {
            console.error('Erro ao registrar decisão:', error);
            alert('Erro ao registrar decisão: ' + (error.response?.data?.error || error.message));
        }
    };

    const processarDecisaoAutomatica = async () => {
        if (!window.confirm('Deseja processar a decisão automática para esta autorização?')) {
            return;
        }

        try {
            await api.put(`/autorizacao/${id}/decisao-automatica`);
            alert('Decisão processada com sucesso!');
            carregarAutorizacao();
        } catch (error) {
            console.error('Erro ao processar decisão:', error);
            alert('Erro ao processar decisão');
        }
    };

    const excluirAutorizacao = async () => {
        if (!window.confirm('Deseja realmente excluir esta autorização?')) {
            return;
        }

        try {
            await api.delete(`/autorizacao/${id}`);
            alert('Autorização excluída com sucesso!');
            navigate('/');
        } catch (error) {
            console.error('Erro ao excluir autorização:', error);
            alert('Erro ao excluir autorização: ' + (error.response?.data?.error || error.message));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APROVADO': return '#27ae60';
            case 'REJEITADO': return '#e74c3c';
            case 'PENDENTE': return '#f39c12';
            default: return '#95a5a6';
        }
    };

    if (loading) {
        return <div style={styles.container}>Carregando...</div>;
    }

    if (!autorizacao) {
        return <div style={styles.container}>Autorização não encontrada</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Detalhes da Autorização</h1>
                <Link to="/" style={styles.backButton}>Voltar</Link>
            </div>

            <div style={styles.card}>
                <div style={{...styles.statusBadge, backgroundColor: getStatusColor(autorizacao.status)}}>
                    {autorizacao.status}
                </div>

                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Informações Gerais</h2>
                    <p><strong>Protocolo:</strong> {autorizacao.numero_protocolo}</p>
                    <p><strong>Status:</strong> {autorizacao.status}</p>
                    <p><strong>Data Solicitação:</strong> {autorizacao.data_solicitacao}</p>
                    {autorizacao.data_prevista && (
                        <p><strong>Data Prevista:</strong> {autorizacao.data_prevista}</p>
                    )}
                </div>

                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Paciente</h2>
                    <p><strong>Nome:</strong> {autorizacao.paciente?.nome || 'N/A'}</p>
                    <p><strong>CPF:</strong> {autorizacao.paciente?.cpf || 'N/A'}</p>
                </div>

                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Convênio</h2>
                    <p><strong>Nome:</strong> {autorizacao.convenio?.nome || 'N/A'}</p>
                    <p><strong>Tipo:</strong> {autorizacao.convenio?.tipo || 'N/A'}</p>
                </div>

                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Procedimento</h2>
                    <p><strong>Tipo:</strong> {autorizacao.tipo_procedimento}</p>
                    <p><strong>Código:</strong> {autorizacao.codigo_procedimento}</p>
                    <p><strong>Descrição:</strong> {autorizacao.descricao_procedimento}</p>
                    <p><strong>Valor Estimado:</strong> R$ {autorizacao.valor_estimado}</p>
                </div>

                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Médico Solicitante</h2>
                    <p><strong>Nome:</strong> {autorizacao.medico_solicitante}</p>
                    <p><strong>CRM:</strong> {autorizacao.crm_medico}</p>
                </div>

                {autorizacao.data_decisao && (
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Decisão</h2>
                        <p><strong>Data:</strong> {autorizacao.data_decisao}</p>
                        <p><strong>Status:</strong> {autorizacao.status}</p>
                        <p><strong>Motivo:</strong> {autorizacao.decisao_motivo}</p>
                        <p><strong>Usuário:</strong> {autorizacao.usuario_decisao}</p>
                    </div>
                )}

                {autorizacao.status === 'PENDENTE' && usuario?.role === 'admin' && (
                    <div style={styles.actions}>
                        <button 
                            onClick={processarDecisaoAutomatica}
                            style={styles.autoButton}
                        >
                            Decisão Automática
                        </button>
                        <button 
                            onClick={() => setMostrarDecisao(true)}
                            style={styles.manualButton}
                        >
                            Decisão Manual
                        </button>
                        <Link 
                            to={`/autorizacao/${id}/editar`}
                            style={styles.editButton}
                        >
                            Editar
                        </Link>
                        <button 
                            onClick={excluirAutorizacao}
                            style={styles.deleteButton}
                        >
                            Excluir
                        </button>
                    </div>
                )}

                {mostrarDecisao && (
                    <div style={styles.decisaoForm}>
                        <h3 style={styles.formTitle}>Registrar Decisão Manual</h3>
                        <form onSubmit={handleSubmitDecisao}>
                            <div style={styles.field}>
                                <label style={styles.label}>Status *</label>
                                <select
                                    name="status"
                                    value={decisaoForm.status}
                                    onChange={handleDecisaoChange}
                                    style={styles.input}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    <option value="APROVADO">Aprovado</option>
                                    <option value="REJEITADO">Rejeitado</option>
                                </select>
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Motivo *</label>
                                <textarea
                                    name="decisao_motivo"
                                    value={decisaoForm.decisao_motivo}
                                    onChange={handleDecisaoChange}
                                    style={styles.textarea}
                                    required
                                />
                            </div>
                            <div style={styles.formActions}>
                                <button type="submit" style={styles.submitButton}>Confirmar</button>
                                <button 
                                    type="button" 
                                    onClick={() => setMostrarDecisao(false)}
                                    style={styles.cancelButton}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '800px',
        margin: '2rem auto',
        padding: '0 1rem'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
    },
    title: {
        margin: 0
    },
    backButton: {
        backgroundColor: '#95a5a6',
        color: 'white',
        textDecoration: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px'
    },
    card: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative'
    },
    statusBadge: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '12px',
        fontSize: '0.9rem',
        fontWeight: 'bold'
    },
    section: {
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #ecf0f1'
    },
    sectionTitle: {
        fontSize: '1.2rem',
        marginBottom: '1rem',
        color: '#2c3e50'
    },
    actions: {
        display: 'flex',
        gap: '1rem',
        marginTop: '2rem',
        flexWrap: 'wrap'
    },
    autoButton: {
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem'
    },
    manualButton: {
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem'
    },
    editButton: {
        backgroundColor: '#f39c12',
        color: 'white',
        textDecoration: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '4px',
        fontSize: '1rem'
    },
    deleteButton: {
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem'
    },
    decisaoForm: {
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
    },
    formTitle: {
        marginTop: 0,
        marginBottom: '1rem'
    },
    field: {
        marginBottom: '1rem'
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 'bold'
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1rem',
        boxSizing: 'border-box'
    },
    textarea: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1rem',
        minHeight: '80px',
        boxSizing: 'border-box',
        resize: 'vertical'
    },
    formActions: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1rem'
    },
    submitButton: {
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        padding: '0.75rem 2rem',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem'
    },
    cancelButton: {
        backgroundColor: '#95a5a6',
        color: 'white',
        border: 'none',
        padding: '0.75rem 2rem',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem'
    }
};

export default PaginaAutorizacaoDetalhe;
