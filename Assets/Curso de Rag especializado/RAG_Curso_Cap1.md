# 📚 RETRIEVAL AUGMENTED GENERATION (RAG)
## Curso de DeepLearning.AI
### Instructor: Zain Hasan (con Andrew Ng)

---

# Capítulo 1: Introducción a RAG

---

## ¿Qué es RAG?

> "RAG es la técnica más ampliamente usada para mejorar la calidad y precisión de las respuestas de un LLM."

### El problema que resuelve:

```
LLM tradicional:
├── Solo conoce datos de entrenamiento (internet público)
├── No conoce TUS documentos
├── No tiene información actualizada
└── Puede inventar (alucinar)

LLM + RAG:
├── Accede a TUS documentos propietarios
├── Información actualizada
├── Respuestas basadas en hechos reales
└── Menos alucinaciones
```

---

## La Idea Central de RAG

> "La idea central de RAG es emparejar sistemas de búsqueda clásicos con las capacidades de razonamiento de los LLMs."

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   BÚSQUEDA CLÁSICA    +    LLM                         │
│   (encontrar docs)         (razonar sobre ellos)       │
│                                                         │
│         │                       │                       │
│         └───────────┬───────────┘                       │
│                     │                                   │
│                     ▼                                   │
│                   RAG                                   │
│         (respuestas precisas y fundamentadas)          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Ejemplos de RAG en Acción

### Ejemplo 1: Chatbots web
```
Usuario: "¿Cuál es la política de devoluciones?"

ChatGPT/Claude: "Buscando en la web..."
               ↓
         [Busca información actual]
               ↓
         "Según la información actual..."
```

### Ejemplo 2: Documentos empresariales
```
Usuario: "¿Cuáles son nuestras políticas internas?"

RAG:  [Busca en documentos de la empresa]
      ↓
      "Según el documento de RRHH de 2024..."
```

---

## ¿Por Qué RAG es Importante?

> "RAG puede ser el tipo de aplicación basada en LLM más comúnmente construida en el mundo hoy."

### Casos de uso:

| Industria | Aplicación |
|-----------|------------|
| **Empresas grandes** | Responder preguntas de clientes sobre productos |
| **RRHH** | Empleados consultan políticas internas |
| **Healthcare** | Responder preguntas médicas |
| **Educación** | Tutores para estudiantes |
| **Startups** | Verticales especializadas |

---

## RAG Evoluciona con los LLMs

### Mejoras recientes:

| Avance en LLMs | Impacto en RAG |
|----------------|----------------|
| **Mejor grounding** | Menos alucinaciones |
| **Reasoning models** | Preguntas más complejas |
| **Context windows grandes** | Más información en contexto |
| **Agentic extraction** | PDFs, slides, más formatos |

> "En el último año, las tasas de alucinación de sistemas RAG han estado bajando constantemente."

---

## RAG como Componente Agéntico

```
┌─────────────────────────────────────────────────────────┐
│           WORKFLOW AGÉNTICO COMPLEJO                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Step 1 → Step 2 → Step 3 → Step 4 → Step 5           │
│                                          │              │
│                                          ▼              │
│                                   ┌──────────┐         │
│                                   │   RAG    │         │
│                                   │ (busca   │         │
│                                   │  info)   │         │
│                                   └────┬─────┘         │
│                                        │               │
│                                        ▼               │
│                              Step 6 → Step 7 → Output  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

> "RAG es frecuentemente un componente en workflows agénticos complejos donde en el paso 5 o 7 de alguna carga de trabajo empresarial, RAG le da al agente la información que necesita."

---

## Agentic RAG: La Frontera

### RAG Tradicional (humano decide):
```
Humano escribe código que decide:
├── Cómo cortar documentos
├── Qué piezas recuperar
├── Cuántas piezas (ej: 7)
└── Qué poner en el contexto del LLM
```

### Agentic RAG (AI decide):
```
Agente AI decide:
├── ¿Necesito hacer web search? ¿Con qué keywords?
├── ¿O consultar una base de datos específica?
├── ¿La primera ronda de info es suficiente?
├── ¿Necesito una segunda ronda de retrieval?
└── El agente se auto-corrige si falla
```

> "Estos sistemas altamente agénticos pueden decidir por sí mismos qué información recuperar para servir una necesidad específica."

---

## Lo Que Vas a Aprender en Este Curso

| Tema | Descripción |
|------|-------------|
| **Preparar datos** | Cómo preparar documentos para RAG |
| **Prompts para RAG** | Sacar el máximo del LLM con contexto |
| **Evaluación** | Medir calidad de respuestas con tráfico real |
| **Técnicas avanzadas** | Multi-modal, reasoning, agentic RAG |
| **Trade-offs** | RAG vs Fine-tuning vs Long context |
| **Hyperparameters** | Chunk size, retrieval count, etc. |

---

## El Balance del Curso

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   FUNDAMENTOS              PRÁCTICA                    │
│   ────────────             ────────                    │
│   • Por qué funciona       • Cómo implementar          │
│   • Conceptos de search    • Tunear hyperparámetros    │
│   • Conceptos de LLMs      • Evaluar performance       │
│                                                         │
│              "El concepto de RAG no es complejo,       │
│               pero hay un millón de formas de          │
│               implementarlo, y las decisiones de       │
│               diseño hacen una GRAN diferencia."       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

Este curso te va a ayudar a:

| Problema de DONA | Solución del curso |
|------------------|-------------------|
| RAG trae docs incorrectos | Técnicas de retrieval |
| Chunking malo | Chunk size óptimo |
| Alucina precios | Grounding y evaluación |
| No encuentra productos | Hybrid search |
| Respuestas lentas | Optimización |

---

## Resumen del Capítulo 1

| Concepto | Explicación |
|----------|-------------|
| **RAG** | Búsqueda clásica + Razonamiento LLM |
| **Problema que resuelve** | LLM no conoce TUS datos |
| **Estado actual** | Menos alucinaciones, más capacidad |
| **Agentic RAG** | El agente decide qué buscar |
| **Importancia** | Aplicación LLM más común del mundo |

---

## Próximo: Componentes de RAG

Visión general de qué partes componen un sistema RAG efectivo.

---
