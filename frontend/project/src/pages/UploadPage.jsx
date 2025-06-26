import { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "../services/supabase.js";
import "./style.css";

function UploadPage() {
  const [usuario, setUsuario] = useState(null);
  const [arquivo, setArquivo] = useState(null);
  const [resumo, setResumo] = useState("");
  const [questoes, setQuestoes] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [mostrarGabarito, setMostrarGabarito] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const verificarLogin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUsuario(user);
    };
    verificarLogin();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!arquivo) return alert("Selecione um arquivo PDF");
    setCarregando(true);
    try {
      const formData = new FormData();
      formData.append("file", arquivo);
      formData.append("user_id", usuario.id);

      const { data } = await axios.post(
        "https://project4-2025a-andressa.onrender.com",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResumo(data.resumo);
      setQuestoes(data.questoes);
      setMostrarGabarito(false);
      setRespostas({});
    } catch (error) {
      alert("Erro ao enviar o arquivo.");
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const handleResposta = (i, letra) => {
    setRespostas({ ...respostas, [i]: letra });
  };

  const verificarRespostas = () => {
    setMostrarGabarito(true);
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Upload de PDF e Geração de Questões</h2>
      {usuario && (
        <form onSubmit={handleUpload} className="text-center">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setArquivo(e.target.files[0])}
            className="form-control mb-3"
          />
          <button className="btn btn-primary" disabled={carregando}>
            {carregando ? "Processando..." : "Enviar e Gerar Questões"}
          </button>
        </form>
      )}

      {resumo && (
        <div className="mt-4">
          <h4>Resumo:</h4>
          <p>{resumo}</p>
        </div>
      )}

      {questoes.length > 0 && (
        <div className="mt-4">
          <h4>Questões:</h4>
          {questoes.map((q, i) => (
            <div key={i} className="mb-3">
              <strong>{i + 1}. {q.pergunta}</strong>
              <div>
                {q.alternativas.map((alt, j) => {
                  const letra = String.fromCharCode(65 + j);
                  const selecionada = respostas[i] === letra;
                  const correta = q.correta === letra;

                  return (
                    <div key={letra}>
                      <label
                        style={{
                          color: mostrarGabarito
                            ? correta
                              ? "green"
                              : selecionada
                              ? "red"
                              : "black"
                            : "black"
                        }}>
                        <input
                          type="radio"
                          name={`questao-${i}`}
                          value={letra}
                          checked={selecionada}
                          disabled={mostrarGabarito}
                          onChange={() => handleResposta(i, letra)}
                        /> {letra}) {alt}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {!mostrarGabarito && (
            <button className="btn btn-success" onClick={verificarRespostas}>
              Verificar Respostas
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadPage;
