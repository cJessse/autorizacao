import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../servicos/api.js';

function PaginaAutorizacaoCadastro() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState({
        idpaciente: '',
        idconvenio: '',
        tipo_procedimento: 'EXAME',
        codigo_procedimento: '',
        descricao_procedimento: '',
        data_prevista: '',
        medico_solicitante: '',
        crm_medico: '',
        valor_estimado: ''
    });
    const [pacientes, setPacientes] = useState([]);
    const [convenios, setConvenios] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        carregarPacientes();
        carregarConvenios();
        if (id) {
            carregarAutorizacao();
        }
    }, [id]);

    const carregarPacientes = async () => {
        try {
            // Usar dados mock locais para pacientes
            const response = await api.get('/autorizacao'); // Temporário, depois usar endpoint específico
            // Por enquanto, usar dados fixos
            setPacientes([
                { idpaciente: 1, nome: 'João Silva' },
                { idpaciente: 2, nome: 'Maria Santos' },
                { idpaciente: 3, nome: 'Pedro Oliveira' },
                { idpaciente: 4, nome: 'Ana Costa' },
                { idpaciente: 5, nome: 'Carlos Lima' }
            ]);
        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
        }
    };

    const carregarConvenios = async () => {
        try {
            // Usar dados mock locais para convênios
            setConvenios([
                { idconvenio: 1, nome: 'Unimed' },
                { idconvenio: 2, nome: 'Bradesco Saúde' },
                { idconvenio: 3, nome: 'SulAmérica' }
            ]);
        } catch (error) {
            console.error('Erro ao carregar convênios:', error);
        }
    };

    const carregarAutorizacao = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/autorizacao/${id}`);
            const aut = response.data;
            setFormData({
                idpaciente: aut.idpaciente,
                idconvenio: aut.idconvenio,
                tipo_procedimento: aut.tipo_procedimento,
                codigo_procedimento: aut.codigo_procedimento,
                descricao_procedimento: aut.descricao_procedimento,
                data_prevista: aut.data_prevista || '',
                medico_solicitante: aut.medico_solicitante,
                crm_medico: aut.crm_medico,
                valor_estimado: aut.valor_estimado || ''
            });
        } catch (error) {
            console.error('Erro ao carregar autorização:', error);
            alert('Erro ao carregar autorização');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.idpaciente || !formData.idconvenio || !formData.codigo_procedimento || 
            !formData.descricao_procedimento || !formData.medico_solicitante || !formData.crm_medico) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            setLoading(true);
            if (id) {
                await api.put(`/autorizacao/${id}`, formData);
                alert('Autorização atualizada com sucesso!');
            } else {
                await api.post('/autorizacao', formData);
                alert('Autorização criada com sucesso!');
            }
            navigate('/');
        } catch (error) {
            console.error('Erro ao salvar autorização:', error);
            alert('Erro ao salvar autorização: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>
                {id ? 'Editar Autorização' : 'Nova Autorização'}
            </h1>

            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.row}>
                    <div style={styles.field}>
                        <label style={styles.label}>Paciente *</label>
                        <select
                            name="idpaciente"
                            value={formData.idpaciente}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        >
                            <option value="">Selecione...</option>
                            {pacientes.map(p => (
                                <option key={p.idpaciente} value={p.idpaciente}>{p.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Convênio *</label>
                        <select
                            name="idconvenio"
                            value={formData.idconvenio}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        >
                            <option value="">Selecione...</option>
                            {convenios.map(c => (
                                <option key={c.idconvenio} value={c.idconvenio}>{c.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={styles.row}>
                    <div style={styles.field}>
                        <label style={styles.label}>Tipo de Procedimento *</label>
                        <select
                            name="tipo_procedimento"
                            value={formData.tipo_procedimento}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        >
                            <option value="EXAME">Exame</option>
                            <option value="INTERNACAO">Internação</option>
                        </select>
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Código do Procedimento *</label>
                        <input
                            type="text"
                            name="codigo_procedimento"
                            value={formData.codigo_procedimento}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Descrição do Procedimento *</label>
                    <textarea
                        name="descricao_procedimento"
                        value={formData.descricao_procedimento}
                        onChange={handleChange}
                        style={styles.textarea}
                        required
                    />
                </div>

                <div style={styles.row}>
                    <div style={styles.field}>
                        <label style={styles.label}>Data Prevista</label>
                        <input
                            type="date"
                            name="data_prevista"
                            value={formData.data_prevista}
                            onChange={handleChange}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Valor Estimado (R$)</label>
                        <input
                            type="number"
                            name="valor_estimado"
                            value={formData.valor_estimado}
                            onChange={handleChange}
                            style={styles.input}
                            step="0.01"
                            min="0"
                        />
                    </div>
                </div>

                <div style={styles.row}>
                    <div style={styles.field}>
                        <label style={styles.label}>Médico Solicitante *</label>
                        <input
                            type="text"
                            name="medico_solicitante"
                            value={formData.medico_solicitante}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>CRM do Médico *</label>
                        <input
                            type="text"
                            name="crm_medico"
                            value={formData.crm_medico}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>
                </div>

                <div style={styles.actions}>
                    <button type="submit" style={styles.submitButton} disabled={loading}>
                        {loading ? 'Salvando...' : (id ? 'Atualizar' : 'Criar')}
                    </button>
                    <button type="button" onClick={() => navigate('/')} style={styles.cancelButton}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '800px',
        margin: '2rem auto',
        padding: '0 1rem'
    },
    title: {
        marginBottom: '2rem'
    },
    form: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    row: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '1rem'
    },
    field: {
        flex: 1
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
    textarea: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1rem',
        minHeight: '100px',
        boxSizing: 'border-box',
        resize: 'vertical'
    },
    actions: {
        display: 'flex',
        gap: '1rem',
        marginTop: '2rem'
    },
    submitButton: {
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        padding: '0.75rem 2rem',
        borderRadius: '4px',
        fontSize: '1rem',
        cursor: 'pointer',
        flex: 1
    },
    cancelButton: {
        backgroundColor: '#95a5a6',
        color: 'white',
        border: 'none',
        padding: '0.75rem 2rem',
        borderRadius: '4px',
        fontSize: '1rem',
        cursor: 'pointer',
        flex: 1
    }
};

export default PaginaAutorizacaoCadastro;
