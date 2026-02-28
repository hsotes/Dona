# Capítulo 21: Document Chunking

---

## ¿Qué es Chunking?

> "Chunking es la práctica de dividir documentos de texto largos de tu knowledge base en pedazos de texto más pequeños."

---

## Por Qué Hacer Chunking (3 Razones)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. LÍMITES DE EMBEDDING MODELS                       │
│      Muchos modelos tienen límites de texto            │
│      que pueden embeber en vectores.                   │
│                                                         │
│   2. MEJORA SEARCH RELEVANCY                           │
│      Chunks más pequeños = vectores más precisos       │
│      = mejor ranking de relevancia.                    │
│                                                         │
│   3. OPTIMIZA USO DEL CONTEXT WINDOW                   │
│      Solo enviás el texto MÁS relevante al LLM,        │
│      no documentos enteros.                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## El Problema Sin Chunking

### Ejemplo: Knowledge Base de 1,000 libros

```
SIN CHUNKING:
├── Cada libro → 1 vector
├── 1,000 vectores en total
│
├── PROBLEMA 1: Vector comprime TODO el libro
│   └── No puede representar temas específicos de un capítulo
│   └── "Promedia" todos los conceptos → representación borrosa
│
├── PROBLEMA 2: Retrieval trae LIBROS ENTEROS
│   └── Llena el context window del LLM inmediatamente
│
└── RESULTADO: Search relevancy muy pobre
```

```
CON CHUNKING:
├── Cada libro → dividido en párrafos
├── 1,000,000 vectores (1M párrafos)
│
├── VENTAJA 1: Cada vector representa UN concepto específico
│   └── Representación precisa y enfocada
│
├── VENTAJA 2: Retrieval trae párrafos relevantes
│   └── Usa el context window eficientemente
│
└── RESULTADO: Search relevancy mucho mejor
```

---

## El Balance del Chunk Size

### Chunks MUY GRANDES (ej: capítulos)

```
❌ PROBLEMAS:
├── Mismo problema que vectorizar libros enteros
├── Vector no captura significado matizado
└── Llena el context window rápidamente
```

### Chunks MUY PEQUEÑOS (ej: palabras)

```
❌ PROBLEMAS:
├── Vectores pierden todo el contexto
├── "cemento" sin saber si es portland, de contacto, etc.
└── Search relevancy también baja
```

### El Balance Correcto

```
✅ SWEET SPOT:
├── Párrafo o grupo de oraciones
├── Suficiente contexto para significado
├── No demasiado grande para el LLM
└── Típico: 200-500 caracteres
```

---

## Estrategia 1: Fixed Size Chunking

### El método más simple:

```
Documento: "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
Chunk size: 250 caracteres

Chunk 1: caracteres 1-250
Chunk 2: caracteres 251-500
Chunk 3: caracteres 501-750
...y así hasta el final
```

### El problema:

```
"...el cemento port|land es ideal para..."
                   ↑
           Corte en medio de palabra!

"...usar hierro del 8. | El precio actual..."
                       ↑
           Separa pensamiento cohesivo!
```

---

## Solución: Overlapping Chunks

### Chunks con solapamiento:

```
Chunk size: 250 caracteres
Overlap: 25 caracteres (10%)

Chunk 1: caracteres 1-250
Chunk 2: caracteres 226-475    ← empieza 25 antes
Chunk 3: caracteres 451-700    ← empieza 25 antes
...
```

### Visualización:

```
Documento:  |-------- Chunk 1 --------|
                              |-------- Chunk 2 --------|
                                                |-------- Chunk 3 --------|

Las palabras en los bordes aparecen en DOS chunks
→ Mayor probabilidad de tener contexto relevante
```

### Trade-off:

```
MÁS OVERLAP:
├── ✅ Mejor search relevancy
├── ✅ Menos cortes problemáticos
└── ❌ Más vectores redundantes en la DB

MENOS OVERLAP:
├── ✅ Menos vectores, menos storage
└── ❌ Más riesgo de cortes problemáticos
```

---

## Estrategia 2: Recursive Character Text Splitting

### Idea:

```
En lugar de cortar cada N caracteres,
cortar en CARACTERES ESPECÍFICOS que indican
estructura del documento.
```

### Ejemplo: Split en newline (\n)

