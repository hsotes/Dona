# Capítulo 19: Algoritmos de Vector Search

---

## El Problema de Escala

> "Si se implementa ingenuamente, vector search escala muy mal, requiriendo recursos computacionales significativos y agregando latencia al sistema."

---

## K-Nearest Neighbors (KNN)

### El algoritmo más simple:

```
1. Crear embedding para cada documento
2. Crear embedding para el prompt
3. Calcular distancia entre prompt y CADA documento
4. Ordenar por distancia
5. Retornar los K más cercanos
```

### El problema:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   KNN ESCALA TERRIBLEMENTE                             │
│                                                         │
│   El número de cálculos crece LINEALMENTE              │
│   con el número de documentos.                         │
│                                                         │
│   1,000 documentos → 1,000 cálculos de distancia       │
│   1,000,000 documentos → 1,000,000 cálculos            │
│   1,000,000,000 documentos → 1,000,000,000 cálculos    │
│                                                         │
│   La segunda búsqueda será UN MILLÓN de veces          │
│   más lenta que la primera.                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Approximate Nearest Neighbors (ANN)

### La solución:

> "Familia de algoritmos que usan estructuras de datos inteligentes para búsquedas significativamente más rápidas."

### El trade-off:

```
KNN: Garantiza encontrar los MÁS cercanos
     Pero muy lento

ANN: No garantiza los ABSOLUTOS más cercanos
     Pero encuentra vectores MUY cercanos
     Y es MUCHO más rápido
```

---

## Navigable Small World (NSW)

### Paso 1: Construir el Proximity Graph

```
ANTES de cualquier búsqueda:

1. Calcular distancia entre CADA par de vectores
2. Crear un NODO por cada documento
3. Crear EDGES entre cada documento y sus vecinos más cercanos

Resultado: Estructura tipo red/web
```

### Visualización del Proximity Graph:

```
        • doc1 ─────── • doc2
       / \              |
      /   \             |
     /     \            |
    • doc3   • doc4 ───• doc5
     \      /     \    /
      \    /       \  /
       \  /         \/
        • doc6 ───── • doc7
        
Cada documento conectado a sus vecinos más cercanos
```

---

### Paso 2: Búsqueda en el Graph

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. Recibir prompt → crear query vector               │
│                                                         │
│   2. Elegir punto de entrada ALEATORIO                 │
│      (no asume que está cerca del prompt)              │
│                                                         │
│   3. Mirar los VECINOS del nodo actual                 │
│      (pocos vecinos = muy rápido)                      │
│                                                         │
│   4. ¿Cuál vecino está MÁS CERCA del prompt?          │
│      → Ese se vuelve el nuevo candidato                │
│                                                         │
│   5. REPETIR paso 3-4                                  │
│                                                         │
│   6. PARAR cuando ningún vecino está más cerca         │
│      que el candidato actual                           │
│                                                         │
│   7. Retornar el candidato final                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Ejemplo visual:

```
Query vector: ★

Paso 1: Entrada aleatoria en doc1
        doc1 • ─────── • doc2
             │
             │  ★ (query está por acá)
             │
        doc3 • ─────── • doc4

Paso 2: Vecinos de doc1: doc2, doc3
        doc3 está más cerca de ★ → moverse a doc3

Paso 3: Vecinos de doc3: doc1, doc4
        doc4 está más cerca de ★ → moverse a doc4

Paso 4: Vecinos de doc4: doc3, doc5
        Ninguno más cerca → RETORNAR doc4
```

---

### Por qué no es perfecto pero funciona:

```
❌ Puede que exista un documento MÁS cercano
   que el algoritmo nunca alcanza
   (porque no puede elegir el path óptimo global,
    solo el mejor en cada momento)

✅ En la práctica encuentra vectores MUY cercanos
✅ MUCHO más rápido que KNN
```

---

## HNSW: Hierarchical Navigable Small World

### La mejora sobre NSW:

> "Agrega capas jerárquicas para acelerar significativamente las primeras partes de la búsqueda."

