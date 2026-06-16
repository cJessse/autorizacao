import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../servicos/api.js';
import { getUsuario } from '../servicos/authService.js';

function PaginaAutorizacaoLista() {
    const [autorizacoes, setAutorizacoes] = useState([]);
    const [filtroStatus, setFiltroStatus] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroPaciente, setFiltroPaciente] = useState('');
    const [filtroConvenio, setFiltroConvenio] = useState('');
    const [filtroDataInicio, setFiltroDataInicio] = useState('');
    const [filtroDataFim, setFiltroDataFim] = useState('');
    const [loading, setLoading] = useState(true);
    const usuario = getUsuario();

    useEffect(() => {
        carregarAutorizacoes();
    }, [filtroStatus, filtroTipo, filtroPaciente, filtroConvenio, filtroDataInicio, filtroDataFim]);

    const carregarAutorizacoes = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filtroStatus) params.status = filtroStatus;
            if (filtroTipo) params.tipo_procedimento = filtroTipo;
            if (filtroPaciente) params.idpaciente = filtroPaciente;
            if (filtroConvenio) params.idconvenio = filtroConvenio;
            if (filtroDataInicio) params.data_inicio = filtroDataInicio;
            if (filtroDataFim) params.data_fim = filtroDataFim;

            const response = await api.get('/autorizacao', { params });
            setAutorizacoes(response.data);
        } catch (error) {
            console.error('Erro ao carregar autorizações:', error);
            alert('Erro ao carregar autorizações');
        } finally {
            setLoading(false);
        }
    };

    const processarDecisaoAutomatica = async (id) => {
        if (!window.confirm('Deseja processar a decisão automática para esta autorização?')) {
            return;
        }

        try {
            await api.put(`/autorizacao/${id}/decisao-automatica`);
            alert('Decisão processada com sucesso!');
            carregarAutorizacoes();
        } catch (error) {
            console.error('Erro ao processar decisão:', error);
            alert('Erro ao processar decisão');
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

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Lista de Autorizações</h1>

            <div style={styles.filtrosContainer}>
                <div style={styles.filtros}>
                    <select 
                        value={filtroStatus} 
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        style={styles.select}
                    >
                        <option value="">Todos os Status</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="APROVADO">Aprovado</option>
                        <option value="REJEITADO">Rejeitado</option>
                    </select>

                    <select 
                        value={filtroTipo} 
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        style={styles.select}
                    >
                        <option value="">Todos os Tipos</option>
                        <option value="EXAME">Exame</option>
                        <option value="INTERNACAO">Internação</option>
                    </select>

                    <input
                        type="number"
                        placeholder="ID Paciente"
                        value={filtroPaciente}
                        onChange={(e) => setFiltroPaciente(e.target.value)}
                        style={styles.select}
                    />

                    <input
                        type="number"
                        placeholder="ID Convênio"
                        value={filtroConvenio}
                        onChange={(e) => setFiltroConvenio(e.target.value)}
                        style={styles.select}
                    />

                    <input
                        type="date"
                        placeholder="Data Início"
                        value={filtroDataInicio}
                        onChange={(e) => setFiltroDataInicio(e.target.value)}
                        style={styles.select}
                    />

                    <input
                        type="date"
                        placeholder="Data Fim"
                        value={filtroDataFim}
                        onChange={(e) => setFiltroDataFim(e.target.value)}
                        style={styles.select}
                    />

                    {usuario?.role === 'admin' && (
                        <Link to="/autorizacao/nova" style={styles.button}>Nova Autorização</Link>
                    )}
                </div>
            </div>

            <div style={styles.grid}>
                {autorizacoes.map((aut) => (
                    <div key={aut.idautorizacao} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h3 style={styles.cardTitle}>Protocolo:</h3>
                            <div style={{...styles.statusBadge, backgroundColor: getStatusColor(aut.status)}}>
                                {aut.status}
                            </div>

                        </div>
                        <p><strong>Paciente:</strong> {aut.paciente?.nome || 'N/A'}</p>
                        <p><strong>Convênio:</strong> {aut.convenio?.nome || 'N/A'}</p>
                        <p><strong>Tipo:</strong> {aut.tipo_procedimento}</p>
                        <p><strong>Procedimento:</strong> {aut.descricao_procedimento}</p>
                        <p><strong>Valor Estimado:</strong> R$ {aut.valor_estimado}</p>
                        <p><strong>Data Solicitação:</strong> {aut.data_solicitacao}</p>
                        {aut.data_decisao && (
                            <p><strong>Data Decisão:</strong> {aut.data_decisao}</p>
                        )}
                        {aut.decisao_motivo && (
                            <p><strong>Motivo:</strong> {aut.decisao_motivo}</p>
                        )}
                        
                        <div style={styles.cardActions}>
                            <Link to={`/autorizacao/${aut.idautorizacao}`} style={styles.linkButton}>
                                Ver Detalhes
                            </Link>
                            {aut.status === 'PENDENTE' && usuario?.role === 'admin' && (
                                <button 
                                    onClick={() => processarDecisaoAutomatica(aut.idautorizacao)}
                                    style={styles.autoButton}
                                >
                                    Decisão Automática
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {autorizacoes.length === 0 && (
                <p style={styles.empty}>Nenhuma autorização encontrada.</p>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: '0 1rem'
    },
    title: {
        marginBottom: '1.5rem'
    },
    filtrosContainer: {
        marginBottom: '2rem'
    },
    filtros: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center'
    },
    select: {
        padding: '0.5rem',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '1rem'
    },
    button: {
        backgroundColor: '#3498db',
        color: 'white',
        textDecoration: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        fontSize: '1rem'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem'
    },
    card: {
        position: 'relative',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1.5rem',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '0.5rem',
        marginBottom: '1rem'
    },
    statusBadge: {
        color: 'white',
        padding: '0.35rem 0.75rem',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        whiteSpace: 'nowrap',
        flexShrink: 0
    },
    cardTitle: {
        marginTop: '0',
        marginBottom: '0',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        wordBreak: 'break-all',
        flexGrow: 1
    },
    cardActions: {
        marginTop: '1rem',
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
    },
    linkButton: {
        backgroundColor: '#3498db',
        color: 'white',
        textDecoration: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        fontSize: '0.9rem'
    },
    autoButton: {
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.9rem'
    },
    empty: {
        textAlign: 'center',
        color: '#7f8c8d',
        fontSize: '1.1rem'
    }
};

export default PaginaAutorizacaoLista;
