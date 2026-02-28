# Capítulo 14: Hybrid Search

---

## Resumen de las Tres Técnicas

| Técnica | Qué hace | Fortaleza |
|---------|----------|-----------|
| **Metadata Filtering** | Filtro rígido sí/no | Criterios estrictos |
| **Keyword Search** | Matchea palabras exactas | Términos técnicos, nombres |
| **Semantic Search** | Matchea por significado | Sinónimos, contexto |

---

## Por Qué Combinarlas

```
METADATA: Rápido, estricto, pero no busca contenido
KEYWORD: Encuentra palabras exactas, pero pierde sinónimos
SEMANTIC: Entiende significado, pero más lento

HYBRID = Lo mejor de cada una
```

---

## El Pipeline de Hybrid Search

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. PROMPT RECIBIDO                                   │
│      "¿Cuánto sale el fierro para columnas?"           │
│                          │                              │
│              ┌───────────┴───────────┐                 │
│              ▼                       ▼                 │
│   2. KEYWORD SEARCH          SEMANTIC SEARCH           │
│      (50 docs ranked)        (50 docs ranked)          │
│              │                       │                 │
│              ▼                       ▼                 │
│   3. METADATA FILTER         METADATA FILTER           │
│      (35 docs)               (30 docs)                 │
│              │                       │                 │
│              └───────────┬───────────┘                 │
│                          ▼                              │
│   4. RECIPROCAL RANK FUSION (RRF)                      │
│      Combina las dos listas en un ranking final        │
│                          │                              │
│                          ▼                              │
│   5. RETORNA TOP-K DOCUMENTOS                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Reciprocal Rank Fusion (RRF)

### El Problema:

```
Tenés DOS listas rankeadas:

Lista Keyword:              Lista Semantic:
1. Doc A                    1. Doc C
2. Doc B                    2. Doc A
3. Doc C                    3. Doc D
4. Doc D                    4. Doc B

¿Cómo las combinás en UN solo ranking?
```

### La Solución: RRF

```
Cada documento gana PUNTOS según su posición en cada lista.

Fórmula: Score = 1 / (K + rank)

Si K = 0:
├── Rank 1 → 1/1 = 1.0 puntos
├── Rank 2 → 1/2 = 0.5 puntos
├── Rank 3 → 1/3 = 0.33 puntos
└── Rank 10 → 1/10 = 0.1 puntos
```

### Ejemplo:

```
Doc A:
├── Rank 2 en Keyword → 1/2 = 0.5 puntos
├── Rank 2 en Semantic → 1/2 = 0.5 puntos
└── TOTAL: 1.0 puntos

Doc B:
├── Rank 2 en Keyword → 1/2 = 0.5 puntos
├── Rank 10 en Semantic → 1/10 = 0.1 puntos
└── TOTAL: 0.6 puntos

Doc A gana porque está bien rankeado en AMBAS listas.
```

---

## El Parámetro K

### ¿Qué controla?

```
K controla el IMPACTO del documento mejor rankeado.
```

### K = 0 (problema):

```
Rank 1 → 1/1 = 1.0 puntos
Rank 10 → 1/10 = 0.1 puntos

Diferencia: 10x

El #1 DOMINA aunque solo esté alto en UNA lista.
```

### K = 50 (mejor balance):

```
Rank 1 → 1/51 = 0.0196 puntos
Rank 10 → 1/60 = 0.0167 puntos

Diferencia: mucho más modesta

Todavía paga estar primero, pero no tan dramáticamente.
```

### Típicamente: K = 60 es un buen default

---

## El Parámetro Beta (Weighting)

### ¿Qué controla?

```
Beta controla el PESO de cada tipo de búsqueda.

Beta = 0.7 → 70% Semantic, 30% Keyword
Beta = 0.3 → 30% Semantic, 70% Keyword
```

### Cuándo usar cada configuración:

| Situación | Beta | Por qué |
|-----------|------|---------|
| Terminología técnica importante | 0.3 | Más peso a keyword |
| Usuarios usan lenguaje variado | 0.7 | Más peso a semantic |
| Balance general | 0.7 | Starting point recomendado |

---

## RRF: Lo que NO considera

```
⚠️ RRF solo mira el RANK, no el SCORE original.

Ejemplo:
Doc A: Score keyword = 0.95 (rank 1)
Doc B: Score keyword = 0.94 (rank 2)

Para RRF:
├── Doc A = 1 punto (rank 1)
└── Doc B = 0.5 puntos (rank 2)

Aunque los scores originales eran casi iguales,
RRF los trata muy diferente.
```

---

## Configuración Recomendada (Starting Point)

```python
hybrid_search_config = {
    # RRF parameter
    "k": 60,
    
    # Weighting: 70% semantic, 30% keyword
    "beta": 0.7,
    
    # Documentos a retornar
    "top_k": 5,
    
    # BM25 parameters
    "bm25_k1": 1.5,
    "bm25_b": 0.75
}
```

---

## Oportunidades de Tuning

| Componente | Qué ajustar | Efecto |
|------------|-------------|--------|
| **BM25** | k1, b | Sensibilidad a repetición y longitud |
| **Metadata** | Qué campos filtrar | Qué docs se excluyen |
| **RRF K** | Valor de K | Impacto del top rank |
| **Beta** | Peso keyword vs semantic | Balance de técnicas |
| **Top-K** | Cuántos docs retornar | Cantidad de contexto |

---

## Aplicación para DONA 🎯

### Configuración sugerida para catálogo de materiales:

```python
dona_config = {
    # Más peso a keyword porque códigos y nombres exactos importan
    "beta": 0.5,  # 50% semantic, 50% keyword
    
    "k": 60,
    "top_k": 5,
    
    # Metadata filters
    "filters": {
        "disponibilidad": "en_stock",
        "activo": True
    }
}
```

### Por qué este balance:

```
KEYWORD importante para DONA:
├── "hierro del 8" debe encontrar "hierro del 8"
├── Códigos de producto exactos
├── Marcas específicas (Loma Negra, Acindar)
└── Medidas exactas (10mm, 50kg)

SEMANTIC importante para DONA:
├── "fierro" = "hierro"
├── "cemento gris" = "portland"
├── "algo para pegar" = "adhesivo/mortero"
└── Variaciones de cómo preguntan los usuarios
```

### Experimentos a probar:

```
1. Beta = 0.3 (más keyword): ¿Encuentra mejor los códigos exactos?
2. Beta = 0.7 (más semantic): ¿Entiende mejor las preguntas vagas?
3. Top-K = 3 vs 10: ¿Cuánto contexto necesita el LLM?
```

---

## Resumen del Capítulo 14

| Concepto | Explicación |
|----------|-------------|
| **Hybrid Search** | Combina keyword + semantic + metadata |
| **RRF** | Algoritmo para fusionar rankings |
| **K** | Controla impacto del top rank |
| **Beta** | Peso de keyword vs semantic |
| **Top-K** | Cuántos docs retornar |

---

## Key Takeaway:

> "Hybrid search te permite aprovechar las fortalezas de cada técnica y tunear el sistema según tu knowledge base y las necesidades de tu proyecto."

---

## Próximo: Evaluación del Retriever

¿Cómo medimos si el retriever está funcionando bien?

---
