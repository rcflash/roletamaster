import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase body size limit for base64 image uploads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // API endpoint for Gemini OCR extraction
  app.post("/api/extract-spins-from-image", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Nenhuma imagem foi fornecida." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chave GEMINI_API_KEY não configurada no servidor." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Remove data URL prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const imagePart = {
        inlineData: {
          mimeType: mimeType || "image/png",
          data: cleanBase64,
        },
      };

      const promptText = `
Análise detalhada de print de tela de histórico de roleta de cassino ao vivo (ex: Evolution, Pragmatic Play, Playtech, etc).
Sua tarefa é extrair TODOS os números de roleta (inteiros de 0 a 36) visíveis no painel/matriz de histórico.

INSTRUÇÕES RIGOROSAS:
1. Nos painéis de cassino ao vivo, o número mais recente sorteado fica no topo/esquerda (ex: primeiro elemento da tela é o ÚLTIMO número sorteado).
2. Extraia os números na ordem visual em que aparecem na tela (linha por linha, da esquerda para a direita, de cima para baixo).
3. Ignore selos de multiplicadores como "100x", "50x", "500x" ou textos promocionais.
4. Inclua apenas números inteiros entre 0 e 36.
5. Retorne os números no formato JSON estruturado com a chave "numbers".
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            imagePart,
            { text: promptText },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              numbers: {
                type: Type.ARRAY,
                items: {
                  type: Type.INTEGER,
                },
                description: "Lista de números inteiros de 0 a 36 extraídos da imagem na ordem visual da tela (do mais recente para o mais antigo).",
              },
            },
            required: ["numbers"],
          },
        },
      });

      const responseText = response.text || "";
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { numbers: [] };
      }

      const rawNumbers = Array.isArray(parsed?.numbers)
        ? parsed.numbers.filter((n: any) => typeof n === "number" && n >= 0 && n <= 36)
        : [];

      // Importante: No print do cassino, o topo-esquerda é o GIRO MAIS RECENTE (#1).
      // Para o nosso sistema, os giros são processados do mais antigo para o mais recente,
      // para que o último item do lote seja o ÚLTIMO SAIU (#1 atual).
      // Portanto, invertemos o array extraído visualmente.
      const numbers = [...rawNumbers].reverse();

      return res.json({
        success: true,
        numbers,
        rawNumbers,
        totalExtracted: numbers.length,
      });
    } catch (error: any) {
      console.error("Erro na extração do print pela IA:", error);
      return res.status(500).json({
        error: "Falha ao analisar a imagem do histórico. Tente enviar uma foto ou print mais nítido do painel da roleta.",
        details: error?.message || String(error),
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
