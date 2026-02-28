/**
 * Chat logic — usa OpenAI function calling para decidir
 * qué herramientas del RAG invocar según la pregunta del usuario.
 */

import OpenAI from 'openai';
import { buscarPerfilTool } from '../tools/buscar-perfil.js';
import { sugerirPerfilesTool } from '../tools/sugerir-perfiles.js';
import { consultarCostosTool } from '../tools/consultar-costos.js';
import { buscarDocumentosTool, estadisticasVectorStoreTool } from '../tools/buscar-documentos.js';

const openai = new OpenAI();

const SYSTEM_PROMPT = `Sos "Dona", un asistente experto en ingeniería estructural metálica argentina.
Tenés acceso a una base de conocimiento (RAG) que incluye:
- Normas CIRSOC 301, 102, 308 y otras normas argentinas
- Libros: McCormac, AISC Steel Construction Manual, AHMSA
- Manuales de software: Tekla Structures, SAP2000
- Normas internacionales: AISC 360, AWS D1.1, AISI S100, ASTM
- Memorias de cálculo de naves industriales
- Catálogo de +8000 materiales metálicos con precios (perfiles laminados en frío y caliente, chapas, ángulos, pletinas, tubos, etc.)
- 89 perfiles estructurales (IPN, IPE, UPN, HEB, HEA) con propiedades completas

REGLAS:
- Respondé SIEMPRE en español.
- Basá tus respuestas en los datos que te devuelven las herramientas. No inventes datos técnicos.
- Si buscás documentos, citá la fuente.
- Si no encontrás información relevante, decilo honestamente.
- Podés usar múltiples herramientas en una misma respuesta si es necesario.
- Sé conciso pero completo. Usá formato con negritas y listas cuando ayude.`;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'buscar_documentos',
      description: 'Busca información en la bibliografía técnica vectorizada (libros, normas, manuales, memorias de cálculo). Útil para conceptos, fórmulas, procedimientos, artículos de normas, ejemplos de cálculo.',
      parameters: {
        type: 'object',
        properties: {
          consulta: { type: 'string', description: 'La pregunta o tema a buscar' },
          coleccion: {
            type: 'string',
            enum: ['norma', 'libro', 'memoria', 'software', 'material', 'pliego', 'todos'],
            description: 'Filtrar por colección. Default: todos',
          },
          limite: { type: 'number', description: 'Max fragmentos (default: 5)' },
        },
        required: ['consulta'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_perfil',
      description: 'Busca perfiles estructurales (IPN, IPE, UPN, HEB, HEA) por propiedades: módulo resistente Wx, momento de inercia Ix, peso, altura, etc.',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['IPN', 'IPE', 'UPN', 'HEB', 'HEA'] },
          minWx: { type: 'number', description: 'Wx mínimo (cm³)' },
          minIx: { type: 'number', description: 'Ix mínimo (cm⁴)' },
          maxPeso: { type: 'number', description: 'Peso máximo (kg/m)' },
          minAltura: { type: 'number', description: 'Altura mínima (mm)' },
          maxAltura: { type: 'number', description: 'Altura máxima (mm)' },
          ordenarPor: { type: 'string', enum: ['peso', 'Wx', 'Ix', 'h'] },
          limite: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sugerir_perfiles',
      description: 'Sugiere perfiles óptimos para un momento flector requerido. Calcula Wx necesario y ordena por preferencia (liviano, económico, rígido).',
      parameters: {
        type: 'object',
        properties: {
          momentoRequerido: { type: 'number', description: 'Momento último Mu (kN·m)' },
          preferencia: { type: 'string', enum: ['liviano', 'economico', 'rigido'] },
          cortanteRequerido: { type: 'number', description: 'Cortante Vu (kN)' },
          luzViga: { type: 'number', description: 'Luz de la viga (m)' },
          margen: { type: 'number', description: 'Factor de margen (default: 1.2)' },
          maxResultados: { type: 'number' },
        },
        required: ['momentoRequerido'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_costos',
      description: 'Consulta precios de materiales metálicos en el catálogo argentino: perfiles (HEB, IPE, IPN, UPN, HEA), chapas, ángulos, pletinas, tubos, caños, planchuelas, hierro redondo, etc.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Texto a buscar (ej: HEB 200, chapa 3mm, ángulo 2x1/4)' },
          tipo: { type: 'string', description: 'Tipo de material' },
          rubro: { type: 'string', description: 'Rubro' },
          maxResultados: { type: 'number' },
        },
      },
    },
  },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function processChat(userMessage: string, history: ChatMessage[]) {
  // Construir mensajes para OpenAI
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // Agregar historial (últimos 10 mensajes para no exceder contexto)
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: 'user', content: userMessage });

  // Primera llamada: OpenAI decide qué herramientas usar
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools,
    tool_choice: 'auto',
    temperature: 0.3,
  });

  const choice = response.choices[0];
  let assistantMessage = choice.message;

  // Si OpenAI quiere usar herramientas, ejecutarlas
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    messages.push(assistantMessage);

    // Ejecutar cada herramienta
    for (const toolCall of assistantMessage.tool_calls) {
      if (toolCall.type !== 'function') continue;
      const fn = toolCall.function;
      const args = JSON.parse(fn.arguments);
      let result: any;

      switch (fn.name) {
        case 'buscar_documentos':
          result = await buscarDocumentosTool(args);
          break;
        case 'buscar_perfil':
          result = buscarPerfilTool(args);
          break;
        case 'sugerir_perfiles':
          result = sugerirPerfilesTool(args);
          break;
        case 'consultar_costos':
          result = consultarCostosTool(args);
          break;
        default:
          result = { error: `Herramienta desconocida: ${fn.name}` };
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result, null, 2),
      });
    }

    // Segunda llamada: OpenAI genera respuesta con los datos
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
    });

    return finalResponse.choices[0].message.content || 'No pude generar una respuesta.';
  }

  // Si no necesita herramientas, responde directo
  return assistantMessage.content || 'No pude generar una respuesta.';
}
