# MÓDULO 3: Vector Databases

---

## Overview del Módulo

### De la Teoría a Producción

> "Ahora que tenés una base sólida en information retrieval, es hora de mover toda esa teoría a producción."

---

## El Problema de Escala

### Con bases de datos tradicionales:

```
Pocos documentos:
├── Relational database funciona bien
├── Keyword search: OK
└── Semantic search: OK

MILLONES o BILLONES de documentos:
├── Las operaciones se vuelven MUY lentas
├── Especialmente las operaciones de VECTORES
└── Semantic search se vuelve impracticable
```

### La solución:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   VECTOR DATABASE                                      │
│                                                         │
│   Base de datos OPTIMIZADA para:                       │
│   ├── Almacenar enormes cantidades de vectores         │
│   └── Buscar a través de ellos RÁPIDAMENTE            │
│                                                         │
│   Por eso se han vuelto casi SINÓNIMO de RAG          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Por Qué Vector Databases

### El desafío de semantic search a escala:

```
Semantic Search sin Vector DB:

Para cada query:
├── Embeber el query → 1 vector
├── Comparar con CADA documento
│   └── Si tenés 1 millón de docs = 1 millón de comparaciones
└── Tiempo: INACEPTABLE

Semantic Search CON Vector DB:

Para cada query:
├── Embeber el query → 1 vector
├── Vector DB usa índices optimizados
│   └── Solo compara con vectores "cercanos"
└── Tiempo: milisegundos
```

---

## Lo Que Vas a Aprender en Este Módulo

| Tema | Descripción |
|------|-------------|
| **Vector Databases** | Por qué están optimizadas para retrieval |
| **Hands-on** | Ejecutar diferentes tipos de búsquedas |
| **Document Chunking** | Cómo dividir documentos grandes |
| **Query Parsing** | Procesar queries de usuarios |
| **Re-ranking** | Mejorar el ranking de resultados |

---

## Técnicas de Producción (Adelanto)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   TÉCNICAS AVANZADAS DE PRODUCCIÓN:                    │
│                                                         │
│   1. DOCUMENT CHUNKING                                 │
│      Documentos grandes → pedazos pequeños             │
│      (para que quepan en context window)               │
│                                                         │
│   2. QUERY PARSING                                     │
│      Procesar y entender el query del usuario          │
│      (extraer intención, keywords, etc.)               │
│                                                         │
│   3. RE-RANKING                                        │
│      Después del retrieval inicial, re-ordenar         │
│      con un modelo más sofisticado                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Escala actual de DONA:

```
Catálogo de Materiales Boto Mariani:
├── ¿Miles de productos?
├── ¿Descripciones largas?
├── ¿Manuales técnicos?
└── ¿Fichas de producto?
```

### Por qué vector database importa:

```
Si DONA crece:
├── Más productos
├── Más sucursales
├── Más documentación
└── Vector DB mantiene velocidad
```

### Técnicas críticas para DONA:

```
CHUNKING:
├── Fichas de producto → chunks individuales
├── Manuales → secciones separadas
└── Evitar mezclar info de diferentes productos

RE-RANKING:
├── Retriever trae 20 docs
├── Re-ranker selecciona los 5 mejores
└── Mejor precisión para el LLM
```

---

## Próximo: Por qué Vector DBs son tan Optimizadas

Deep dive en cómo funcionan las vector databases.

---
