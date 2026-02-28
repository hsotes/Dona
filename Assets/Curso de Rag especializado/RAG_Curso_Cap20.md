# Capítulo 20: Vector Databases en la Práctica

---

## ¿Qué es una Vector Database?

> "Una base de datos diseñada desde cero para almacenar datos vectoriales de alta dimensionalidad e implementar algoritmos orientados a vectores como ANN."

### Historia:

```
Crecieron en popularidad en los early 2020s:
├── Disponibilidad masiva de LLMs
├── Explosión de técnicas basadas en embeddings
└── Bases de datos relacionales = muy lentas para semantic search
    (performance cercana a KNN ineficiente)
```

### Optimizadas para:

```
├── Construir proximity graphs (HNSW)
├── Computar distancias entre vectores
├── Escalar bien
└── Operar significativamente más rápido
```

---

## Weaviate

### La Vector DB del curso:

```
WEAVIATE:
├── Open-source
├── Popular
├── Puede correr local o en cloud
└── Funcionalidad similar a otras Vector DBs
```

### Otras opciones en el mercado:

```
├── Pinecone
├── Milvus
├── Qdrant
├── Chroma
├── pgvector (PostgreSQL extension)
└── Muchas más...
```

> "Si elegís otra Vector DB para proyectos futuros, casi seguro proveerá funcionalidad muy similar."

---

## Pasos para Preparar una Vector DB

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. SET UP DATABASE                                   │
│      Crear instancia o conectar a existente            │
│                                                         │
│   2. LOAD DOCUMENTS                                    │
│      Cargar tus documentos en la DB                    │
│                                                         │
│   3. CREATE SPARSE VECTORS                             │
│      Para keyword search (automático)                  │
│                                                         │
│   4. CREATE DENSE VECTORS                              │
│      Para semantic search (embeddings)                 │
│                                                         │
│   5. CREATE INDEX                                      │
│      HNSW index para búsqueda rápida                  │
│                                                         │
│   → LISTO PARA BÚSQUEDAS                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Código en Weaviate

### Paso 1: Crear una Collection

```python
# Crear collection para artículos de noticias
client.collections.create(
    name="Article",
    properties=[
        Property(name="title", data_type=DataType.TEXT),
        Property(name="body", data_type=DataType.TEXT)
    ],
    # Especificar qué embedding model usar
    vectorizer_config=Configure.Vectorizer.text2vec_openai()
)
```

### Paso 2: Agregar Datos

```python
# Agregar documentos usando batch
collection = client.collections.get("Article")

with collection.batch as batch:
    for article in articles:
        batch.add_object(
            properties={
                "title": article["title"],
                "body": article["body"]
            }
        )
        # batch.add_object también:
        # - Cuenta errores
        # - Permite corregirlos después
        # - Puede romper el loop si hay muchos errores
```

---

### Paso 3: Ejecutar Búsquedas

#### Vector Search (Semantic):

```python
# Búsqueda semántica
collection = client.collections.get("Article")

response = collection.query.near_text(
    query="climate change impact",
    limit=3,
    return_metadata=MetadataQuery(distance=True)
)

# Retorna:
# - Top 3 documentos más similares semánticamente
# - Distancia entre query vector y document vector
```

#### Keyword Search (BM25):

```python
# Búsqueda por keywords
response = collection.query.bm25(
    query="renewable energy",
    limit=3
)

# Weaviate automáticamente crea el inverted index
# que permite mapear qué palabras se usan y con qué frecuencia
```

#### Hybrid Search:

```python
# Combinación de vector + keyword
response = collection.query.hybrid(
    query="sustainable technology",
    alpha=0.25,  # 25% vector, 75% keyword
    limit=3
)

# alpha controla el balance:
# alpha = 0.0 → 100% keyword
# alpha = 0.5 → 50/50
# alpha = 1.0 → 100% vector
```

> "En producción, esto es lo que la mayoría de las empresas usan porque permite balancear semantic similarity y strict keyword matching."

---

### Paso 4: Aplicar Filtros (Metadata)

```python
# Hybrid search con filtros
response = collection.query.hybrid(
    query="technology news",
    alpha=0.5,
    limit=3,
    filters=Filter.by_property("category").equal("tech")
)

# El filtro:
# - Revisa la property especificada
# - Si el valor matchea → pasa el filtro, puede retornarse
# - Si no matchea → NO se retorna
```

---

## El Loop Completo

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. CONFIGURE DATABASE                                │
│      └── Crear collections, especificar vectorizer     │
│                                                         │
│   2. LOAD & INDEX DATA                                 │
│      └── Insertar documentos, crear índices            │
│                                                         │
│   3. WRITE QUERY                                       │
│      └── Hybrid search + filters                       │
│                                                         │
│   4. GET RESULTS                                       │
│      └── Top K documentos para el LLM                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Parámetro Alpha en Hybrid Search

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ALPHA = 0.0                                          │
│   └── 100% Keyword Search                              │
│                                                         │
│   ALPHA = 0.25                                         │
│   └── 25% Vector + 75% Keyword                         │
│                                                         │
│   ALPHA = 0.5                                          │
│   └── 50% Vector + 50% Keyword (balanced)              │
│                                                         │
│   ALPHA = 0.75                                         │
│   └── 75% Vector + 25% Keyword                         │
│                                                         │
│   ALPHA = 1.0                                          │
│   └── 100% Vector Search                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Setup para el catálogo:

```python
# Collection para productos
client.collections.create(
    name="Producto",
    properties=[
        Property(name="nombre", data_type=DataType.TEXT),
        Property(name="descripcion", data_type=DataType.TEXT),
        Property(name="precio", data_type=DataType.NUMBER),
        Property(name="categoria", data_type=DataType.TEXT),
        Property(name="marca", data_type=DataType.TEXT),
        Property(name="disponibilidad", data_type=DataType.TEXT),
        Property(name="codigo", data_type=DataType.TEXT)
    ],
    vectorizer_config=Configure.Vectorizer.text2vec_openai()
)
```

### Query típico de DONA:

```python
# Usuario pregunta: "hierro del 8 acindar"
response = collection.query.hybrid(
    query="hierro del 8 acindar",
    alpha=0.5,  # Balance para encontrar nombre exacto + sinónimos
    limit=5,
    filters=Filter.by_property("disponibilidad").equal("en_stock")
)
```

### Experimentar con alpha:

```
Para DONA, probar:
├── alpha=0.3 → Más keyword (códigos exactos)
├── alpha=0.5 → Balanced
└── alpha=0.7 → Más semantic (preguntas vagas)

Medir con test set y elegir el mejor.
```

---

## Resumen del Capítulo 20

| Operación | Código Weaviate |
|-----------|-----------------|
| **Crear collection** | `client.collections.create()` |
| **Insertar datos** | `collection.batch.add_object()` |
| **Vector search** | `collection.query.near_text()` |
| **Keyword search** | `collection.query.bm25()` |
| **Hybrid search** | `collection.query.hybrid(alpha=0.5)` |
| **Con filtros** | `filters=Filter.by_property().equal()` |

---

## Key Takeaway:

> "En producción, la mayoría de las empresas usan **hybrid search** porque permite balancear la similitud semántica de vector search con el matching estricto de keyword search."

---

## Próximo: Document Chunking

Cómo dividir documentos grandes en pedazos manejables.

---
