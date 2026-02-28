# Capítulo 42: Construyendo Custom Datasets

---

## El Valor de Custom Datasets

> "Crear un dataset custom de prompts que tu sistema recibió te permite entender profundamente cómo tu sistema performó en el pasado, y correr experimentos para ver cómo un rediseño podría cambiar la performance en prompts del mundo real."

---

## ¿Qué es un Custom Dataset?

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Una COLECCIÓN de:                                    │
│                                                         │
│   ├── Prompts que tu sistema procesó anteriormente     │
│   └── Información sobre el journey de ese prompt       │
│                                                         │
│   Puede ser simple (prompt + response) o detallado     │
│   (todos los pasos del pipeline).                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ¿Qué Datos Guardar?

### La pregunta clave:

```
¿Qué querés EVALUAR?

La respuesta determina qué datos guardar.
```

### Nivel Mínimo (End-to-End):

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   DATOS BÁSICOS:                                       │
│   ├── Input prompt del usuario                         │
│   └── Respuesta final del sistema                      │
│                                                         │
│   PERMITE:                                             │
│   ├── Sentido general de performance                   │
│   └── Trackear cómo cambian respuestas con edits       │
│                                                         │
│   LIMITACIÓN:                                          │
│   Solo evaluación end-to-end, no component-level.      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Nivel Detallado (Component-Level):

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PARA EVALUACIÓN POR COMPONENTE, guardar:             │
│                                                         │
│   INPUT/OUTPUT de cada componente:                     │
│   ├── Query rewriter (input → output)                 │
│   ├── Retriever (query → docs encontrados)            │
│   ├── Re-ranker (docs antes → docs después)           │
│   ├── Router LLM (input → decisión)                   │
│   └── Generator LLM (prompt → response)               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Estructura Típica de Dataset

### Tabla con docenas de columnas:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   METADATA:                                            │
│   ├── request_id                                       │
│   ├── timestamp                                        │
│   ├── customer_id                                      │
│   ├── session_id                                       │
│   └── topic/category                                   │
│                                                         │
│   INPUT:                                               │
│   ├── original_prompt                                  │
│   └── conversation_history                             │
│                                                         │
│   QUERY PROCESSING:                                    │
│   ├── rewritten_query                                  │
│   ├── expanded_queries                                 │
│   └── detected_intent                                  │
│                                                         │
│   RETRIEVAL:                                           │
│   ├── docs_retrieved (IDs)                            │
│   ├── retrieval_scores                                 │
│   ├── docs_after_rerank                               │
│   └── rerank_scores                                   │
│                                                         │
│   GENERATION:                                          │
│   ├── final_prompt_to_llm                             │
│   ├── llm_response                                    │
│   └── tokens_used                                     │
│                                                         │
│   PERFORMANCE:                                         │
│   ├── total_latency_ms                                │
│   ├── retrieval_latency_ms                            │
│   ├── llm_latency_ms                                  │
│   └── cost_usd                                        │
│                                                         │
│   FEEDBACK:                                            │
│   ├── user_rating (thumbs up/down)                    │
│   └── user_comments                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Beneficios de Datos Detallados

### Análisis multidimensional:

```
Con datos detallados podés:

1. FILTRAR por dimensión
   ├── Por topic de pregunta
   ├── Por tipo de cliente
   ├── Por período de tiempo
   └── Por intent detectado

2. DETECTAR patrones
   ├── "Preguntas sobre refunds → alta calidad"
   ├── "Preguntas sobre delays → baja calidad"
   └── "Ciertos clientes → más problemas"

3. INVESTIGAR causas
   ├── ¿El retriever no encuentra docs?
   ├── ¿El re-ranker elimina docs buenos?
   └── ¿El LLM ignora el contexto?
```

---

## Caso Real: Diagrams vs Images

### El problema:

```
Sistema RAG que genera:
├── Texto
├── Imágenes (text-to-image)
└── Charts/diagrams (Mermaid.js code)

QUEJA: "La calidad de algunos diagramas es muy baja"
```

### Debugging con logs:

```
Trabajando hacia atrás en los logs:

1. Encontrar prompts con mala calidad de diagramas
2. Analizar el journey de esos prompts
3. DESCUBRIMIENTO: Usuario pedía "draw a diagram"
4. Router LLM interpretó "draw" → imagen
5. Envió a text-to-image model
6. Text-to-image es MALO para charts

SOLUCIÓN: Actualizar system prompt del router
para que "diagram" → Mermaid.js, no image generation
```

### El valor del logging:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Gracias a un sistema robusto de monitoring y logging:│
│                                                         │
│   1. Recibimos reportes de clientes                    │
│   2. Fácil trackear la fuente del problema             │
│   3. Fix rápido a producción                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Visualización de Datos

