import Autorizacao from "./Autorizacao.js";
import Paciente from "./Paciente.js";
import Convenio from "./Convenio.js";
import RegraConvenio from "./RegraConvenio.js";

// Relacionamentos
Autorizacao.belongsTo(Paciente, { foreignKey: 'idpaciente', as: 'paciente' });
Autorizacao.belongsTo(Convenio, { foreignKey: 'idconvenio', as: 'convenio' });

Paciente.hasMany(Autorizacao, { foreignKey: 'idpaciente', as: 'autorizacoes' });
Convenio.hasMany(Autorizacao, { foreignKey: 'idconvenio', as: 'autorizacoes' });

RegraConvenio.belongsTo(Convenio, { foreignKey: 'idconvenio', as: 'convenio' });
Convenio.hasMany(RegraConvenio, { foreignKey: 'idconvenio', as: 'regras' });
