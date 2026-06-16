import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Menu from './componentes/Menu';
import PaginaAutorizacaoLista from './componentes/PaginaAutorizacaoLista';
import PaginaAutorizacaoCadastro from './componentes/PaginaAutorizacaoCadastro';
import PaginaAutorizacaoDetalhe from './componentes/PaginaAutorizacaoDetalhe';
import PaginaLogin from './componentes/PaginaLogin';
import { isAuthenticated } from './servicos/authService.js';

function ProtectedRoute({ children }) {
    return isAuthenticated() ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<PaginaLogin />} />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Menu />
                            <PaginaAutorizacaoLista />
                        </ProtectedRoute>
                    } />
                    <Route path="/autorizacao/nova" element={
                        <ProtectedRoute>
                            <Menu />
                            <PaginaAutorizacaoCadastro />
                        </ProtectedRoute>
                    } />
                    <Route path="/autorizacao/:id" element={
                        <ProtectedRoute>
                            <Menu />
                            <PaginaAutorizacaoDetalhe />
                        </ProtectedRoute>
                    } />
                    <Route path="/autorizacao/:id/editar" element={
                        <ProtectedRoute>
                            <Menu />
                            <PaginaAutorizacaoCadastro />
                        </ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
