# Capítulo 43: Quantization - Compresión para LLMs y Vectores

---

## Los Trade-offs de Producción

> "Una vez que podés evaluar tu sistema RAG y experimentar con diferentes configuraciones, vas a estar listo para enfrentar trade-offs familiares en muchos proyectos de software: Costo, Velocidad, y Calidad."

---

## ¿Qué es Quantization?

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   QUANTIZATION = Compresión para LLMs y Vectores       │
│                                                         │
│   Reemplaza:                                           │
│   ├── Model weights en LLMs                            │
│   └── Valores en embedding vectors                     │
│                                                         │
│   Con tipos de datos de MENOR PRECISIÓN (comprimidos). │
│                                                         │
│   RESULTADO:                                           │
│   ├── Más pequeños                                     │
│   ├── Más baratos                                      │
│   ├── Más rápidos                                      │
│   └── Con poca pérdida de calidad                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Analogía: Compresión de Imágenes

```
IMAGEN ORIGINAL (24 bits/pixel):
└── Colores perfectos
└── Mucha data

IMAGEN COMPRIMIDA (12 bits/pixel):
└── 50% del tamaño
└── Calidad aceptable

IMAGEN MUY COMPRIMIDA (6 bits/pixel):
└── 25% del tamaño
└── Artifacts visibles

Dependiendo del uso, la pérdida de calidad
puede valer el ahorro de memoria.
```

---

## Quantization de LLMs

### El problema:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Parámetros típicos de LLM: 16 bits cada uno          │
│                                                         │
│   Modelos modernos:                                    │
│   ├── 1 billion → 1 trillion parámetros               │
│   ├── = ENORMES                                        │
│   ├── Mucha memoria para guardarlos                    │
│   └── GPUs potentes para correrlos                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### La solución:

```
QUANTIZED LLMs:
16-bit → 8-bit o 4-bit

BENEFICIOS:
├── Reduce GPU memory significativamente
├── Modelos corren más rápido
└── Pequeña pérdida de calidad

EJEMPLO:
Llama 70B en 16-bit: ~140GB VRAM
Llama 70B en 4-bit:  ~35GB VRAM (4x menos!)
```

---

## Quantization de Embedding Vectors

### El problema:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Vector típico de 768 dimensiones:                    │
│   768 × 32-bit floats = 3KB por vector                │
│                                                         │
│   Modelos de más dimensiones: muchos más KB           │
│                                                         │
│   Con MILLONES o BILLONES de vectores:                │
│   = CANTIDADES ENORMES de data                        │
│                                                         │
│   Vectores necesitan estar en RAM para búsqueda       │
│   rápida = CARO                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Integer Quantization (8-bit):

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   32-bit float → 8-bit integer                         │
│                                                         │
│   RESULTADO: Vectores son 1/4 del tamaño original     │
│                                                         │
│   = AHORRO MASIVO de espacio                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Cómo funciona:

```
PASO 1: Encontrar min y max de cada dimensión
        (define el rango de valores)

PASO 2: Dividir el rango en 256 secciones
        (256 = cantidad de valores con 8 bits)

PASO 3: Numerar secciones 0, 1, 2, ... 255

PASO 4: Asignar a cada float original
        el número de la sección donde cae

PASO 5: Guardar min y width de cada sección
        para poder reconstruir aproximación

RESULTADO:
Original: 3.14159 (32 bits)
Quantized: 47 (8 bits) + metadata
```

### Performance de 8-bit:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   A pesar de usar solo 1/4 de la data                  │
│   y un algoritmo de compresión "naive":                │
│                                                         │
│   8-bit integer quantization funciona MUY BIEN         │
│                                                         │
│   Recall@K: Solo baja unos pocos puntos porcentuales   │
│                                                         │
│   BENEFICIOS:                                          │
│   ├── Menos data en vector database                   │
│   ├── Búsqueda más rápida                              │
│   └── Cálculos simplificados                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Binary Quantization (1-bit)

### Compresión extrema:

```
32-bit float → 1-bit

= Compresión de 32x (!)

Cada valor en el vector es solo 1 o 0
(indica si el valor original era positivo o negativo)
```

### Trade-offs:

```
✅ VENTAJAS:
├── Vectores 32x más pequeños
├── Retrieval significativamente más rápido
└── Muchísimo ahorro de memoria

❌ DESVENTAJAS:
├── Performance puede caer notablemente
└── Pérdida de información significativa
```

### Técnica combinada:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. RETRIEVAL INICIAL: Con 1-bit vectors (rápido)    │
│   2. RESCORING: Con 32-bit originales (preciso)       │
│                                                         │
│   = Lo mejor de ambos mundos                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Matryoshka Embedding Models

### La idea (como muñecas rusas):

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Vectores diseñados para usar SOLO UN SUBCONJUNTO    │
│   de las dimensiones.                                  │
│                                                         │
│   Vector de 1000 dimensiones:                          │
│   ├── Podés usar solo las primeras 500                │
│   ├── O solo las primeras 100                         │
│   └── O el vector completo                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Por qué funciona:

```
MODELO TÍPICO:
Cada dimensión tiene ~igual varianza (información)

MODELO MATRYOSHKA:
Dimensiones ORDENADAS por densidad de información

├── Dimensiones tempranas: MÁS varianza = MÁS información
└── Dimensiones tardías: MENOS varianza = MENOS información

→ Podés excluir dimensiones tardías con menor penalidad
```

### Usos:

```
OPCIÓN 1: Siempre usar primeras 100 dims
├── Ahorro de espacio
├── Cálculos más rápidos
└── Preserva máxima información posible

OPCIÓN 2: Retrieval + Rescoring
├── Initial retrieval: primeras 100 dims (rápido)
├── Pull remaining 900 dims de memoria más lenta
└── Rescore con todas 1000 dims (preciso)

IDEAL PARA:
Ambientes dinámicos donde querés cambiar rápidamente
entre representaciones de baja y alta fidelidad.
```

---

## Resumen de Técnicas de Quantization

| Técnica | Compresión | Calidad | Uso |
|---------|------------|---------|-----|
| **8-bit Integer** | 4x | Alta | Uso general, recomendado |
| **4-bit Integer** | 8x | Media-Alta | LLMs, balance |
| **1-bit Binary** | 32x | Media | Initial retrieval + rescore |
| **Matryoshka** | Variable | Variable | Ambientes dinámicos |

---

## El Takeaway Principal

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   DEBERÍAS EXPERIMENTAR con quantization:              │
│                                                         │
│   ├── LLMs quantizados (8-bit, 4-bit)                 │
│   └── Embedding vectors quantizados                    │
│                                                         │
│   La mayoría de proveedores ofrecen modelos            │
│   quantizados junto a los base.                        │
│                                                         │
│   AHORROS de espacio y costo: SIGNIFICATIVOS           │
│   REDUCCIONES de calidad: PEQUEÑAS                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Dónde aplicar quantization en DONA:

```python
DONA_QUANTIZATION_OPTIONS = {
    "embedding_model": {
        "full_precision": "768 dims × 32-bit = 3KB/vector",
        "8-bit_quantized": "768 dims × 8-bit = 768B/vector (4x menos)",
        "recommendation": "Empezar con 8-bit, medir recall"
    },
    
    "llm": {
        "full_precision": "gpt-4 via API (no aplica)",
        "self_hosted": {
            "llama_70b_16bit": "~140GB VRAM",
            "llama_70b_8bit": "~70GB VRAM",
            "llama_70b_4bit": "~35GB VRAM"
        },
        "recommendation": "Si self-hosted, probar 8-bit primero"
    },
    
    "vector_database": {
        "weaviate": "Soporta PQ y BQ",
        "pinecone": "Soporta quantization",
        "recommendation": "Habilitar si >1M vectores"
    }
}
```

### Cálculo de ahorro para DONA:

```
ESCENARIO: Catálogo de 100,000 productos

SIN QUANTIZATION:
100,000 × 3KB = 300MB de vectores
(necesitan estar en RAM para búsqueda rápida)

CON 8-BIT QUANTIZATION:
100,000 × 768B = 75MB de vectores
= 75% AHORRO de memoria

CON BINARY (1-bit):
100,000 × 96B = 9.6MB de vectores
= 97% AHORRO (pero menor recall)
```

### Estrategia recomendada para DONA:

```
FASE 1 (MVP):
├── Full precision embeddings
├── API-based LLM (no necesita quantization)
└── Evaluar baseline de calidad

FASE 2 (Optimización):
├── Probar 8-bit quantized embeddings
├── Medir impacto en recall
├── Si recall baja <3%, adoptar

FASE 3 (Escala):
├── Si >1M productos, considerar binary + rescoring
├── Si self-hosting LLM, usar 4-bit o 8-bit
└── Matryoshka si necesitás flexibilidad
```

---

## Resumen del Capítulo 43

| Concepto | Qué hace | Ahorro | Pérdida |
|----------|----------|--------|---------|
| **LLM Quantization** | 16-bit → 8/4-bit | 2-4x memoria | Pequeña |
| **Vector 8-bit** | 32-bit → 8-bit | 4x memoria | ~2-3% recall |
| **Vector Binary** | 32-bit → 1-bit | 32x memoria | Notable |
| **Matryoshka** | Usar subset dims | Variable | Variable |

---

## Key Takeaways:

```
1. Quantization = compresión para LLMs y vectores

2. 8-bit quantization: 4x ahorro con mínima pérdida

3. Binary (1-bit): 32x ahorro pero combinar con rescoring

4. Matryoshka: dimensiones ordenadas por información,
   usar solo las que necesitás

5. EXPERIMENTÁ con modelos quantizados - los ahorros
   son significativos y las pérdidas son pequeñas
```

---

## Próximo: Más Trade-offs de Producción

Otras estrategias para balancear costo, velocidad, y calidad.

---
