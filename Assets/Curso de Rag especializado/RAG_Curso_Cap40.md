# Capítulo 40: Sistema de Observabilidad

---

## La Base de Producción

> "Un buen primer paso para manejar los desafíos de producción es construir un sistema de observabilidad robusto."

---

## Qué Debe Trackear una Plataforma de Observabilidad

### 1. Métricas de Performance de Software

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Las métricas clásicas de cualquier sistema:          │
│                                                         │
│   ├── LATENCIA (tiempo de respuesta)                   │
│   ├── THROUGHPUT (requests por segundo)                │
│   ├── MEMORIA (uso de RAM)                             │
│   └── COMPUTE (uso de CPU/GPU)                         │
│                                                         │
│   ¿Cuántos requests maneja?                            │
│   ¿Cuánto tarda?                                       │
│   ¿Cuántos recursos consume?                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Métricas de Calidad

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Más allá de velocidad/eficiencia:                    │
│   ¿Los resultados cumplen los estándares de calidad?   │
│                                                         │
│   ├── Satisfacción del usuario con respuestas         │
│   ├── Recall del retriever                             │
│   ├── Faithfulness del LLM                            │
│   └── Precisión de citas                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. Estadísticas Agregadas

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Datos agregados OVER TIME:                           │
│                                                         │
│   ├── Trackear tendencias de alto nivel               │
│   ├── Identificar regresiones rápidamente             │
│   └── Comparar períodos (semana vs semana)            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4. Logs Detallados

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Logs para TRACING individual:                        │
│                                                         │
│   Seguir el journey de prompts individuales            │
│   a través del pipeline RAG.                           │
│                                                         │
│   Útil para entender la FUENTE de                      │
│   respuestas de bajo rendimiento.                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5. Experimentación

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Habilitar EXPERIMENTACIÓN:                           │
│                                                         │
│   ├── Testear nuevo modelo de lenguaje                │
│   ├── Ajustar system prompt                           │
│   ├── Cambiar settings del retriever                  │
│                                                         │
│   Opciones:                                            │
│   ├── Experimentos en ambiente seguro                 │
│   └── A/B testing con usuarios en producción          │
│                                                         │
│   Monitorear impacto en métricas de                   │
│   performance y calidad para decidir si deployar.     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Framework: Scope × Evaluator Type

### Las dos dimensiones:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   SCOPE (Alcance):                                     │
│   ├── SYSTEM-LEVEL: Performance general               │
│   └── COMPONENT-LEVEL: Debug de issues específicos    │
│                                                         │
│   EVALUATOR TYPE (Tipo de evaluador):                  │
│   ├── CODE-BASED: Automático, determinístico, barato  │
│   ├── LLM-AS-JUDGE: Flexible, medio costo            │
│   └── HUMAN FEEDBACK: Costoso pero captura más       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### El Grid:

```
                    │ Code-Based │ LLM-as-Judge │ Human Feedback │
────────────────────┼────────────┼──────────────┼────────────────┤
SYSTEM-LEVEL        │ Latency    │ Response     │ Thumbs up/down │
                    │ Throughput │ quality      │ User comments  │
                    │ Memory     │              │                │
────────────────────┼────────────┼──────────────┼────────────────┤
COMPONENT-LEVEL     │ LLM tokens │ Faithfulness │ Annotated      │
(Retriever)         │ per second │ Relevancy    │ test datasets  │
(LLM)               │ JSON valid │              │ (precision/    │
(etc.)              │            │              │  recall)       │
────────────────────┴────────────┴──────────────┴────────────────┘
```

---

## Scope: System vs Component

### System-Level:

```
PROPÓSITO:
├── Resumir performance general
├── Vista de alto nivel de cómo van las cosas
└── Dashboards ejecutivos

EJEMPLOS:
├── Latencia promedio del sistema
├── Throughput total
├── User satisfaction rate
└── Error rate general
```

### Component-Level:

```
PROPÓSITO:
├── Debugear fuente de issues específicos
└── Identificar qué componente causa problemas

EJEMPLO:
Sistema tiene latencia alta →
¿Es el retriever? ¿El LLM? ¿Otro componente?

Necesitás métricas por componente para saber.
```

---

## Evaluator Types

### 1. Code-Based Evals

```
✅ Más baratos
✅ Más simples
✅ Más directos de implementar
✅ Automáticos
✅ Determinísticos
✅ Casi gratis de correr

EJEMPLOS:
├── Requests por segundo
├── Latencia en ms
├── Memoria usada
├── Unit tests (¿output es JSON válido?)
├── Tokens generados por segundo
└── Error rates
```

### 2. Human Feedback

```
❌ Más costoso
✅ Captura info que code-based no puede

EJEMPLOS:
├── Thumbs up/down en respuestas
├── Text boxes para feedback detallado
├── Datasets pre-compilados por humanos
│   (prompt + documentos relevantes esperados)
└── Anotaciones de calidad

NOTA: Algunos evals corren automáticamente
pero DEPENDEN de input humano inicial
(ej: el dataset de test lo compila un humano)
```

### 3. LLM-as-a-Judge

