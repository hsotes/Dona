# MÓDULO 2: Information Retrieval

---

## Overview del Módulo

### El Desafío del Retriever

> "El trabajo del retriever es fácil de describir: encontrar documentos que ayuden al LLM a responder. Pero si lo pensás... es un trabajo bastante difícil."

---

## Por Qué es Difícil

### Los usuarios NO envían SQL estructurado:

```
❌ Lo que NO recibís:
SELECT * FROM productos 
WHERE nombre LIKE '%cemento%' 
AND precio < 10000

✅ Lo que SÍ recibís:
"che cuanto me sale el cemento ese que viene en bolsas grandes"
```

### Los documentos son para HUMANOS, no computadoras:

```
Knowledge Base típica:
├── Emails personales
├── Memos internos de empresa
├── Artículos de journals médicos
├── Catálogos de productos
├── Manuales de procedimiento
└── Estructurados para que HUMANOS los lean
    (no para que computadoras los busquen)
```

---

## El Desafío Completo

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   INPUT:                                               │
│   • Queries en lenguaje natural (messy)                │
│   • Cualquier forma de preguntar                       │
│                                                         │
│   KNOWLEDGE BASE:                                      │
│   • Documentos estructurados para humanos              │
│   • Información rica pero desordenada                  │
│                                                         │
│   RETRIEVER DEBE:                                      │
│   • Manejar toda esta info messy                       │
│   • Encontrar lo MÁS RELEVANTE                         │
│   • En FRACCIONES DE SEGUNDO                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Lo que Vas a Aprender en este Módulo

| Tema | Descripción |
|------|-------------|
| **Técnicas de retrieval** | Cómo el retriever logra esta hazaña |
| **Teoría** | Cómo funciona cada técnica |
| **Fortalezas y debilidades** | Cuándo usar cada una |
| **Combinación** | Cómo usarlas juntas para mejores resultados |
| **Evaluación** | Cómo medir el performance del retriever |

---

## Las Técnicas que Vas a Ver

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. KEYWORD SEARCH (BM25)                             │
│      → Busca palabras exactas                          │
│                                                         │
│   2. SEMANTIC SEARCH (Embeddings)                      │
│      → Busca por significado                           │
│                                                         │
│   3. HYBRID SEARCH                                     │
│      → Combina ambas para mejores resultados           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

Este módulo es **CRÍTICO** para diagnosticar DONA:

```
Si DONA no encuentra el producto correcto...

¿Es problema de KEYWORD?
→ "hierro del 8" no matchea con "varilla Ø8mm"

¿Es problema de SEMANTIC?
→ No entiende que "fierro" = "hierro"

¿Necesitás HYBRID?
→ Combinar ambos para mejor cobertura
```

---

## Próximo: Primera técnica de retrieval

Deep dive en cómo buscar documentos relevantes.

---
