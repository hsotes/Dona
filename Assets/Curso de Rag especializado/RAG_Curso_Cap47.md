# Capítulo 47: Multimodal RAG

---

## Más Allá del Texto

> "A lo largo de este curso, viste sistemas RAG construidos sobre datos de texto, pero hoy en día, la información se guarda en una ENORME variedad de formatos."

---

## El Problema

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Información valiosa está en:                         │
│   ├── Slide decks (presentaciones)                     │
│   ├── PDFs                                             │
│   ├── Imágenes                                         │
│   ├── Audio                                            │
│   └── Video                                            │
│                                                         │
│   Idealmente querés incluir TODO esto en tu            │
│   knowledge base y hacerlo disponible para tu LLM.     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ¿Qué es un Modelo Multimodal?

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Un modelo diseñado para manejar MÚLTIPLES            │
│   tipos de datos.                                      │
│                                                         │
│   COMBINACIONES COMUNES:                               │
│   ├── Texto + Imágenes (más común)                    │
│   ├── Texto + Audio                                   │
│   └── Texto + Video                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Sistema RAG Multimodal Típico

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ACEPTA:                                              │
│   ├── Prompts de texto                                │
│   └── Prompts de imágenes                             │
│                                                         │
│   KNOWLEDGE BASE contiene:                             │
│   ├── Documentos de texto                             │
│   └── Archivos de imagen                              │
│                                                         │
│   GENERA:                                              │
│   └── Respuestas de texto                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Componentes que Necesitan Upgrade

```
Para habilitar multimodal:

1. EMBEDDING MODEL → Multimodal embedding model
2. LLM → Language Vision Model (LVM)
```

---

## Multimodal Embedding Models

### Cómo funcionan:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Embeben MÚLTIPLES formatos en el MISMO vector space. │
│                                                         │
│   EJEMPLO:                                             │
│   ├── Palabra "dog" → vector cercano a                │
│   ├── Palabra "puppy" → vector cercano a              │
│   └── IMAGEN de un perro → vector cercano también!    │
│                                                         │
│   ├── Palabra "tree" → vector en otra zona           │
│   └── IMAGEN de un árbol → vector cercano a "tree"   │
│                                                         │
│   Items con significados similares quedan CERCA,       │
│   sin importar si son texto o imágenes.               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Visualización:

```
VECTOR SPACE:

    "dog" ○ ○ "puppy"
           ○ [imagen perro]
           
                            "tree" ○
                                   ○ [imagen árbol]
                                   
    "car" ○ ○ [imagen auto]
```

---

## Retrieval Multimodal

### Funciona de manera muy familiar:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. Embeber imágenes Y texto de knowledge base        │
│      en el mismo vector space                          │
│                                                         │
│   2. Cuando llega un prompt (texto O imagen):          │
│      Usar el mismo modelo multimodal para embeber      │
│                                                         │
│   3. Vector search como siempre:                       │
│      Retornar imágenes O documentos más cercanos       │
│                                                         │
│   4. Agregar al augmented prompt                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Language Vision Models (LVM)

