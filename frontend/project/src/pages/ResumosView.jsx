import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import "./style.css";

function ResumosView() {
  const [usuario, setUsuario] = useState(null);
  const [resumos, setResumos] = useState([]);
  const [expandido, setExpandido] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verificarLogin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUsuario(user);
        buscarResumos(user.id);
      } else {
        navigate("/");
      }
    };
    verificarLogin();
  }, []);

  const buscarResumos = async (userId) => {
    const { data, error } = await supabase
      .from("resumos")
      .select("*")
      .eq("user_id", userId)
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao buscar resumos:", error);
    } else {
      setResumos(data);
    }
  };

  const toggleExpandir = (id) => {
    setExpandido(expandido === id ? null : id);
  };

  return (
    <div>
      <header className="p-3 border-bottom bg-white">
        <div className="container-fluid d-flex justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => navigate("/upload")}
            >
              Novo Resumo
            </button>
          </div>

          {usuario && (
            <div className="d-flex align-items-center gap-2">
              <img
                src={`https://github.com/${usuario.user_metadata?.user_name}.png`}
                alt="Avatar"
                className="user-avatar"
              />
              <span>{usuario.user_metadata?.full_name}</span>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/");
                }}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="container py-5">
        <h2 className="text-center mb-4">Meus Resumos e Questões</h2>

        {resumos.length === 0 ? (
          <p className="text-center">Nenhum resumo encontrado.</p>
        ) : (
          resumos.map((resumo) => (
            <div key={resumo.id} className="resumo-box mb-4">
              <div onClick={() => toggleExpandir(resumo.id)} className="resumo-cabecalho">
                <h5 className="mb-1">Resumo #{resumo.id}</h5>
                <p className="mb-0">
                  {expandido === resumo.id
                    ? resumo.resumo
                    : resumo.resumo.slice(0, 100) + "..."}
                </p>
              </div>

              {expandido === resumo.id && (
                <div className="resumo-detalhes mt-3">
                  <h6>Questões:</h6>
                  {Array.isArray(resumo.questoes) && resumo.questoes.length > 0 ? (
                    resumo.questoes.map((q, idx) => (
                      <div key={idx} className="mb-3">
                        <strong>{idx + 1}. {q.pergunta}</strong>
                        <ul className="mt-1">
                          {q.alternativas.map((alt, i) => (
                            <li key={i}>
                              {String.fromCharCode(65 + i)}. {alt}
                            </li>
                          ))}
                        </ul>
                        <p><strong>Correta:</strong> {q.correta}</p>
                      </div>
                    ))
                  ) : (
                    <p>Sem questões disponíveis.</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ResumosView;
