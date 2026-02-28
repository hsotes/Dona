# Capítulo 33: Hallucinations y Grounding

---

## El Problema Central

> "Las hallucinations son una preocupación constante cuando trabajás con LLMs, e incluso un sistema RAG bien diseñado puede seguir alucinando."

---

## Ejemplo: El Descuento Inventado

```
ESCENARIO:
Chatbot de customer service para tienda online.

Usuario: "¿Tienen descuentos para estudiantes?"

Retriever encuentra:
├── Info sobre descuento para seniors (10%)
└── Info sobre descuento para clientes nuevos (10%)

System prompt: "Sé útil con los clientes"

LLM responde:
"¡Absolutamente! Podés obtener 10% de descuento con 
tu credencial de estudiante. El mismo descuento que 
ofrecemos a seniors y clientes nuevos."

EL PROBLEMA: El descuento de estudiantes NO EXISTE.
El LLM lo inventó.
```

---

## Por Qué los LLMs Alucinan

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Los LLMs están diseñados para producir               │
│   SECUENCIAS DE TEXTO PROBABLES                        │
│   con algo de randomización para variedad.             │
│                                                         │
│   Secuencias probables FRECUENTEMENTE son precisas     │
│   PERO NO SIEMPRE.                                     │
│                                                         │
│   Los LLMs NO diferencian entre:                       │
│   ├── VERDADERO y FALSO                               │
│   └── Solo entre PROBABLE e IMPROBABLE                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Por Qué las Hallucinations son Problemáticas

```
1. INFORMACIÓN INCORRECTA
   No querés dar info falsa a usuarios.

2. SUENAN PLAUSIBLES
   Casi por definición, las alucinaciones suenan creíbles.
   Más difícil de detectar que nonsense total.

3. EROSIÓN DE CONFIANZA
   Con el tiempo, alucinaciones ocasionales causan
   que usuarios pierdan confianza en tu sistema,
   incluso si la mayoría del contenido es preciso.
```

---

## Tipos de Hallucinations

### Nivel 1: Error de detalle

```
REALIDAD: Descuento senior es 10%
LLM DICE: Descuento senior es 5%

El concepto existe, pero el detalle está mal.
```

### Nivel 2: Negación incorrecta

```
REALIDAD: Existe descuento senior
LLM DICE: No tenemos descuento para seniors

Niega algo que sí existe.
```

### Nivel 3: Invención completa

```
REALIDAD: No existe descuento estudiante
LLM DICE: Tenemos descuento estudiante del 10%

Inventa algo que no existe.
```

---

## La Verdad Fría y Dura

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   NO HAY SOLUCIÓN PERFECTA PARA HALLUCINATIONS         │
│                                                         │
│   Al menos no actualmente.                             │
│                                                         │
│   PERO: RAG es uno de los mejores approaches           │
│   disponibles actualmente, y hay formas de             │
│   refinarlo para reducir aún más las alucinaciones.    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Técnica 1: Self-Consistency Checking

### Sin knowledge base:

```
Hacer que el modelo genere MÚLTIPLES completions
para el mismo prompt y verificar si la info factual
es CONSISTENTE entre ellas.

IDEA: Si el LLM está alucinando, lo hará inconsistentemente.
      Diferencias factuales serán detectables.

PROBLEMA: Costoso y poco confiable en la práctica.
```

---

## Técnica 2: Grounding en Knowledge Base

### El approach principal para RAG:

```
Modificar el system prompt para que el LLM
SOLO haga claims factuales basados en info recuperada.
```

### Ejemplo de prompt:

```python
GROUNDED_SYSTEM_PROMPT = """
Sos un asistente que responde preguntas basándote 
ÚNICAMENTE en los documentos proporcionados.

REGLAS ESTRICTAS:
1. Solo podés hacer afirmaciones factuales que estén 
   DIRECTAMENTE soportadas por los documentos
2. Si la información no está en los documentos, decí:
   "No tengo información sobre eso en los documentos disponibles"
3. NO inferís, NO asumís, NO completás información faltante
4. Si no estás seguro, expresá la incertidumbre

PROHIBIDO:
- Inventar información
- Generalizar más allá de lo que dicen los documentos
- Asumir que algo existe porque "tiene sentido"
"""
```

---

## Técnica 3: Citar Fuentes

### La idea:

```
Requerir que el LLM CITE las fuentes de cada claim.

BENEFICIOS:
├── Aumenta probabilidad de que use los documentos
├── Facilita verificación por humanos
└── Hace las alucinaciones más obvias
```

### Implementación en prompt:

```python
CITATION_PROMPT = """
Al responder, citá la fuente de cada afirmación factual.

Formato:
"El cemento Portland cuesta $8,500 [Documento 1]"
"El descuento para seniors es del 10% [Documento 3]"

Si no podés citar una fuente para una afirmación,
NO la incluyas en tu respuesta.
"""
```

### El riesgo:

```
⚠️ EL LLM PUEDE ALUCINAR LAS CITAS TAMBIÉN

"El descuento estudiante es 10% [Documento 2]"
→ Pero el Documento 2 no dice nada de estudiantes

Necesitás verificación externa para citas confiables.
```

---

## Técnica 4: ContextCite

### Sistema de verificación externa:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ContextCite procesa la respuesta ORACIÓN POR ORACIÓN │
│                                                         │
│   Para cada oración:                                   │
│   ├── Atribuye a uno de los documentos de contexto    │
│   ├── Genera tag indicando la fuente                  │
│   └── Si no hay soporte, marca "NO SOURCE"            │
│                                                         │
│   Algunas implementaciones dan similarity score        │
│   entre la oración y el documento fuente.              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Uso:

