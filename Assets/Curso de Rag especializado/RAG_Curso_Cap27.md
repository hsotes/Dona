# MÓDULO 4: LLMs para RAG

---

## Overview del Módulo

> "El retriever es una parte crítica de tu sistema RAG, pero el LLM es el verdadero cerebro de la operación."

---

## El Rol del LLM en RAG

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   RETRIEVER:                                           │
│   ├── Encuentra información útil                       │
│   └── Prepara el contexto                              │
│                                                         │
│   LLM:                                                 │
│   ├── USA esa información                              │
│   └── Genera respuesta de ALTA CALIDAD                 │
│                                                         │
│   Al final del día, es el LLM quien tiene que         │
│   USAR la información para generar una respuesta.      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Lo Que Vas a Aprender

| Tema | Descripción |
|------|-------------|
| **Cómo funcionan los LLMs** | Deep dive en la arquitectura transformer |
| **Construir llamadas a LLM** | Código para interactuar con LLMs |
| **Mejorar performance** | Técnicas específicas para RAG |
| **Grounding** | Asegurar que respuestas se basen en el contexto |
| **Técnicas avanzadas** | Pushing the limits del LLM |
| **Consejos prácticos** | Qué funciona en proyectos típicos |

---

## El Flujo que Vas a Construir

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. BASIC WORKFLOW                                    │
│      Llamadas básicas al LLM en código                 │
│                                                         │
│   2. AGREGAR ITERATIVAMENTE                            │
│      Técnicas para mejorar calidad                     │
│                                                         │
│   3. GROUNDING                                         │
│      Asegurar que respuestas se basen en retriever     │
│                                                         │
│   4. ADVANCED TECHNIQUES                               │
│      Pushing the limits                                │
│                                                         │
│   5. PRACTICAL ADVICE                                  │
│      Qué funciona en proyectos reales                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Por Qué Este Módulo es Importante

```
Hasta ahora:
├── Módulo 1: Fundamentos de RAG
├── Módulo 2: Cómo buscar documentos
└── Módulo 3: Cómo almacenar y recuperar a escala

Ahora:
├── Cómo hacer que el LLM USE bien esos documentos
├── Cómo evitar que el LLM invente cosas
└── Cómo obtener respuestas de alta calidad
```

---

## Aplicación para DONA 🎯

### El problema típico de DONA:

```
RETRIEVER funciona bien:
├── Encuentra el producto correcto
├── Trae el precio actualizado
└── Contexto relevante

PERO el LLM puede:
├── Ignorar el contexto y responder de memoria
├── Inventar precios
├── Mezclar información de diferentes productos
└── No citar fuentes
```

### Lo que vas a aprender a resolver:

```
1. Forzar al LLM a usar SOLO el contexto
2. Detectar cuando el LLM alucina
3. Estructurar el prompt para mejor grounding
4. Manejar casos donde no hay info suficiente
```

---

## Próximo: Arquitectura Transformer

Deep dive en cómo funcionan los LLMs internamente.

---
