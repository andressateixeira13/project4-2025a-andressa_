import { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "../services/supabase.js";
import { useNavigate } from "react-router-dom";
import "./style.css";

function UploadPage() {
  const [usuario, setUsuario] = useState(null);
  const [arquivo, setArquivo] = useState(null);
  const [texto, setTexto] = useState("");
  const [resumo, setResumo] = useState("");
  const [questoes, setQuestoes] = useState([]);
  const [todasQuestoes, setTodasQuestoes] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [verificado, setVerificado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verificarLogin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUsuario(user);
    };
    verificarLogin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario) return alert("Usuário não autenticado.");

    setCarregando(true);
    setResumo("");
    setQuestoes([]);
    setTodasQuestoes([]);
    setRespostas({});
    setVerificado(false);

    try {
      let response;

      if (arquivo) {
        const formData = new FormData();
        formData.append("file", arquivo);
        formData.append("user_id", usuario.id);

        response = await axios.post(
          "https://project4-2025a-andressa.onrender.com/upload",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else if (texto.trim()) {
        response = await axios.post(
          "https://project4-2025a-andressa.onrender.com/resumo-texto",
          { user_id: usuario.id, texto }
        );
      } else {
        alert("Envie um PDF ou digite um texto.");
        return;
      }

      setResumo(response.data.resumo);
      setQuestoes(response.data.questoes);
      setTodasQuestoes(response.data.questoes);
    } catch (err) {
      alert("Erro ao processar o conteúdo.");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const gerarMaisQuestoes = async () => {
    if (!resumo || !usuario?.id) return alert("Resumo indisponível.");

    try {
      const response = await axios.post(
        "https://project4-2025a-andressa.onrender.com/resumo-texto",
        { user_id: usuario.id, texto: texto || resumo }
      );

      const novas = response.data.questoes.filter((nova) =>
        !todasQuestoes.some((q) => q.pergunta === nova.pergunta)
      );

      if (novas.length === 0) {
        alert("Não foi possível gerar novas questões diferentes.");
        return;
      }

      setQuestoes(novas);
      setTodasQuestoes((prev) => [...prev, ...novas]);
      setRespostas({});
      setVerificado(false);
    } catch (err) {
      alert("Erro ao gerar novas questões.");
      console.error(err);
    }
  };

  const handleAlternativa = (index, letra) => {
    if (!verificado) {
      setRespostas((prev) => ({ ...prev, [index]: letra }));
    }
  };

  const verificarRespostas = () => {
    setVerificado(true);
  };

  return (
    <div>
      <header className="p-3 border-bottom bg-white">
        <div className="container-fluid d-flex justify-content-end align-items-center gap-3">
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
        <h2 className="text-center mb-4">Gerador de Resumo e Questões</h2>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <label className="form-label">Upload de PDF:</label>
            <input
              type="file"
              accept="application/pdf"
              className="form-control"
              onChange={(e) => {
                setArquivo(e.target.files[0]);
                setTexto("");
              }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Ou digite o texto abaixo:</label>
            <textarea
              className="form-control"
              rows="6"
              value={texto}
              placeholder="Digite texto aqui..."
              onChange={(e) => {
                setTexto(e.target.value);
                setArquivo(null);
              }}
            />
          </div>

          <button className="btn btn-primary w-100" disabled={carregando}>
            {carregando ? "Processando..." : "Gerar Resumo e Questões"}
          </button>
        </form>

        {resumo && (
          <div className="mb-4">
            <h4>Resumo:</h4>
            <div className="p-3 bg-light border rounded">{resumo}</div>
          </div>
        )}

        {questoes.length > 0 && (
          <div>
            <h4>Questões:</h4>
            {questoes.map((q, i) => (
              <div key={i} className="mb-3 p-3 border rounded bg-white">
                <strong>{i + 1}. {q.pergunta}</strong>
                <ul className="mt-2 list-unstyled">
                  {q.alternativas.map((alt, j) => {
                    const letra = String.fromCharCode(65 + j);
                    const selecionada = respostas[i] === letra;
                    const correta = verificado && letra === q.correta;
                    const incorreta = verificado && selecionada && letra !== q.correta;

                    return (
                      <li
                        key={letra}
                        className={`alternativa ${selecionada ? "marcada" : ""} ${correta ? "correta" : ""} ${incorreta ? "incorreta" : ""}`}
                        onClick={() => handleAlternativa(i, letra)}
                      >
                        <strong>{letra}.</strong> {alt}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {!verificado && (
              <button className="btn btn-success w-100 mt-3" onClick={verificarRespostas}>
                Verificar Respostas
              </button>
            )}
            <button className="btn btn-secondary w-100 mt-2" onClick={gerarMaisQuestoes}>
              Gerar Mais Questões
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;
