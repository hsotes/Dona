# Capítulo 24: Arquitecturas de Semantic Search

---

## La Arquitectura Vanilla: Bi-Encoder

> "La arquitectura que viste hasta ahora se llama **bi-encoder**."

### Cómo funciona:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PRE-PROCESO (una vez):                               │
│   Documento → Embedding Model → 1 vector               │
│   (para cada documento en la KB)                       │
│                                                         │
│   EN CADA BÚSQUEDA:                                    │
│   Prompt → Embedding Model → 1 vector                  │
│   ANN busca vectores cercanos                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Por qué "bi-encoder":

```
Documentos y prompt se embeben SEPARADAMENTE.

Esto es importante porque:
├── Documentos pueden embeberse POR ADELANTADO
├── Solo el prompt se embebe después de recibirlo
└── Búsqueda MUY RÁPIDA
```

### Trade-off:

```
✅ Muy rápido
✅ Escala bien
❌ Calidad de resultados "buena" pero no óptima
```

---

## Cross-Encoder: Mejor Calidad, Peor Velocidad

### La idea:

```
En lugar de embeber documento y prompt por separado,
CONCATENAR ambos y pasarlos JUNTOS por el modelo.
```

### Cómo funciona:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Para CADA documento:                                 │
│                                                         │
│   [PROMPT] + [DOCUMENTO] → Cross-Encoder → Score (0-1)│
│                                                         │
│   El score es la PROBABILIDAD de match                 │
│   entre el prompt y ese documento.                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Ejemplo:

```
Prompt: "Great places to eat in New York"

Documento 1: "NYC has amazing cuisine options..."
[Prompt + Doc1] → Cross-Encoder → 0.70 (70% match)

Documento 2: "The weather in Seattle is rainy..."
[Prompt + Doc2] → Cross-Encoder → 0.05 (5% match)

Documento 3: "Central Park is beautiful..."
[Prompt + Doc3] → Cross-Encoder → 0.30 (30% match)
```

### Por qué es mejor:

```
Al tener AMBOS textos en el input:
├── El modelo entiende interacciones CONTEXTUALES profundas
├── Entre el prompt y el documento
└── Que un bi-encoder podría perder

Ejemplo:
Prompt: "eat in New York"
Doc: "NYC cuisine" 

Bi-encoder: Embebe cada uno por separado
            Puede no captar que "NYC" = "New York"
            
Cross-encoder: Ve ambos juntos
               Entiende la conexión contextual
```

---

### El Problema GRAVE del Cross-Encoder

```
❌ ESCALA TERRIBLEMENTE

Para CADA prompt:
├── Necesitás correr CADA documento por el cross-encoder
├── Si tenés 1 millón de documentos = 1 millón de pasadas
├── Si tenés 1 billón = 1 billón de pasadas

Y NO podés pre-procesar nada porque:
├── El cross-encoder necesita [prompt + documento]
├── No tenés el prompt hasta que el usuario lo envía
└── Todo el cómputo es EN TIEMPO DE BÚSQUEDA

Resultado: Demasiado lento para usar como búsqueda principal
```

---

## ColBERT: El Balance

### ColBERT = Contextualized Late Interaction over BERT

### La idea:

```
├── Generar vectores por adelantado (como bi-encoder)
├── Pero capturar interacciones profundas (como cross-encoder)
└── ¿Cómo? Un vector por CADA TOKEN
```

### Cómo funciona:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PRE-PROCESO:                                         │
│   Documento (1000 tokens) → 1000 vectores              │
│   (un vector por cada token)                           │
│                                                         │
│   EN BÚSQUEDA:                                         │
│   Prompt (10 tokens) → 10 vectores                     │
│                                                         │
│   SCORING:                                             │
│   Cada token del prompt busca su token                 │
│   MÁS SIMILAR en el documento.                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Ejemplo de Scoring en ColBERT

```
Prompt: "Great places to eat in New York"
        [vec1][vec2][vec3][vec4][vec5][vec6]

Documento: "NYC has amazing cuisine options in the city"
           [d1] [d2] [d3]   [d4]    [d5]  [d6][d7][d8]

GRID DE SIMILITUDES:
(cada prompt token vs cada doc token)

         d1    d2    d3     d4      d5     d6   d7   d8
        NYC   has  amazing cuisine options  in  the city
Great   0.1   0.1   0.3    0.2     0.1    0.1  0.1  0.1
places  0.1   0.1   0.1    0.2     0.4    0.1  0.1  0.3
to      0.1   0.2   0.1    0.1     0.1    0.3  0.2  0.1
eat     0.2   0.1   0.2    0.8←    0.3    0.1  0.1  0.1
in      0.2   0.1   0.1    0.1     0.1    0.9← 0.1  0.2
New     0.7←  0.1   0.1    0.1     0.1    0.1  0.1  0.3
York    0.8←  0.1   0.1    0.1     0.1    0.1  0.1  0.4←

← = máximo por fila

MAX-SIM SCORE:
"eat" → máximo con "cuisine" (0.8)
"in" → máximo con "in" (0.9)
"New" → máximo con "NYC" (0.7)
"York" → máximo con "NYC" (0.8) o "city" (0.4)

Score total = suma de máximos
```

