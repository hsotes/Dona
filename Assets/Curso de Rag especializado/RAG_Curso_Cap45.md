# Capítulo 45: Optimizando Latencia

---

## El Balance Latencia vs Calidad

> "Otro acto de balance importante que tenés que considerar para una aplicación RAG en producción es el tiempo que toma cada query (latencia) versus la calidad de respuesta."

---

## Por Qué Importa el Contexto

### Cada aplicación tiene diferentes tolerancias:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   E-COMMERCE (recomendaciones):                        │
│   ├── Clientes tienen POCA PACIENCIA                   │
│   ├── Optimizar para BAJA LATENCIA                     │
│   └── OK si no es la recomendación "perfecta"          │
│                                                         │
│   DIAGNÓSTICO MÉDICO (enfermedades raras):             │
│   ├── Calidad es CRÍTICA                               │
│   ├── Optimizar para CALIDAD                           │
│   └── OK si tarda más en responder                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## El Culpable Principal: Transformers

### Regla fácil de recordar:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   CASI TODA la latencia viene de correr TRANSFORMERS   │
│                                                         │
│   El MAYOR CULPABLE: LLM calls                        │
│                                                         │
│   Retrieval agrega un poco de latencia, pero:          │
│   ├── Databases modernas son MUY RÁPIDAS              │
│   └── Vector databases escalan bien                    │
│                                                         │
│   Si querés reducir latencia:                          │
│   → Empezá por tu CORE LANGUAGE MODEL                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Estrategia 1: Modelos Más Pequeños

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Smaller LLMs o Quantized models                      │
│   = SIEMPRE corren más rápido en el mismo hardware     │
│                                                         │
│   Trade-off: Posible pérdida de calidad                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Estrategia 2: Router LLM Inteligente

### La idea:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Router LLM (pequeño y rápido):                       │
│   Mira el prompt y decide qué modelo usar.             │
│                                                         │
│   QUERY COMPLEJA (razonamiento):                       │
│   → Modelo grande y poderoso (más lento)               │
│                                                         │
│   QUERY SIMPLE:                                        │
│   → Modelo pequeño y rápido                            │
│                                                         │
│   RESULTADO:                                           │
│   ├── Latencia baja para prompts simples              │
│   └── Latencia alta SOLO cuando se necesita           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Estrategia 3: Caching de Respuestas

### Para sistemas con prompts similares:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   MANTENER CACHE de:                                   │
│   ├── Prompts frecuentes                               │
│   └── Sus respuestas                                   │
│                                                         │
│   CUANDO llega un nuevo prompt:                        │
│   1. Calcular similarity con prompts en cache          │
│   2. Si hay match cercano → retornar respuesta cacheada│
│   3. SKIP el proceso de generación (lento)             │
│                                                         │
│   Con tuning cuidadoso: GRAN mejora de latencia        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Variante: Cache + Personalización

```
1. Recuperar respuesta cacheada
2. Pasar cached response + user prompt a LLM pequeño
3. Hacer pequeños ajustes para personalizar

= Respuesta rápida + algo de personalización
```

---

## Estrategia 4: Evaluar Otros Componentes Transformer

### Después de optimizar el core LLM:

```
OTROS COMPONENTES QUE AGREGAN LATENCIA:
├── Query rewriter
├── Re-ranker
├── Router LLM
└── Citation generator

PARA CADA UNO, MEDIR:
├── Latencia que agrega
└── Calidad incremental que provee

SI NO DA MUCHO BENEFICIO:
→ Considerar REMOVER el componente
```

### Ejemplo:

```
Query rewriter agrega 200ms pero 
solo mejora relevancy un 2%...

¿Vale la pena? Quizás no.
→ Remover para ganar 200ms
```

---

## Estrategia 5: Optimizar Retrieval

### Aunque retrieval es generalmente rápido:

```
BINARY QUANTIZATION de embeddings:
├── Simplifica cálculos de distancia
└── Acelera búsqueda

SHARDING de databases grandes:
├── Separar en instancias
└── Reduce latencia de búsqueda

La mayoría de vector DB providers
tienen tools para implementar esto.
```

---

## Orden de Prioridad para Reducir Latencia

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. CORE LLM (mayor impacto)                          │
│      ├── Modelo más pequeño                            │
│      ├── Quantization                                  │
│      ├── Router para elegir modelo                     │
│      └── Caching                                       │
│                                                         │
│   2. OTROS TRANSFORMERS                                │
│      ├── Medir latencia de cada uno                   │
│      ├── Medir beneficio de calidad                   │
│      └── Remover si no vale la pena                   │
│                                                         │
│   3. RETRIEVAL (si todavía hay issues)                │
│      ├── Binary quantization                          │
│      └── Sharding                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### Análisis de latencia para DONA:

