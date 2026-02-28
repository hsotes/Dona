# Capítulo 10: Metadata Filtering

---

## ¿Qué es Metadata Filtering?

> "Metadata filtering es la técnica más directa y probablemente la más familiar usada dentro de un retriever."

### Definición:

```
METADATA FILTERING = Usar criterios RÍGIDOS para filtrar documentos
                     basándose en sus metadatos
```

### Metadatos típicos:

| Metadato | Ejemplo |
|----------|---------|
| Título | "Guía de Instalación Eléctrica" |
| Autor | "Juan Pérez" |
| Fecha de creación | 2024-06-15 |
| Categoría | "Electricidad" |
| Permisos de acceso | "Solo suscriptores" |
| Región | "Argentina" |

---

## Ejemplo: Archivo de un Periódico

### Knowledge Base:

```
┌─────────────────────────────────────────────────────────┐
│   ARTÍCULOS DEL PERIÓDICO (miles de documentos)        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Artículo 1:                                          │
│   ├── título: "Elecciones 2024"                        │
│   ├── fecha: 2024-06-15                                │
│   ├── autor: "María García"                            │
│   ├── sección: "Política"                              │
│   └── contenido: [texto completo]                      │
│                                                         │
│   Artículo 2:                                          │
│   ├── título: "Nuevo iPhone"                           │
│   ├── fecha: 2024-07-20                                │
│   ├── autor: "Carlos López"                            │
│   ├── sección: "Tecnología"                            │
│   └── contenido: [texto completo]                      │
│                                                         │
│   ... (miles más)                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Cómo Funciona (Similar a SQL)

### Filtro simple:

```sql
-- Todos los artículos de un día específico
WHERE fecha = '2024-06-15'

-- Todos los artículos de un autor
WHERE autor = 'María García'
```

### Filtro complejo:

```sql
-- Artículos de opinión, junio-julio 2024, por periodista favorito
WHERE sección = 'Opinión'
  AND fecha BETWEEN '2024-06-01' AND '2024-07-31'
  AND autor = 'María García'
```

> "Si alguna vez filtraste una tabla en Excel, ya hiciste metadata filtering."

---

## Uso en RAG: Refinar Resultados

### NO se usa para hacer el retrieval principal:

```
❌ INCORRECTO:
   Prompt → Metadata Filter → Documentos
   (no funciona porque ignora el contenido)

✅ CORRECTO:
   Prompt → Keyword/Semantic Search → Metadata Filter → Documentos
   (refina los resultados de otras técnicas)
```

### Los filtros NO vienen del prompt:

```
Los filtros usualmente vienen de ATRIBUTOS DEL USUARIO,
no de lo que escribió en el prompt.

Ejemplo:
├── ¿Es suscriptor pago? → Filtrar artículos premium
├── ¿En qué región está? → Filtrar por región
├── ¿De qué departamento es? → Filtrar docs internos
└── ¿Qué permisos tiene? → Filtrar por acceso
```

---

## Ejemplos de Uso Real

### Ejemplo 1: Contenido Pago vs Gratis

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Usuario NO suscriptor busca artículos               │
│                                                         │
│   Keyword/Semantic Search retorna:                     │
│   ├── Artículo A (gratis)                              │
│   ├── Artículo B (PAGO) ← excluir                     │
│   ├── Artículo C (gratis)                              │
│   └── Artículo D (PAGO) ← excluir                     │
│                                                         │
│   Después del Metadata Filter:                         │
│   ├── Artículo A (gratis) ✅                           │
│   └── Artículo C (gratis) ✅                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Ejemplo 2: Filtro por Región

```
Usuario en Argentina busca noticias

Metadata Filter: region = 'Argentina'

Solo ve artículos publicados en Argentina
(no ve artículos de España, México, etc.)
```

---

## Ventajas del Metadata Filtering

| Ventaja | Explicación |
|---------|-------------|
| **Simple** | Fácil de entender y debuggear |
| **Rápido** | Técnica madura y optimizada |
| **Criterios rígidos** | ÚNICO approach que garantiza exclusión estricta |

### El punto clave:

> "Si querés definir ESTRICTAMENTE qué documentos deben o no ser incluidos, metadata filtering es el ÚNICO approach que te da ese comportamiento."

---

## Limitaciones del Metadata Filtering

| Limitación | Explicación |
|------------|-------------|
| **No es búsqueda real** | Solo refina resultados de otras técnicas |
| **Muy rígido** | No hay "grados" de match |
| **Ignora contenido** | No sabe qué dice el documento |
| **No rankea** | Pasa o no pasa, no hay score |

### Por qué no puede usarse solo:

```
❌ Retriever SOLO con metadata filtering = INÚTIL

Porque no puede determinar si el CONTENIDO del documento
es relevante para el prompt del usuario.

Solo sabe metadatos (título, fecha, autor...)
pero NO sabe qué DICE el documento.
```

---

## Aplicación para DONA 🎯

### Metadatos útiles para tu catálogo:

| Metadato | Uso |
|----------|-----|
| **Categoría** | "hierros", "cementos", "eléctricos" |
| **Disponibilidad** | "en_stock", "sin_stock", "por_pedido" |
| **Sucursal** | "central", "norte", "sur" |
| **Tipo** | "material", "herramienta", "servicio" |
| **Proveedor** | "Acindar", "Loma Negra", etc. |

### Ejemplo de filtrado para DONA:

```python
# Usuario pregunta por hierros

# Keyword/Semantic encuentra docs relevantes
docs = search("hierro construcción precio")

# Metadata filter refina
docs_filtrados = filter(docs, where={
    "categoria": "hierros",
    "disponibilidad": "en_stock",
    "sucursal": usuario.sucursal
})
```

### ¿DONA tiene metadata filtering?

```
CHECKLIST:
□ ¿Cada producto tiene categoría?
□ ¿Filtrás por disponibilidad?
□ ¿Filtrás por sucursal si aplica?
□ ¿Excluís productos discontinuados?
```

---

## Resumen del Capítulo 10

| Aspecto | Metadata Filtering |
|---------|-------------------|
| **Qué hace** | Filtra por criterios rígidos |
| **Basado en** | Metadatos (no contenido) |
| **Uso en RAG** | Refinar resultados de otras búsquedas |
| **Ventaja única** | Exclusión ESTRICTA garantizada |
| **Limitación** | No puede usarse solo |

---

## Key Takeaway:

> "Metadata filtering es simple y efectivo, pero necesita ser combinado con otras técnicas de búsqueda para proveer valor real."

---

## Próximo: Keyword Search

Cómo buscar documentos basándose en las palabras exactas del prompt.

---
