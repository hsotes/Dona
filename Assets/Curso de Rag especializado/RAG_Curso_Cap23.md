# Capítulo 23: Query Parsing

---

## El Problema

> "Los sistemas RAG a menudo se despliegan en contextos donde el usuario espera interactuar con un LLM de manera conversacional, como si estuviera chateando con otra persona."

### Resultado:

```
Prompts escritos por humanos = MALAS queries de búsqueda

En lugar de enviar esos prompts directamente a la Vector DB,
el retriever puede PARSEAR el prompt para:
├── Identificar su intención
├── Editar
├── Reescribir
└── Transformar completamente
```

---

## Técnica 1: Query Rewriting (La Más Usada)

### La idea:

```
Usar un LLM para REESCRIBIR la query
antes de enviarla al retriever.
```

### Ejemplo de prompt para el rewriter:

```
"El siguiente prompt fue enviado por un usuario para 
consultar una base de datos de documentos médicos 
que vinculan síntomas con diagnósticos.

Reescribí el prompt para optimizarlo para búsqueda:
- Clarificá frases ambiguas
- Usá terminología médica donde aplique
- Agregá sinónimos que aumenten chances de match
- Remové información innecesaria o distractora

[PROMPT DEL USUARIO]"
```

---

### Ejemplo Real:

#### Query original del usuario:

```
"I was out walking my dog, a beautiful black lab named Poppy, 
when she raced away from me and yanked on her leash hard 
while I was holding it. Three days later, my shoulder is 
still numb and my fingers are all pins and needles. 
What's going on?"
```

#### Problemas de esta query:

```
❌ Info irrelevante: nombre del perro, raza, que es "beautiful"
❌ Lenguaje coloquial: "yanked", "pins and needles"
❌ No usa terminología médica
❌ Difícil de matchear con documentos médicos técnicos
```

#### Query reescrita por LLM:

```
"Experienced a sudden forceful pull on the shoulder, 
resulting in persistent shoulder numbness and finger 
numbness for three days. What are the potential causes 
or diagnoses such as neuropathy or nerve impingement?"
```

#### Mejoras:

```
✅ Removió info irrelevante (perro, nombre, paseo)
✅ Clarificó la ambigüedad
✅ Usó terminología médica (neuropathy, nerve impingement)
✅ Estructura clara de síntomas
```

---

### Vale la pena el costo adicional:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Query Rewriting agrega:                              │
│   ├── Una llamada extra al LLM                         │
│   ├── Algo de latencia                                 │
│   └── Costo de API                                     │
│                                                         │
│   PERO los beneficios son SUSTANCIALES:                │
│   ├── Mucho mejor matching en retrieval                │
│   ├── Menos ruido en los resultados                    │
│   └── LLM final recibe mejor contexto                  │
│                                                         │
│   En general, los beneficios JUSTIFICAN fácilmente     │
│   el costo adicional.                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Técnica 2: Named Entity Recognition (NER)

### La idea:

```
Reconocer CATEGORÍAS de información en la query:
├── Lugares
├── Personas
├── Fechas
├── Personajes ficticios
├── Productos
└── etc.
```

### Uso:

```
La info extraída puede usarse para:
├── Informar el vector search
└── Configurar metadata filtering
```

### Ejemplo con GLiNER:

```python
from gliner import GLiNER

model = GLiNER.load("gliner_base")

text = "John Smith visited New York on January 15th 
        to meet Harry Potter author J.K. Rowling"

labels = ["person", "location", "date", "character", "book"]

entities = model.predict(text, labels)

# Resultado:
# [
#   {"text": "John Smith", "label": "person"},
#   {"text": "New York", "label": "location"},
#   {"text": "January 15th", "label": "date"},
#   {"text": "Harry Potter", "label": "character"},
#   {"text": "J.K. Rowling", "label": "person"}
# ]
```

### Beneficios:

```
✅ Modelo muy eficiente (puede correr en cada query)
✅ Mejora significativa en calidad de retrieval
❌ Agrega algo de latencia
```

---

## Técnica 3: HyDE (Hypothetical Document Embeddings)

### La idea:

```
Generar un DOCUMENTO HIPOTÉTICO que sería
el resultado IDEAL de la búsqueda.

Luego usar ESE documento para hacer la búsqueda.
```

### El problema que resuelve:

```
NORMALMENTE:
Query (pregunta) → Buscar → Documentos (respuestas)

El retriever intenta matchear TIPOS DIFERENTES de texto:
├── Query: "¿Qué causa entumecimiento en el hombro?"
└── Documento: "El pinzamiento nervioso puede causar..."

Es como comparar manzanas con naranjas.
```

### Con HyDE:

