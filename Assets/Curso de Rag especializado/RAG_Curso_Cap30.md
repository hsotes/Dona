# Capítulo 30: Eligiendo el LLM Correcto

---

## La Decisión Importante

> "Una decisión mayor cuando construís una aplicación RAG es qué LLM vas a usar. Elegir el correcto puede tener un gran impacto en velocidad, calidad y presupuesto."

---

## Métricas Cuantificables

### 1. Model Size (Parámetros)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PEQUEÑOS: 1-10 billion parámetros                    │
│   MEDIANOS: 10-100 billion parámetros                  │
│   GRANDES: 100-500+ billion parámetros                 │
│                                                         │
│   Más grande = típicamente más capaz                   │
│   Más grande = SIEMPRE más caro de correr              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Costo

```
Típicamente cobrado por millón de tokens.

A veces precios diferentes para:
├── Input tokens (prompt)
└── Output tokens (completion)

Modelos más nuevos/grandes/capaces = más caros.
```

### 3. Context Window

```
Máximo de tokens que el LLM puede procesar
(prompt + completion combinados).

Ejemplos:
├── GPT-3.5: ~16K tokens
├── GPT-4: ~128K tokens
├── Claude: ~200K tokens
├── Gemini: ~1M tokens

Más grande = más flexibilidad
PERO: Seguís pagando por token usado.
```

### 4. Velocidad / Latencia

```
TIME TO FIRST TOKEN:
¿Cuánto tarda en empezar a responder?

TOKENS PER SECOND:
¿Qué tan rápido genera una vez que empieza?

Si tu sistema necesita real-time:
→ Podrías sacrificar calidad por velocidad.
```

### 5. Knowledge Cutoff Date

```
¿Hasta qué fecha tiene conocimiento el modelo?

Incluso en RAG, un cutoff más reciente es preferible:
├── Mejor comprensión de eventos recientes
├── Conocimiento más actualizado del mundo
└── Menos chances de información obsoleta
```

---

## Métricas de Calidad (Más Difíciles)

### El desafío:

```
"Calidad" incluye:
├── Capacidad de razonamiento
├── Resolución de problemas matemáticos
├── Generación de código
├── Texto agradable de leer
├── Seguimiento de instrucciones
└── Y mucho más...

No hay una sola métrica que capture todo.
```

---

## Tipos de Benchmarks

### 1. Automated Benchmarks

```
LLMs evaluados en tareas que código puede verificar.

Ejemplos:
├── Multiple choice tests
├── Problemas matemáticos
├── Coding challenges

MMLU (Massive Multitask Language Understanding):
├── 57 subjects
├── STEM, humanities, law, etc.
├── Multiple choice format
```

### 2. Human Evaluation

```
Dos LLMs anónimos responden al mismo prompt.
Humanos eligen cuál respuesta prefieren.

Se usa algoritmo ELO (como en ajedrez)
para crear un ranking comparativo.

LLM Arena:
├── Uno de los benchmarks más citados
├── Captura calidad matizada
├── Factores que automated no puede medir
```

### 3. LLM-as-a-Judge

```
Un LLM evalúa las respuestas de otro LLM.

El juez tiene respuestas de referencia
y determina qué tan cerca estuvo el evaluado.

Resultado: Win rate para comparar modelos.

✅ Ventaja: Barato y flexible
❌ Desventaja: Bias hacia su propia familia
   GPT prefiere GPT, Gemini prefiere Gemini
```

---

## Cualidades de Buenos Benchmarks

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. RELEVANCIA                                        │
│      Si tu app no genera código,                       │
│      un benchmark de código no ayuda.                  │
│                                                         │
│   2. DIFICULTAD                                        │
│      Debe diferenciar entre modelos.                   │
│      Si todos scorean bien, no es útil.                │
│                                                         │
│   3. REPRODUCIBILIDAD                                  │
│      Scores consistentes entre runs.                   │
│      Verificables independientemente.                  │
│                                                         │
│   4. ALINEAMIENTO CON REALIDAD                         │
│      Buen score en coding → debe escribir buen código  │
│      en la práctica, no solo en el benchmark.          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## El Problema de Data Contamination

