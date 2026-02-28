# Capítulo 32: Técnicas Avanzadas de Prompting

---

## Overview

> "Una vez que tenés un template básico de prompt para tu sistema RAG, podés empezar a probar técnicas de prompt engineering más avanzadas."

---

## Técnica 1: In-Context Learning

### La idea:

```
Ayudar al LLM a aprender qué tipo de output querés
agregando EJEMPLOS al prompt.
```

### Ejemplo:

```
Si estás construyendo un chatbot de customer service:

├── Incluir ejemplos de requests de clientes anteriores
├── Incluir respuestas de alta calidad a esos requests
└── El LLM aprende el tono y estructura de esas respuestas
```

### Nomenclatura:

```
FEW-SHOT LEARNING: Varios ejemplos en el prompt
ONE-SHOT LEARNING: Un solo ejemplo en el prompt
ZERO-SHOT: Sin ejemplos (lo que venías haciendo)
```

---

### Implementación de In-Context Learning

#### Opción 1: Ejemplos hardcodeados

```python
SYSTEM_PROMPT = """
Sos un asistente de ventas. Respondé como en estos ejemplos:

EJEMPLO 1:
Cliente: "¿Tienen cemento?"
Asistente: "¡Sí! Tenemos varias opciones de cemento. El Portland 
Tipo I de Loma Negra está a $8,500 la bolsa de 50kg. ¿Cuántas 
bolsas necesitás?"

EJEMPLO 2:
Cliente: "¿Cuánto sale el hierro?"
Asistente: "El hierro del 8 está a $X el metro, y el del 10 a $Y. 
¿Para qué uso lo necesitás? Así te recomiendo el más adecuado."

Ahora respondé a la siguiente consulta:
"""
```

#### Opción 2: RAG para ejemplos dinámicos

```python
# Indexar conversaciones exitosas en vector DB
def get_example_conversations(query):
    # Buscar conversaciones similares anteriores
    examples = conversation_db.query.hybrid(
        query=query,
        limit=2
    )
    return examples

# Inyectar ejemplos relevantes al prompt
examples = get_example_conversations(user_query)
prompt = f"""
Ejemplos de conversaciones exitosas sobre temas similares:

{format_examples(examples)}

Ahora respondé:
{user_query}
"""
```

> "De muchas formas, esto es RAG normal, pero el hecho de que estás recuperando específicamente RESPUESTAS DE EJEMPLO puede mejorar aún más la calidad."

---

## Técnica 2: Chain-of-Thought (CoT)

### La idea:

```
Animar al LLM a RAZONAR paso a paso
antes de dar la respuesta final.
```

### Implementación con Scratchpad:

```python
SYSTEM_PROMPT = """
Cuando respondas preguntas complejas, primero pensá en voz alta
dentro de tags <scratchpad>. Estos tags son para organizar 
tus pensamientos y NO son parte de la respuesta final.

Formato:
<scratchpad>
[Tu razonamiento paso a paso aquí]
</scratchpad>

[Tu respuesta final aquí]
"""
```

### Ejemplo de output:

```
Usuario: "¿Qué materiales necesito para una losa de 20m²?"

<scratchpad>
1. Para calcular materiales de losa necesito saber:
   - Área: 20m² (dado)
   - Espesor típico: 10-12cm para losa residencial
   
2. Calculando para espesor de 10cm:
   - Volumen de hormigón: 20m² × 0.10m = 2m³
   - Cemento: ~300kg/m³ × 2m³ = 600kg = 12 bolsas
   - Arena: ~0.5m³/m³ × 2m³ = 1m³
   - Piedra: ~0.7m³/m³ × 2m³ = 1.4m³
   
3. Hierro para malla:
   - Malla típica: cada 15cm
   - Hierro del 6 o del 8 según carga
</scratchpad>

Para una losa de 20m² con espesor de 10cm, vas a necesitar 
aproximadamente:
- **Cemento**: 12 bolsas de 50kg
- **Arena**: 1m³
- **Piedra**: 1.5m³
- **Hierro**: Malla con hierro del 6 cada 15cm

¿Querés que te arme un presupuesto con precios actuales?
```

---

### Por qué funciona CoT:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. Le das al LLM un "scratchpad" para organizar       │
│      sus pensamientos antes de responder.              │
│                                                         │
│   2. El enfoque incremental aumenta la probabilidad    │
│      de respuestas más precisas.                       │
│                                                         │
│   3. Es más fácil detectar DÓNDE falla el razonamiento │
│      cuando el LLM "muestra su trabajo".               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Técnica 3: Reasoning Models

### La evolución de CoT:

```
Las estrategias de razonamiento fueron tan exitosas que
ahora hay LLMs diseñados como "reasoning models" de fábrica.

Ejemplos:
├── OpenAI o1 / o1-mini
├── DeepSeek R1
├── Claude con extended thinking
└── Otros "thinking" models
```

### Cómo funcionan internamente:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. REASONING TOKENS (interno)                        │
│      Planificación, consideración de opciones          │
│      Como el scratchpad pero automático                │
│                                                         │
│   2. RESPONSE TOKENS (lo que ves)                      │
│      La respuesta final al usuario                     │
│                                                         │
└─────────────────────────────────────────────────────────┘

Algunos proveedores solo muestran response tokens.
Otros te dejan ver los reasoning tokens también.
```

### Trade-offs de Reasoning Models:

```
✅ VENTAJAS:
├── Más precisos en tareas complejas
├── Excelentes en código, matemáticas, planificación
├── Buenos evaluando relevancia de documentos
└── Mejores incorporando información en respuestas complejas

