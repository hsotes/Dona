# Capítulo 3: Ejemplos de RAG en Producción

---

## La Idea Central (repaso)

> "RAG = emparejar un LLM con una knowledge base de información a la que no tuvo acceso durante el entrenamiento."

---

## Ejemplo 1: Code Generation

### El problema:
```
LLM entrenado en:
├── Probablemente todo repositorio público de Git
├── Documentación general
└── Stack Overflow, etc.

PERO no conoce:
├── TUS clases y funciones
├── TUS definiciones
├── TU estilo de código
└── TU proyecto específico
```

### La solución RAG:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   KNOWLEDGE BASE: Tu repositorio de código             │
│   ├── Clases                                           │
│   ├── Funciones                                        │
│   ├── Definiciones                                     │
│   └── Archivos del proyecto                            │
│                                                         │
│                     │                                   │
│                     ▼                                   │
│                                                         │
│   Usuario: "Agregá un método para calcular descuento"  │
│                     │                                   │
│                     ▼                                   │
│                                                         │
│   RETRIEVER: Recupera clases relevantes, estilo usado  │
│                     │                                   │
│                     ▼                                   │
│                                                         │
│   LLM: Genera código que ENCAJA con tu proyecto        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Ejemplos:** GitHub Copilot, Cursor, Claude Code

---

## Ejemplo 2: Chatbots Empresariales

### Información específica de cada empresa:
- Productos propios
- Políticas internas
- Guías de comunicación
- Inventario actual
- Troubleshooting

### Dos tipos de chatbots:

| Tipo | Knowledge Base | Uso |
|------|----------------|-----|
| **Customer Service** | Productos, inventario, FAQs | Atención al cliente |
| **Internal** | Políticas, documentación interna | Empleados |

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   CHATBOT CUSTOMER SERVICE                             │
│                                                         │
│   Knowledge Base:                                      │
│   ├── Catálogo de productos                            │
│   ├── Inventario actual                                │
│   ├── Pasos de troubleshooting                         │
│   └── FAQs                                             │
│                                                         │
│   Cliente: "¿El modelo X viene en azul?"               │
│   Bot: "Sí, el modelo X está disponible en azul.       │
│         Tenemos 15 unidades en stock."                 │
│         (respuesta FUNDAMENTADA en datos reales)       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

> "La knowledge base ayuda a fundamentar las respuestas del LLM en los productos o políticas específicas de tu empresa, y minimiza respuestas genéricas o engañosas."

---

## Ejemplo 3: Healthcare y Legal

### El desafío:
```
├── Precisión es IMPERATIVA
├── Información muy especializada
├── Mucha información privada
└── No puede inventar nada
```

### Knowledge bases típicas:

| Dominio | Contenido |
|---------|-----------|
| **Legal** | Documentos de casos específicos, jurisprudencia |
| **Healthcare** | Journals médicos recientes, historiales |

> "En campos donde la precisión es imperativa y hay mucha información privada y especializada, RAG puede ser la ÚNICA forma de desplegar un producto LLM suficientemente preciso."

---

## Ejemplo 4: AI Web Search

### Evolución de los buscadores:

```
ANTES (búsqueda clásica):
Query → Retriever → Lista de websites

AHORA (AI search):
Query → Retriever → LLM → Resumen AI de los resultados
                          (skimmable, útil)
```

### Básicamente:

> "Los resúmenes AI de búsqueda web son un sistema RAG cuya knowledge base es TODO INTERNET."

**Ejemplos:** Perplexity, Google AI Overview, Bing Chat

---

## Ejemplo 5: Asistentes Personalizados

### Contexto pequeño pero DENSO:

| Aplicación | Knowledge Base |
|------------|----------------|
| **Mensajes** | Tus conversaciones, contactos |
| **Email** | Tu bandeja de entrada |
| **Word processor** | Tus documentos |
| **Calendario** | Tu agenda |

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ASISTENTE PERSONAL                                   │
│                                                         │
│   Knowledge Base (pequeña pero densa):                 │
│   ├── Tus emails recientes                             │
│   ├── Tu calendario                                    │
│   └── Tus documentos del proyecto                      │
│                                                         │
│   Usuario: "Respondé el email de Juan sobre el         │
│             proyecto del viernes"                       │
│                                                         │
│   Asistente: [Recupera email de Juan + contexto del    │
│               proyecto + tu calendario del viernes]    │
│              → Genera respuesta RELEVANTE              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

> "Cuanto más contexto tiene el LLM sobre tu proyecto, mejor puede ayudarte."

---

## La Regla General

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   SI TENÉS información que probablemente               │
│   NO fue usada para entrenar el LLM...                 │
│                                                         │
│            ↓                                            │
│                                                         │
│   ...hay potencial para construir una                  │
│   aplicación RAG útil.                                 │
│                                                         │
│   Puede incluso permitir usar LLMs en contextos        │
│   que de otra forma serían IMPOSIBLES.                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

Tu caso es una combinación de varios ejemplos:

| Ejemplo | Aplicación en DONA |
|---------|-------------------|
| **Enterprise Chatbot** | Catálogo de Materiales Boto Mariani |
| **Customer Service** | Responder preguntas de precios |
| **Specialized Domain** | Construcción (precisión importante) |
| **Internal Assistant** | Manuales de procedimiento |

### Tu Knowledge Base:
```
DONA Knowledge Base:
├── Catálogo de materiales (productos, precios, stock)
├── Manuales de procedimiento
├── Información técnica de construcción
└── Políticas de la empresa
```

---

## Resumen del Capítulo 3

| Aplicación | Knowledge Base | Beneficio |
|------------|----------------|-----------|
| **Code Gen** | Tu repositorio | Código que encaja |
| **Enterprise** | Productos, políticas | Respuestas fundamentadas |
| **Healthcare/Legal** | Docs especializados | Precisión crítica |
| **Web Search** | Internet | Resúmenes útiles |
| **Personal** | Tus datos | Relevancia personal |

### Key Insight:

> "Siempre que tengas información que el LLM no conoce, hay potencial para RAG."

---

## Próximo: Arquitectura de RAG

Deep dive en cómo se estructura un sistema RAG.

---
