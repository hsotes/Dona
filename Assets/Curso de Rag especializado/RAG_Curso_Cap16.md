# Capítulo 16: Cómo se Entrenan los Embedding Models

---

## El Trabajo del Embedding Model

> "El trabajo es simple de describir: embeber texto similar a vectores cercanos, y texto diferente a vectores lejanos."

### Pero si lo pensás...

```
¿Cómo puede una computadora ENTENDER el significado de un texto?

Es una hazaña increíblemente sofisticada.
```

---

## Pares Positivos y Negativos

### El concepto:

```
PAR POSITIVO (deben estar CERCA):
├── "good morning"
└── "hello"
(significado similar)

PAR NEGATIVO (deben estar LEJOS):
├── "good morning"
└── "that's a noisy trombone"
(significado diferente)
```

### El objetivo del embedding model:

```
Pares positivos → vectores CERCANOS
Pares negativos → vectores LEJANOS
```

---

## El Proceso de Entrenamiento

### Paso 1: Compilar datos de entrenamiento

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   MILLONES de pares positivos y negativos              │
│                                                         │
│   Ejemplo:                                             │
│   ├── ("dog", "puppy") → positivo                      │
│   ├── ("dog", "cat") → negativo                        │
│   ├── ("happy", "joyful") → positivo                   │
│   ├── ("happy", "sad") → negativo                      │
│   └── ... millones más                                 │
│                                                         │
│   Cada palabra/texto aparece en MUCHOS pares           │
│   para capturar todas sus relaciones.                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Paso 2: Inicialización aleatoria

```
ANTES del entrenamiento:

Cada texto → vector ALEATORIO

"dog" → [0.23, 0.87, -0.12, ...]  (sin sentido)
"cat" → [0.91, -0.34, 0.56, ...]  (sin sentido)
"puppy" → [-0.45, 0.12, 0.78, ...] (sin sentido)

Estos vectores NO tienen ninguna relación con el significado.
Si usaras este modelo, los resultados serían BASURA.
```

---

### Paso 3: Contrastive Training

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   El modelo pregunta:                                  │
│   "¿Qué tan bien puse los pares positivos juntos      │
│    y los negativos separados?"                         │
│                                                         │
│   Usa el CONTRASTE entre positivos y negativos         │
│   para evaluar su performance.                         │
│                                                         │
│   Por eso se llama: CONTRASTIVE TRAINING               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Paso 4: Actualizar parámetros

```
Basándose en qué tan bien lo hizo:

├── ACERCAR pares positivos
└── ALEJAR pares negativos

Luego REPETIR:
1. Generar nuevos vectores con parámetros actualizados
2. Evaluar performance con pares positivos/negativos
3. Actualizar parámetros
4. Repetir muchas veces
```

---

## Ejemplo Visual

### Anchor Point: "he could smell the roses"

```
Par positivo: "a field of fragrant flowers"
Par negativo: "a lion roared majestically"
```

### Inicio del entrenamiento (aleatorio):

```
         • "lion roared"
    
    
              • "smell roses" (anchor)
    
    
  • "fragrant flowers"
  
(posiciones aleatorias, sin sentido)
```

### Durante el entrenamiento:

```
Desde la perspectiva del anchor:

├── TIRAR el par positivo más CERCA
└── EMPUJAR el par negativo más LEJOS
```

### Después de muchas rondas:

```
  • "smell roses" (anchor)
  • "fragrant flowers"
  (muy cerca - par positivo)
  
  
  
  
  
                              • "lion roared"
                              (muy lejos - par negativo)
```

---

## La Complejidad Real

