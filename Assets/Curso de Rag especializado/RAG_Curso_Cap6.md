# Capítulo 6: Cómo Funciona el Retriever

---

## El Propósito del Retriever

> "Proveer información útil al LLM que potencialmente no estaba disponible cuando el modelo fue entrenado."

---

## La Analogía de la Biblioteca

### Tu pregunta:
```
"¿Cómo puedo hacer pizza estilo New York en casa?"
```

### La biblioteca:

```
┌─────────────────────────────────────────────────────────┐
│                     BIBLIOTECA                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│   │ Cocina  │  │Historia │  │ Ciencia │  │  Viajes │  │
│   │         │  │         │  │         │  │         │  │
│   │ 📚📚📚  │  │ 📚📚📚  │  │ 📚📚📚  │  │ 📚📚📚  │  │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
│                                                         │
│   BIBLIOTECARIO:                                       │
│   ├── Entiende el SIGNIFICADO de tu pregunta          │
│   ├── Sabe que debe buscar en: Cocina, Italia, NY     │
│   ├── Encuentra los libros MÁS RELEVANTES             │
│   └── Te los trae                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Retriever = Bibliotecario Digital

| Biblioteca | Retriever |
|------------|-----------|
| Colección de libros | Knowledge base de documentos |
| Organizado por secciones | Index de documentos |
| Bibliotecario | Algoritmo de retrieval |
| Busca libros relevantes | Busca documentos relevantes |

---

## Cómo Funciona el Retriever

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. RECIBE el prompt                                  │
│      "¿Cómo hacer pizza estilo New York?"              │
│                          │                              │
│                          ▼                              │
│   2. PROCESA para entender el significado              │
│      → Cocina + Pizza + New York + Receta casera       │
│                          │                              │
│                          ▼                              │
│   3. BUSCA en el índice de documentos                  │
│      → Compara con cada documento                      │
│      → Calcula SCORE de relevancia                     │
│                          │                              │
│                          ▼                              │
│   4. RANKEA documentos por score                       │
│      Doc A: 0.95 (muy relevante)                       │
│      Doc B: 0.87                                        │
│      Doc C: 0.72                                        │
│      Doc D: 0.31 (poco relevante)                      │
│                          │                              │
│                          ▼                              │
│   5. RETORNA los top documentos                        │
│      → Doc A, Doc B, Doc C                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## El Score de Relevancia

> "Cada documento recibe un score numérico que cuantifica su relevancia."

### Cómo se calcula:

```
SIMILARITY SCORE = qué tan similar es el texto del prompt
                   al texto del documento

Métodos (los verás más adelante):
├── Keyword matching (BM25)
├── Semantic similarity (embeddings)
└── Hybrid (combinación)
```

### Ejemplo:

```
Prompt: "¿Cómo hacer pizza estilo New York?"

Documento A: "Receta de pizza New York: masa fina..."
Score: 0.95 ✅ MUY RELEVANTE

Documento B: "Historia de la pizza en Italia..."
Score: 0.72 ⚠️ ALGO RELEVANTE

Documento C: "Mejores restaurantes de New York..."
Score: 0.45 ❌ POCO RELEVANTE

Documento D: "Cómo hacer sushi en casa..."
Score: 0.12 ❌ IRRELEVANTE
```

---

## El Balance Crítico

### El problema de retornar DEMASIADO:

```
❌ SI RETORNÁS TODOS LOS DOCUMENTOS:

├── Técnicamente tenés todo lo relevante
├── PERO está perdido en montaña de info irrelevante
├── Prompts muy costosos
└── Podés agotar el context window del LLM
```

### El problema de retornar MUY POCO:

```
❌ SI RETORNÁS SOLO EL TOP 1:

├── Podés perder info valiosa del #2, #3, #4
├── Si el ranking está mal, perdiste
└── Respuesta incompleta
```

### El balance ideal:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   MUNDO PERFECTO:                                      │
│   ├── Retriever rankea perfectamente                   │
│   └── Elige exactamente el número correcto             │
│                                                         │
│   MUNDO REAL:                                          │
│   ├── A veces rankea docs relevantes muy bajo          │
│   ├── A veces rankea docs irrelevantes muy alto        │
│   └── Difícil decidir cuántos retornar                 │
│                                                         │
│   SOLUCIÓN:                                            │
│   ├── Monitorear el retriever                          │
│   ├── Experimentar con diferentes settings             │
│   └── Ajustar basado en resultados reales              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Tecnologías Similares al Retriever

| Tecnología | Qué recupera | Cómo |
|------------|--------------|------|
| **Web Search Engine** | Páginas web | Relevantes al search query |
| **Relational Database** | Filas de tablas | Matching SQL query |
| **Retriever (RAG)** | Documentos | Similares al prompt |

> "El campo de Information Retrieval ya era maduro cuando los LLMs fueron desarrollados. Las ideas de este campo fundamentan cómo se diseñan los retrievers."

---

## Vector Databases (Adelanto)

> "A escala, la mayoría de los retrievers se construyen sobre una vector database."

### ¿Qué es?

```
VECTOR DATABASE:
├── Tipo especializado de base de datos
├── Optimizada para encontrar rápidamente
│   documentos que más coinciden con un prompt
└── Usa embeddings (representaciones numéricas)
```

### El curso cubrirá:

| Tema | Aplicación |
|------|------------|
| **Principios de Information Retrieval** | Cualquier tecnología de búsqueda |
| **Vector Databases** | Retrievers en producción a escala |

---

## Aplicación para DONA 🎯

### Preguntas de diagnóstico:

| Pregunta | Si la respuesta es NO... |
|----------|-------------------------|
| ¿El retriever trae los docs correctos? | Problema de ranking/similarity |
| ¿Trae suficientes docs? | Ajustar cantidad retornada |
| ¿Trae demasiados docs? | LLM se confunde |
| ¿El índice está bien construido? | Problema de chunking |

### Ejemplo DONA:

```
Prompt: "¿Cuánto sale el hierro del 8?"

RETRIEVER MALO:
├── Doc 1: "Hierro del 10 - $5000/kg" (relevante pero incorrecto)
├── Doc 2: "Cemento Portland..." (irrelevante)
└── Doc 3: "Historia del acero..." (irrelevante)

RETRIEVER BUENO:
├── Doc 1: "Hierro del 8 - $4500/kg" ← EXACTO
├── Doc 2: "Hierro construcción 6mm-12mm..." ← CONTEXTO
└── Doc 3: "Precios hierro actualizado enero 2026" ← ACTUAL
```

---

## Resumen del Capítulo 6

| Concepto | Explicación |
|----------|-------------|
| **Retriever** | Bibliotecario digital que encuentra docs relevantes |
| **Index** | Organización de documentos para búsqueda rápida |
| **Score** | Número que cuantifica relevancia |
| **Ranking** | Ordenar docs por score |
| **Balance** | Ni muy pocos ni demasiados docs |
| **Vector DB** | Base de datos optimizada para similarity search |

---

## Key Takeaway:

> "Para optimizar el performance del retriever, necesitás monitorearlo y experimentar con diferentes settings."

---

## Próximo: Wrap-up Módulo 1

Resumen y preparación para el primer assignment.

---
