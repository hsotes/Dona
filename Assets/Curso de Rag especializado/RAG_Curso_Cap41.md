# Capítulo 41: Implementación de Observabilidad

---

## De Métricas a Implementación

> "Una vez que sabés qué métricas querés colectar sobre tu sistema RAG, realmente necesitás construir el sistema para colectar esos datos."

---

## Plataformas de Observabilidad para LLMs

### Por qué usar una plataforma:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Plataformas diseñadas para aplicaciones LLM:         │
│                                                         │
│   ├── Capturar métricas system-wide y component-level │
│   ├── Loggear tráfico del sistema                      │
│   ├── Habilitar experimentación                        │
│                                                         │
│   BENEFICIO:                                           │
│   Menos tiempo diseñando/implementando observabilidad  │
│   Más tiempo monitoreando y mejorando tu sistema       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Plataformas disponibles:

```
├── Phoenix (Arize) - Open source
├── LangSmith (LangChain)
├── Weights & Biases
├── Helicone
├── Langfuse
└── Y más...
```

---

## Phoenix (Arize) - Ejemplo

### Herramienta principal: TRACES

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Un TRACE te permite seguir el path de un prompt      │
│   a través de TODO el pipeline RAG.                    │
│                                                         │
│   Ver cómo es modificado por cada componente.          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Qué muestra un trace:

```
TRACE DE UN PROMPT:

1. INPUT
   └── "¿Cuánto sale el cemento Portland?"

2. QUERY REWRITING
   └── "precio cemento portland"
   └── Latency: 45ms

3. RETRIEVER
   └── Query enviada: "precio cemento portland"
   └── Chunks retornados: 5
   └── Latency: 120ms

4. RE-RANKER
   └── Input: 5 chunks
   └── Output: 3 chunks (top relevantes)
   └── Latency: 80ms

5. LLM PROMPT
   └── System prompt + context + query
   └── Total tokens: 1,247

6. LLM RESPONSE
   └── "El cemento Portland está a $8,500..."
   └── Tokens generados: 87
   └── Latency: 1,200ms

TOTAL LATENCY: 1,445ms
```

### Uso de traces:

```
Para debugging:
├── Prompt tuvo mala performance
├── Seguir el trace
├── Identificar qué paso causó el error
│
│   ¿El retriever trajo docs irrelevantes?
│   ¿El re-ranker eliminó el doc correcto?
│   ¿El LLM ignoró el contexto?
│
└── Arreglar el componente específico
```

---

## Integración con RAGAS

### Evaluaciones automáticas:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Phoenix integra con RAGAS para calcular:             │
│                                                         │
│   ├── Search relevancy del retriever                   │
│   ├── Faithfulness del LLM                            │
│   ├── Citation accuracy                               │
│   └── Otras métricas RAGAS                            │
│                                                         │
│   Fácil agregar estos pasos de evaluación.             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Experimentación

### Iteración manual:

```
Probar tus propios prompts y ver cómo serían
procesados por tu pipeline RAG.

Útil para:
├── Testear edge cases
├── Verificar comportamiento esperado
└── Debugging durante desarrollo
```

### A/B Testing:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Testear CAMBIOS al sistema:                          │
│                                                         │
│   PREGUNTAS QUE RESPONDE:                              │
│   ├── ¿El nuevo system prompt mejora calidad?          │
│   ├── ¿Qué gains da agregar un re-ranker?             │
│   ├── ¿El nuevo modelo es mejor?                       │
│   └── ¿El cambio de alpha mejora retrieval?           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Reportes Agregados

### Estadísticas diarias:

```
Phoenix provee reportes de métricas clave:

├── Accuracy del retriever
├── Hallucination rate del modelo
├── Latencia promedio
├── Error rates
├── Throughput
└── Tendencias over time
```

### Dashboard típico:

