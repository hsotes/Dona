# Capítulo 11: Keyword Search

---

## ¿Qué es Keyword Search?

> "Esta técnica ha impulsado el retrieval en bases de datos y motores de búsqueda por décadas. Su simplicidad y efectividad la hacen un componente clave en sistemas RAG modernos."

### La idea básica:

```
Documentos que contienen MUCHAS PALABRAS del prompt
son MÁS PROBABLES de ser relevantes.
```

---

## Bag of Words (Bolsa de Palabras)

### El concepto:

```
Tanto el prompt como cada documento se tratan como una "bolsa de palabras"

├── El ORDEN de las palabras se IGNORA totalmente
├── Solo importa QUÉ palabras hay
└── Y CUÁNTAS VECES aparece cada una
```

### Ejemplo:

```
Texto: "making pizza without a pizza oven"

Bag of Words:
├── pizza: 2
├── making: 1
├── without: 1
├── a: 1
└── oven: 1
```

---

## Sparse Vectors (Vectores Dispersos)

### ¿Qué son?

```
Un vector con un espacio para CADA palabra del vocabulario
(puede ser decenas de miles de espacios)

Cada número cuenta cuántas veces aparece esa palabra.
```

### Ejemplo visual:

```
Vocabulario: [a, making, oven, pizza, the, without, ...]
                ↓
Vector:      [1,    1,     1,    2,     0,     1,    ...]

La mayoría son CEROS → por eso se llaman "sparse" (dispersos)
```

---

## Term Document Matrix (Matriz Término-Documento)

### Preparación de la Knowledge Base:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Para cada documento → generar sparse vector          │
│   Organizar todos los vectores en una MATRIZ           │
│                                                         │
│              Doc1  Doc2  Doc3  Doc4  Doc5              │
│   pizza       2     0     1     0     3                │
│   oven        1     0     1     0     0                │
│   making      1     0     0     0     1                │
│   the         5     3     2     4     6                │
│   without     1     0     0     0     0                │
│   ...                                                   │
│                                                         │
│   Columnas = Documentos                                │
│   Filas = Palabras                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### También llamado: Inverted Index (Índice Invertido)

```
¿Por qué "invertido"?

Normal: Documento → ¿Qué palabras contiene?
Invertido: Palabra → ¿En qué documentos aparece?

Esto hace MUY FÁCIL encontrar todos los docs que contienen una palabra.
```

---

## El Proceso de Scoring

### Paso 1: Generar vector del prompt

```
Prompt: "making pizza without a pizza oven"

Vector del prompt:
├── pizza: 2
├── oven: 1
├── making: 1
├── without: 1
└── a: 1
```

### Paso 2: Scoring simple (versión básica)

```
Por cada KEYWORD en el prompt:
├── Buscar su fila en el índice
├── Dar 1 PUNTO a cada documento que la contenga
└── El documento con más puntos gana

Ejemplo:
Prompt tiene 5 keywords → máximo posible = 5 puntos
```

```
              Doc1  Doc2  Doc3  Doc4  Doc5
pizza          ✓     -     ✓     -     ✓    (1 punto cada uno)
oven           ✓     -     ✓     -     -    (1 punto)
making         ✓     -     -     -     ✓    (1 punto)
without        ✓     -     -     -     -    (1 punto)
a              ✓     ✓     ✓     ✓     ✓    (1 punto)
─────────────────────────────────────────────
TOTAL:         5     1     3     1     4

Ranking: Doc1 > Doc5 > Doc3 > Doc2 = Doc4
```

---

## Mejorando el Scoring

### Problema 1: No cuenta múltiples ocurrencias

```
❌ Simple: Doc tiene "pizza" 10 veces = 1 punto
✅ Mejorado: Doc tiene "pizza" 10 veces = 10 puntos

Solución: Sumar el conteo de cada keyword, no solo 1
```

### Problema 2: Documentos largos tienen ventaja injusta

```
❌ Doc largo (10,000 palabras) con "pizza" 50 veces
   vs
   Doc corto (100 palabras) con "pizza" 5 veces

El doc largo gana solo porque es más largo, no más relevante.

✅ Solución: NORMALIZAR dividiendo por longitud del documento

Score normalizado = puntos / palabras_totales_del_doc
```