### Por qué funciona:

```
✅ "New York" en el prompt matchea con "NYC" en el doc
   (porque los tokens se comparan directamente)

✅ "eat" matchea con "cuisine"
   (relación semántica capturada)

✅ Mucho más rico que un solo vector por documento
```

---

## Comparación de Arquitecturas

| Arquitectura | Calidad | Velocidad | Storage | Uso |
|--------------|---------|-----------|---------|-----|
| **Bi-Encoder** | Buena | Muy rápida | Bajo | Default |
| **Cross-Encoder** | Excelente | Muy lenta | N/A | Re-ranking |
| **ColBERT** | Muy buena | Rápida | Alto | Precision crítica |

### Visualización del trade-off:

```
                    CALIDAD
                       ↑
                       │
    Cross-Encoder ─────┼───────────────────── ★
                       │
           ColBERT ────┼─────────────── ★
                       │
        Bi-Encoder ────┼───────── ★
                       │
                       └──────────────────────→ VELOCIDAD

                    STORAGE
                       ↑
           ColBERT ────┼───────────────────── ★ (mucho)
                       │
        Bi-Encoder ────┼───── ★ (poco)
                       │
    Cross-Encoder ────┼── N/A (no pre-almacena)
```

---

## Cuándo Usar Cada Uno

### Bi-Encoder (Default):

```
✅ La mayoría de los casos
✅ Necesitás velocidad
✅ Storage es una preocupación
✅ Calidad "buena" es suficiente
```

### Cross-Encoder:

```
✅ Re-ranking (no como búsqueda principal)
✅ Cuando la calidad es crítica
✅ Sobre un conjunto PEQUEÑO de documentos pre-filtrados
```

### ColBERT:

```
✅ Dominios donde precision es crítica (legal, médico)
✅ Tenés storage disponible
✅ Necesitás velocidad cercana a bi-encoder
✅ Pero calidad cercana a cross-encoder
```

---

## Aplicación para DONA 🎯

### Recomendación para DONA:

```
FASE 1: Bi-Encoder (default)
├── Suficiente para catálogo de productos
├── Rápido y económico
└── Evaluar métricas

FASE 2: Si precision es problema
├── Cross-Encoder para RE-RANKING
├── Bi-encoder trae 20 docs
├── Cross-encoder re-rankea → top 5
└── (Próximo capítulo)

FASE 3: Si storage no es problema
├── Considerar ColBERT
├── Para documentación técnica compleja
└── Donde interacciones contextuales importan
```

### Ejemplo de cuándo ColBERT ayudaría:

```
Prompt: "hierro para columna de 3 metros"

Documento: "Varilla de acero estructural para elementos verticales 
            de hasta 300cm de altura"

Bi-encoder: Puede no captar que:
├── "hierro" ≈ "acero"
├── "columna" ≈ "elementos verticales"
└── "3 metros" = "300cm"

ColBERT: Compara token por token
├── "hierro" encuentra "acero" (similar)
├── "columna" encuentra "verticales" (similar)
└── "3" encuentra "300" (relacionado contextualmente)
```

---

## Resumen del Capítulo 24

| Arquitectura | Cómo embebe | Pre-proceso | Calidad | Velocidad |
|--------------|-------------|-------------|---------|-----------|
| **Bi-Encoder** | 1 vector por doc | Sí | Buena | Muy rápida |
| **Cross-Encoder** | Prompt+Doc juntos | No | Excelente | Muy lenta |
| **ColBERT** | 1 vector por token | Sí | Muy buena | Rápida |

---

## Key Takeaway:

> "Bi-encoder es el default. Cross-encoder es demasiado lento para búsqueda directa, pero es excelente para re-ranking. ColBERT es un balance entre ambos, a costa de mucho más storage."

---

## Próximo: Re-ranking con Cross-Encoders

Cómo usar cross-encoders a pesar de su ineficiencia.

---
