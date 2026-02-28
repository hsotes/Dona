# Capítulo 25: Re-ranking

---

## ¿Qué es Re-ranking?

> "Re-ranking es un proceso post-retrieval donde el conjunto inicial de documentos retornados por la vector database son re-rankeados usando modelos de alto rendimiento pero costosos, para asegurar que se retornen los documentos absolutamente más relevantes."

---

## La Idea Principal

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Re-ranking mejora la CALIDAD del retrieval:          │
│                                                         │
│   ├── DESPUÉS de que la Vector DB retorna resultados   │
│   ├── ANTES de que se envíen al LLM                   │
│                                                         │
│   Re-scoring y re-ranking usando modelos más capaces   │
│   que son costosos pero solo procesan pocos docs.      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Por Qué Funciona

### El problema sin re-ranking:

```
Prompt: "What is the capital of Canada?"

Vector search retorna docs semánticamente relacionados
pero que NO responden la pregunta:

1. "Toronto is in Canada"              ← relacionado pero no responde
2. "The capital of France is Paris"    ← tiene "capital" pero no responde
3. "Canada is the maple syrup capital" ← tiene ambas palabras pero no responde
4. "Ottawa is the capital of Canada"   ← ✅ RESPONDE
```

### Con re-ranking:

```
Re-ranker analiza cada doc contra el prompt:

1. "Ottawa is the capital of Canada"   → Score: 0.95 ← TOP
2. "Toronto is in Canada"              → Score: 0.30
3. "The capital of France is Paris"    → Score: 0.20
4. "Canada is maple syrup capital"     → Score: 0.15

Resultado: El documento correcto sube al top.
```

---

## El Flujo de Re-ranking

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. OVER-FETCH con Vector DB                          │
│      Hybrid search → 20-100 documentos                 │
│      (más de los que realmente necesitás)              │
│                                                         │
│   2. RE-RANK                                           │
│      Cross-encoder re-scorea cada documento            │
│      Genera nuevo ranking basado en scores             │
│                                                         │
│   3. RETURN SUBSET                                     │
│      Solo los top 5-10 documentos                      │
│      (mucho más relevantes que sin re-ranking)         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Visualización:

```
PASO 1: Vector DB retrieval (over-fetch)

Prompt → Hybrid Search → [doc1, doc2, doc3, ... doc50]
                         (50 docs, algunos buenos, algunos no tanto)

PASO 2: Re-ranking con Cross-encoder

[Prompt + doc1] → Cross-encoder → 0.45
[Prompt + doc2] → Cross-encoder → 0.92 ← muy relevante
[Prompt + doc3] → Cross-encoder → 0.12
...
[Prompt + doc50] → Cross-encoder → 0.33

PASO 3: Nuevo ranking y subset

Ordenar por score → [doc2, doc17, doc31, doc5, doc42, ...]
Retornar top 5 → [doc2, doc17, doc31, doc5, doc42]

Estos 5 son MUCHO más relevantes que los top 5 originales.
```

---

## Por Qué Cross-Encoder Funciona Aquí

### Recordatorio del problema:

```
Cross-encoder: Excelente calidad, pero MUY LENTO.
Infeasible con millones de documentos.
```

### La solución: Usarlo DESPUÉS del filtro inicial

```
ANTES (imposible):
1 millón de docs × cross-encoder = 1 millón de operaciones ❌

DESPUÉS (posible):
1 millón de docs → Vector DB → 50 docs → cross-encoder = 50 operaciones ✅

El bi-encoder ya filtró el 99.995% de los documentos.
Ahora el cross-encoder solo procesa los 50 candidatos.
```

### El trade-off:

```
✅ Mucha mejor calidad de resultados
❌ Algo de latencia adicional

PERO: Este trade-off casi SIEMPRE vale la pena.
```

---

## LLM-Based Re-ranking

### La idea:

```
En lugar de cross-encoder, usar un LLM directamente.

[Prompt + Documento] → LLM → Score de relevancia

LLMs específicamente diseñados para esta tarea pueden:
├── Analizar el par prompt-documento
├── Evaluar relevancia
└── Responder con un score numérico
```

### Trade-off:

```
✅ Promisorio, puede ser muy preciso
❌ Tan ineficiente como cross-encoder
❌ Scoring no puede empezar hasta recibir el prompt
❌ Scorear un documento individual es costoso

Resultado: También es solo para RE-RANKING,
           no para búsqueda principal.
```

