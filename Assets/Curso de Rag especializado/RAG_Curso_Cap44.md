# Capítulo 44: Gestionando Costos en RAG

---

## El Tema Favorito de Todo Ingeniero: El Presupuesto

> "Cuando diseñás tu primer sistema RAG, probablemente te enfoques en explorar qué es posible y obtener un prototipo funcionando. Cuando empezás a escalar a cientos, miles, o incluso millones de requests, las consideraciones de costo se vuelven cada vez más importantes."

---

## Los Dos Mayores Costos

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   En una aplicación RAG típica:                        │
│                                                         │
│   1. VECTOR DATABASE                                   │
│   2. LARGE LANGUAGE MODELS                             │
│                                                         │
│   Estos son los principales drivers de costo.          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Estrategia 1: Modelos Más Pequeños

### La idea:

```
Experimentar con SMALLER MODELS:

├── El LLM principal (genera respuesta final)
├── Router LLMs en sistemas agentic
└── Otros LLMs auxiliares

Podrías lograr SIMILAR CALIDAD con modelos
más pequeños = más baratos.
```

### Qué significa "más pequeño":

```
MENOS PARÁMETROS:
├── GPT-4 (~1.8T params) → GPT-3.5 (~175B params)
├── Claude Opus → Claude Haiku
└── Llama 70B → Llama 8B

QUANTIZED:
├── 16-bit → 8-bit o 4-bit
└── Mismo modelo, menos precisión
```

### Cuándo funciona bien:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Modelos pequeños funcionan especialmente bien si:    │
│                                                         │
│   ├── El LLM hace un NÚMERO LIMITADO de tareas        │
│   ├── Las tareas son relativamente SIMPLES             │
│   └── Podés FINE-TUNEAR para tu dominio específico    │
│                                                         │
│   Fine-tuning de un modelo pequeño puede dar           │
│   buenos resultados a bajo costo.                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Estrategia 2: Limitar Tokens

### Input tokens:

```
RAG prompts pueden CRECER RÁPIDAMENTE:
├── System prompt
├── Conversation history
├── Retrieved documents (muchos chunks largos)
└── User query

SOLUCIONES:
├── Reducir TOP-K (menos docs recuperados)
├── Chunks más cortos
├── Summarization de documentos
└── Context pruning en conversaciones
```

### Output tokens:

```
LLMs pueden ser LONG-WINDED:
Pagás por CADA token que generan.

SOLUCIONES:
├── System prompt que pide respuestas CONCISAS
├── Límite firme de tokens (max_tokens)
└── Instrucciones específicas de longitud
```

### El rol de observabilidad:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Ya sea reduciendo tamaño de modelo o largo de prompt:│
│                                                         │
│   Un pipeline de observabilidad robusto te permite:    │
│   ├── Evaluar impacto de los cambios                  │
│   └── Decidir si el trade-off vale la pena            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Estrategia 3: Hardware Dedicado

### El problema con APIs:

```
Cloud LLM providers (Together AI, AWS, Google):
├── Inference endpoints convenientes
├── Ideales para prototipos
└── PERO: Pagás por TOKEN

A escala (miles/millones de requests):
= Puede ser MUY caro
```

### La alternativa:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   DEDICATED HARDWARE:                                  │
│                                                         │
│   Alquilar GPUs dedicadas de los mismos providers     │
│   para correr tus modelos.                             │
│                                                         │
│   PRICING: Por HORA (no por token)                    │
│                                                         │
│   A escala, el ahorro puede ser MUY SIGNIFICATIVO.    │
│                                                         │
│   BONUS: Mejor reliability                             │
│   (hardware solo sirve TU tráfico)                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Cuándo conviene:

```
PROTOTYPE / BAJO VOLUMEN:
→ API pay-per-token (simple, flexible)

ESCALA / ALTO VOLUMEN:
→ Dedicated hardware (más barato por request)
```

---

## Estrategia 4: Gestionar Memoria del Vector DB

### Los tres tipos de memoria:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   TIPO         │ VELOCIDAD │ COSTO                     │
│   ─────────────┼───────────┼─────────────────────────  │
│   RAM          │ Más rápido│ Más caro                  │
│   Disk         │ Medio     │ Medio                     │
│   Cloud Object │ Más lento │ Más barato                │
│                                                         │
│   RAM es VARIAS VECES más caro que Disk               │
│   Disk es VARIAS VECES más caro que Cloud Object      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Qué poner dónde:

```
EN RAM (caro pero rápido):
├── HNSW index
└── Datos que necesitan acceso instantáneo

EN DISK (balance):
├── Contenido de documentos más accedidos
└── Metadata frecuente

EN CLOUD OBJECT STORAGE (barato pero lento):
├── Documentos raramente accedidos
├── Archivos históricos
└── Backups
```

### El principio:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Solo pagá por almacenamiento rápido y caro          │
│   si realmente beneficia la performance.              │
│                                                         │
│   Muchos vector DBs tienen features para:             │
│   ├── Monitorear este trade-off                       │
│   └── Mover datos dinámicamente entre tiers           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Estrategia 5: Multi-Tenancy

