# Capítulo 28: Arquitectura Transformer

---

## La Pregunta Fundamental

> "Tu retriever acaba de retornar documentos relevantes. Pero, ¿por qué esto funciona? ¿Cómo puede un LLM entender esa información recuperada?"

---

## Historia: "Attention is All You Need" (2017)

```
Paper seminal enfocado en machine translation.

Dos componentes principales:
├── ENCODER: Procesa el texto original (ej: párrafo en alemán)
│            Desarrolla entendimiento contextual profundo
│
└── DECODER: Usa ese entendimiento para generar nuevo texto
             (ej: versión en inglés)
```

### En LLMs modernos:

```
LLMs: Solo usan el DECODER (generación de texto)

Embedding Models: Usan el ENCODER (representación semántica)
```

---

## El Viaje de un Prompt a Través del LLM

### Paso 1: Tokenización

```
Prompt: "The brown dog sat next to the fox"
         ↓
Tokens: ["The", "brown", "dog", "sat", "next", "to", "the", "fox"]
```

### Paso 2: Embedding Inicial (First Guess)

```
Cada token → vector denso inicial

"dog" → [0.23, 0.45, -0.12, ...] (first guess)
"brown" → [0.67, -0.34, 0.89, ...] (first guess)

Estos vectores son ESTÁTICOS:
El mismo token siempre recibe el mismo first guess.
```

### Paso 3: Positional Encoding

```
Cada token también recibe un vector de POSICIÓN.

"dog" en posición 3 → vector posicional [...]
"fox" en posición 8 → vector posicional [...]

Esto le dice al modelo DÓNDE está cada token.
```

---

## El Mecanismo de Atención

### La idea:

```
Cada token MIRA a todos los otros tokens.
Ve su significado Y su posición.
Decide a cuáles prestar más ATENCIÓN.
```

### Ejemplo:

```
"The brown dog sat next to the red fox"

¿A qué presta atención "dog"?

dog → brown:  70% atención (lo describe directamente)
dog → sat:    20% atención (qué hace el perro)
dog → otros:  10% distribuido

"Attention" = ¿Qué tokens deberían impactar más MI significado?
```

---

### Múltiples Attention Heads

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Los modelos tienen MÚLTIPLES attention heads         │
│   que se especializan en DIFERENTES relaciones.        │
│                                                         │
│   HEAD 1: Relaciones objeto-descripción                │
│           fox → presta atención a "red"                │
│                                                         │
│   HEAD 2: Relaciones espaciales                        │
│           fox → presta atención a "sat", "next"        │
│                                                         │
│   HEAD 3: Relaciones gramaticales                      │
│           ...                                          │
│                                                         │
│   Modelos pequeños: 8-16 heads                         │
│   Modelos grandes: 100+ heads                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Resultado:

```
Cada token trackea su relación con TODOS los otros tokens,
y lo hace MUCHAS veces con diferentes "puntos de vista".

= Representación MUY detallada de las relaciones entre tokens.
```

---

## Feedforward Layers

### La parte más grande del LLM:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   FEEDFORWARD LAYERS                                   │
│   (La mayoría de los parámetros están aquí)            │
│                                                         │
│   Input: Embedding original + posición + atención      │
│   Output: NUEVO vector para cada token                 │
│                                                         │
│   Este nuevo vector es un "second guess" del           │
│   significado, AHORA INFORMADO por el contexto.        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Iteración: Refinando el Entendimiento

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1st pass: First guess → Attention → Feedforward      │
│             → Second guess vectors                     │
│                                                         │
│   2nd pass: Second guess → Attention → Feedforward     │
│             → Third guess vectors                      │
│                                                         │
│   3rd pass: Third guess → Attention → Feedforward      │
│             → Fourth guess vectors                     │
│                                                         │
│   ...                                                  │
│                                                         │
│   Típico: 8 a 64 pasadas (layers)                     │
│   Cada pasada REFINA el entendimiento.                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Generación de Tokens

### Paso 1: Predecir el siguiente token

```
Basándose en los vectores refinados, el modelo pregunta:

"Según mis datos de entrenamiento,
 ¿qué tokens probablemente vienen después?"

Resultado: Distribución de probabilidad sobre TODO el vocabulario.

Ej: Si el vocabulario tiene 100,000 tokens:

"is"     → 0.35 (35%)
"was"    → 0.25 (25%)
"sat"    → 0.15 (15%)
"jumped" → 0.08 (8%)
...
"xyz"    → 0.0001 (casi cero)
```