```
Documento:
"Este es el primer párrafo sobre cemento.
                                          ← split aquí (\n)
Este es el segundo párrafo sobre hierro.
                                          ← split aquí (\n)
Este es el tercer párrafo sobre arena."

Chunk 1: "Este es el primer párrafo sobre cemento."
Chunk 2: "Este es el segundo párrafo sobre hierro."
Chunk 3: "Este es el tercer párrafo sobre arena."
```

### Ventajas:

```
✅ Respeta la estructura del documento
✅ Conceptos relacionados se mantienen juntos
✅ Chunks más semánticamente coherentes
```

### Desventaja:

```
❌ Chunks de tamaño variable
   └── Algunos muy grandes, otros muy pequeños
```

---

## Chunking por Tipo de Documento

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   HTML:                                                │
│   └── Split en <p>, <h1>, <h2>, <div>                 │
│                                                         │
│   PYTHON CODE:                                         │
│   └── Split en definiciones de funciones              │
│                                                         │
│   MARKDOWN:                                            │
│   └── Split en headers (##, ###)                      │
│                                                         │
│   TEXT:                                                │
│   └── Split en newlines (párrafos)                    │
│                                                         │
│   PDF:                                                 │
│   └── Split en páginas o secciones                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Metadata en Chunks

### Importante: Los chunks heredan metadata del documento fuente

```python
# Documento original
documento = {
    "titulo": "Manual de Cemento Portland",
    "categoria": "cementos",
    "fecha": "2024-01-15"
}

# Chunks heredan metadata + agregan ubicación
chunk_1 = {
    "texto": "El cemento portland tipo I...",
    "titulo": "Manual de Cemento Portland",  # heredado
    "categoria": "cementos",                  # heredado
    "fecha": "2024-01-15",                    # heredado
    "chunk_index": 0,                         # nuevo
    "page": 1                                 # nuevo
}
```

---

## Recomendación de Starting Point

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   CONFIGURACIÓN INICIAL RECOMENDADA:                   │
│                                                         │
│   Chunk size: ~500 caracteres                          │
│   Overlap: 50-100 caracteres (10-20%)                  │
│                                                         │
│   Después: ajustar según métricas de tu sistema        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Tipos de documentos en DONA:

```
1. FICHAS DE PRODUCTO (cortas):
   ├── Probablemente no necesitan chunking
   └── Ya son del tamaño correcto

2. MANUALES TÉCNICOS (largos):
   ├── Chunking por secciones
   ├── Cada sección = 1 chunk
   └── Heredar metadata del producto

3. CATÁLOGO COMPLETO:
   ├── Cada producto = 1 chunk
   └── Metadata: categoría, marca, código
```

### Ejemplo de chunking para DONA:

```python
# Configuración para productos
producto_chunking = {
    "strategy": "fixed_size",
    "chunk_size": 300,      # Productos suelen ser descripciones cortas
    "overlap": 50,
    "inherit_metadata": ["categoria", "marca", "codigo", "precio"]
}

# Configuración para manuales
manual_chunking = {
    "strategy": "recursive",
    "split_on": ["\n\n", "\n", ". "],  # Párrafos, líneas, oraciones
    "max_chunk_size": 500,
    "inherit_metadata": ["producto_id", "tipo_documento"]
}
```

### Checklist de chunking para DONA:

```
□ ¿Cada producto está en su propio chunk?
  → Evita mezclar info de diferentes productos

□ ¿Los chunks tienen metadata correcta?
  → categoria, codigo, marca para filtrar

□ ¿El tamaño es apropiado?
  → No muy grande (pierde precisión)
  → No muy chico (pierde contexto)

□ ¿Los manuales están bien divididos?
  → Por sección, no arbitrariamente
```

---

## Resumen del Capítulo 21

| Concepto | Explicación |
|----------|-------------|
| **Chunking** | Dividir docs grandes en pedazos pequeños |
| **Por qué** | Límites de embedding, mejor relevancy, optimizar context |
| **Fixed size** | Chunks de N caracteres |
| **Overlap** | Solapamiento para evitar cortes malos |
| **Recursive** | Split en caracteres estructurales (\n, etc.) |
| **Metadata** | Chunks heredan metadata del doc fuente |

---

## Key Takeaway:

> "Si buscás un buen starting point, usá chunks de tamaño fijo de ~500 caracteres con overlap de 50-100 caracteres."

---

## Próximo: Técnicas Avanzadas de Chunking

Semantic chunking y otras estrategias más sofisticadas.

---