### Problema 3: Todas las palabras valen igual

```
❌ "pizza" vale lo mismo que "the"
   Pero "the" aparece en TODOS los documentos
   Mientras "pizza" es específico y relevante

✅ Solución: IDF (Inverse Document Frequency)
```

---

## IDF: Inverse Document Frequency

### El concepto:

```
Palabras RARAS son más valiosas para identificar relevancia
Palabras COMUNES no dicen mucho
```

### Cómo calcularlo:

```
1. Document Frequency (DF):
   DF = docs_que_contienen_palabra / total_docs

   Ejemplo (100 docs en knowledge base):
   ├── "pizza" aparece en 5 docs → DF = 5/100 = 0.05
   └── "the" aparece en 100 docs → DF = 100/100 = 1.0

2. Inverse Document Frequency (IDF):
   IDF = total_docs / docs_que_contienen_palabra

   ├── "pizza": IDF = 100/5 = 20   (palabra rara = alto IDF)
   └── "the": IDF = 100/100 = 1    (palabra común = bajo IDF)

3. Aplicar LOG para suavizar:
   (porque IDF crudo puede ser muy extremo)

   ├── "pizza": log(20) ≈ 3.0
   └── "the": log(1) = 0
```

---

## TF-IDF: Term Frequency - Inverse Document Frequency

### La fórmula combinada:

```
TF-IDF = TF × IDF

Donde:
├── TF (Term Frequency) = cuántas veces aparece la palabra en el doc
└── IDF = qué tan rara es la palabra en toda la knowledge base
```

### Actualizar la matriz:

```
Multiplicar cada fila por su IDF:

ANTES (conteos crudos):
              Doc1  Doc2  Doc3
pizza          2     0     1
the            5     3     2

DESPUÉS (TF-IDF):
              Doc1  Doc2  Doc3
pizza (×3.0)   6     0     3     ← palabra rara, más peso
the (×0)       0     0     0     ← palabra común, sin peso
```

### Resultado:

```
Los documentos que:
├── Usan keywords FRECUENTEMENTE
└── Especialmente keywords RARAS en la knowledge base

...tendrán los scores más altos.
```

---

## Ejemplo Final

```
Prompt: "making pizza without a pizza oven"

Análisis de keywords:
├── "pizza" → raro → IDF alto → MUCHO peso
├── "oven" → raro → IDF alto → MUCHO peso
├── "making" → medio → IDF medio
├── "without" → común → IDF bajo
└── "a" → muy común → IDF muy bajo (casi 0)

Documentos sobre pizza y hornos ganarán
aunque también mencionen "a" y "the"
```

---

## TF-IDF es la Baseline

> "Los scores TF-IDF son un baseline estándar para el performance de keyword retrieval."

```
Sistemas modernos usan una versión refinada: BM25
(próximo capítulo)
```

---

## Aplicación para DONA 🎯

### Keywords importantes en tu catálogo:

```
ALTA IDF (raras, valiosas):
├── "portland" (tipo específico de cemento)
├── "adn42" (código de producto)
├── "10mm" (medida específica)
└── "acindar" (marca)

BAJA IDF (comunes, poco valor):
├── "material"
├── "construcción"
├── "precio"
└── "el", "de", "para"
```

### Ejemplo de búsqueda DONA:

```
Query: "hierro del 8 para construcción"

Keywords con valor:
├── "hierro" → IDF medio (hay varios productos)
├── "8" (o "del 8") → IDF alto (específico)
└── "construcción" → IDF muy bajo (todo es construcción)

El "8" es lo que realmente diferencia la búsqueda.
```

---

## Resumen del Capítulo 11

| Concepto | Explicación |
|----------|-------------|
| **Bag of Words** | Ignorar orden, solo contar palabras |
| **Sparse Vector** | Vector con conteo de cada palabra |
| **Inverted Index** | Palabra → documentos que la contienen |
| **TF** | Term Frequency (cuántas veces en el doc) |
| **IDF** | Inverse Doc Frequency (qué tan rara) |
| **TF-IDF** | TF × IDF = score final |

---

## Key Insight:

> "Documentos con keywords frecuentes Y raras obtienen los scores más altos."

---

## Próximo: BM25

La versión refinada de TF-IDF que usan los sistemas modernos.

---