```
PASO 1: Query → LLM genera documento hipotético

Query: "¿Qué causa entumecimiento en el hombro?"

Documento hipotético generado:
"El entumecimiento del hombro puede ser causado por 
diversas condiciones. El pinzamiento nervioso ocurre 
cuando un nervio es comprimido, causando entumecimiento 
y hormigueo. La neuropatía también puede producir estos 
síntomas. Condiciones como el síndrome del túnel carpiano..."

PASO 2: Embeber el documento hipotético
        (no la query original)

PASO 3: Buscar documentos similares al hipotético
```

### Por qué funciona:

```
Ahora comparás:
├── Documento hipotético (generado)
└── Documentos reales (knowledge base)

Comparando naranjas con naranjas.
El retriever entiende no solo la INTENCIÓN
sino también cómo LUCE un resultado de calidad.
```

### Trade-off:

```
✅ Mejoras reales en performance
❌ Latencia adicional
❌ Costo computacional del LLM
```

---

## Comparación de Técnicas

| Técnica | Complejidad | Beneficio | Cuándo usar |
|---------|-------------|-----------|-------------|
| **Query Rewriting** | Baja | Alto | SIEMPRE (default) |
| **NER** | Media | Medio | Cuando metadata filtering importa |
| **HyDE** | Alta | Alto | Cuando precision es crítica |

---

## Recomendación

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   EN CASI TODOS LOS CASOS:                             │
│                                                         │
│   Basic Query Rewriting es suficiente.                 │
│                                                         │
│   Un LLM bien prompteado haciendo "touch-ups" básicos  │
│   en los prompts del usuario es el approach correcto.  │
│                                                         │
│   Técnicas avanzadas (NER, HyDE):                      │
│   ├── Pueden dar beneficios adicionales                │
│   ├── Más complejas de implementar                     │
│   ├── No necesariamente dan mejores resultados         │
│   └── Experimentá y dejá que los resultados decidan    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Query Rewriting para DONA:

```python
DONA_QUERY_REWRITER_PROMPT = """
El siguiente mensaje fue enviado por un cliente para 
consultar el catálogo de materiales de construcción.

Reescribí la consulta para optimizarla:
- Identificá el producto o tipo de producto buscado
- Usá nombres técnicos correctos de materiales
- Agregá sinónimos comunes (fierro/hierro, cemento/portland)
- Extraé especificaciones (medidas, marcas, cantidades)
- Remové saludos y texto conversacional

Query del usuario: {user_query}
"""
```

### Ejemplo para DONA:

```
QUERY ORIGINAL:
"Hola che, necesito algo para armar unas columnas, 
el fierro ese que viene en barras largas, creo que 
del 8 o del 10, no me acuerdo bien. Ah y también 
necesitaría estribos."

QUERY REESCRITA:
"Hierro/varilla de construcción para columnas, 
diámetro 8mm o 10mm. Estribos para armado de columnas."
```

### NER para DONA:

```python
# Entidades útiles para DONA
labels = ["producto", "medida", "marca", "cantidad", "uso"]

query = "Necesito 10 bolsas de cemento Loma Negra para la losa"

# Resultado:
# [
#   {"text": "10 bolsas", "label": "cantidad"},
#   {"text": "cemento", "label": "producto"},
#   {"text": "Loma Negra", "label": "marca"},
#   {"text": "losa", "label": "uso"}
# ]

# Esto puede informar metadata filtering:
# categoria="cementos", marca="Loma Negra"
```

### Flujo recomendado para DONA:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. Usuario envía mensaje conversacional              │
│      "Che, cuánto sale el fierro del 8?"               │
│                                                         │
│   2. Query Rewriting (LLM)                             │
│      "Precio hierro/varilla construcción 8mm"          │
│                                                         │
│   3. (Opcional) NER                                    │
│      producto: "hierro", medida: "8mm"                 │
│                                                         │
│   4. Hybrid Search con metadata filter                 │
│      categoria="hierros", activo=True                  │
│                                                         │
│   5. Resultados al LLM para respuesta final            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Resumen del Capítulo 23

| Técnica | Qué hace | Recomendación |
|---------|----------|---------------|
| **Query Rewriting** | LLM limpia y mejora la query | USAR SIEMPRE |
| **NER** | Identifica entidades (productos, fechas, etc.) | Opcional, útil para filtering |
| **HyDE** | Genera documento hipotético ideal | Solo si precision es crítica |

---

## Key Takeaway:

> "Tener algún tipo de query parsing es una pieza CLAVE de tu sistema RAG. En casi todos los casos, basic query rewriting es el approach correcto."

---

## Próximo: Re-ranking

Cómo mejorar el ranking de resultados después del retrieval inicial.

---
