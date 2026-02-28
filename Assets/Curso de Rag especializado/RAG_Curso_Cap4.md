# Capítulo 4: Arquitectura de un Sistema RAG

---

## LLM Directo vs RAG

### Uso normal de un LLM:

```
Usuario → Prompt → LLM → Respuesta
```

### Uso con RAG:

```
Usuario → Prompt → [RETRIEVER → Knowledge Base] → Augmented Prompt → LLM → Respuesta
```

> "La experiencia del usuario es idéntica. Enviás un prompt, recibís una respuesta. Internamente, hay algunos pasos más."

---

## El Flujo Completo de RAG

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. USUARIO ENVÍA PROMPT                              │
│      "¿Por qué los hoteles en Vancouver están          │
│       tan caros este fin de semana?"                   │
│                          │                              │
│                          ▼                              │
│   2. RETRIEVER BUSCA EN KNOWLEDGE BASE                 │
│      ┌────────────────────────────────┐                │
│      │      KNOWLEDGE BASE            │                │
│      │  (database de documentos)      │                │
│      │                                │                │
│      │  • Artículo sobre Taylor Swift │                │
│      │  • Noticias de Vancouver       │                │
│      │  • Info de hoteles             │                │
│      └────────────────────────────────┘                │
│                          │                              │
│                          ▼                              │
│      Retriever devuelve: "5 artículos relevantes"      │
│                          │                              │
│                          ▼                              │
│   3. SE CREA AUGMENTED PROMPT                          │
│      ┌────────────────────────────────┐                │
│      │ "Answer the following question: │                │
│      │  ¿Por qué los hoteles en        │                │
│      │  Vancouver están tan caros?     │                │
│      │                                 │                │
│      │  Here are 5 relevant articles   │                │
│      │  that may help you respond:     │                │
│      │  [texto de los artículos]"      │                │
│      └────────────────────────────────┘                │
│                          │                              │
│                          ▼                              │
│   4. LLM GENERA RESPUESTA                              │
│      (usando conocimiento de training                  │
│       + contexto de documentos recuperados)            │
│                          │                              │
│                          ▼                              │
│   5. USUARIO RECIBE RESPUESTA                          │
│      "Los hoteles están caros porque Taylor Swift      │
│       tiene un show de dos noches este weekend..."     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## La Diferencia Clave

```
SIN RAG:                    CON RAG:
                            
Prompt → LLM → Response     Prompt → Retriever → Augmented → LLM → Response
                                         │          Prompt
                                         ▼
                                   Knowledge
                                     Base
```

> "La principal diferencia entre usar un LLM directamente y un sistema RAG es la adición del retriever."

---

## Ventajas de RAG

### 1. Acceso a información que el LLM no tiene

```
├── Políticas de tu empresa
├── Información personal
├── Noticias de esta mañana
└── Cualquier dato privado o reciente
```

> "RAG es frecuentemente la ÚNICA forma de hacer disponible ciertos tipos de información a un LLM."

---

### 2. Reduce alucinaciones

```
Causa de alucinaciones:
├── Temas excluidos del training
├── Temas mencionados raramente
└── LLM "inventa" para llenar gaps

Solución RAG:
├── Información directamente en el prompt
├── Respuestas FUNDAMENTADAS en docs reales
└── Menos texto genérico o engañoso
```

---

### 3. Fácil de actualizar

```
REENTRENAR LLM:              ACTUALIZAR RAG:
├── Costoso                  ├── Barato
├── Lento                    ├── Rápido
└── Complejo                 └── Simple (como actualizar DB)

Knowledge Base actualizada → LLM responde con info nueva
```

> "Podés simplemente actualizar la información en la knowledge base, igual que actualizarías entradas en cualquier otra base de datos."

---

### 4. Permite citar fuentes

