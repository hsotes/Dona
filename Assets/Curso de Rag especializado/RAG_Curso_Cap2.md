# Capítulo 2: Cómo Funciona RAG

---

## La Analogía de las Preguntas

### Pregunta 1: General (no necesita búsqueda)
```
"¿Por qué los hoteles son caros los fines de semana?"

TU RESPUESTA: "Más gente viaja los fines de semana, 
               hay más competencia por habitaciones."

→ Ya tenés el conocimiento, no necesitás buscar nada.
```

### Pregunta 2: Específica (necesita algo de búsqueda)
```
"¿Por qué los hoteles en Vancouver están super caros 
 ESTE fin de semana?"

TU RESPUESTA: "No sé... déjame buscar..."
              [Busca online]
              "¡Taylor Swift tiene un show este weekend!"

→ Necesitaste buscar información actual.
```

### Pregunta 3: Especializada (necesita mucha búsqueda)
```
"¿Por qué Vancouver no tiene más capacidad hotelera 
 cerca del downtown?"

TU RESPUESTA: "Necesito investigar historia de Vancouver,
               planificación urbana, regulaciones..."

→ Necesitás acceso a información muy especializada.
```

---

## Las Dos Fases de Responder

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   FASE 1: RETRIEVAL          FASE 2: GENERATION        │
│   ──────────────────         ─────────────────         │
│   Recolectar información     Razonar sobre ella        │
│   necesaria                  y responder               │
│                                                         │
│   [A veces no necesitás]     [Siempre necesitás]       │
│   [A veces necesitás poco]                             │
│   [A veces necesitás MUCHO]                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

> "Los LLMs se benefician de la fase de retrieval por las mismas razones que vos."

---

## El Problema de los LLMs

### Lo que un LLM "sabe":

```
LLM = Persona que leyó enormes chunks de internet

├── Conocimiento general: ✅ Muy bueno
├── Eventos recientes: ❌ No sabe
├── Información privada: ❌ No tiene acceso
├── Datos especializados: ❌ Probablemente no vio
└── Tu catálogo de productos: ❌ Definitivamente no sabe
```

### Por qué el LLM no sabe todo:

| Razón | Ejemplo |
|-------|---------|
| **Datos privados** | Bases de datos de empresas |
| **Información oculta** | Documentos internos |
| **Noticias recientes** | Publicadas después del training |
| **Datos especializados** | Tu catálogo de Materiales Boto Mariani |

> "Es irrazonable esperar que los LLMs sean expertos en todos los temas."

---

## La Solución: Ponerlo en el Prompt

### La idea clave de RAG:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ANTES (sin RAG):                                     │
│                                                         │
│   Usuario: "¿Cuánto sale el cemento?"                  │
│                     │                                   │
│                     ▼                                   │
│              ┌──────────┐                              │
│              │   LLM    │                              │
│              │ (no sabe │                              │
│              │ tu precio)│                              │
│              └────┬─────┘                              │
│                   │                                     │
│                   ▼                                     │
│   Respuesta: "El cemento suele costar entre..."        │
│              (INVENTA o da precio genérico)            │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                                                         │
│   DESPUÉS (con RAG):                                   │
│                                                         │
│   Usuario: "¿Cuánto sale el cemento?"                  │
│                     │                                   │
│                     ▼                                   │
│              ┌──────────────┐                          │
│              │  RETRIEVER   │                          │
│              │ (busca en tu │                          │
│              │  catálogo)   │                          │
│              └──────┬───────┘                          │
│                     │                                   │
│                     ▼                                   │
│   Prompt aumentado:                                    │
│   "Contexto: Cemento Portland 50kg = $8500            │
│    Pregunta: ¿Cuánto sale el cemento?"                │
│                     │                                   │
│                     ▼                                   │
│              ┌──────────┐                              │
│              │   LLM    │                              │
│              │ (ahora   │                              │
│              │  SABE)   │                              │
│              └────┬─────┘                              │
│                   │                                     │
│                   ▼                                     │
│   Respuesta: "El cemento Portland 50kg sale $8500"    │
│              (CORRECTO, basado en TUS datos)          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Los Componentes de RAG

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    SISTEMA RAG                          │
│                                                         │
│   ┌──────────────────────────────────────────────┐     │
│   │              KNOWLEDGE BASE                   │     │
│   │   (documentos, catálogos, manuales, etc.)    │     │
│   └──────────────────────┬───────────────────────┘     │
│                          │                              │
│                          ▼                              │
│   ┌──────────────────────────────────────────────┐     │
│   │              RETRIEVER                        │     │
│   │   • Busca en la knowledge base               │     │
│   │   • Encuentra info relevante                 │     │
│   │   • La pasa al LLM                           │     │
│   └──────────────────────┬───────────────────────┘     │
│                          │                              │
│                          ▼                              │
│   ┌──────────────────────────────────────────────┐     │
│   │              LLM (Generator)                  │     │
│   │   • Recibe prompt + contexto recuperado      │     │
│   │   • Razona sobre la información              │     │
│   │   • Genera respuesta fundamentada            │     │
│   └──────────────────────────────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## El Nombre Explicado

```
RETRIEVAL    AUGMENTED    GENERATION
─────────    ─────────    ──────────
Recuperar    Mejorar/     Generar
información  Aumentar     texto

"Mejorar la generación de texto del LLM 
 recuperando primero información relevante 
 de una knowledge base."
```

---

## Aplicación para DONA 🎯

| Componente | En tu caso |
|------------|------------|
| **Knowledge Base** | Catálogo de materiales, manuales de procedimiento |
| **Retriever** | Lo que busca en tu base de datos |
| **LLM** | El modelo que genera la respuesta |

### El problema probable de DONA:

```
Si DONA "sigue a la mierda", el problema está en:

1. RETRIEVER: ¿Trae los documentos correctos?
2. KNOWLEDGE BASE: ¿Los documentos están bien estructurados?
3. PROMPT: ¿El LLM usa bien el contexto recuperado?
```

---

## Resumen del Capítulo 2

| Concepto | Explicación |
|----------|-------------|
| **Retrieval** | Fase de buscar información necesaria |
| **Generation** | Fase de razonar y responder |
| **Por qué RAG** | LLMs no saben todo, especialmente tus datos |
| **La solución** | Poner la info relevante en el prompt |
| **Componentes** | Knowledge Base → Retriever → LLM |

---

## Próximo: Ejemplos de RAG en Producción

Cómo se usa RAG en aplicaciones reales.

---
