# Capítulo 5: Cómo Funcionan los LLMs (Deep Dive)

---

## LLMs = "Fancy Autocomplete"

> "Todos los LLMs hacen es predecir la siguiente palabra que debería aparecer en un texto."

### Ejemplo:

```
Prompt: "What a beautiful day, the sun is..."

Completions posibles:
├── "shining" ← más probable
├── "rising"  ← probable
├── "out"     ← probable
└── "exploding" ← improbable (pero válido gramaticalmente)
```

**¿Por qué "exploding" es incorrecto?**
No es por gramática (es inglés válido), sino porque es **improbable**. El sol usualmente no explota, especialmente en un día hermoso.

---

## Cómo Genera Texto un LLM

### Paso a paso:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  1. PROCESA el estado actual del texto                 │
│     → Entiende relaciones entre palabras               │
│     → Comprende significado general                    │
│                                                         │
│  2. CALCULA probabilidad para CADA token               │
│     → Vocabulario: 10,000 - 100,000+ tokens            │
│     → Cada token tiene una probabilidad                │
│                                                         │
│  3. ELIGE aleatoriamente de esa distribución           │
│     → "shining": 80% de las veces                      │
│     → "rising": 15% de las veces                       │
│     → "exploding": 0.01% de las veces                  │
│                                                         │
│  4. REPITE para el siguiente token                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Tokens vs Palabras

> "Técnicamente, un LLM no genera palabras sino tokens - piezas de palabras."

### Ejemplos:

| Palabra | Tokens |
|---------|--------|
| "London" | 1 token |
| "door" | 1 token |
| "programmatically" | múltiples tokens |
| "unhappy" | múltiples tokens ("un" + "happy") |
| "." (punto) | 1 token |
| "?" | 1 token |

### ¿Por qué tokens?

```
Ventaja: Puede construir CUALQUIER palabra
         sin necesitar un token para cada una.

"programmatically" = "program" + "mat" + "ically"
```

---

## Comportamiento Autoregresivo

> "Autoregresivo = auto-influenciante. Las elecciones anteriores impactan las posteriores."

### Ejemplo:

```
Prompt: "The sun is..."

CAMINO A:
├── Elige: "shining"
├── Luego: "in"
├── Luego: "the"
└── Luego: "sky"
→ "The sun is shining in the sky"

CAMINO B:
├── Elige: "warming"
├── Luego: "our"
└── Luego: "faces"
→ "The sun is warming our faces"
```

### Implicación importante:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Una vez que el LLM elige una dirección,              │
│   SIGUE ese camino donde lo lleve.                     │
│                                                         │
│   Por eso: mismo prompt → diferentes respuestas        │
│   (randomness + autoregressive)                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Cómo se Entrena un LLM

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ANTES del training:                                  │
│   ├── Modelo con billones de parámetros               │
│   └── Produce GIBBERISH (basura)                      │
│                                                         │
│   DURANTE el training:                                 │
│   ├── Se le muestran textos incompletos               │
│   ├── Intenta predecir la siguiente palabra           │
│   ├── Se corrigen sus parámetros según precisión      │
│   └── Repite TRILLONES de veces                       │
│                                                         │
│   DESPUÉS del training:                                │
│   ├── Aprendió información factual                    │
│   ├── Aprendió estilos lingüísticos                   │
│   └── Puede generar texto coherente                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Datos de entrenamiento típicos:

```
├── Trillones de tokens
├── Mayormente de internet público
├── Variedad de estilos y temas
└── Todo lo que estaba en el training data
```

---

## Por Qué los LLMs Alucinan

> "LLMs están diseñados para generar texto PROBABLE, no texto VERDADERO."

### La definición de "verdad" para un LLM:

```
VERDAD HUMANA:          VERDAD LLM:
────────────────        ──────────────
Corresponde a           Es probabilísticamente
la realidad             probable según el
                        training data
```

### Cuándo alucinan:

| Situación | Por qué alucina |
|-----------|-----------------|
| Datos privados de tu empresa | No estaban en el training |
| Noticias de hoy | Entrenado antes de hoy |
| Info especializada rara | Pocas menciones en training |
| Tu catálogo de productos | Definitivamente no lo vio |

> "El LLM no está teniendo un episodio psicológico. Está haciendo exactamente lo que fue diseñado para hacer: generar texto probable."

---

## Cómo RAG Soluciona Esto

### El insight clave:

> "Los LLMs son MUY buenos entendiendo contexto en el prompt, incluso si esa información NO estaba en el training."

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   SIN RAG:                                             │
│   Prompt: "¿Cuánto sale el cemento?"                   │
│   LLM: [busca en training data]                        │
│        → No tiene tu catálogo                          │
│        → ALUCINA un precio                             │
│                                                         │
│   CON RAG:                                             │
│   Prompt: "Contexto: Cemento Portland $8500            │
│            Pregunta: ¿Cuánto sale el cemento?"         │
│   LLM: [lee el contexto en el prompt]                  │
│        → TIENE la información                          │
│        → Responde correctamente                        │
│                                                         │
│   "La información FUNDAMENTA (grounds) las respuestas" │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Limitaciones del Contexto

### 1. Costo computacional:

```
Antes de generar CADA token, el LLM escanea 
TODOS los tokens del prompt + completion.

Prompt más largo = más cómputo = más caro = más lento
```

### 2. Context Window:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   CONTEXT WINDOW = máximo de tokens que puede procesar │
│                                                         │
│   Modelos viejos: ~4,000 tokens                        │
│   Modelos nuevos: hasta millones de tokens             │
│                                                         │
│   Si excedés el context window → ERROR                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### El trade-off:

```
MÁS contexto:               MENOS contexto:
├── Más información         ├── Más barato
├── Mejores respuestas      ├── Más rápido
├── Más caro                ├── Puede faltar info
└── Más lento               └── Posibles alucinaciones
```

---

## Resumen: Por Qué Importa para RAG

| Característica LLM | Implicación para RAG |
|--------------------|----------------------|
| Predice tokens probables | Puede "inventar" si no tiene data |
| Entiende contexto muy bien | Podemos DARLE info en el prompt |
| Autoregresivo | Una vez que toma dirección, la sigue |
| Context window limitado | No podemos meter TODO, hay que elegir |
| Más contexto = más caro | Retriever debe ser SELECTIVO |

---

## El Rol del Retriever (adelanto)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PROBLEMA:                                            │
│   - LLM necesita contexto para no alucinar            │
│   - Pero no podemos meter TODO en el prompt           │
│   - Context window limitado + costo                   │
│                                                         │
│   SOLUCIÓN: RETRIEVER                                  │
│   - Filtra la información                             │
│   - Encuentra lo MÁS RELEVANTE                        │
│   - Presenta solo lo necesario                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Por qué DONA puede estar fallando:

| Problema | Causa probable |
|----------|----------------|
| Inventa precios | No tiene el dato en contexto |
| Respuestas genéricas | Retriever no trae docs correctos |
| Mezcla productos | Demasiado contexto confuso |
| Respuestas inconsistentes | Autoregressive + random |

### Soluciones:

```
1. Asegurar que el Retriever traiga docs CORRECTOS
2. Prompt que FUERCE usar solo el contexto
3. No meter demasiado contexto (confunde)
4. Temperatura baja para menos randomness
```

---

## Próximo: El Retriever

Cómo el retriever encuentra y selecciona información relevante.

---
