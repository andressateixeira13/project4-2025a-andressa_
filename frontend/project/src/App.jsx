import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const verificarLogin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUsuario(user);
    };
    verificarLogin();
  }, []);

  const handleLogin = async () => {
    setCarregando(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
    });
    if (error) alert("Erro ao redirecionar para o GitHub");
    setCarregando(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="text-center w-100">
        <h1 className="mb-4 text-primary">Login</h1>

        {!usuario ? (
          <>
            <p className="mb-3">Entre com sua conta do GitHub para continuar</p>
            <button
              className="btn btn-dark"
              onClick={handleLogin}
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Carregando...
                </>
              ) : (
                <>
                  <i className="bi bi-github me-2"></i>
                  Entrar com GitHub
                </>
              )}
            </button>
          </>
        ) : (
          <div className="card p-4 mx-auto" style={{ maxWidth: "400px" }}>
            <img
              src={usuario.user_metadata?.avatar_url}
              alt="Avatar"
              className="rounded-circle mx-auto mb-3"
              width="100"
              height="100"
            />
            <h5 className="mb-2">{usuario.user_metadata?.full_name || usuario.email}</h5>
            <button className="btn btn-outline-danger mt-3" onClick={handleLogout}>
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;


