# Capítulo 13: Semantic Search

---

## ¿Qué es Semantic Search?

> "Semantic search puede matchear documentos a prompts basándose en **significado compartido**, capturando matices que keyword search pierde."

### Lo que keyword search NO puede hacer:

```
❌ "happy" vs "glad" → Son sinónimos, pero NO matchean
❌ "Python" (lenguaje) vs "Python" (serpiente) → Matchean incorrectamente
```

### Lo que semantic search SÍ puede hacer:

```
✅ "happy" ≈ "glad" → Entiende que son sinónimos
✅ "Python programming" ≠ "python snake" → Entiende el contexto
```

---

## Alto Nivel: Igual que Keyword Search

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   KEYWORD SEARCH:                                      │
│   Documento → Vector (conteo de palabras)              │
│   Prompt → Vector (conteo de palabras)                 │
│   Comparar vectores → Score → Ranking                  │
│                                                         │
│   SEMANTIC SEARCH:                                     │
│   Documento → Vector (embedding)                       │
│   Prompt → Vector (embedding)                          │
│   Comparar vectores → Score → Ranking                  │
│                                                         │
│   La diferencia está en CÓMO se generan los vectores   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Embedding Models: La Magia

### ¿Qué hace un embedding model?

```
EMBEDDING MODEL = Modelo matemático que mapea 
                  palabras/frases/documentos 
                  a UBICACIONES EN EL ESPACIO
```

### Ejemplo simple (2D):

```
"pizza" → vector [3, 1]
"bear" → vector [5, 2]

En un plano X-Y:

  Y
  │
  │     • bear (5,2)
  │   • pizza (3,1)
  │
  └─────────────────── X
```

---

## La Parte Mágica

> "El embedding model mapea palabras semánticamente similares a ubicaciones CERCANAS en el espacio."

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ESPACIO DE EMBEDDINGS (2D simplificado):             │
│                                                         │
│         • trombone                                     │
│                                                         │
│                              • cat                     │
│                                                         │
│                                                         │
│   • food                                               │
│     • cuisine   ← CERCANOS (significado similar)      │
│       • pizza                                          │
│                                                         │
│   Palabras similares = Ubicaciones cercanas            │
│   Palabras diferentes = Ubicaciones lejanas            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### No hay "ejes" interpretables:

```
No existe un "eje de comida" o "eje de animales".
Son dimensiones abstractas que el modelo aprendió.

Solo pensá en puntos flotando en el espacio,
con conceptos similares agrupados juntos.
```

---

## Dimensiones Reales

### ¿Por qué más dimensiones?

```
2D: Muy limitado para capturar relaciones complejas
3D: Un poco mejor, más espacio para clusters

REALIDAD: 
├── Cientos a MILES de dimensiones
├── Típico: 384, 768, 1024, 1536 dimensiones
└── Enorme flexibilidad para ubicar conceptos
```

### Imposible de visualizar, pero matemáticamente igual:

```
Vector 2D: [3, 1]
Vector 768D: [0.23, -0.87, 0.12, 0.45, ..., 0.33]  (768 números)

Mismos principios:
├── Vectores cercanos = conceptos similares
└── Vectores lejanos = conceptos diferentes
```

---

## Embeddings de Diferentes Tamaños

### No solo palabras:

| Input | Output |
|-------|--------|
| **Palabra** | Un vector |
| **Oración** | Un vector |
| **Documento completo** | Un vector |

### Ejemplo con oraciones:

```
Oración 1: "He spoke softly in class"
Oración 2: "He whispered quietly during class"
Oración 3: "Her daughter brightened the gloomy day"

En el espacio de embeddings:

        • Oración 3 (tema diferente, lejos)



   • Oración 1  • Oración 2  (significado similar, cerca)
```

---

## Midiendo Distancia Entre Vectores

### 3 métodos comunes:

| Método | Qué mide | Rango |
|--------|----------|-------|
| **Euclidean Distance** | Distancia en línea recta | 0 → ∞ |
| **Cosine Similarity** | Similitud de dirección | -1 → 1 |
| **Dot Product** | Proyección de un vector en otro | -∞ → ∞ |

---

### 1. Euclidean Distance (Distancia Euclidiana)

