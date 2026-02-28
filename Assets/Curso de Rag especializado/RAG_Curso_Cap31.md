# Capítulo 31: Prompt Engineering para RAG

---

## La Importancia del Prompting

> "Para sacar el máximo de tu LLM, necesitás escribir un prompt de alta calidad. Prompt engineering es un término paraguas para técnicas que llevan a mejores resultados."

---

## El Formato de Mensajes (OpenAI Style)

### Estructura JSON:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "Sos un asistente útil..."
    },
    {
      "role": "user",
      "content": "¿Cuál es el precio del cemento?"
    },
    {
      "role": "assistant",
      "content": "El cemento Portland cuesta..."
    },
    {
      "role": "user",
      "content": "¿Y el hierro del 8?"
    }
  ]
}
```

### Los Tres Roles:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   SYSTEM:                                              │
│   Instrucciones de alto nivel para el LLM.             │
│   Cómo debe comportarse en general.                    │
│                                                         │
│   USER:                                                │
│   Mensajes que el usuario ha enviado.                  │
│                                                         │
│   ASSISTANT:                                           │
│   Respuestas que el LLM generó previamente.            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Cómo Funcionan las Conversaciones Multi-Turn

### La realidad:

```
El LLM NO "recuerda" lo que dijiste antes.

Cada vez que enviás un mensaje:
1. Toda la conversación se convierte a formato messages
2. Tu nuevo mensaje se agrega al final
3. TODO se envía al LLM
4. El LLM responde como si fuera la primera vez

Es como si le mostraras toda la conversación de nuevo
cada vez que hablás.
```

### Visualización:

```
TURNO 1:
[system] + [user: "hola"] → LLM → [assistant: "¡Hola!"]

TURNO 2:
[system] + [user: "hola"] + [assistant: "¡Hola!"] + [user: "¿precio cemento?"] → LLM

TURNO 3:
[system] + [user: "hola"] + [assistant: "¡Hola!"] + [user: "¿precio?"] + [assistant: "El precio es..."] + [user: "¿y hierro?"] → LLM

Cada turno envía TODA la historia.
```

---

## El Chat Template

### Cómo se convierte a texto:

```
El JSON de mensajes se convierte en un string
con tags especiales que el LLM reconoce.

Ejemplo:
<|system|>
Sos un asistente de ventas...
<|user|>
¿Cuál es el precio del cemento?
<|assistant|>
El cemento Portland cuesta $X...
<|user|>
¿Y el hierro del 8?
```

> "Los LLMs están entrenados para reconocer estos tags y entender la diferencia entre system, user, y assistant."

---

## Construyendo el System Prompt

### Qué incluir:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. INFORMACIÓN CONTEXTUAL                            │
│      ├── Knowledge cutoff del modelo                   │
│      ├── Fecha actual                                  │
│      └── Contexto del sistema                          │
│                                                         │
│   2. INSTRUCCIONES DE COMPORTAMIENTO                   │
│      ├── Tono a usar                                   │
│      ├── Proceso para razonar                          │
│      ├── Formato de respuesta                          │
│      └── Restricciones                                 │
│                                                         │
│   3. PERSONALIDAD                                      │
│      ├── Cómo debe "sonar"                            │
│      └── Actitud hacia el usuario                     │
│                                                         │
│   4. INSTRUCCIONES RAG-ESPECÍFICAS                     │
│      ├── Usar SOLO documentos recuperados              │
│      ├── Citar fuentes                                 │
│      └── Qué hacer si no hay info suficiente          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Ejemplo de system prompt real:

```
Los system prompts de chatbots populares son ENORMES.
Múltiples páginas de instrucciones.

Incluyen:
├── Knowledge cutoff y fecha actual
├── Instrucciones de razonamiento paso a paso
├── Políticas de seguridad
├── Formato de respuesta (markdown)
├── Personalidad ("intelectualmente curioso")
└── Procedimientos específicos para diferentes casos
```

---

## System Prompt para RAG

### Elementos esenciales:

```python
RAG_SYSTEM_PROMPT = """
Sos un asistente de [tu dominio]. Tu trabajo es responder 
preguntas basándote ÚNICAMENTE en la información proporcionada 
en los documentos de contexto.

INSTRUCCIONES:
1. Usá SOLO la información de los documentos proporcionados
2. Si la información no está en los documentos, decí "No tengo 
   información sobre eso en los documentos disponibles"
3. Citá la fuente cuando sea relevante
4. Respondé de manera [concisa/detallada]
5. Usá un tono [profesional/amigable]

FORMATO:
- Respondé en español
- Usá markdown si es apropiado
- Incluí precios con el símbolo $ cuando corresponda

RESTRICCIONES:
- NO inventes información
- NO uses conocimiento fuera de los documentos
- NO respondas preguntas fuera de [tu dominio]
"""
```

---

## El Template del Prompt Completo

### Estructura recomendada:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. SYSTEM PROMPT                                     │
│      Instrucciones de alto nivel                       │
│                                                         │
│   2. CONVERSATION HISTORY (si es multi-turn)           │
│      Mensajes anteriores user/assistant                │
│                                                         │
│   3. RETRIEVED CONTEXT                                 │
│      Top 5-10 chunks del retriever                     │
│      + Instrucciones de cómo procesarlos               │
│                                                         │
│   4. CURRENT USER PROMPT                               │
│      La pregunta actual del usuario                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Ejemplo concreto:

```python
def build_rag_prompt(user_query, retrieved_docs, conversation_history=[]):
    
    # 1. System prompt
    messages = [{
        "role": "system",
        "content": RAG_SYSTEM_PROMPT
    }]
    
    # 2. Conversation history
    for msg in conversation_history:
        messages.append(msg)
    
    # 3. Retrieved context (como mensaje de usuario)
    context_text = format_retrieved_docs(retrieved_docs)
    messages.append({
        "role": "user",
        "content": f"""
DOCUMENTOS DE CONTEXTO:
{context_text}

Basándote ÚNICAMENTE en los documentos anteriores, 
respondé la siguiente pregunta:
"""
    })
    
    # 4. Current user prompt
    messages.append({
        "role": "user",
        "content": user_query
    })
    
    return messages
