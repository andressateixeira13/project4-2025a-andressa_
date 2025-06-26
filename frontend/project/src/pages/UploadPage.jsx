import { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "../services/supabase.js";

function UploadPage() {
  const [usuario, setUsuario] = useState(null);
  const [arquivo, setArquivo] = useState(null);
  const [texto, setTexto] = useState("");
  const [resumo, setResumo] = useState("");
  const [questoes, setQuestoes] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const verificarLogin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    } catch (err) {
      alert("Erro ao processar o conteúdo.");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  return (
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
              setTexto(""); // limpa o texto se PDF for enviado
            }}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Ou digite o texto abaixo:</label>
          <textarea
            className="form-control"
            rows="6"
            value={texto}
            placeholder="Cole seu texto aqui..."
            onChange={(e) => {
              setTexto(e.target.value);
              setArquivo(null); // limpa o arquivo se texto for escrito
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
              <ul className="mt-2">
                {q.alternativas.map((alt, j) => {
                  const letra = String.fromCharCode(65 + j);
                  return (
                    <li key={letra}>
                      <strong>{letra}.</strong>{" "}
                      <span style={{ color: letra === q.correta ? "green" : "inherit", fontWeight: letra === q.correta ? "bold" : "normal" }}>
                        {alt}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UploadPage;
