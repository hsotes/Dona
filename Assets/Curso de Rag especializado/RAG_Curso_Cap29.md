# Capítulo 29: Controlando la Aleatoriedad del LLM

---

## La Realidad de los LLMs

> "Una gran parte de trabajar con un LLM es entender y controlar la aleatoriedad en el corazón de cómo operan."

```
Cada token que un LLM agrega a tu completion
es una ELECCIÓN ALEATORIA PONDERADA.
```

---

## Distribución de Probabilidades

### Ejemplo: "The sky is ___"

```
Probabilidades del siguiente token:

blue     → 50%
bright   → 25%
clear    → 10%
...
other    → <1%
```

### Visualización:

```
DISTRIBUCIÓN "CONFIDENT" (spike alto):
│
│  ▓
│  ▓
│  ▓ ▓
│  ▓ ▓ ░
│  ▓ ▓ ░ ░ ░ ░ ░ ░ ░ ░ ░
└──────────────────────────────
  blue bright clear ...

El modelo está SEGURO - pocas opciones reales.


DISTRIBUCIÓN "UNCERTAIN" (más plana):
│
│  ▓ ▓ ▓ ▓
│  ▓ ▓ ▓ ▓ ▓ ▓
│  ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ░
└──────────────────────────────
  many tokens with similar probabilities

El modelo está INCIERTO - muchas direcciones posibles.
```

---

## Técnica 1: Greedy Decoding

### La idea:

```
SIEMPRE elegir el token con la probabilidad más alta.
Sin aleatoriedad.
```

### Ventajas:

```
✅ DETERMINÍSTICO
   Mismo prompt → siempre misma respuesta

✅ Útil para debugging
   Podés reproducir exactamente el mismo output
```

### Desventajas:

```
❌ Texto PREDECIBLE y genérico
   Puede sonar robótico o estilizado

❌ LOOPS REPETITIVOS
   El LLM puede quedarse repitiendo la misma secuencia
   
   "The best way to do this is to do this is to do this is..."
   
   No hay mecanismo para salir del loop.
```

### Cuándo usar:

```
├── Code completion (querés predictibilidad)
├── Debugging (querés reproducibilidad)
└── Respuestas factuales cortas
```

---

## Técnica 2: Temperature

### La idea:

```
Un "dial" que cambia la FORMA de la distribución de probabilidades.
```

### Valores:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   TEMPERATURE = 1.0 (default)                          │
│   Distribución original, sin modificar.                │
│                                                         │
│   TEMPERATURE < 1.0 (ej: 0.7)                          │
│   Distribución más "SPIKY"                             │
│   Solo tokens más probables tienen chance real          │
│   → Más conservador, más predecible                    │
│                                                         │
│   TEMPERATURE = 0                                      │
│   = Greedy decoding                                    │
│   Solo el token más probable (100%)                    │
│                                                         │
│   TEMPERATURE > 1.0 (ej: 1.2)                          │
│   Distribución más "FLAT"                              │
│   Tokens menos probables tienen más chance              │
│   → Más variado, más "creativo"                        │
│                                                         │
│   TEMPERATURE muy alta (ej: 2.0)                       │
│   Distribución MUY flat                                │
│   Casi cualquier token tiene chance similar            │
│   → CAOS, texto sin sentido                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Visualización:

```
Temperature 0.5 (bajo):           Temperature 1.5 (alto):
│                                 │
│  ▓                              │  ▓ ▓ ▓ ▓ ▓
│  ▓                              │  ▓ ▓ ▓ ▓ ▓ ▓ ▓
│  ▓ ░                            │  ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓
│  ▓ ░ ░ ░ ░ ░ ░ ░                │  ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓
└─────────────────                └─────────────────────

Casi seguro elige "blue"          Muchas opciones viables
```

---

## Técnica 3: Top-K Sampling

### La idea:

```
Limitar al LLM a elegir SOLO de los K tokens más probables.
```

### Ejemplo:

```
Top K = 5

Tokens disponibles:
1. blue    (50%)
2. bright  (25%)
3. clear   (10%)
4. dark    (8%)
5. endless (5%)

Todos los demás tokens → probabilidad 0
(no importa cuántos había originalmente)
```

### Uso:

```python
response = llm.generate(
    prompt="The sky is",
    temperature=1.1,
    top_k=5  # Solo los 5 más probables
)
```

---

## Técnica 4: Top-P Sampling (Nucleus Sampling)

### La idea:

```
Limitar al LLM a tokens cuya probabilidad ACUMULADA
sea menor que un threshold P.
```

### Ejemplo:

