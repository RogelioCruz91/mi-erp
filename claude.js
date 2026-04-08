import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Modifica este prompt para generar el modulo que necesites
const prompt = process.argv[2] || "crea un CRUD de clientes en React con Tailwind";

async function generar() {
  console.log(`Generando: "${prompt}"...`);

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Eres un experto en Next.js 15, TypeScript y Tailwind CSS.
Genera SOLO el codigo del componente, sin explicaciones.
El componente debe usar "use client" si necesita hooks.
Usa Tailwind para estilos.

Tarea: ${prompt}`,
      },
    ],
  });

  const code = msg.content[0].type === "text" ? msg.content[0].text : "";

  // Extrae codigo del bloque markdown si lo hay
  const match = code.match(/```(?:tsx?|jsx?)?\n([\s\S]*?)```/);
  const cleanCode = match ? match[1] : code;

  const filename = `componente-${Date.now()}.tsx`;
  fs.writeFileSync(filename, cleanCode);
  console.log(`Listo! Codigo guardado en: ${filename}`);
}

generar().catch(console.error);