```
LLMs se entrenan con trillones de tokens del internet.

Posible que datos del benchmark estén en el training data.

Si el LLM YA VIO las preguntas y respuestas:
├── Overperforma en ese benchmark
├── Pero no refleja capacidad real
└── Score no es indicativo de rendimiento general
```

---

## La Realidad de los Benchmarks

### El patrón que se repite:

```
AÑO 1: Benchmark nuevo, scores bajos
       ↓
AÑO 2-3: Modelos mejoran, scores suben
       ↓
AÑO 4: "Saturación" - todos scorean cerca del máximo
       ↓
Se necesitan nuevos benchmarks más difíciles
       ↓
El ciclo se repite
```

### Implicación:

```
Modelos de HOY son significativamente mejores
que modelos de hace 2 años.

El modelo que elijas HOY probablemente necesitará
ser reemplazado cuando salgan modelos mejores.

→ Diseñá tu sistema para poder cambiar de modelo.
```

---

## Resumen: Cómo Elegir

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PASO 1: Definir constraints                          │
│   ├── Presupuesto máximo                               │
│   ├── Latencia requerida                               │
│   └── Context window necesario                         │
│                                                         │
│   PASO 2: Filtrar por métricas cuantificables          │
│   ├── Costo por token                                  │
│   ├── Velocidad                                        │
│   └── Context window                                   │
│                                                         │
│   PASO 3: Comparar calidad con benchmarks relevantes   │
│   ├── Elegir benchmarks que apliquen a tu use case    │
│   └── Verificar alignment con realidad                 │
│                                                         │
│   PASO 4: Testear con tu data real                     │
│   └── Ningún benchmark reemplaza pruebas reales       │
│                                                         │
│   PASO 5: Planear para cambio                          │
│   └── El modelo que elijas será reemplazado           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Consideraciones para DONA:

```
PRESUPUESTO:
├── ¿Cuántas queries por día?
├── ¿Cuánto podés gastar en LLM?
└── Input tokens (contexto) vs output tokens (respuesta)

LATENCIA:
├── Clientes esperan respuesta rápida
├── Real-time chat → latencia importa
└── Time to first token crítico

CONTEXT WINDOW:
├── ¿Cuántos productos en contexto a la vez?
├── ¿Manuales técnicos largos?
└── Típicamente 8-16K es suficiente para DONA

CALIDAD:
├── Necesita entender español
├── Necesita seguir instrucciones (grounding)
└── NO necesita código ni matemática avanzada
```

### Opciones para DONA:

```
OPCIÓN 1: Modelo grande (GPT-4, Claude)
├── Mejor calidad
├── Mejor seguimiento de instrucciones
├── Más caro
└── Para: Producción con presupuesto

OPCIÓN 2: Modelo mediano (GPT-3.5, Claude Haiku)
├── Buena calidad para tareas simples
├── Mucho más barato
├── Más rápido
└── Para: Alto volumen, MVP

OPCIÓN 3: Modelo open-source (Llama, Mistral)
├── Sin costo de API
├── Control total
├── Necesita infraestructura propia
└── Para: Control total, privacidad de datos
```

### Recomendación para DONA:

```
FASE 1 (MVP):
└── GPT-3.5 o Claude Haiku (barato, rápido, suficiente)

FASE 2 (Producción):
└── Evaluar si calidad es suficiente
    Si no → upgrade a GPT-4 / Claude Sonnet

FASE 3 (Escala):
└── Considerar open-source para reducir costos
```

---

## Resumen del Capítulo 30

| Factor | Qué considerar |
|--------|----------------|
| **Size** | Más grande = más capaz pero más caro |
| **Cost** | $ por millón de tokens |
| **Context** | Máximo tokens (prompt + completion) |
| **Speed** | Latencia y tokens/segundo |
| **Cutoff** | Fecha hasta donde tiene conocimiento |
| **Quality** | Benchmarks relevantes a tu use case |

---

## Key Takeaway:

> "Elegir el LLM correcto es una decisión importante pero TEMPORAL. Gracias a la velocidad con que mejoran los modelos, deberías planear eventualmente cambiar a modelos nuevos que se ajusten mejor a tu sistema RAG."

---

## Próximo: Prompting para RAG

Cómo estructurar prompts para que el LLM use el contexto recuperado.

---
