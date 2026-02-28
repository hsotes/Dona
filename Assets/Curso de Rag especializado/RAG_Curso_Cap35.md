# Capítulo 35: Agentic Workflows en RAG

---

## La Evolución del Sistema RAG

> "A medida que tu sistema RAG madura, una forma poderosa de mejorar su performance es empezar a introducir agentic workflows."

---

## ¿Qué es un Agentic Workflow?

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Usar VARIOS LLMs a lo largo de tu sistema RAG,       │
│   cada uno responsable de UN SOLO PASO                 │
│   en el proceso general.                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Ya viste ejemplos:

```
├── Query expansion
├── Prompt rewriting  
├── Citation generation
└── Re-ranking
```

---

## Modelo Tradicional vs Agentic

### Tradicional:

```
Prompt → LLM → Respuesta

Simple, un solo paso.
```

### Agentic:

```
DOS CAMBIOS PRINCIPALES:

1. Tareas tratadas como SERIE DE PASOS y DECISIONES
   Cada paso puede ser completado por un LLM diferente.

2. LLMs tienen acceso a HERRAMIENTAS:
   ├── Code interpreter
   ├── Web browser
   ├── Vector database
   └── APIs externas
```

---

## Ejemplo de Agentic RAG Workflow

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Usuario envía prompt                                 │
│          │                                              │
│          ▼                                              │
│   ┌─────────────┐                                      │
│   │ ROUTER LLM  │ (pequeño, rápido)                    │
│   │ ¿Necesita   │                                      │
│   │ retrieval?  │                                      │
│   └─────┬───────┘                                      │
│         │                                              │
│    ┌────┴────┐                                         │
│    │         │                                         │
│   YES       NO                                         │
│    │         │                                         │
│    ▼         │                                         │
│ Vector DB    │                                         │
│    │         │                                         │
│    ▼         │                                         │
│ ┌──────────┐ │                                         │
│ │EVALUATOR │ │                                         │
│ │LLM       │ │                                         │
│ │¿Docs     │ │                                         │
│ │suficien- │ │                                         │
│ │tes?      │ │                                         │
│ └────┬─────┘ │                                         │
│      │       │                                         │
│   ┌──┴──┐    │                                         │
│   │     │    │                                         │
│  YES   NO────┼──→ Más retrievals                       │
│   │          │                                         │
│   ▼          │                                         │
│ Construir    │                                         │
│ augmented    │                                         │
│ prompt       │                                         │
│   │          │                                         │
│   └────┬─────┘                                         │
│        │                                               │
│        ▼                                               │
│   ┌──────────┐                                         │
│   │GENERATOR │ (modelo grande)                         │
│   │LLM       │                                         │
│   └────┬─────┘                                         │
│        │                                               │
│        ▼                                               │
│   ┌──────────┐                                         │
│   │CITATION  │ (especializado)                         │
│   │LLM       │                                         │
│   └────┬─────┘                                         │
│        │                                               │
│        ▼                                               │
│   Respuesta Final                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Key Points de Agentic Systems

### 1. Diseñar = Dibujar un Flowchart

```
Cada LLM en el diagrama:
├── Toma TEXT INPUT
├── Genera TEXT OUTPUT
└── Completa UNA tarea en el journey del prompt
```

### 2. Diferentes LLMs para Diferentes Tareas

```
ROUTER/EVALUATOR:
├── Modelos pequeños y livianos
├── Rápidos y baratos
├── Tarea simple: clasificar/decidir

GENERATOR:
├── Modelo grande y capaz
├── Tarea compleja: generar respuesta

CITATION:
├── Modelo especializado en citas
├── Optimizado para esa tarea específica
```

---

## Patrones de Workflows Agentic

### 1. Sequential Workflow

```
Input → LLM A → LLM B → LLM C → Output

Ejemplo RAG:
Prompt → Query Parser → Query Rewriter → Generator → Citation → Response

Cada LLM se ESPECIALIZA en un paso.
```

### 2. Conditional Workflow (Router)

```
              ┌──→ LLM A
              │
Input → Router LLM ──→ LLM B
              │
              └──→ LLM C

El router DECIDE qué path seguir.

Ejemplo:
├── ¿Necesita retrieval? → Yes/No
├── ¿Qué tipo de pregunta es? → Técnica/General/Precio
└── ¿Qué modelo usar? → Grande/Pequeño
```

### 3. Iterative Workflow (Loop)

```
              ┌──────────────────────┐
              │                      │
              ▼                      │
Input → Generator → Evaluator ──No──┘
                        │
                       Yes
                        │
                        ▼
                     Output

El evaluator puede VOLVER a un paso anterior.

Ejemplo: Generación de código
├── Generar código
├── Evaluar si funciona
├── Si no → feedback → regenerar
└── Si sí → output
```

### 4. Parallel Workflow

```
                    ┌──→ LLM A ──┐
                    │            │
Input → Orchestrator──→ LLM B ──→ Synthesizer → Output
                    │            │
                    └──→ LLM C ──┘

Divide tareas, procesa en paralelo, recombina.

Ejemplo: Comparar dos papers
├── LLM A resume paper 1
├── LLM B resume paper 2
└── Synthesizer compara insights
```

---

## El Mindset Shift

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ANTES:                                               │
│   LLMs = soluciones standalone                         │
│   Un LLM hace todo                                     │
│                                                         │
│   AHORA:                                               │
│   LLMs = piezas MODULARES                              │
│   Cada LLM hace una cosa bien                          │
│                                                         │
│   Resultado:                                           │
│   ├── Feliz de usar modelos pequeños                   │
│   ├── Modelos que solo excel en algunas tareas         │
│   └── Capabilities alineadas con su rol específico     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementación

### Para sistemas simples:

```python
# Implementar la lógica del workflow vos mismo

def agentic_rag(prompt):
    # 1. Router decision
    needs_retrieval = router_llm(prompt)  # Returns "yes" or "no"
    
    if needs_retrieval == "yes":
        # 2. Retrieval
        docs = vector_db.search(prompt)
        
        # 3. Evaluate if sufficient
        sufficient = evaluator_llm(prompt, docs)
        
        while sufficient == "no":
            # Additional retrieval
            more_docs = vector_db.search(prompt, different_query=True)
            docs.extend(more_docs)
            sufficient = evaluator_llm(prompt, docs)
        
        # 4. Generate with context
        response = generator_llm(prompt, docs)
    else:
        # Direct response without retrieval
        response = generator_llm(prompt)
    
    # 5. Add citations
    final_response = citation_llm(response, docs)
    
    return final_response
```

### Para sistemas complejos:

```
Herramientas y frameworks:
├── LangChain
├── LlamaIndex
├── AutoGen
├── CrewAI
└── Custom orchestration
```

---

## Aplicación para DONA 🎯

### Agentic Workflow para DONA:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Cliente: "Hola, ¿cuánto sale el cemento?"            │
│                     │                                   │
│                     ▼                                   │
│            ┌───────────────┐                           │
│            │ INTENT ROUTER │ (pequeño, rápido)         │
│            │ ¿Qué tipo de  │                           │
│            │ consulta es?  │                           │
│            └───────┬───────┘                           │
│                    │                                    │
│      ┌─────────────┼─────────────┐                     │
│      │             │             │                     │
│   SALUDO     CONSULTA PROD    OTRO                     │
│      │             │             │                     │
│      ▼             ▼             ▼                     │
│   Respuesta    Vector DB    Respuesta                  │
│   directa          │        genérica                   │
│      │             ▼             │                     │
│      │      ┌───────────┐       │                     │
│      │      │ EVALUATOR │       │                     │
│      │      │ ¿Encontró │       │                     │
│      │      │ productos?│       │                     │
│      │      └─────┬─────┘       │                     │
│      │            │             │                     │
│      │       ┌────┴────┐        │                     │
│      │      YES       NO        │                     │
│      │       │         │        │                     │
│      │       │    "No encontré  │                     │
│      │       │     el producto" │                     │
│      │       │         │        │                     │
│      │       ▼         │        │                     │
│      │   GENERATOR     │        │                     │
│      │   (con precios) │        │                     │
│      │       │         │        │                     │
│      └───────┴─────────┴────────┘                     │
│                     │                                   │
│                     ▼                                   │
│              SALES ENHANCER                            │
│              (agregar CTA,                             │
│               preguntar cantidad)                       │
│                     │                                   │
│                     ▼                                   │
│              Respuesta Final                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Implementación para DONA:

```python
# Modelos por rol
DONA_MODELS = {
    "router": "gpt-3.5-turbo",      # Rápido, barato
    "evaluator": "gpt-3.5-turbo",   # Rápido, barato
    "generator": "gpt-4",            # Capaz, calidad
    "sales_enhancer": "gpt-3.5-turbo"  # Rápido
}

async def dona_agentic(mensaje_cliente):
    # 1. Router: ¿Qué tipo de mensaje es?
    intent = await router_llm(
        mensaje_cliente,
        options=["saludo", "consulta_producto", "consulta_precio", 
                 "consulta_stock", "otro"]
    )
    
    if intent == "saludo":
        return "¡Hola! ¿En qué puedo ayudarte hoy?"
    
    if intent in ["consulta_producto", "consulta_precio", "consulta_stock"]:
        # 2. Query rewriting
        query_limpia = await query_rewriter(mensaje_cliente)
        
        # 3. Retrieval
        productos = await vector_db.search(query_limpia)
        
        # 4. Evaluate
        if not productos:
            return "No encontré ese producto. ¿Podés darme más detalles?"
        
        # 5. Generate response
        respuesta = await generator_llm(
            mensaje=mensaje_cliente,
            productos=productos,
            intent=intent
        )
        
        # 6. Sales enhancement
        respuesta_final = await sales_enhancer(respuesta)
        
        return respuesta_final
    
    return await generator_llm(mensaje_cliente)
```

### Beneficios para DONA:

```
✅ Router evita retrievals innecesarios (saludos, etc.)
✅ Modelos pequeños para tareas simples = más rápido y barato
✅ Modelo grande solo cuando necesita calidad
✅ Sales enhancer asegura buenas prácticas de venta
✅ Evaluator previene respuestas sin contexto
```

---

## Resumen del Capítulo 35

| Patrón | Descripción | Uso |
|--------|-------------|-----|
| **Sequential** | A → B → C lineal | Pipelines simples |
| **Conditional** | Router decide path | Diferentes tipos de queries |
| **Iterative** | Loop con evaluator | Refinamiento, código |
| **Parallel** | Divide y combina | Tareas independientes |

---

## Key Takeaways:

```
1. Agentic = Múltiples LLMs, cada uno especializado en una tarea

2. Diseñar = Dibujar un flowchart

3. Diferentes modelos para diferentes tareas:
   ├── Pequeños para routing/evaluating
   └── Grandes para generation

4. Mindset shift: LLMs como piezas MODULARES

5. Frameworks disponibles para sistemas complejos
```

---

## Próximo: Wrap-up Módulo 4

Resumen de LLMs para RAG.

---