```
1. GENERAR CITAS:
   Tags se usan para agregar citas al output final.

2. EVALUACIÓN:
   Medir qué tan frecuentemente el LLM se basa
   en documentos vs alucina.
```

---

## Técnica 5: ALCE Benchmark

### Para evaluar tu sistema:

```
ALCE (Automatic LLM Citation Evaluation):

1. Provee knowledge bases pre-armados
2. Provee sample questions
3. Tu sistema RAG procesa las preguntas
4. ALCE evalúa las respuestas generadas
```

### Métricas que evalúa:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   FLUENCY:                                             │
│   ¿Qué tan claro es el texto final?                   │
│                                                         │
│   CORRECTNESS:                                         │
│   ¿Qué tan factualmente preciso?                      │
│                                                         │
│   CITATION QUALITY:                                    │
│   ¿Qué tan bien las citas se alinean con las fuentes? │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

> "Estos benchmarks no controlan hallucinations en producción, pero dan sentido de qué tan bien tu sistema las evita."

---

## Resumen de Estrategias

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PASO 1: Construir RAG                                │
│   Ya es el paso más efectivo para minimizar            │
│   hallucinations.                                      │
│                                                         │
│   PASO 2: Refinar System Prompt                        │
│   Asegurar que el LLM base sus respuestas en          │
│   información recuperada.                              │
│                                                         │
│   PASO 3: Requerir Citas                              │
│   Forzar al LLM a citar fuentes para cada claim.      │
│                                                         │
│   PASO 4: Verificación Externa                        │
│   Usar sistemas como ContextCite para validar citas.  │
│                                                         │
│   PASO 5: Testear con Benchmarks                      │
│   Evaluar sistema con ALCE u otros benchmarks.        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Aplicación para DONA 🎯

### System Prompt Anti-Hallucination:

```python
DONA_GROUNDED_PROMPT = """
Sos DONA, asistente de Materiales Boto Mariani.

REGLAS DE GROUNDING (MUY IMPORTANTES):
1. SOLO respondés con información de los documentos proporcionados
2. Si un producto no está en los documentos, decí:
   "No encontré ese producto en nuestro catálogo actual. 
    ¿Querés que busque algo similar?"
3. NUNCA inventés precios, disponibilidad, o características
4. Si no estás segura de algo, preguntá al cliente
5. Citá el producto específico cuando des información

EJEMPLOS DE QUÉ NO HACER:
❌ "Seguramente tenemos eso" (si no está en docs)
❌ "El precio debe ser alrededor de..." (si no hay precio exacto)
❌ "Todos nuestros productos tienen garantía" (si no está en docs)

EJEMPLOS DE QUÉ HACER:
✅ "Según el catálogo, el cemento Portland está a $8,500 [Producto 1]"
✅ "No veo hierro del 12 en los productos encontrados. 
    Tenemos del 8 y del 10, ¿te sirve alguno?"
✅ "No tengo información sobre garantía en estos documentos. 
    ¿Querés que consulte con un vendedor?"
"""
```

### Detección de Hallucinations para DONA:

```python
def check_grounding(response, retrieved_docs):
    """
    Verificar si la respuesta está grounded en los documentos.
    Retorna warnings si detecta posibles hallucinations.
    """
    warnings = []
    
    # Extraer precios mencionados en la respuesta
    precios_respuesta = extract_prices(response)
    precios_docs = [doc['precio'] for doc in retrieved_docs]
    
    for precio in precios_respuesta:
        if precio not in precios_docs:
            warnings.append(f"⚠️ Precio ${precio} no encontrado en documentos")
    
    # Verificar productos mencionados
    productos_respuesta = extract_product_names(response)
    productos_docs = [doc['nombre'] for doc in retrieved_docs]
    
    for producto in productos_respuesta:
        if not any(prod in producto for prod in productos_docs):
            warnings.append(f"⚠️ Producto '{producto}' no encontrado en documentos")
    
    # Detectar frases de riesgo
    risky_phrases = [
        "seguramente tenemos",
        "probablemente",
        "debe costar",
        "aproximadamente",
        "todos nuestros productos"
    ]
    
    for phrase in risky_phrases:
        if phrase.lower() in response.lower():
            warnings.append(f"⚠️ Frase de riesgo detectada: '{phrase}'")
    
    return warnings
```

### Logging para detectar patrones:

```python
def log_response_quality(query, response, docs, warnings):
    """Loggear para análisis posterior"""
    log_entry = {
        "timestamp": datetime.now(),
        "query": query,
        "response": response,
        "num_docs": len(docs),
        "grounding_warnings": warnings,
        "is_grounded": len(warnings) == 0
    }
    
    # Guardar para análisis
    save_to_analytics(log_entry)
    
    # Alertar si hay muchos warnings
    if len(warnings) >= 2:
        alert_for_review(log_entry)
```

---

## Resumen del Capítulo 33

| Estrategia | Qué hace | Efectividad |
|------------|----------|-------------|
| **RAG mismo** | Provee info para grounding | Alta (base) |
| **System Prompt** | Instruye a usar solo docs | Media-Alta |
| **Citar Fuentes** | Fuerza atribución | Media |
| **ContextCite** | Verifica citas externamente | Alta |
| **ALCE Benchmark** | Evalúa sistema | Para testing |

---

## Key Takeaways:

```
1. NO HAY SOLUCIÓN PERFECTA para hallucinations

2. RAG es el paso MÁS EFECTIVO para minimizarlas

3. Refinar system prompt para GROUNDING es el siguiente paso

4. Requerir CITAS ayuda pero el LLM puede alucinar citas también

5. Verificación EXTERNA (ContextCite) da más confianza

6. TESTEAR con benchmarks para medir qué tan bien funciona
```

---

## Próximo: Evaluación de LLMs en RAG

Métricas y benchmarks específicos para evaluar el componente LLM.

---