### El escenario:

```
1 millón de documentos
owned by
1,000 usuarios diferentes

Cada usuario solo puede acceder a SUS documentos.
= Cada usuario tiene su propio HNSW index.
```

### La optimización:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   CARGAR datos de un tenant en RAM solo cuando         │
│   es NECESARIO.                                        │
│                                                         │
│   EJEMPLOS:                                            │
│                                                         │
│   ├── Cargar cuando el cliente HACE LOGIN              │
│   │   (no antes)                                       │
│                                                         │
│   ├── Tenants europeos → storage lento durante         │
│   │   la NOCHE en Europa                              │
│                                                         │
│   └── Tenants inactivos → mover a cloud storage       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Beneficio:

```
Organizar información por tenant hace FÁCIL
mover datos in/out de memoria cara de manera eficiente.
```

---

## Resumen de Optimizaciones de Costo

| Componente | Estrategia | Ahorro |
|------------|------------|--------|
| **LLM** | Modelos más pequeños | Significativo |
| **LLM** | Reducir tokens input/output | Proporcional |
| **LLM** | Hardware dedicado (a escala) | Muy significativo |
| **Vector DB** | Quantization de vectores | 4-32x memoria |
| **Vector DB** | Tiered storage (RAM/Disk/Cloud) | Variable |
| **Vector DB** | Multi-tenancy + lazy loading | Variable |

---

## Aplicación para DONA 🎯

### Análisis de costos para DONA:

```python
DONA_COST_ANALYSIS = {
    "llm_costs": {
        "current": {
            "model": "gpt-3.5-turbo",
            "avg_input_tokens": 1200,
            "avg_output_tokens": 150,
            "cost_per_query": 0.002  # ~$2/1000 queries
        },
        "optimized": {
            "reduce_top_k": "5 → 3 docs = 30% menos input",
            "concise_prompt": "Respuestas cortas = 50% menos output",
            "potential_savings": "~40%"
        }
    },
    
    "vector_db_costs": {
        "current": {
            "products": 100_000,
            "vector_size": "3KB each",
            "total": "300MB in RAM"
        },
        "optimized": {
            "8bit_quantization": "75MB (75% ahorro)",
            "tiered_storage": "Solo productos activos en RAM"
        }
    }
}
```

### Estrategias específicas para DONA:

```python
# 1. REDUCIR TOKENS
DONA_CONCISE_PROMPT = """
Respondé en 2-3 oraciones máximo.
Solo mencioná precio y disponibilidad.
No des explicaciones técnicas a menos que pregunten.
"""

# 2. TIERED STORAGE POR ACTIVIDAD DE PRODUCTO
def categorize_products():
    return {
        "hot": "Productos vendidos en últimos 30 días → RAM",
        "warm": "Productos consultados en últimos 90 días → Disk",
        "cold": "Resto → Cloud Storage"
    }

# 3. MODELO SIZING
DONA_MODEL_STRATEGY = {
    "high_volume_simple": {
        "queries": ["consulta_precio", "consulta_stock"],
        "model": "gpt-3.5-turbo",  # Barato y suficiente
        "reasoning": "Tareas simples, no necesita modelo grande"
    },
    "complex_recommendations": {
        "queries": ["recomendacion", "calculo"],
        "model": "gpt-4",  # Cuando se necesita
        "reasoning": "Vale la pena para calidad"
    }
}
```

### Proyección de costos para DONA:

```
ESCENARIO: 10,000 queries/día

SIN OPTIMIZAR:
├── LLM: $20/día ($600/mes)
├── Vector DB RAM: $50/mes
└── Total: ~$650/mes

CON OPTIMIZACIONES:
├── LLM: $12/día (reducir tokens)
├── Vector DB: $20/mes (quantization + tiering)
└── Total: ~$380/mes

AHORRO: ~40%
```

### Decisiones según escala para DONA:

```
< 1,000 queries/día:
→ API pay-per-token
→ Full precision vectors
→ Simple setup

1,000 - 100,000 queries/día:
→ API pay-per-token
→ 8-bit quantized vectors
→ Token optimization

> 100,000 queries/día:
→ Considerar dedicated hardware
→ Binary vectors + rescoring
→ Multi-tenancy si múltiples corralones
```

---

## Key Takeaways:

```
1. DOS MAYORES COSTOS: LLM y Vector Database

2. LLM SAVINGS:
   ├── Modelos más pequeños
   ├── Menos tokens (input y output)
   └── Hardware dedicado a escala

3. VECTOR DB SAVINGS:
   ├── Quantization (4-32x)
   ├── Tiered storage (RAM/Disk/Cloud)
   └── Multi-tenancy + lazy loading

4. SIEMPRE: Medir impacto en calidad
   antes de adoptar optimizaciones

5. El principio: Entender la FUENTE de tus costos
   y asegurar que estén justificados por performance
```

---

## Próximo: Trade-offs de Latencia

Optimizando velocidad de respuesta.

---