---

## Implementación Práctica

### En muchas Vector DBs es muy simple:

```python
# Sin re-ranking
results = collection.query.hybrid(
    query="What is the capital of Canada?",
    limit=5
)

# CON re-ranking (una línea extra)
results = collection.query.hybrid(
    query="What is the capital of Canada?",
    limit=5,
    rerank=Rerank.cohere()  # o Rerank.cross_encoder()
)
```

### Configuración típica:

```python
# Over-fetch y re-rank
results = collection.query.hybrid(
    query=user_query,
    limit=5,                    # Queremos 5 docs finales
    auto_limit=25,              # Over-fetch 25 docs
    rerank=Rerank.cross_encoder(
        model="cross-encoder/ms-marco-MiniLM-L-6-v2"
    )
)

# El sistema:
# 1. Trae 25 docs con hybrid search
# 2. Re-rankea los 25 con cross-encoder
# 3. Retorna los top 5
```

---

## Configuración Recomendada

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   TÍPICO Y EFECTIVO:                                   │
│                                                         │
│   Over-fetch: 15-25 documentos                         │
│   Re-rank entre ellos                                  │
│   Retornar: 5-10 documentos                            │
│                                                         │
│   Resultado:                                           │
│   ├── Gran boost en relevancia                         │
│   └── Poca latencia adicional                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Cuándo Usar Re-ranking

```
✅ SIEMPRE que la relevancia de búsqueda sea importante
   (casi siempre en RAG)

✅ Una de las PRIMERAS técnicas a explorar
   cuando querés mejorar tu pipeline

✅ Fácil de implementar
   (a menudo una sola línea de código)

❌ Si la latencia adicional es inaceptable
   (pero típicamente es muy poca)
```

---

## Aplicación para DONA 🎯

### Setup de re-ranking para DONA:

```python
# Búsqueda de productos con re-ranking
def buscar_producto(query: str):
    # 1. Query rewriting
    query_limpia = rewrite_query(query)
    
    # 2. Hybrid search con over-fetch
    results = collection.query.hybrid(
        query=query_limpia,
        alpha=0.5,
        limit=5,          # Queremos 5 productos
        auto_limit=20,    # Over-fetch 20
        rerank=Rerank.cross_encoder(),
        filters=Filter.by_property("disponibilidad").equal("en_stock")
    )
    
    return results
```

### Ejemplo de mejora con re-ranking:

```
Query: "cemento para hacer una vereda"

SIN RE-RANKING (top 5 de hybrid search):
1. Cemento de contacto (tiene "cemento" pero no aplica)
2. Cemento blanco (relacionado pero no ideal)
3. Cemento Portland (✅ correcto)
4. Arena fina (relacionado a veredas)
5. Cemento rápido (relacionado pero específico)

CON RE-RANKING:
1. Cemento Portland (✅ ideal para veredas)
2. Cemento Portland tipo I (✅ también correcto)
3. Arena fina (necesaria para mezcla)
4. Cemento rápido (alternativa)
5. Cal hidratada (se usa en mezclas)

El re-ranker entiende que "para hacer vereda" implica
cemento de construcción, no cemento de contacto.
```

### Métricas esperadas:

```
SIN re-ranking:
├── Recall@5: 60%
├── Precision@5: 40%
└── MRR: 0.5

CON re-ranking:
├── Recall@5: 80%
├── Precision@5: 70%
└── MRR: 0.85

(Números ilustrativos - medir en tu sistema)
```

---

## Resumen del Capítulo 25

| Concepto | Explicación |
|----------|-------------|
| **Re-ranking** | Proceso post-retrieval para mejorar relevancia |
| **Over-fetch** | Traer más docs de los necesarios (20-100) |
| **Cross-encoder** | Modelo típico para re-ranking |
| **LLM re-ranking** | Alternativa usando LLM directamente |
| **Configuración típica** | Over-fetch 15-25, retornar 5-10 |

---

## Key Takeaway:

> "Re-ranking es una de las PRIMERAS técnicas que deberías explorar para mejorar la relevancia de búsqueda. Típicamente, podés over-fetch 15-25 documentos y re-rankear entre ellos para un gran boost en relevancia a costa de poca latencia adicional."

---

## Próximo: Wrap-up Módulo 3

Resumen de Vector Databases y técnicas de producción.

---