### Con millones de pares:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Cada vector está siendo EMPUJADO y TIRADO            │
│   en MUCHAS direcciones simultáneamente.               │
│                                                         │
│   "dog" tiene pares con:                               │
│   ├── "puppy" (positivo) → tirar cerca                 │
│   ├── "cat" (negativo) → empujar lejos                 │
│   ├── "pet" (positivo) → tirar cerca                   │
│   ├── "car" (negativo) → empujar lejos                 │
│   └── ... miles más                                    │
│                                                         │
│   Por eso necesitamos CIENTOS de dimensiones:          │
│   Da espacio para acomodar todas las relaciones.       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

### 1. Los vectores son abstractos y algo aleatorios

```
ANTES del training:
├── Una ubicación en el espacio NO tiene significado
└── Los vectores se colocan aleatoriamente

DESPUÉS del training:
├── Las ubicaciones SÍ tienen significado semántico
└── PERO solo porque ahí se formó un cluster de conceptos similares
```

### 2. Los clusters se forman, pero en ubicaciones diferentes

```
Si entrenás el mismo modelo dos veces con diferentes valores iniciales:

Run 1: Cluster de "animales" cerca de [0.5, 0.3, ...]
Run 2: Cluster de "animales" cerca de [-0.2, 0.8, ...]

Los MISMOS clusters se forman, pero en DIFERENTES ubicaciones.
```

### 3. NUNCA compares vectores de diferentes modelos

```
❌ INCORRECTO:
vector_modelo_A = embed_A("perro")
vector_modelo_B = embed_B("dog")
distance(vector_modelo_A, vector_modelo_B)  # BASURA

Cada modelo tiene:
├── Diferentes datos de entrenamiento
├── Diferentes dimensiones
├── Diferentes valores iniciales aleatorios

Comparar vectores de modelos diferentes = NONSENSE
```

---

## En la Práctica

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Probablemente usarás modelos PRE-ENTRENADOS          │
│   (off-the-shelf)                                      │
│                                                         │
│   Ejemplos:                                            │
│   ├── OpenAI text-embedding-ada-002                    │
│   ├── Sentence Transformers (all-MiniLM)               │
│   ├── Cohere embed-v3                                  │
│   └── BGE, E5, etc.                                    │
│                                                         │
│   Hacen un trabajo EXCELENTE ubicando textos           │
│   similares en ubicaciones cercanas.                   │
│                                                         │
│   Probablemente tampoco implementes las métricas       │
│   de distancia - las librerías lo hacen por vos.       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Consideraciones para elegir embedding model:

```
1. IDIOMA:
   ├── ¿El modelo entiende español?
   ├── ¿Entiende jerga argentina de construcción?
   └── Modelos multilingües vs español-específicos

2. DOMINIO:
   ├── ¿Fue entrenado con textos de construcción?
   ├── ¿Entiende "hierro del 8" vs "varilla 8mm"?
   └── Puede necesitar fine-tuning

3. CONSISTENCIA:
   ├── SIEMPRE usar el MISMO modelo para docs y queries
   ├── Si cambiás de modelo, re-embeber TODO
   └── Nunca mezclar vectores de diferentes modelos
```

### Modelos recomendados para español:

```
├── multilingual-e5-large (muy bueno en español)
├── paraphrase-multilingual-MiniLM
├── BETO embeddings (español específico)
└── OpenAI ada-002 (multilingüe)
```

---

## Resumen del Capítulo 16

| Concepto | Explicación |
|----------|-------------|
| **Contrastive Training** | Entrenar con pares positivos y negativos |
| **Pares positivos** | Textos similares → deben estar cerca |
| **Pares negativos** | Textos diferentes → deben estar lejos |
| **Inicialización** | Vectores aleatorios al inicio |
| **Después de training** | Clusters de significado se forman |
| **Regla crítica** | NUNCA comparar vectores de diferentes modelos |

---

## Key Takeaway:

> "Después del entrenamiento, los vectores capturan significado porque textos similares fueron TIRADOS hacia áreas similares del espacio vectorial."

---

## Próximo: Usando Dense Vectors en el Retriever

Cómo usar estos vectores en tu sistema RAG.

---
