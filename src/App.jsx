import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home/Home'
import Simuladores from './pages/Simuladores/Simuladores'
import Conteudo from './pages/Conteudo/Conteudo'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simuladores" element={<Simuladores />} />
        <Route path="/conteudo" element={<Conteudo />} />
        {/* rotas dos simuladores — implementadas nas próximas etapas */}
        <Route path="/afd" element={<Navigate to="/simuladores" replace />} />
        <Route path="/afnd" element={<Navigate to="/simuladores" replace />} />
        <Route path="/apd" element={<Navigate to="/simuladores" replace />} />
        <Route path="/apnd" element={<Navigate to="/simuladores" replace />} />
        <Route path="/turing" element={<Navigate to="/simuladores" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