```

---

## Formateando los Documentos Recuperados

### Opción 1: Lista simple

```
DOCUMENTOS DE CONTEXTO:

[1] Cemento Portland Tipo I - Precio: $8,500 por bolsa de 50kg.
Disponible en stock. Marca: Loma Negra.

[2] Cemento Portland Tipo II - Precio: $9,200 por bolsa de 50kg.
Resistente a sulfatos. Marca: Holcim.

[3] Cemento de Albañilería - Precio: $7,800 por bolsa de 40kg.
Para uso general en mampostería.
```

### Opción 2: Con metadata explícita

```
DOCUMENTOS DE CONTEXTO:

---
Documento 1:
Categoría: Cementos
Producto: Cemento Portland Tipo I
Marca: Loma Negra
Precio: $8,500/bolsa 50kg
Contenido: El cemento Portland Tipo I es ideal para...
---

---
Documento 2:
Categoría: Cementos
Producto: Cemento Portland Tipo II
...
---
```

### Opción 3: XML-style (más estructurado)

```xml
<documentos>
  <documento id="1">
    <categoria>Cementos</categoria>
    <producto>Cemento Portland Tipo I</producto>
    <precio>$8,500/bolsa 50kg</precio>
    <contenido>El cemento Portland Tipo I es ideal para...</contenido>
  </documento>
  <documento id="2">
    ...
  </documento>
</documentos>
```

---

## Aplicación para DONA 🎯

### System Prompt para DONA:

```python
DONA_SYSTEM_PROMPT = """
Sos DONA, asistente virtual de Materiales Boto Mariani, 
una empresa de materiales de construcción en Argentina.

TU ROL:
Ayudar a clientes con consultas sobre productos, precios, 
disponibilidad y recomendaciones de materiales.

INSTRUCCIONES:
1. Respondé SOLO basándote en los documentos de contexto
2. Si el producto no está en el contexto, decí:
   "No encontré ese producto en nuestro catálogo. 
    ¿Querés que te ayude a buscar algo similar?"
3. Siempre mencioná el precio actualizado si está disponible
4. Si hay múltiples opciones, presentalas ordenadas por precio
5. Preguntá sobre cantidad si el cliente no especificó

TONO:
- Amigable pero profesional
- Usá "vos" (español argentino)
- Sé conciso pero completo

FORMATO:
- Precios con $ y sin decimales innecesarios
- Disponibilidad clara (en stock / sin stock / consultar)
- Si recomendás alternativas, explicá por qué

RESTRICCIONES:
- NO inventes precios o disponibilidad
- NO des consejos técnicos de ingeniería estructural
- NO prometas plazos de entrega sin confirmación
"""
```

### Template completo para DONA:

```python
def dona_build_prompt(user_query, products, conversation=[]):
    messages = [{"role": "system", "content": DONA_SYSTEM_PROMPT}]
    
    # Historial
    messages.extend(conversation[-6:])  # Últimos 3 turnos
    
    # Contexto de productos
    if products:
        context = "PRODUCTOS ENCONTRADOS:\n\n"
        for i, p in enumerate(products, 1):
            context += f"""[{i}] {p['nombre']}
Categoría: {p['categoria']}
Marca: {p['marca']}
Precio: ${p['precio']}
Disponibilidad: {p['disponibilidad']}
Descripción: {p['descripcion']}

"""
        messages.append({
            "role": "user", 
            "content": context + "\nBasándote en estos productos:"
        })
    else:
        messages.append({
            "role": "user",
            "content": "No se encontraron productos relevantes en el catálogo."
        })
    
    # Query del usuario
    messages.append({"role": "user", "content": user_query})
    
    return messages
```

---

## Tips para Buenos Prompts

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. SÉ ESPECÍFICO                                     │
│      "Respondé en 2-3 oraciones" > "Sé conciso"        │
│                                                         │
│   2. USA EJEMPLOS                                      │
│      Mostrá cómo querés que sea la respuesta           │
│                                                         │
│   3. ESTRUCTURA CLARA                                  │
│      Separadores visuales entre secciones              │
│                                                         │
│   4. INSTRUCCIONES POSITIVAS                           │
│      "Hacé X" > "No hagas Y"                          │
│                                                         │
│   5. ITERÁ                                             │
│      El prompt perfecto no sale de primera             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Resumen del Capítulo 31

| Componente | Propósito |
|------------|-----------|
| **System Prompt** | Instrucciones globales de comportamiento |
| **Conversation History** | Contexto de turnos anteriores |
| **Retrieved Context** | Documentos del retriever |
| **User Prompt** | La pregunta actual |

---

## Key Takeaway:

> "Los system prompts se agregan a CADA prompt que tu LLM procesa. Invertir tiempo refinándolos es una excelente manera de mejorar el estilo y calidad de los resultados de tu sistema RAG."

---

## Próximo: Técnicas Avanzadas de Prompting

Chain-of-thought, few-shot learning, y más.

---