```
La línea recta más corta entre dos puntos.
(Teorema de Pitágoras en N dimensiones)

        • B
       /|
      / |
     /  |
    •───┘
    A

Distancia = √[(x₂-x₁)² + (y₂-y₁)² + ...]

Problema: En dimensiones altas, TODO está lejos de TODO.
```

---

### 2. Cosine Similarity (Más usado)

```
Mide si dos vectores APUNTAN en la misma dirección,
sin importar qué tan lejos estén.

Ejemplo:
Vector [10, 10] y Vector [100, 100]
├── Están lejos en el espacio
└── PERO apuntan en la misma dirección
    → Cosine similarity ≈ 1

Rango:
├── 1 = misma dirección (muy similares)
├── 0 = perpendiculares (sin relación)
└── -1 = direcciones opuestas (opuestos)
```

---

### 3. Dot Product (Producto Punto)

```
Combina dirección Y longitud de los vectores.

├── Misma dirección y largos = valor alto positivo
├── Perpendiculares (90°) = 0
└── Direcciones opuestas = valor negativo

Rango: -∞ a +∞
```

---

### Resumen de métricas:

```
Para AMBOS cosine similarity y dot product:
├── Valores MÁS ALTOS = vectores más CERCANOS
└── Vectores más cercanos = conceptos más SIMILARES
```

---

## El Proceso de Semantic Search

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. PRE-PROCESO (una sola vez):                       │
│      Todos los documentos → Embedding Model → Vectores │
│                                                         │
│      Doc A → [0.2, -0.5, 0.8, ...]                     │
│      Doc B → [0.1, 0.3, -0.2, ...]                     │
│      Doc C → [0.9, -0.1, 0.4, ...]                     │
│                                                         │
│   2. EN CADA BÚSQUEDA:                                 │
│      Prompt → Embedding Model → Vector del prompt      │
│                                                         │
│      "¿Cómo hacer pizza?" → [0.3, -0.4, 0.7, ...]     │
│                                                         │
│   3. COMPARAR:                                         │
│      Medir distancia entre vector del prompt           │
│      y vector de CADA documento                        │
│                                                         │
│   4. RANKEAR:                                          │
│      Ordenar documentos por distancia                  │
│      (más cercano = más similar = mejor match)         │
│                                                         │
│   5. RETORNAR:                                         │
│      Los documentos más cercanos al prompt             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Por Qué Funciona

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   El embedding model fue ENTRENADO para que:           │
│                                                         │
│   • Conceptos similares → ubicaciones cercanas         │
│   • Conceptos diferentes → ubicaciones lejanas         │
│                                                         │
│   Entonces:                                            │
│                                                         │
│   • Prompt cercano a documento = significado similar   │
│   • Distancia cuantifica relevancia                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Casos donde semantic search brilla:

```
Query: "algo para pegar ladrillos"
       ↓ embedding
       [0.3, 0.7, -0.2, ...]
       
Documento: "Mortero de albañilería para muros"
           ↓ embedding
           [0.35, 0.68, -0.18, ...]  ← MUY CERCANO

Keyword search: ❌ (no comparte palabras)
Semantic search: ✅ (significado similar)
```

### Más ejemplos para DONA:

| Query del usuario | Documento en catálogo | Keyword | Semantic |
|-------------------|----------------------|---------|----------|
| "fierro" | "Hierro del 8" | ❌ | ✅ |
| "cemento gris común" | "Cemento Portland Normal" | ❌ | ✅ |
| "material para techo" | "Chapa galvanizada" | ❌ | ✅ |
| "pegamento para cerámica" | "Adhesivo para revestimientos" | ❌ | ✅ |

---

## Resumen del Capítulo 13

| Concepto | Explicación |
|----------|-------------|
| **Semantic Search** | Busca por SIGNIFICADO, no palabras exactas |
| **Embedding Model** | Mapea texto a vectores en espacio N-dimensional |
| **Vectores cercanos** | Significados similares |
| **Cosine Similarity** | Método más común para medir cercanía |
| **Ventaja** | Entiende sinónimos y contexto |

---

## Key Takeaway:

> "Semantic search funciona porque el embedding model fue entrenado para poner conceptos similares cerca en el espacio. La distancia entre vectores cuantifica la relevancia."

---

## Próximo: Cómo se Entrenan los Embedding Models

Deep dive en cómo estos modelos "aprenden" a ubicar conceptos similares juntos.

---