### Clustering de prompts:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Visualizar TODOS los prompts del sistema:            │
│                                                         │
│   1. Embeber prompts                                   │
│   2. Clustering algorithm (k-means, etc.)              │
│   3. Identificar topics de alto nivel:                 │
│                                                         │
│      ○ ○ ○ ○ ○   Cluster A: Product questions          │
│        ○ ○ ○                                           │
│                                                         │
│            ○ ○ ○ ○   Cluster B: Troubleshooting       │
│          ○ ○ ○ ○ ○                                     │
│                                                         │
│      ○ ○             Cluster C: Refunds               │
│        ○ ○ ○                                           │
│                                                         │
│   4. Correr evals SOLO en un cluster                   │
│   5. Detectar si ciertos topics underperforman         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Estructura de dataset para DONA:

```python
DONA_DATASET_SCHEMA = {
    # Metadata
    "request_id": str,
    "timestamp": datetime,
    "session_id": str,
    "channel": str,  # web, whatsapp, etc.
    
    # Input
    "user_message": str,
    "conversation_history": list,
    
    # Intent & Query Processing
    "detected_intent": str,  # consulta_precio, consulta_stock, saludo, etc.
    "rewritten_query": str,
    
    # Retrieval
    "products_retrieved": list,  # IDs de productos
    "retrieval_scores": list,
    "products_after_rerank": list,
    
    # Generation
    "prompt_to_llm": str,
    "response": str,
    "tokens_input": int,
    "tokens_output": int,
    
    # Productos mencionados en respuesta
    "products_mentioned": list,
    "prices_mentioned": list,
    
    # Performance
    "total_latency_ms": int,
    "retrieval_latency_ms": int,
    "llm_latency_ms": int,
    "cost_usd": float,
    
    # Quality signals
    "grounding_warnings": list,
    "price_accuracy": bool,  # ¿Precios coinciden con DB?
    
    # Feedback
    "user_rating": str,  # thumbs_up, thumbs_down, none
    "led_to_sale": bool,  # Si terminó en venta
}
```

### Análisis por cluster para DONA:

```python
def analyze_dona_clusters():
    """
    Identificar clusters de preguntas y performance por cluster
    """
    
    # Posibles clusters en DONA:
    clusters = {
        "consulta_precio": {
            "example": "¿Cuánto sale el cemento?",
            "expected_performance": "high",
            "key_metric": "price_accuracy"
        },
        "consulta_stock": {
            "example": "¿Tienen hierro del 8?",
            "expected_performance": "high",
            "key_metric": "availability_accuracy"
        },
        "recomendacion": {
            "example": "¿Qué me recomendás para una losa?",
            "expected_performance": "medium",
            "key_metric": "response_relevancy"
        },
        "calculo": {
            "example": "¿Cuánto material necesito para 20m²?",
            "expected_performance": "medium",
            "key_metric": "calculation_accuracy"
        },
        "fuera_dominio": {
            "example": "¿Venden comida para perros?",
            "expected_performance": "should_decline",
            "key_metric": "proper_decline_rate"
        }
    }
    
    # Evaluar cada cluster por separado
    for cluster_name, config in clusters.items():
        prompts = filter_by_cluster(dataset, cluster_name)
        metrics = evaluate_cluster(prompts, config["key_metric"])
        
        if metrics < config["expected_performance"]:
            alert(f"Cluster {cluster_name} underperforming")
```

### Caso de debugging para DONA:

```
PROBLEMA REPORTADO:
"A veces DONA da precios incorrectos"

INVESTIGACIÓN CON LOGS:
1. Filtrar respuestas donde price_accuracy = False
2. Analizar los prompts
3. DESCUBRIMIENTO: Muchos son preguntas ambiguas
   "¿Cuánto sale el cemento?" sin especificar marca
4. Retriever trae VARIOS cementos
5. LLM a veces menciona precio de uno pero nombre de otro

SOLUCIÓN:
- Actualizar system prompt para siempre confirmar producto
- O: Cuando hay múltiples matches, preguntar cuál
```

---

## Resumen del Capítulo 42

| Aspecto | Recomendación |
|---------|---------------|
| **Qué guardar** | Lo que querés evaluar |
| **Mínimo** | Input prompt + response final |
| **Ideal** | Input/output de CADA componente |
| **Análisis** | Filtrar por dimensiones, clustering |
| **Valor** | Debugging rápido, mejora continua |

---

## Key Takeaways:

```
1. Custom datasets = prompts REALES que tu sistema procesó

2. Guardar datos de CADA componente para debugging granular

3. Permite análisis MULTIDIMENSIONAL
   (por topic, por cliente, por tiempo)

4. VISUALIZAR prompts con clustering para detectar
   patrones de underperformance

5. El mejor way de mejorar = testear con prompts REALES
   de tus usuarios
```

---

## Próximo: Trade-offs de RAG en Producción

Balancear costo, latencia, y calidad.

---
