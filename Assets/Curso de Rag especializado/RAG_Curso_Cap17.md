# Capítulo 17: Wrap-up Módulo 2 - Information Retrieval

---

## Resumen del Módulo

> "Llegamos al final de nuestro viaje por los principios de Information Retrieval y cómo se combinan en un retriever."

---

## Las Tres Técnicas de Búsqueda

### 1. Keyword Search (BM25)

```
QUÉ HACE: Rankea documentos por frecuencia de keywords del prompt

FORTALEZA:
├── Técnica madura y probada
├── Asegura que los docs contengan las palabras EXACTAS
└── Excelente para términos técnicos y nombres de productos

DEBILIDAD:
└── No entiende sinónimos ni significado
```

### 2. Semantic Search (Embeddings)

```
QUÉ HACE: Rankea documentos por SIGNIFICADO similar al prompt

CÓMO FUNCIONA:
├── Embedding model convierte texto a vectores
├── Textos con significado similar → vectores cercanos
└── Encontrar docs relevantes = encontrar vectores cercanos

FORTALEZA:
├── Flexibilidad que keyword search no tiene
├── Entiende sinónimos y contexto
└── "fierro" encuentra "hierro"

DEBILIDAD:
├── Más lento y computacionalmente intensivo
└── Puede perder matches exactos importantes
```

### 3. Metadata Filtering

```
QUÉ HACE: Excluye documentos por criterios ESTRICTOS en metadatos

FORTALEZA:
├── Filtro rígido sí/no
├── Rápido y fácil de implementar
└── Asegura relevancia para el usuario

DEBILIDAD:
├── No es búsqueda real
└── Solo refina resultados de otras técnicas
```

---

## Hybrid Search: Todo Junto

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PROMPT                                               │
│      │                                                  │
│      ├────────────────┬────────────────┐               │
│      ▼                ▼                │               │
│   KEYWORD          SEMANTIC            │               │
│   SEARCH           SEARCH              │               │
│      │                │                │               │
│      ▼                ▼                │               │
│   Lista 1          Lista 2             │               │
│      │                │                │               │
│      ├────────────────┤                │               │
│      ▼                ▼                │               │
│   METADATA FILTER  METADATA FILTER     │               │
│      │                │                │               │
│      └───────┬────────┘                │               │
│              ▼                         │               │
│      RECIPROCAL RANK FUSION            │               │
│              │                         │               │
│              ▼                         │               │
│      RANKING FINAL                     │               │
│              │                         │               │
│              ▼                         │               │
│      TOP-K DOCUMENTOS → LLM            │               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Métricas de Evaluación

| Métrica | Qué Mide |
|---------|----------|
| **Recall@K** | % de relevantes encontrados |
| **Precision@K** | % de resultados que son relevantes |
| **MAP@K** | Calidad del ranking |
| **MRR** | Posición del primer relevante |

### Uso de métricas:

```
Ajustar hyperparámetros → Medir métricas → Ver si mejora o empeora
```

---

## Hyperparámetros Tuneables

| Componente | Parámetro | Efecto |
|------------|-----------|--------|
| **BM25** | k1, b | Saturation, length normalization |
| **RRF** | K | Impacto del top rank |
| **Hybrid** | Beta | Peso keyword vs semantic |
| **Retriever** | Top-K | Cantidad de docs a retornar |
| **Metadata** | Campos | Qué filtrar |

---

## Lo Que Aprendiste en el Módulo 2

| Capítulo | Tema |
|----------|------|
| 8 | Overview del módulo |
| 9 | Arquitectura del retriever |
| 10 | Metadata filtering |
| 11 | Keyword search (TF-IDF) |
| 12 | BM25 |
| 13 | Semantic search |
| 14 | Hybrid search + RRF |
| 15 | Métricas de evaluación |
| 16 | Cómo se entrenan embeddings |
| 17 | Wrap-up |

---

## Aplicación para DONA 🎯

### Checklist de diagnóstico del retriever:

```
□ ¿Keyword search encuentra términos exactos?
  → Probar con códigos de producto, marcas

□ ¿Semantic search entiende variaciones?
  → Probar "fierro" vs "hierro", sinónimos

□ ¿Metadata filtering está configurado?
  → Categorías, disponibilidad, activos

□ ¿El balance keyword/semantic es correcto?
  → Experimentar con beta

□ ¿Tenés ground truth para evaluar?
  → Crear test set de 20-50 prompts
```

### Configuración inicial sugerida:

```python
dona_retriever_config = {
    # Hybrid balance
    "beta": 0.5,  # 50% semantic, 50% keyword
    
    # BM25
    "bm25_k1": 1.5,
    "bm25_b": 0.75,
    
    # RRF
    "rrf_k": 60,
    
    # Output
    "top_k": 5,
    
    # Metadata
    "filters": ["disponibilidad", "categoria", "activo"]
}
```

---

## Key Takeaway del Módulo 2:

> "Hybrid search combina las fortalezas de keyword (exactitud), semantic (flexibilidad), y metadata filtering (criterios estrictos) para crear un retriever robusto y tuneable."

---

# Fin del Módulo 2: Information Retrieval ✅

## Próximo: Módulo 3 - Vector Databases

Cómo almacenar y buscar vectores a escala de producción.

---