```
Augmented Prompt:
"[Documento: Manual de RRHH, pág 15]
 La política de vacaciones es..."

Respuesta del LLM:
"Según el Manual de RRHH (pág 15), 
 la política de vacaciones es..."

→ El usuario puede verificar la fuente
```

---

### 5. División de responsabilidades

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   RETRIEVER:                  LLM:                     │
│   ───────────                 ────                     │
│   • Filtrar información       • Generar texto          │
│   • Encontrar lo relevante    • Escribir respuesta     │
│   • Presentar sucintamente    • Razonar sobre contexto │
│                                                         │
│   "Cada componente trabaja en su área de              │
│    mayor fortaleza."                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Código Básico de RAG

### Las dos funciones principales:

```python
def retrieve(query: str) -> list:
    """
    Wrapper del retriever.
    Acepta un query de texto.
    Retorna documentos relevantes de la knowledge base.
    """
    return retriever.search(query)


def generate(prompt: str) -> str:
    """
    Wrapper del LLM.
    Acepta un prompt de texto.
    Retorna la respuesta del LLM.
    """
    return llm.complete(prompt)
```

---

### Flujo completo:

```python
# 1. El prompt del usuario
prompt = "¿Por qué los hoteles en Vancouver están tan caros este weekend?"

# 2. SIN RAG - respuesta directa del LLM
response_without_rag = generate(prompt)
# Resultado: respuesta genérica, posiblemente incorrecta

# 3. Recuperar información relevante
retrieved_docs = retrieve(prompt)
# Resultado: artículos sobre Taylor Swift en Vancouver

# 4. Crear augmented prompt
augmented_prompt = f"""
Respond to the following prompt:
{prompt}

Using the following information retrieved to help you answer:
{retrieved_docs}
"""

# 5. CON RAG - respuesta con contexto
response_with_rag = generate(augmented_prompt)
# Resultado: "Los hoteles están caros porque Taylor Swift 
#             tiene un show este weekend..."
```

---

## Resumen Visual

```
┌─────────────────────────────────────────────────────────┐
│                    SISTEMA RAG                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │  PROMPT  │───►│RETRIEVER │───►│ AUGMENTED PROMPT │  │
│  └──────────┘    └────┬─────┘    └────────┬─────────┘  │
│                       │                    │            │
│                       ▼                    │            │
│                 ┌──────────┐               │            │
│                 │KNOWLEDGE │               │            │
│                 │  BASE    │               │            │
│                 └──────────┘               │            │
│                                            ▼            │
│                                      ┌──────────┐       │
│                                      │   LLM    │       │
│                                      └────┬─────┘       │
│                                           │             │
│                                           ▼             │
│                                      ┌──────────┐       │
│                                      │ RESPONSE │       │
│                                      └──────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Ventajas - Resumen

| Ventaja | Explicación |
|---------|-------------|
| **Acceso a info** | Datos que LLM no conoce |
| **Menos alucinaciones** | Respuestas fundamentadas |
| **Fácil actualizar** | Solo cambiar knowledge base |
| **Citar fuentes** | Usuario puede verificar |
| **División de trabajo** | Cada componente en su fortaleza |

---

## Aplicación para DONA 🎯

### Tu flujo debería ser:

```python
# Usuario pregunta
prompt = "¿Cuánto sale el cemento Portland?"

# DONA recupera del catálogo
docs = retrieve(prompt)
# → "Cemento Portland 50kg - $8500 - Stock: 150 bolsas"

# Augmented prompt
augmented = f"""
Sos DONA, asistente de Materiales Boto Mariani.
Pregunta: {prompt}
Información del catálogo: {docs}
Respondé basándote SOLO en la información del catálogo.
"""

# LLM genera respuesta fundamentada
response = generate(augmented)
# → "El cemento Portland de 50kg sale $8500. 
#    Tenemos 150 bolsas en stock."
```

---

## Próximo: Deep Dive en cada Componente

Vamos a ver en detalle el Retriever, la Knowledge Base, y el LLM.

---