❌ DESVENTAJAS:
├── Más LENTOS (generan muchos reasoning tokens)
├── Más CAROS (pagás por todos los tokens)
└── Los reasoning tokens son tokens regulares con costo
```

---

### Prompting para Reasoning Models

#### Lo que NO necesitás:

```
❌ "Pensá paso a paso" → ya lo hacen automáticamente
❌ In-context learning → pueden confundir ejemplos con la pregunta actual
```

#### Lo que SÍ funciona:

```
✅ Objetivos específicos a alcanzar
✅ Formato de respuesta muy específico
✅ Principios guía de alto nivel
✅ Enfoques a tomar o evitar
✅ Context dump completo de documentos RAG
```

---

## Gestión del Context Window

### El problema:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   TODO usa context window:                             │
│   ├── System prompt                                    │
│   ├── In-context learning examples                     │
│   ├── Retrieved documents                              │
│   ├── Conversation history                             │
│   ├── Reasoning tokens (si reasoning model)            │
│   └── Generated response                               │
│                                                         │
│   Es MUY fácil llenarlo rápidamente si no prestás      │
│   atención.                                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Solución 1: Validar valor agregado

```
Para single-turn conversations:

Si una técnica (CoT, few-shot) no está dando mejor performance:
→ REMOVELA del sistema

No agregues complejidad sin beneficio medible.
```

### Solución 2: Context Pruning

```
Para multi-turn conversations:

OPCIÓN A: Fixed window
└── Mantener solo los últimos N mensajes (ej: últimos 5)

OPCIÓN B: Summarization
└── Usar LLM separado para resumir mensajes viejos
└── Preserva puntos clave, reduce tokens

OPCIÓN C: Drop reasoning tokens
└── En reasoning models, solo guardar response tokens
└── No guardar el "pensamiento" en el historial

OPCIÓN D: Drop old RAG context
└── Solo incluir chunks para la pregunta ACTUAL
└── No arrastrar chunks de preguntas anteriores
```

---

### Ejemplo de Context Pruning para DONA:

```python
def prune_conversation(messages, max_messages=6):
    """Mantener solo los últimos N mensajes"""
    if len(messages) <= max_messages:
        return messages
    
    # Siempre mantener system prompt
    system = [m for m in messages if m['role'] == 'system']
    
    # Últimos N mensajes user/assistant
    recent = [m for m in messages if m['role'] != 'system'][-max_messages:]
    
    return system + recent


def prune_with_summary(messages, llm, max_messages=6):
    """Resumir mensajes viejos"""
    if len(messages) <= max_messages:
        return messages
    
    system = [m for m in messages if m['role'] == 'system']
    conversation = [m for m in messages if m['role'] != 'system']
    
    # Mensajes viejos a resumir
    old_messages = conversation[:-max_messages]
    recent_messages = conversation[-max_messages:]
    
    # Resumir con LLM
    summary = llm.generate(
        prompt=f"Resumí esta conversación en 2-3 oraciones: {old_messages}"
    )
    
    # Inyectar resumen como contexto
    summary_message = {
        "role": "system",
        "content": f"Resumen de la conversación anterior: {summary}"
    }
    
    return system + [summary_message] + recent_messages
```

---

## Aplicación para DONA 🎯

### Few-Shot Learning para DONA:

```python
DONA_EXAMPLES = """
EJEMPLO 1:
Cliente: "cuanto sale el cemento"
DONA: "El Cemento Portland de Loma Negra está a $8,500 la bolsa 
de 50kg. También tenemos Holcim a $8,200. ¿Cuántas bolsas necesitás?"

EJEMPLO 2:
Cliente: "necesito fierro"
DONA: "¿Qué diámetro necesitás? Tenemos:
- Hierro del 6: $X/metro
- Hierro del 8: $Y/metro  
- Hierro del 10: $Z/metro
¿Es para columnas, vigas, o losa?"
"""
```

### CoT para consultas complejas:

```python
# Activar CoT solo para preguntas de cálculo/presupuesto
if es_pregunta_compleja(user_query):
    prompt += """
    <scratchpad>
    Antes de responder, calculá:
    1. Qué productos se necesitan
    2. Cantidades aproximadas
    3. Precios actuales del contexto
    </scratchpad>
    """
```

### Context Pruning para DONA:

```python
DONA_CONTEXT_CONFIG = {
    "max_history_messages": 6,      # Últimos 3 turnos
    "max_retrieved_docs": 5,        # Solo para pregunta actual
    "include_reasoning_in_history": False,
    "summarize_after": 10           # Resumir si > 10 mensajes
}
```

---

## Cuándo Usar Cada Técnica

| Técnica | Cuándo usar | Cuándo NO usar |
|---------|-------------|----------------|
| **Few-Shot** | Formato específico de respuesta | Ya funciona bien sin ejemplos |
| **CoT** | Razonamiento complejo, cálculos | Preguntas simples |
| **Reasoning Model** | Tareas complejas, presupuesto disponible | Preguntas simples, presupuesto bajo |
| **Context Pruning** | Conversaciones largas | Conversaciones cortas |

---

## Resumen del Capítulo 32

| Técnica | Qué hace | Costo |
|---------|----------|-------|
| **Few-Shot** | Ejemplos en el prompt | Más tokens en prompt |
| **Chain-of-Thought** | Razonamiento paso a paso | Más tokens generados |
| **Reasoning Models** | CoT automático interno | Más lento y caro |
| **Context Pruning** | Reducir historial | Complejidad de implementación |

---

## Key Takeaway:

> "Tu sistema RAG no necesariamente necesita emplear estas técnicas avanzadas. Un template simple y un system prompt bien escrito podrían ser todo lo que necesitás. Cuando se trata de técnicas más avanzadas, te aconsejo agregarlas solo después de que esté claro que las necesitás."

---

## Próximo: Grounding y Hallucinations

Cómo asegurar que el LLM se base en los documentos recuperados.

---