### Paso 2: Elegir un token

```
El LLM ELIGE un token de esta distribución,
pesando la elección por las probabilidades asignadas.

Tokens probables se eligen más seguido,
pero EN TEORÍA cualquier token tiene una chance.

→ Por eso los LLMs son INHERENTEMENTE ALEATORIOS.
```

### Paso 3: Repetir

```
Token elegido se agrega al final del prompt.

Para generar el SEGUNDO token:
├── Repetir TODO el proceso
├── Pero ahora considerando el nuevo token también
└── Nuevos tokens hacen sentido con originales Y generados

Esto continúa hasta:
├── Llegar al límite de tokens que configuraste
└── O el modelo genera un token especial de "fin"
```

---

## Visualización del Proceso Completo

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PROMPT: "What is the capital of"                     │
│                                                         │
│   1. Tokenizar → ["What", "is", "the", "capital", "of"]│
│                                                         │
│   2. First guess embeddings para cada token            │
│                                                         │
│   3. Positional encodings                              │
│                                                         │
│   4. Attention (múltiples heads)                       │
│      "capital" presta atención a "What" (pregunta)     │
│      "capital" presta atención a "of" (preposición)    │
│                                                         │
│   5. Feedforward → second guess                        │
│                                                         │
│   6. Repetir 4-5 muchas veces (8-64 layers)           │
│                                                         │
│   7. Predecir siguiente token                          │
│      "France" → 0.02                                   │
│      "Canada" → 0.03                                   │
│      ...depende de qué país esperaba...                │
│                                                         │
│   8. Elegir token (ej: "France")                       │
│                                                         │
│   9. Repetir para generar más tokens                   │
│      → "France is Paris"                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Implicaciones para RAG

### 1. Por qué RAG funciona

```
Los LLMs pueden PROFUNDAMENTE entender el significado
y relevancia de la información agregada al prompt.

Gracias a:
├── Attention mechanism (entiende relaciones)
└── Feedforward layers (conocimiento del mundo)

El LLM puede "leer" los documentos recuperados
y USARLOS para responder.
```

### 2. Los LLMs son inherentemente ALEATORIOS

```
⚠️ IMPORTANTE:

Aunque inyectes información significativa en el prompt,
el LLM PUEDE elegir NO usarla para generar texto.

Por eso necesitás:
├── Controlar la aleatoriedad (temperature)
├── Confirmar que el LLM se basa en la info recuperada
└── Técnicas de grounding
```

### 3. Los LLMs son computacionalmente COSTOSOS

```
Generar UN SOLO TOKEN requiere mucho procesamiento.

Y el costo CRECE con la longitud del prompt/completion:
├── Cada token necesita mirar a TODOS los otros
├── Más tokens = más comparaciones = más costo
└── O(n²) en términos de atención

La mayoría de los costos de un sistema RAG
vienen de correr estos modelos transformer.
```

---

## Aplicación para DONA 🎯

### Por qué DONA puede funcionar:

```
Cuando el retriever trae info del producto:
├── El LLM "lee" esa información
├── Attention conecta la pregunta con el contexto
├── Feedforward usa conocimiento general
└── Genera respuesta basada en el contexto
```

### Riesgos a manejar:

```
1. ALEATORIEDAD:
   El LLM puede ignorar el contexto y responder de memoria
   → Necesitamos técnicas de grounding

2. COSTO:
   Prompts largos con mucho contexto = más caro
   → Chunking y re-ranking optimizan esto

3. CONTEXTO MEZCLADO:
   Con múltiples productos en contexto, el LLM puede mezclar
   → Estructurar bien el prompt
```

---

## Resumen del Capítulo 28

| Componente | Qué hace |
|------------|----------|
| **Tokenización** | Divide texto en tokens |
| **Embeddings** | First guess del significado |
| **Positional Encoding** | Dónde está cada token |
| **Attention** | Qué tokens impactan a cuáles |
| **Feedforward** | Refina entendimiento con contexto |
| **Layers** | Repite attention+feedforward 8-64x |
| **Generation** | Predice y elige siguiente token |

---

## Key Takeaways:

```
1. RAG funciona porque attention entiende relaciones profundas

2. LLMs son ALEATORIOS - pueden ignorar el contexto

3. LLMs son COSTOSOS - costo crece con longitud

4. Cada token generado requiere procesar TODO el prompt
```

---

## Próximo: Construyendo Llamadas a LLM en Código

Cómo interactuar con LLMs programáticamente.

---
