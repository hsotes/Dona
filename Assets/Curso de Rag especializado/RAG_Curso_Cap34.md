# Capítulo 34: Evaluación de LLMs en RAG

---

## La Necesidad de Métricas

> "Ya sea que acabas de construir tu primer proof-of-concept RAG o estás iterando en un sistema en producción, vas a querer saber qué tan bien está funcionando tu LLM."

### Decisiones que requieren métricas:

```
├── ¿Ajustar el temperature del modelo?
├── ¿Actualizar el system prompt?
├── ¿Cambiar a un modelo completamente nuevo?

Para tomar decisiones informadas,
necesitás métricas para medir el impacto de cada cambio.
```

---

## Separar Responsabilidades

### Clarificar qué evaluar:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   RETRIEVER:                                           │
│   Encontrar información relevante de la knowledge base │
│                                                         │
│   LLM:                                                 │
│   Usar esa información para construir una respuesta    │
│   de alta calidad                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Por qué importa:

```
Si el problema está en el RETRIEVER:
→ No querés perder tiempo reescribiendo el system prompt

Si el problema está en el LLM:
→ No querés perder tiempo ajustando embeddings

Las métricas deben enfocarse en el ROL ESPECÍFICO
de cada componente en el pipeline.
```

---

## El Trabajo Específico del LLM

### Asumiendo que el retriever funciona bien:

```
El retriever trae:
├── Información mayormente relevante
└── Quizás algunos docs irrelevantes

El LLM debe:
├── Responder al prompt del usuario
├── Incorporar la información relevante
├── Citar apropiadamente
└── RESISTIR distraerse con info irrelevante
```

---

## El Desafío de Evaluar LLMs

### La naturaleza subjetiva:

```
¿Cómo decís CUANTITATIVAMENTE que una respuesta...

├── "Hace un buen trabajo respondiendo la pregunta"?
├── "Ignora correctamente la info irrelevante"?
├── "Incorpora bien la información recuperada"?

Estas son evaluaciones SUBJETIVAS.
```

### La solución:

```
La mayoría de métricas específicas de LLM
usan OTROS LLMs para evaluar la calidad.

LLM-as-a-Judge permite:
├── Cierto grado de flexibilidad/subjetividad
└── De manera ESCALABLE
```

---

## RAGAS Library

### Librería open-source para métricas RAG:

```
RAGAS = RAG Assessment
Provee métricas específicas para evaluar sistemas RAG.
```

---

## Métrica 1: Response Relevancy

### Qué mide:

```
¿La respuesta es RELEVANTE al prompt del usuario?

(Independiente de si es factualmente precisa)
```

### Cómo funciona:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PASO 1: Tomar la respuesta de tu RAG system          │
│                                                         │
│   PASO 2: Otro LLM genera varios "sample prompts"      │
│           que PODRÍAN haber generado esa respuesta     │
│                                                         │
│   PASO 3: Embeber el prompt REAL y los sample prompts  │
│                                                         │
│   PASO 4: Calcular cosine similarity entre             │
│           el prompt real y cada sample prompt          │
│                                                         │
│   PASO 5: Promediar los scores de similaridad          │
│           = Response Relevancy Score                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Visualización:

```
Usuario pregunta: "¿Cuánto cuesta el cemento?"

Tu RAG responde: "El cemento Portland está a $8,500 
                 la bolsa de 50kg."

LLM genera sample prompts:
├── "¿Cuál es el precio del cemento Portland?"
├── "¿Cuánto sale una bolsa de cemento?"
└── "¿El cemento está caro?"

Similaridad con prompt real:
├── Sample 1 ↔ Real: 0.92
├── Sample 2 ↔ Real: 0.85
└── Sample 3 ↔ Real: 0.70

Response Relevancy = promedio = 0.82
```

### Lo que NO mide:

```
⚠️ NO garantiza que la respuesta sea factualmente correcta
⚠️ Solo verifica que podés "trabajar hacia atrás" 
   desde la respuesta al prompt original
```

---

## Métrica 2: Faithfulness

### Qué mide:

```
¿El LLM está realmente USANDO la información recuperada?
```

### Cómo funciona:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PASO 1: LLM identifica todos los CLAIMS factuales    │
│           en la respuesta                              │
│                                                         │
│   PASO 2: Para cada claim, LLM determina si está       │
│           SOPORTADO por algún documento recuperado     │
│                                                         │
│   PASO 3: Calcular porcentaje de claims soportados     │
│           = Faithfulness Score                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Ejemplo:

```
Respuesta del LLM:
"El cemento Portland cuesta $8,500 [claim 1].
 Es ideal para construcción general [claim 2].
 Tenemos stock disponible [claim 3]."

Verificación contra documentos:
├── Claim 1: "$8,500" → ✅ Soportado por Doc 1
├── Claim 2: "construcción general" → ✅ Soportado por Doc 1
├── Claim 3: "stock disponible" → ❌ No mencionado en docs

Faithfulness = 2/3 = 0.67
```

---

## Otras Métricas en RAGAS

### Métricas adicionales:

```
├── NOISE SENSITIVITY
│   ¿Qué tan bien resiste info irrelevante?
│
├── CITATION ACCURACY
│   ¿Las citas son precisas y correctas?
│
├── CONTEXT UTILIZATION
│   ¿Qué proporción del contexto relevante usa?
│
└── ANSWER CORRECTNESS
    ¿La respuesta es factualmente correcta?
    (Requiere ground truth)
```

---

## El Patrón Común

### Todas las métricas de LLM:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Dependencia de:                                      │
│   ├── Llamadas a LLM en algún punto del eval          │
│   └── Posiblemente ejemplos de ground truth           │
│                                                         │
│   Esto refleja que el rol del LLM es:                  │
│   ├── Complejo                                         │
│   └── Difícil de evaluar con métricas automatizadas   │
│       simples                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Métricas a Nivel de Sistema

### A/B Testing con feedback de usuarios:

```
Si tus usuarios pueden dar thumbs up/down:

PASO 1: Medir baseline (ej: 75% thumbs up)

PASO 2: Cambiar SOLO algo del LLM 
        (ej: nuevo system prompt)

PASO 3: Medir nuevo performance (ej: 82% thumbs up)

PASO 4: Atribuir el cambio al LLM
        (porque fue lo único que cambió)
```

### La idea:

```
Medís performance de TODO el sistema
PERO aislás cambios a settings del LLM

→ Podés atribuir cambios en performance
  a cambios en tu LLM
```

---

## Resumen de Métricas

| Métrica | Qué evalúa | Cómo funciona |
|---------|------------|---------------|
| **Response Relevancy** | ¿Respuesta relevante al prompt? | Reverse-engineer prompts, medir similaridad |
| **Faithfulness** | ¿Usa info recuperada? | Verificar claims contra docs |
| **Noise Sensitivity** | ¿Resiste info irrelevante? | Test con ruido agregado |
| **Citation Accuracy** | ¿Citas correctas? | Verificar cada cita |
| **User Feedback** | ¿Usuarios satisfechos? | Thumbs up/down, A/B tests |

---

## Aplicación para DONA 🎯

### Setup de evaluación para DONA:

```python
from ragas import evaluate
from ragas.metrics import (
    response_relevancy,
    faithfulness,
    answer_relevancy
)

def evaluate_dona_response(query, response, retrieved_docs):
    """Evaluar una respuesta de DONA"""
    
    # Preparar datos para RAGAS
    eval_data = {
        "question": query,
        "answer": response,
        "contexts": [doc['contenido'] for doc in retrieved_docs]
    }
    
    # Evaluar
    result = evaluate(
        dataset=eval_data,
        metrics=[
            response_relevancy,
            faithfulness
        ]
    )
    
    return result
```