### Procesando imágenes en LLMs:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Las imágenes deben ser TOKENIZADAS:                  │
│                                                         │
│   1. Dividir imagen en PATCHES (cuadrados)             │
│   2. Cada patch = un token                             │
│                                                         │
│   CANTIDAD DE TOKENS:                                  │
│   ├── Baja resolución: ~100 tokens                    │
│   └── Alta resolución: ~1000 tokens                   │
│                                                         │
│   Lo importante: Tanto imágenes como texto se          │
│   convierten en SECUENCIA DE TOKENS.                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Cómo funciona el LVM:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. Recibe secuencia multimodal de tokens             │
│      (texto + imágenes tokenizadas)                    │
│                                                         │
│   2. Pasa por TRANSFORMER                              │
│      Desarrolla entendimiento de texto, imágenes,      │
│      Y sus RELACIONES                                  │
│                                                         │
│   3. Genera tokens de TEXTO como output                │
│      (respondiendo al prompt inicial)                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Arquitectura Multimodal RAG

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   User Prompt (texto O imagen)                         │
│          │                                              │
│          ▼                                              │
│   Multimodal Embedding Model                           │
│          │                                              │
│          ▼                                              │
│   Vector Search                                        │
│   (busca en texto E imágenes)                          │
│          │                                              │
│          ▼                                              │
│   Retrieved: docs + imágenes                           │
│          │                                              │
│          ▼                                              │
│   Augmented Prompt                                     │
│   (texto + imágenes tokenizadas)                       │
│          │                                              │
│          ▼                                              │
│   Language Vision Model                                │
│          │                                              │
│          ▼                                              │
│   Text Response                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Manejo de PDFs y Slides

### El beneficio:

```
Actualizar RAG para manejar imágenes permite
ingerir formatos comunes que se convierten fácilmente
a imágenes:

├── Slides de presentaciones
└── PDFs
```

### El desafío:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PDFs y slides son MUY DENSOS en información:         │
│                                                         │
│   Una sola página puede contener:                      │
│   ├── Texto                                            │
│   ├── Charts                                           │
│   ├── Captions                                         │
│   └── Imágenes                                         │
│                                                         │
│   Un SOLO vector no puede capturar todo el matiz       │
│   de una página de PDF.                                │
│                                                         │
│   = Necesitás CHUNKEAR tus imágenes                    │
│     igual que chunkeás texto.                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Estrategias de Chunking de Imágenes

### Approach inicial (sofisticado):

```
Detectar diferentes porciones de la página PDF:
├── ¿Cuál es un chart?
├── ¿Cuál es una imagen?
├── ¿Cuál es texto?

PROBLEMA: Técnicas todavía son ERROR-PRONE y finicky.
```

### Approach nuevo: PDF RAG (grid-based)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   IDEA SIMPLE:                                         │
│   Dividir cada página en un GRID DE CUADRADOS          │
│   sin preocuparse si los límites caen en lugares       │
│   sensibles.                                           │
│                                                         │
│   ┌───┬───┬───┬───┐                                   │
│   │ 1 │ 2 │ 3 │ 4 │                                   │
│   ├───┼───┼───┼───┤                                   │
│   │ 5 │ 6 │ 7 │ 8 │                                   │
│   ├───┼───┼───┼───┤                                   │
│   │ 9 │10 │11 │12 │                                   │
│   └───┴───┴───┴───┘                                   │
│                                                         │
│   Cada cuadrado se embebe con el modelo multimodal.    │
│   Una página = ~1000 vectores (no 1)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Cómo funciona el retrieval (similar a ColBERT):

```
1. Cada PALABRA del prompt busca su mejor matching CUADRADO
2. Sumar scores de todos los matches
3. = Score total de la página

VENTAJAS:
├── Muy FLEXIBLE (cualquier imagen se puede dividir)
├── Buen PERFORMANCE en retrieval
└── No necesita detectar qué es qué en la página

DESVENTAJA:
├── Requiere almacenar MASIVA cantidad de vectores
```

---

## Estado Actual de Multimodal RAG

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   CUTTING-EDGE technology con desarrollo RÁPIDO        │
│                                                         │
│   LANGUAGE VISION MODELS:                              │
│   ├── GPT-4V, GPT-4o                                  │
│   ├── Claude con visión                               │
│   ├── Gemini                                          │
│   └── LLaVA, etc.                                     │
│   → Disponibles de la mayoría de providers            │
│                                                         │
│   MULTIMODAL EMBEDDING MODELS:                         │
│   ├── CLIP                                            │
│   ├── BLIP                                            │
│   ├── SigLIP                                          │
│   └── Otros                                           │
│   → Relativamente más EXPERIMENTALES                  │
│                                                         │
│   Vector DBs están implementando tools para            │
│   habilitar este tipo de retrieval multimodal.         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Casos de uso multimodal para DONA:

```python
DONA_MULTIMODAL_CASES = {
    "product_images": {
        "use_case": "Cliente sube foto de material que busca",
        "example": "[foto de un tipo de baldosa]",
        "response": "Buscar productos similares en catálogo"
    },
    
    "pdf_catalogs": {
        "use_case": "Catálogos de proveedores en PDF",
        "example": "PDF de Weber con todos sus productos",
        "response": "Hacer searchable toda la info del catálogo"
    },
    
    "technical_sheets": {
        "use_case": "Fichas técnicas de productos",
        "example": "PDF con especificaciones de cemento",
        "response": "Responder preguntas técnicas precisas"
    },
    
    "measurement_photos": {
        "use_case": "Cliente sube foto de espacio a calcular",
        "example": "[foto de habitación]",
        "response": "Estimar materiales necesarios"
    }
}
```

### Implementación básica para DONA:

```python
# Con un LVM como GPT-4V

def dona_multimodal_query(query, image=None):
    """
    Manejar queries con o sin imagen
    """
    
    if image:
        # Embeber imagen con modelo multimodal
        image_embedding = multimodal_embed(image)
        
        # Buscar productos similares visualmente
        similar_products = vector_db.search(
            vector=image_embedding,
            collection="product_images"
        )
        
        # Agregar al contexto
        context = format_products(similar_products)
        
    else:
        # Búsqueda normal de texto
        context = retrieve_text_chunks(query)
    
    # Generar respuesta con LVM
    response = lvm.generate(
        prompt=query,
        images=[image] if image else [],
        context=context
    )
    
    return response

# Ejemplo de uso
response = dona_multimodal_query(
    query="Busco baldosas parecidas a esta",
    image=uploaded_image
)
```

### PDF RAG para catálogos de DONA:

```python
def ingest_supplier_catalog(pdf_path):
    """
    Ingestar catálogo PDF de proveedor
    usando grid-based approach
    """
    
    pages = pdf_to_images(pdf_path)
    
    for page_num, page_image in enumerate(pages):
        # Dividir en grid
        squares = split_into_grid(page_image, grid_size=10)  # 10x10
        
        for square_idx, square in enumerate(squares):
            # Embeber cada cuadrado
            embedding = multimodal_embed(square)
            
            # Guardar con metadata
            vector_db.insert(
                vector=embedding,
                metadata={
                    "source": pdf_path,
                    "page": page_num,
                    "square": square_idx,
                    "type": "pdf_chunk"
                }
            )
    
    print(f"Ingested {len(pages) * 100} vectors from {pdf_path}")
```

---

## Resumen del Capítulo 47

| Componente | Tradicional | Multimodal |
|------------|-------------|------------|
| **Embedding Model** | Text-only | Multimodal (texto + imágenes) |
| **LLM** | Text-only | Language Vision Model |
| **Knowledge Base** | Documentos de texto | Texto + Imágenes + PDFs |
| **Prompts** | Solo texto | Texto y/o imágenes |

---

## Key Takeaways:

```
1. MULTIMODAL = manejar múltiples tipos de datos
   (texto + imágenes principalmente)

2. MULTIMODAL EMBEDDING MODEL:
   Embebe texto e imágenes en el MISMO vector space

3. LANGUAGE VISION MODEL:
   LLM que puede procesar imágenes tokenizadas

4. PDF RAG (grid-based):
   Dividir páginas en grid de cuadrados
   = ~1000 vectores por página (flexible pero storage-heavy)

5. CUTTING-EDGE pero cada vez más accesible
   → Vector DBs implementando soporte
   → Esperar progreso continuo
```

---

## Próximo: Wrap-up del Módulo 5

Resumen de todo lo aprendido sobre producción.

---
