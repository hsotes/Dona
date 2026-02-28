# Capítulo 22: Técnicas Avanzadas de Chunking

---

## El Problema del Chunking Básico

> "Al dividir documentos en chunks más pequeños, también se arriesga a romper el texto de manera que pierde contexto relevante."

### Ejemplo:

```
Oración original:
"That night she dreamed, as she did often, 
 that she was finally an Olympic champion."

Si el chunk corta aquí:
"That night she dreamed... | ...that she was finally an Olympic champion."

Parece que YA ES campeona olímpica,
cuando en realidad está SOÑANDO con serlo.
```

> "Fixed size y recursive character splitting no proveen protección contra este tipo de problema."

---

## Técnica 1: Semantic Chunking

### La idea:

```
Agrupar oraciones en chunks si tienen SIGNIFICADO SIMILAR.
```

### El algoritmo:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. Empezar con la primera oración                    │
│                                                         │
│   2. Para cada oración siguiente:                      │
│      a) Vectorizar el chunk actual                     │
│      b) Vectorizar la oración siguiente                │
│      c) Calcular distancia entre vectores              │
│                                                         │
│   3. Si distancia < threshold:                         │
│      → Agregar oración al chunk actual                 │
│                                                         │
│   4. Si distancia > threshold:                         │
│      → Cortar chunk aquí                               │
│      → Empezar nuevo chunk con esta oración            │
│                                                         │
│   5. Repetir hasta terminar el documento               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Visualización:

```
Distancia entre chunk actual y siguiente oración:

Threshold ─────────────────────────────────────────
                    │              │
                    │              │    ╱╲
               ╱╲   │         ╱╲   │   ╱  ╲
          ╱╲  ╱  ╲  │    ╱╲  ╱  ╲  │  ╱    
     ╱╲  ╱  ╲╱    ╲ │   ╱  ╲╱    ╲ │ ╱     
────╱──╲╱──────────╲│──╱──────────╲│╱────────────
                    │              │
                 CORTE          CORTE
                   ↓              ↓
              Chunk 1        Chunk 2        Chunk 3
```

### Resultado:

```
✅ Chunks de tamaño variable
✅ Siguen el "hilo de pensamiento" del autor
✅ Si el autor hace una tangente → nuevo chunk
✅ Si el mismo tema cruza párrafos → mismo chunk
```

### Trade-off:

```
❌ Computacionalmente COSTOSO
   └── Vectorizar CADA oración de la knowledge base

✅ Alta calidad de retrieval
   └── Mejor precision y recall
```

---

## Técnica 2: LLM-Based Chunking

### La idea:

```
Darle el documento a un LLM con instrucciones
de cómo querés que cree los chunks.
```

### Ejemplo de prompt:

```
"Separá este documento en chunks basándote en el significado.
Mantené conceptos similares juntos en un chunk.
Separá el texto en nuevos chunks cuando se discutan nuevos temas."
```

### Características:

```
✅ MUY alta performance
✅ Flexible - podés dar instrucciones específicas
✅ Costos de LLM bajando → más viable económicamente

❌ "Black box" - difícil auditar
❌ Costoso en procesamiento
❌ Resultados pueden variar
```

---

## Técnica 3: Context-Aware Chunking

### La idea:

```
Usar un LLM para AGREGAR CONTEXTO a cada chunk,
explicando su rol en el documento más amplio.
```

### Ejemplo:

```
DOCUMENTO: Blog post sobre entrenamiento para maratón

CHUNK ORIGINAL (final del blog):
"Gracias a Juan Pérez, María García, 
 Pedro López, y todo el equipo de Nike."

PROBLEMA: Solo una lista de nombres, difícil de interpretar.

CHUNK CON CONTEXTO AGREGADO:
"[Este chunk contiene los agradecimientos finales 
del blog post sobre preparación para maratón. 
El autor agradece a sus entrenadores y sponsors.]

Gracias a Juan Pérez, María García, 
Pedro López, y todo el equipo de Nike."
```

### Beneficios del contexto agregado:

```
1. CUANDO SE VECTORIZA:
   └── El contexto mejora el embedding
   └── → Mejor search relevancy

2. CUANDO SE RECUPERA:
   └── El LLM entiende mejor el chunk
   └── → Mejor generación de respuesta
```

### Trade-off:

```
❌ Preprocessing costoso
   └── LLM debe procesar CADA documento y chunk

✅ Búsquedas más relevantes
✅ Sin impacto en velocidad de búsqueda
   └── El costo es una sola vez, no por query
```

---

## Comparación de Técnicas

| Técnica | Complejidad | Costo | Calidad | Cuándo usar |
|---------|-------------|-------|---------|-------------|
| **Fixed size + overlap** | Baja | Bajo | OK | Prototipos, default |
| **Recursive character** | Baja | Bajo | OK+ | Docs estructurados |
| **Semantic chunking** | Media | Alto | Alta | Cuando precision importa |
| **LLM-based** | Alta | Muy alto | Muy alta | Cuando presupuesto permite |
| **Context-aware** | Media | Alto | Alta+ | Primer upgrade a explorar |

---

## Recomendaciones de Uso

### Para empezar:

```
1. Fixed-size con overlap (500 chars, 10% overlap)
   └── Bueno para prototipos
   └── Baseline decente

2. Si necesitás mejorar:
   └── Context-aware chunking es buen primer paso
   └── Aplica sobre cualquier estrategia
   └── Mejora tanto search como generation
```

### Para producción:

```
1. Experimentar con subset pequeño de datos
2. Medir si técnicas avanzadas REALMENTE mejoran
3. Evaluar costo vs beneficio

NO es el objetivo usar la técnica más cutting-edge.
ES el objetivo entender qué opciones hay y cuáles
son apropiadas para TUS datos y TU sistema.
```

---

## Aplicación para DONA 🎯

### Análisis por tipo de documento:

```
FICHAS DE PRODUCTO (cortas):
├── Probablemente fixed-size es suficiente
├── Ya son semánticamente coherentes
└── Context-aware no agrega mucho valor

MANUALES TÉCNICOS (largos):
├── Semantic chunking puede ayudar
├── Secciones técnicas tienen temas claros
└── Context-aware útil para secciones ambiguas

CATÁLOGO GENERAL:
├── Fixed-size por producto
├── Metadata es más importante que chunking sofisticado
└── Filtrar por categoria > chunking avanzado
```

### Estrategia recomendada para DONA:

```
FASE 1 (MVP):
├── Fixed-size + overlap para todo
├── Metadata bien configurada
└── Evaluar métricas baseline

FASE 2 (Si es necesario):
├── Context-aware para manuales técnicos
├── Agregar resumen de sección a cada chunk
└── Medir si mejora precision/recall

FASE 3 (Si justifica el costo):
├── Semantic chunking para documentación compleja
├── Solo si métricas muestran problemas
└── Evaluar ROI del costo computacional
```

### Ejemplo de context-aware para manual:

```python
# Chunk original de manual de cemento
chunk = "Mezclar 3 partes de arena por 1 de cemento..."

# Con contexto agregado por LLM
chunk_con_contexto = """
[Contexto: Esta sección del Manual de Cemento Portland 
describe la proporción de mezcla para mortero de 
albañilería básico. Es parte del capítulo de 
"Aplicaciones Residenciales".]

Mezclar 3 partes de arena por 1 de cemento...
"""
```

---

## Resumen del Capítulo 22

| Técnica | Qué hace | Costo | Cuándo usar |
|---------|----------|-------|-------------|
| **Semantic** | Agrupa por significado similar | Alto | Precision crítica |
| **LLM-based** | LLM decide dónde cortar | Muy alto | Presupuesto alto |
| **Context-aware** | Agrega contexto a chunks | Alto | Primer upgrade |

---

## Key Takeaway:

> "El objetivo NO es implementar la técnica de chunking más cutting-edge del mercado. Es entender qué opciones están disponibles, qué tan adecuadas son para tus datos, y si los costos y beneficios hacen que valga la pena implementarlas en tu sistema."

---

## Próximo: Query Parsing

Cómo procesar y entender las queries de los usuarios.

---
