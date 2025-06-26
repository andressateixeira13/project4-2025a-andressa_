import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { InferenceClient } from "@huggingface/inference";
import { createClient } from "@supabase/supabase-js";
import pkg from "pdfjs-dist/legacy/build/pdf.js";
const { getDocument } = pkg;

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const hfClient = new InferenceClient(process.env.HF_TOKEN);
console.log("HF_TOKEN:", process.env.HF_TOKEN ? "Token presente" : "Token ausente");


// Extração de texto do PDF
async function extrairTextoPDF(buffer) {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  let texto = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    texto += content.items.map(item => item.str).join(' ') + '\n';
  }
  return texto;
}

// Gerando resumo
async function gerarResumo(texto) {
  const prompt = `
Você é um assistente inteligente. Resuma o conteúdo abaixo de forma clara, mantendo os principais pontos e informações relevantes. Evite repetir frases do texto, organize bem as ideias.

Texto:
"""${texto}"""
`;

  try {
    const response = await hfClient.chatCompletion({
      provider: "novita",
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages: [{ role: "user", content: prompt }]
    });

    return response.choices?.[0]?.message?.content.trim() || "Resumo indisponível.";
  } catch (error) {
    console.error("Erro ao gerar resumo:", error);
    return "Erro ao gerar resumo.";
  }
}


// Gerando questões
async function gerarQuestoes(resumo) {
  const prompt = `
Resumo: """${resumo}"""

Crie até 5 questões de múltipla escolha com 4 alternativas cada (A, B, C, D), baseadas no resumo acima.

A saída deve ser apenas um array JSON válido, como no exemplo abaixo:

[
  {
    "pergunta": "Qual é a função da fotossíntese?",
    "alternativas": ["Produzir energia", "Absorver água", "Gerar luz", "Transportar seiva"],
    "correta": "A"
  },
  ...
]

Não inclua explicações ou texto fora do JSON. Apenas o JSON puro.
`;

  try {
    const response = await hfClient.chatCompletion({
      provider: "novita",
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      messages: [{ role: "user", content: prompt }]
    });

    const content = response.choices?.[0]?.message?.content || "";
    return JSON.parse(content);
  } catch (error) {
    console.error("Erro ao gerar questões:", error);
    return [];
  }
}

// POST /upload (PDF)
app.post('/upload', upload.single('file'), async (req, res) => {
  const userId = req.body.user_id;
  if (!userId || !req.file) return res.status(400).send("Faltam dados.");

  try {
    const texto = await extrairTextoPDF(req.file.buffer);
    const resumo = await gerarResumo(texto);
    const questoes = await gerarQuestoes(resumo);

    await supabase.from("resumos").insert([{ user_id: userId, texto, resumo, questoes }]);
    res.json({ resumo, questoes });
  } catch (err) {
    console.error("Erro ao processar PDF:", err);
    res.status(500).send("Erro ao processar o arquivo.");
  }
});

// POST /resumo-texto (texto manual)
app.post('/resumo-texto', async (req, res) => {
  const { user_id, texto } = req.body;
  if (!user_id || !texto) return res.status(400).send("Faltam dados.");

  try {
    const resumo = await gerarResumo(texto);
    const questoes = await gerarQuestoes(resumo);

    await supabase.from("resumos").insert([{ user_id, texto, resumo, questoes }]);
    res.json({ resumo, questoes });
  } catch (err) {
    console.error("Erro ao processar texto:", err);
    res.status(500).send("Erro ao processar o texto.");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando`);
});