```python
DONA_LATENCY_BREAKDOWN = {
    # Típico query flow
    "components": {
        "intent_detection": 50,    # ms
        "query_rewriting": 80,     # ms
        "vector_search": 100,      # ms
        "re_ranking": 120,         # ms
        "llm_generation": 1200,    # ms ← MAYOR CULPABLE
        "response_formatting": 30  # ms
    },
    "total_typical": 1580,  # ms
    "target": 2000,         # ms (aceptable para chat)
    "stretch_target": 1000  # ms (ideal)
}
```

### Estrategias para DONA:

```python
# 1. ROUTER PARA ELEGIR MODELO
def dona_router(query, intent):
    """
    Queries simples → modelo rápido
    Queries complejas → modelo capaz
    """
    if intent in ["saludo", "consulta_precio_simple"]:
        return "gpt-3.5-turbo"  # Rápido: ~800ms
    elif intent in ["recomendacion", "calculo_materiales"]:
        return "gpt-4"  # Capaz: ~1500ms
    else:
        return "gpt-3.5-turbo"  # Default rápido

# 2. CACHE DE RESPUESTAS FRECUENTES
DONA_CACHE = {
    "preguntas_frecuentes": [
        ("horario de atencion", "Estamos abiertos de..."),
        ("donde estan ubicados", "Nos encontrás en..."),
        ("hacen envios", "Sí, hacemos envíos a..."),
        ("formas de pago", "Aceptamos efectivo, tarjeta..."),
    ],
    
    # Para productos más consultados
    "productos_top": {
        "cemento_portland": "cached_response_with_current_price",
        "hierro_8": "cached_response_with_current_price",
    }
}

def check_cache(query):
    """
    Buscar match en cache antes de procesar
    """
    query_embedding = embed(query)
    
    for cached_query, cached_response in DONA_CACHE["preguntas_frecuentes"]:
        similarity = cosine_sim(query_embedding, embed(cached_query))
        if similarity > 0.92:  # Threshold alto
            return cached_response
    
    return None  # No cache hit, procesar normalmente
```

### Optimización de componentes para DONA:

```python
# 3. EVALUAR CADA COMPONENTE

DONA_COMPONENT_EVALUATION = {
    "query_rewriting": {
        "latency_added": 80,  # ms
        "quality_improvement": "3% better relevancy",
        "decision": "KEEP - beneficio vale la latencia"
    },
    
    "re_ranking": {
        "latency_added": 120,  # ms
        "quality_improvement": "8% better relevancy",
        "decision": "KEEP - beneficio significativo"
    },
    
    "intent_detection": {
        "latency_added": 50,  # ms
        "quality_improvement": "Enables routing",
        "decision": "KEEP - habilita optimizaciones"
    }
}

# 4. STREAMING PARA MEJOR UX
def dona_stream_response(query):
    """
    Streaming hace que la latencia PERCIBIDA sea menor
    aunque la latencia total sea la misma.
    
    Usuario ve tokens aparecer → se siente más rápido
    """
    for token in llm.stream(prompt):
        yield token
```

### Targets de latencia para DONA:

```
TIPO DE QUERY          │ TARGET    │ ACTUAL    │ STATUS
───────────────────────┼───────────┼───────────┼────────
Saludo                 │ < 500ms   │ 400ms     │ ✅
Precio simple          │ < 1500ms  │ 1200ms    │ ✅
Disponibilidad         │ < 1500ms  │ 1300ms    │ ✅
Recomendación          │ < 3000ms  │ 2500ms    │ ✅
Cálculo de materiales  │ < 5000ms  │ 4000ms    │ ✅
```

---

## Resumen del Capítulo 45

| Estrategia | Impacto | Dificultad |
|------------|---------|------------|
| **Modelo más pequeño** | Alto | Baja |
| **Router inteligente** | Alto | Media |
| **Caching** | Alto (para prompts repetidos) | Media |
| **Remover componentes** | Variable | Baja |
| **Binary quantization** | Medio | Baja |
| **Sharding** | Medio | Alta |

---

## Key Takeaways:

```
1. La latencia depende del CONTEXTO de tu aplicación
   (e-commerce vs diagnóstico médico)

2. CASI TODA la latencia viene de TRANSFORMERS
   → El LLM es el MAYOR CULPABLE

3. ORDEN DE PRIORIDAD:
   1. Core LLM (modelos pequeños, routing, caching)
   2. Otros transformers (evaluar si valen la pena)
   3. Retrieval (binary quantization, sharding)

4. MEDIR latencia Y calidad de cada componente
   para tomar decisiones informadas

5. Con observabilidad robusta, podés iterar
   hasta alcanzar la latencia que tu proyecto necesita
```

---

## Próximo: Multimodal RAG

Incorporando imágenes y PDFs en sistemas RAG.

---
