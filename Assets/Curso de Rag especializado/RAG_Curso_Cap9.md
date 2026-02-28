# Capítulo 9: Arquitectura del Retriever

---

## El Modelo Mental

> "Puede ser útil tener un modelo mental del sistema completo antes de profundizar en cada técnica."

---

## El Flujo del Retriever

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PROMPT ──► RETRIEVER                                 │
│                  │                                      │
│                  ▼                                      │
│           KNOWLEDGE BASE                               │
│           (archivos de texto en DB)                    │
│                  │                                      │
│         ┌───────┴───────┐                              │
│         ▼               ▼                              │
│   ┌──────────┐   ┌──────────┐                         │
│   │ KEYWORD  │   │ SEMANTIC │                         │
│   │  SEARCH  │   │  SEARCH  │                         │
│   └────┬─────┘   └────┬─────┘                         │
│        │              │                                │
│        ▼              ▼                                │
│   20-50 docs     20-50 docs                           │
│        │              │                                │
│        ▼              ▼                                │
│   ┌──────────┐   ┌──────────┐                         │
│   │ METADATA │   │ METADATA │                         │
│   │  FILTER  │   │  FILTER  │                         │
│   └────┬─────┘   └────┬─────┘                         │
│        │              │                                │
│        └──────┬───────┘                               │
│               ▼                                        │
│        ┌──────────┐                                   │
│        │ COMBINE  │                                   │
│        │ & RANK   │                                   │
│        └────┬─────┘                                   │
│             │                                          │
│             ▼                                          │
│        TOP DOCUMENTS                                   │
│             │                                          │
│             ▼                                          │
│      AUGMENTED PROMPT                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Las Dos Técnicas de Búsqueda

### 1. Keyword Search (Tradicional)

```
¿Qué hace?
→ Busca documentos que contienen las PALABRAS EXACTAS del prompt

Ejemplo:
Prompt: "precio cemento portland"
Busca: Documentos con "precio", "cemento", "portland"

Ventaja: Time-tested, décadas de uso
```

### 2. Semantic Search (Moderno)

```
¿Qué hace?
→ Busca documentos con SIGNIFICADO SIMILAR al prompt

Ejemplo:
Prompt: "precio cemento portland"
Encuentra: "Costo del cemite tipo I" (mismo significado, otras palabras)

Ventaja: Más flexible, encuentra docs relevantes sin palabras exactas
```

---

## El Proceso Paso a Paso

### Paso 1: Cada técnica busca independientemente

```
KEYWORD SEARCH:               SEMANTIC SEARCH:
├── Doc A (rank #1)           ├── Doc C (rank #1)
├── Doc B (rank #2)           ├── Doc A (rank #2)
├── Doc C (rank #3)           ├── Doc D (rank #3)
├── Doc D (rank #4)           ├── Doc B (rank #4)
└── ... (20-50 docs)          └── ... (20-50 docs)

Nota: Doc A aparece en ambas listas pero con diferente ranking
```

### Paso 2: Metadata Filtering

```
Ejemplo: Sistema para empresa con múltiples departamentos

Usuario: María del equipo de Engineering

ANTES del filtro:          DESPUÉS del filtro:
├── Doc A (Engineering)    ├── Doc A (Engineering) ✅
├── Doc B (HR)             ├── Doc C (Engineering) ✅
├── Doc C (Engineering)    ├── Doc E (Engineering) ✅
├── Doc D (Finance)        │
└── Doc E (Engineering)    (HR y Finance removidos)
```

### Paso 3: Combinar y Rankear

```
Lista Keyword (filtrada) + Lista Semantic (filtrada)
                    │
                    ▼
            RANKING FINAL
            ├── Doc A (apareció alto en ambas)
            ├── Doc C (alto en semantic)
            ├── Doc E (alto en keyword)
            └── ...
```

### Paso 4: Retornar Top Documents

```
Top 5 documentos → Augmented Prompt → LLM
```

---

## Esto es HYBRID SEARCH

> "Este estilo de búsqueda se llama **hybrid search** porque combina múltiples técnicas para producir el ranking final."

```
HYBRID SEARCH = KEYWORD + SEMANTIC + METADATA FILTERING
```

---

## Beneficios de Cada Técnica

| Técnica | Beneficio Principal |
|---------|---------------------|
| **Keyword Search** | Sensible a palabras EXACTAS del usuario |
| **Semantic Search** | Flexible, encuentra docs por SIGNIFICADO |
| **Metadata Filtering** | Excluye docs por criterios RÍGIDOS |

---

## El Arte del Tuning

> "Diseñar un retriever de alto rendimiento significa entender las fortalezas relativas de cada técnica y luego **tunear el balance** entre ellas según las necesidades de tu proyecto."

```
Proyecto A (búsqueda de código):
├── Keyword: 70% (nombres exactos de funciones importan)
├── Semantic: 20%
└── Metadata: 10%

Proyecto B (customer service):
├── Keyword: 30%
├── Semantic: 60% (usuarios preguntan de muchas formas)
└── Metadata: 10%

Proyecto C (sistema multi-departamento):
├── Keyword: 30%
├── Semantic: 40%
└── Metadata: 30% (filtrar por departamento es crítico)
```

---

## Aplicación para DONA 🎯

### ¿Qué balance necesita DONA?

```
Catálogo de materiales de construcción:

KEYWORD importante porque:
├── "hierro del 8" debe matchear "hierro del 8"
├── Códigos de producto exactos
└── Nombres técnicos específicos

SEMANTIC importante porque:
├── "fierro" = "hierro"
├── "cemite" = "cemento"
├── "cuánto sale" = "precio"

METADATA importante porque:
├── Filtrar por categoría (hierros, cementos, etc.)
├── Filtrar por disponibilidad (en stock)
└── Filtrar por sucursal
```

### Diagnóstico para DONA:

| Síntoma | Probable causa |
|---------|----------------|
| No encuentra producto con nombre exacto | Keyword search débil |
| No entiende sinónimos | Semantic search débil |
| Trae productos de categorías incorrectas | Falta metadata filtering |

---

## Resumen del Capítulo 9

| Componente | Función |
|------------|---------|
| **Keyword Search** | Encuentra palabras exactas |
| **Semantic Search** | Encuentra significado similar |
| **Metadata Filter** | Excluye por criterios rígidos |
| **Combine & Rank** | Une las listas, rankea final |
| **Hybrid Search** | Nombre del sistema completo |

---

## Próximo: Metadata Filtering

La técnica más simple de las tres - empezamos por ahí.

---