```
Top P = 0.85 (85%)

Acumulando desde el más probable:
1. blue    (50%)  → acumulado: 50%  ✅ incluido
2. bright  (25%)  → acumulado: 75%  ✅ incluido
3. clear   (10%)  → acumulado: 85%  ✅ incluido
4. dark    (8%)   → acumulado: 93%  ❌ excede 85%

Solo tokens 1-3 están disponibles.
```

### Top-K vs Top-P:

```
TOP-K: Siempre elige de K tokens (fijo)
       No importa la forma de la distribución.

TOP-P: Elige de más/menos tokens según la confianza
       - Si el modelo está seguro → pocos tokens
       - Si está incierto → más tokens

TOP-P es más DINÁMICO y RESPONSIVO.
```

---

## Técnica 5: Repetition Penalty

### El problema:

```
Los LLMs tienden a repetir palabras o frases:

"This is a great product. This product is great. 
 The product is really great and this great product..."
```

### La solución:

```
Repetition Penalty DISMINUYE la probabilidad de
tokens que ya aparecieron en el completion.

repetition_penalty = 1.2

Si "great" ya apareció, su probabilidad baja
para el siguiente token.
```

---

## Técnica 6: Logit Biasing

### La idea:

```
Ajustar PERMANENTEMENTE la probabilidad de tokens específicos.
```

### Ejemplos de uso:

```
1. EVITAR PROFANIDAD:
   Bias negativo en palabras que no querés que aparezcan.

2. CLASIFICACIÓN:
   Si el LLM debe responder solo "positive" o "negative",
   boost la probabilidad de esos tokens específicos.

3. FORZAR FORMATO:
   Boost tokens como "{" o "[" para forzar JSON.
```

---

## Configuración Recomendada

### Para uso general:

```python
response = llm.generate(
    prompt=augmented_prompt,
    temperature=0.8,       # Un poco conservador
    top_p=0.9,             # Evita la cola larga
    repetition_penalty=1.2 # Penaliza repetición
)
```

### Por tipo de tarea:

| Tarea | Temperature | Top-P | Notas |
|-------|-------------|-------|-------|
| **Código** | 0.2-0.5 | 0.8 | Querés predictibilidad |
| **Preguntas factuales** | 0.3-0.7 | 0.85 | Basarse en hechos |
| **RAG general** | 0.7-0.9 | 0.9 | Balance |
| **Escritura creativa** | 1.0-1.3 | 0.95 | Más variedad |
| **Brainstorming** | 1.2-1.5 | 0.95 | Exploración |

---

## Aplicación para DONA 🎯

### Configuración recomendada para DONA:

```python
dona_llm_config = {
    "temperature": 0.7,      # Respuestas consistentes pero naturales
    "top_p": 0.9,            # Evitar tokens raros
    "repetition_penalty": 1.1,  # Evitar repetir precios/productos
    "max_tokens": 500        # Respuestas concisas
}
```

### Por qué estos valores:

```
TEMPERATURE 0.7:
├── No queremos que invente precios (bajo)
├── Pero queremos respuestas naturales (no 0)
└── Balance entre factual y conversacional

TOP-P 0.9:
├── Evita tokens nonsense
├── Pero permite variación en lenguaje
└── No tan restrictivo como 0.8

REPETITION PENALTY 1.1:
├── Evita repetir "el precio es" múltiples veces
├── Pero no tan alto que suene forzado
└── Mantiene naturalidad
```

### Escenarios específicos de DONA:

```
CONSULTA DE PRECIO:
temperature=0.5, top_p=0.85
→ Queremos respuesta factual y consistente

RECOMENDACIÓN DE PRODUCTO:
temperature=0.8, top_p=0.9
→ Queremos respuesta más exploratoria

EXPLICACIÓN TÉCNICA:
temperature=0.6, top_p=0.9
→ Factual pero con espacio para variación
```

---

## Resumen del Capítulo 29

| Técnica | Qué controla | Valor típico |
|---------|--------------|--------------|
| **Greedy** | Sin aleatoriedad | temp=0 |
| **Temperature** | Forma de distribución | 0.7-1.0 |
| **Top-K** | Cantidad fija de opciones | 5-50 |
| **Top-P** | Opciones según confianza | 0.85-0.95 |
| **Repetition Penalty** | Penaliza repetición | 1.1-1.3 |
| **Logit Bias** | Tokens específicos | Variable |

---

## Key Takeaway:

> "En general, recomiendo configurar temperature y top_p que mejor se ajusten a tus necesidades. Para código o preguntas factuales, valores bajos. Para dominios creativos, valores más altos."

---

## Próximo: Prompting para RAG

Cómo estructurar prompts para obtener respuestas grounded.

---