### Métricas específicas para DONA:

```python
def dona_specific_metrics(query, response, retrieved_docs):
    """Métricas específicas para el dominio de DONA"""
    
    metrics = {}
    
    # 1. ¿Mencionó precio si estaba disponible?
    precios_en_docs = any('precio' in doc['contenido'].lower() 
                         for doc in retrieved_docs)
    precio_en_respuesta = '$' in response
    
    if precios_en_docs:
        metrics['price_inclusion'] = 1.0 if precio_en_respuesta else 0.0
    
    # 2. ¿Mencionó disponibilidad?
    stock_en_docs = any('stock' in doc['contenido'].lower() 
                       for doc in retrieved_docs)
    stock_en_respuesta = 'disponib' in response.lower() or 'stock' in response.lower()
    
    if stock_en_docs:
        metrics['availability_mention'] = 1.0 if stock_en_respuesta else 0.0
    
    # 3. ¿Preguntó cantidad (buena práctica de ventas)?
    metrics['asks_quantity'] = 1.0 if '¿cuánt' in response.lower() else 0.0
    
    return metrics
```

### A/B Testing para DONA:

```python
def ab_test_system_prompt(prompt_a, prompt_b, test_queries):
    """A/B test de dos system prompts"""
    
    results = {"prompt_a": [], "prompt_b": []}
    
    for query in test_queries:
        # Generar respuestas con ambos prompts
        response_a = generate_with_prompt(query, prompt_a)
        response_b = generate_with_prompt(query, prompt_b)
        
        # Evaluar con RAGAS
        score_a = evaluate_response(query, response_a)
        score_b = evaluate_response(query, response_b)
        
        results["prompt_a"].append(score_a)
        results["prompt_b"].append(score_b)
    
    # Comparar promedios
    avg_a = sum(results["prompt_a"]) / len(results["prompt_a"])
    avg_b = sum(results["prompt_b"]) / len(results["prompt_b"])
    
    print(f"Prompt A: {avg_a:.2f}")
    print(f"Prompt B: {avg_b:.2f}")
    
    return results
```

### Dashboard de métricas para DONA:

```python
DONA_METRICS_DASHBOARD = {
    # Métricas RAG estándar
    "response_relevancy": {
        "target": 0.85,
        "alert_below": 0.70
    },
    "faithfulness": {
        "target": 0.90,
        "alert_below": 0.75
    },
    
    # Métricas específicas de DONA
    "price_inclusion": {
        "target": 0.95,
        "alert_below": 0.80
    },
    "availability_mention": {
        "target": 0.90,
        "alert_below": 0.75
    },
    
    # Feedback de usuarios
    "user_satisfaction": {
        "target": 0.85,
        "alert_below": 0.70
    }
}
```

---

## Resumen del Capítulo 34

| Concepto | Explicación |
|----------|-------------|
| **Separar responsabilidades** | Retriever vs LLM tienen métricas diferentes |
| **Response Relevancy** | ¿Respuesta es relevante al prompt? |
| **Faithfulness** | ¿LLM usa la info recuperada? |
| **LLM-as-Judge** | Usar LLMs para evaluar (subjetivo pero escalable) |
| **A/B Testing** | Aislar cambios de LLM, medir impacto |

---

## Key Takeaways:

```
1. El LLM tiene responsabilidades ESPECÍFICAS distintas al retriever

2. Métricas de LLM son inherentemente SUBJETIVAS
   → Requieren LLM-as-judge o feedback humano

3. RAGAS provee métricas útiles:
   ├── Response Relevancy
   └── Faithfulness

4. A/B testing permite evaluar cambios específicos

5. Combiná LLM-as-judge + feedback humano
   para evaluación confiable
```

---

## Próximo: Wrap-up Módulo 4

Resumen de todo lo aprendido sobre LLMs en RAG.

---