```
┌─────────────────────────────────────────────────────────┐
│                     DONA - Daily Report                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   📊 Retriever Accuracy: 87% (↑2% vs ayer)            │
│   🎯 Response Relevancy: 0.89 (estable)                │
│   ⚠️ Hallucination Rate: 3.2% (↓0.5% vs ayer)         │
│   ⏱️ Avg Latency: 1.8s (estable)                       │
│   📈 Requests: 1,247 (↑15% vs ayer)                    │
│   👍 User Satisfaction: 91%                            │
│                                                         │
│   [Ver detalles] [Exportar] [Comparar períodos]        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Herramientas Complementarias

### Lo que Phoenix NO cubre bien:

```
├── Compute usage de la vector database
├── Memory usage del sistema
├── Infraestructura general
└── Networking metrics
```

### Herramientas clásicas para eso:

```
├── Datadog
├── Grafana
├── Prometheus
├── CloudWatch (AWS)
├── Cloud Monitoring (GCP)
└── Application Insights (Azure)
```

### Setup completo:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   OBSERVABILIDAD COMPLETA:                             │
│                                                         │
│   LLM-ESPECÍFICO (Phoenix/LangSmith):                  │
│   ├── Traces de prompts                                │
│   ├── Métricas de calidad RAG                         │
│   ├── Experimentación                                  │
│   └── Evals con RAGAS                                 │
│                                                         │
│   INFRAESTRUCTURA (Datadog/Grafana):                   │
│   ├── CPU/Memory/Disk usage                           │
│   ├── Network metrics                                  │
│   ├── Database performance                             │
│   └── Error logs                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## El Flywheel de Mejoras

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│          ┌──────────────────────┐                      │
│          │ Ver cómo el sistema  │                      │
│          │ maneja tráfico real  │                      │
│          └──────────┬───────────┘                      │
│                     │                                   │
│                     ▼                                   │
│          ┌──────────────────────┐                      │
│          │ Identificar bugs o   │                      │
│          │ áreas de mejora      │                      │
│          └──────────┬───────────┘                      │
│                     │                                   │
│                     ▼                                   │
│          ┌──────────────────────┐                      │
│          │ Hacer cambios        │                      │
│          │ (experimentos)       │                      │
│          └──────────┬───────────┘                      │
│                     │                                   │
│                     ▼                                   │
│          ┌──────────────────────┐                      │
│          │ Ver impacto de los   │──────┐               │
│          │ cambios              │      │               │
│          └──────────────────────┘      │               │
│                     ▲                   │               │
│                     └───────────────────┘               │
│                                                         │
│   Con el tiempo: tunear cada componente para           │
│   matchear cómo los usuarios REALMENTE usan el sistema.│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Custom Datasets

### La idea:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Crear DATASETS CUSTOM de prompts que tu sistema      │
│   RAG ya procesó anteriormente.                        │
│                                                         │
│   GUARDAR prompts reales → RE-CORRER por el sistema    │
│   → Ver IMPACTO de cambios en prompts reales           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Esto se explora más en el próximo video.

---

## Aplicación para DONA 🎯

### Setup de observabilidad para DONA:

```python
# Phoenix setup para DONA
import phoenix as px
from phoenix.trace.openai import OpenAIInstrumentor

# Instrumentar calls
OpenAIInstrumentor().instrument()

# Iniciar session
session = px.launch_app()

# Ahora todos los calls se tracean automáticamente
```

### Trace típico en DONA:

```
TRACE: "che cuanto sale el fierro del 8"

1. INTENT DETECTION (50ms)
   └── Intent: "consulta_precio"

2. QUERY REWRITING (80ms)
   └── "precio hierro 8mm varilla construcción"

3. HYBRID SEARCH (150ms)
   └── Retrieved: 8 docs
   └── Top score: 0.87

4. RE-RANKING (100ms)
   └── After rerank: 5 docs
   └── Top score: 0.92

5. LLM GENERATION (1,200ms)
   └── Model: gpt-3.5-turbo
   └── Input tokens: 850
   └── Output tokens: 120

6. RESPONSE
   └── "El hierro del 8 está a $X el metro..."

TOTAL: 1,580ms
COST: $0.0015
```

### Dashboard DONA:

```python
DONA_DASHBOARD_METRICS = {
    "daily": {
        "requests_total": count,
        "avg_latency_ms": avg,
        "p95_latency_ms": percentile(95),
        "error_rate": rate,
        "thumbs_up_rate": rate,
        "cost_total_usd": sum
    },
    
    "quality": {
        "retriever_accuracy": ragas_metric,
        "response_relevancy": ragas_metric,
        "faithfulness": ragas_metric,
        "price_accuracy": custom_metric  # ¿Precios correctos?
    },
    
    "alerts": {
        "latency_spike": if p95 > 5000,
        "error_spike": if error_rate > 0.05,
        "quality_drop": if faithfulness < 0.80
    }
}
```

---

## Resumen del Capítulo 41

| Herramienta | Qué hace | Cuándo usar |
|-------------|----------|-------------|
| **Phoenix/LangSmith** | Traces, evals RAG, experimentación | Siempre para LLMs |
| **RAGAS** | Métricas de calidad | Evaluar retriever/LLM |
| **Datadog/Grafana** | Infra, compute, memory | Monitoreo general |

---

## Key Takeaways:

```
1. Usar PLATAFORMAS de observabilidad para LLMs
   (Phoenix, LangSmith, etc.)

2. TRACES son la herramienta principal para debugging
   (seguir el journey del prompt)

3. Integrar con RAGAS para métricas de calidad

4. Complementar con herramientas clásicas (Datadog)
   para infraestructura

5. El FLYWHEEL: observar → identificar → cambiar → medir → repetir

6. CUSTOM DATASETS de tráfico real para testear cambios
```

---

## Próximo: Construyendo Custom Datasets

Crear datasets de prompts reales para testing.

---