```
✅ Más flexible que code-based
✅ Más barato que human feedback
⚠️ Necesita ser cuidadosamente tuneado

CUIDADOS:
├── Modelos tienen BIASES
│   (favorecen respuestas de su propia familia)
├── Necesitan RUBRICS claros
└── Funcionan mejor con estándares DISCRETOS
    (relevant/irrelevant) 
    vs escalas continuas (0-100)

EJEMPLOS:
├── ¿Documentos recuperados son relevantes?
├── Response relevancy (RAGAS)
├── Faithfulness (RAGAS)
└── Citation quality
```

---

## Set Inicial de Métricas Recomendado

### Performance Metrics (Code-Based):

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   POR COMPONENTE Y SISTEMA:                            │
│                                                         │
│   ├── Latencia (ms)                                    │
│   ├── Throughput (requests/segundo)                    │
│   ├── Memory usage (MB)                                │
│   └── Tokens generados por segundo                     │
│                                                         │
│   Son BARATAS y FÁCILES de colectar.                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Quality Metrics:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   SYSTEM-WIDE (Human Feedback):                        │
│   ├── Thumbs up/down en respuestas                     │
│   └── Feedback rate general                            │
│                                                         │
│   RETRIEVER (Human Annotated Dataset):                 │
│   ├── Recall                                           │
│   ├── Precision                                        │
│   └── MRR                                              │
│                                                         │
│   LLM (LLM-as-Judge / RAGAS):                         │
│   ├── Response relevancy                               │
│   ├── Faithfulness                                     │
│   ├── Citation quality                                 │
│   └── Noise sensitivity                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Dashboard de Métricas para DONA:

```python
DONA_OBSERVABILITY = {
    # Performance (Code-Based) - Barato
    "performance": {
        "system": {
            "latency_p50_ms": target < 2000,
            "latency_p95_ms": target < 5000,
            "throughput_rps": monitor,
            "error_rate": target < 0.01
        },
        "retriever": {
            "search_latency_ms": target < 500,
            "docs_retrieved_avg": monitor
        },
        "llm": {
            "generation_latency_ms": target < 1500,
            "tokens_per_second": monitor,
            "cost_per_query_usd": monitor
        }
    },
    
    # Quality - Más costoso pero necesario
    "quality": {
        "system": {
            "thumbs_up_rate": target > 0.85,
            "thumbs_down_rate": alert_if > 0.15
        },
        "retriever": {
            "recall_at_5": target > 0.80,
            "precision_at_5": target > 0.70
        },
        "llm": {
            "response_relevancy": target > 0.85,
            "faithfulness": target > 0.90,
            "price_accuracy": target > 0.95  # Custom para DONA
        }
    }
}
```

### Logs para Tracing en DONA:

```python
def log_dona_request(request_id, query, retrieved_docs, response):
    """Log detallado para debugging"""
    log_entry = {
        "request_id": request_id,
        "timestamp": datetime.now(),
        
        # Input
        "user_query": query,
        "query_after_rewriting": rewritten_query,
        
        # Retrieval
        "docs_retrieved": len(retrieved_docs),
        "retrieval_latency_ms": retrieval_time,
        "top_doc_score": retrieved_docs[0]['score'] if retrieved_docs else None,
        
        # LLM
        "llm_latency_ms": llm_time,
        "tokens_generated": token_count,
        "model_used": model_name,
        
        # Output
        "response_length": len(response),
        "mentioned_products": extract_products(response),
        "mentioned_prices": extract_prices(response),
        
        # Quality indicators
        "grounding_warnings": check_grounding(response, retrieved_docs)
    }
    
    save_log(log_entry)
    
    # Alert si hay problemas
    if log_entry["grounding_warnings"]:
        alert_for_review(log_entry)
```

### A/B Testing Setup para DONA:

```python
def dona_ab_test(experiment_name, variant_a_config, variant_b_config):
    """
    A/B test de cambios en DONA
    
    Ejemplos de experimentos:
    - Nuevo system prompt
    - Diferente modelo LLM
    - Cambio en alpha de hybrid search
    - Nuevo re-ranker
    """
    
    for request in incoming_requests:
        # 50/50 split
        variant = "A" if hash(request.user_id) % 2 == 0 else "B"
        config = variant_a_config if variant == "A" else variant_b_config
        
        # Process with variant config
        response = process_with_config(request, config)
        
        # Log variant for analysis
        log_experiment(experiment_name, variant, request, response)
    
    # Después de N requests, analizar:
    # - Latencia por variante
    # - Thumbs up rate por variante
    # - Costo por variante
    # - Quality metrics por variante
```

---

## Resumen del Capítulo 40

| Tipo de Eval | Costo | Qué Captura | Ejemplo |
|--------------|-------|-------------|---------|
| **Code-Based** | Bajo | Performance | Latencia, throughput |
| **LLM-as-Judge** | Medio | Calidad flexible | Relevancy, faithfulness |
| **Human** | Alto | Calidad real | Thumbs up/down, datasets |

---

## Key Takeaways:

```
1. Trackear PERFORMANCE (barato) + QUALITY (más costoso)

2. Métricas a nivel SISTEMA + nivel COMPONENTE

3. Estadísticas AGREGADAS para tendencias
   + LOGS detallados para debugging

4. Habilitar EXPERIMENTACIÓN (A/B testing)

5. Balance entre evals baratos (code-based)
   y costosos pero informativos (human/LLM)
```

---

## Próximo: Implementación de Observabilidad

Consideraciones al implementar este sistema.

---