### Estructura jerárquica:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   LAYER 3 (top): Solo 10 vectores                      │
│   ┌─────────────────────────────────────┐              │
│   │    •       •       •                │              │
│   │      \   /   \   /                  │              │
│   │       • ───── •                     │              │
│   └─────────────────────────────────────┘              │
│                    ↓                                    │
│   LAYER 2: 100 vectores                                │
│   ┌─────────────────────────────────────┐              │
│   │  • • •   • • •   • • •   • •       │              │
│   │   \|/     \|/     \|/     \/       │              │
│   │    •       •       •      •        │              │
│   └─────────────────────────────────────┘              │
│                    ↓                                    │
│   LAYER 1 (bottom): TODOS los 1000 vectores           │
│   ┌─────────────────────────────────────┐              │
│   │  ••••••••••••••••••••••••••••••••  │              │
│   │  ••••••••••••••••••••••••••••••••  │              │
│   │  ••••••••••••••••••••••••••••••••  │              │
│   └─────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Cómo funciona la búsqueda HNSW:

```
1. EMPEZAR en Layer 3 (solo 10 vectores)
   ├── Elegir entrada aleatoria
   ├── Navegar hasta encontrar mejor candidato
   └── SALTOS GRANDES hacia el vecindario correcto

2. BAJAR a Layer 2 (100 vectores)
   ├── Empezar desde el mejor de Layer 3
   ├── Navegar para encontrar mejor candidato
   └── Refinando la ubicación

3. BAJAR a Layer 1 (TODOS los vectores)
   ├── Empezar desde el mejor de Layer 2
   ├── Ya estamos MUY CERCA del prompt
   └── Navegar para encontrar el mejor final

4. RETORNAR el candidato final
```

---

### Por qué HNSW es tan eficiente:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   CAPAS SUPERIORES:                                    │
│   ├── Pocos vectores                                   │
│   ├── Saltos GRANDES                                   │
│   └── Llegan rápido al "vecindario" correcto          │
│                                                         │
│   CAPA INFERIOR:                                       │
│   ├── Todos los vectores                               │
│   ├── PERO ya empezás muy cerca del prompt            │
│   └── Solo refinamiento final                          │
│                                                         │
│   COMPLEJIDAD:                                         │
│   KNN:  O(n) - lineal                                  │
│   HNSW: O(log n) - logarítmica                        │
│                                                         │
│   1 billón de vectores:                                │
│   KNN:  1,000,000,000 comparaciones                   │
│   HNSW: ~30 comparaciones                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Resumen de Algoritmos

| Algoritmo | Velocidad | Precisión | Uso |
|-----------|-----------|-----------|-----|
| **KNN** | Muy lento (O(n)) | Perfecta | Solo para datasets pequeños |
| **NSW** | Rápido | Aproximada | Datasets medianos |
| **HNSW** | Muy rápido (O(log n)) | Aproximada | Producción a escala |

---

## Key Takeaways

### 1. ANN es significativamente más rápido que KNN

```
Permite vector search a escala de BILLONES de vectores
con solo unos cientos de milisegundos de latencia.
```

### 2. No garantiza los matches absolutos mejores

```
Pero encuentra vectores MUY cercanos.
El trade-off vale la pena para la velocidad.
```

### 3. Depende de construir un buen Proximity Graph

```
Proceso computacionalmente intensivo
PERO se puede pre-computar antes de recibir queries.
```

---

## Aplicación para DONA 🎯

### No necesitás implementar esto:

```
Las Vector Databases (Weaviate, Pinecone, etc.)
implementan HNSW internamente.

Solo necesitás:
├── Elegir una Vector DB
├── Cargar tus documentos
└── Ejecutar queries
```

### Lo que SÍ necesitás entender:

```
1. El retrieval es APROXIMADO (no perfecto)
   → Por eso usamos hybrid search

2. El índice se construye UNA VEZ
   → Agregar documentos puede requerir re-indexar

3. Más capas = más rápido pero más memoria
   → Trade-off a configurar
```

---

## Próximo: Herramientas para Implementar Vector Search

Vector Databases en la práctica.

---
