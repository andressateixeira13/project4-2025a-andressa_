import { useEffect, useState } from "react";
import { supabase } from "./services/supabase.js";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import UploadPage from "./pages/UploadPage.jsx";
import ResumosView from "./pages/ResumosView.jsx";

function LoginPage({ onLogin }) {
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    setCarregando(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "github" });
    if (error) alert("Erro ao redirecionar para o GitHub");
    setCarregando(false);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="text-center w-100">
        <h1 className="mb-4 text-primary">Login</h1>
        <p className="mb-3">Entre com sua conta do GitHub para continuar</p>
        <button className="btn btn-dark" onClick={handleLogin} disabled={carregando}>
          {carregando ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Carregando...
            </>
          ) : (
            <>
              <i className="bi bi-github me-2"></i>
              Entrar com GitHub
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function AuthWrapper() {
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verificarLogin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUsuario(user);
        navigate("/upload");
      }
    };
    verificarLogin();
  }, [navigate]);

  return <LoginPage />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthWrapper />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/resumos" element={<ResumosView />}/>
      </Routes>
    </Router>
  );
}
