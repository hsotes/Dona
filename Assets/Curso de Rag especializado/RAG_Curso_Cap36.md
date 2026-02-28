# Capítulo 36: Fine-Tuning vs RAG

---

## Dos Técnicas para Mejorar LLMs

> "Mientras RAG es un approach popular y poderoso para mejorar la performance de un LLM, otra técnica llamada fine-tuning también se usa frecuentemente."

---

## ¿Qué es Fine-Tuning?

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   FINE-TUNING:                                         │
│   Re-entrenar un LLM con TUS propios datos             │
│   para actualizar sus parámetros internos.             │
│                                                         │
│   VS                                                   │
│                                                         │
│   RAG:                                                 │
│   Agregar información al PROMPT sin cambiar el modelo. │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Supervised Fine-Tuning (SFT)

### Cómo funciona:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   1. Dataset etiquetado del dominio objetivo:          │
│      ├── Instrucciones/preguntas (input)               │
│      └── Respuestas correctas esperadas (output)       │
│                                                         │
│   2. Feed al modelo las instrucciones                  │
│                                                         │
│   3. Comparar output con respuestas correctas          │
│                                                         │
│   4. Ajustar parámetros internos para                  │
│      alinearse mejor con las respuestas correctas      │
│                                                         │
│   Similar al entrenamiento inicial,                    │
│   pero con dataset de dominio específico.              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Ejemplo: Dominio Médico

### Antes del fine-tuning:

```
Prompt: "Paciente con dolor articular, rash en piel, 
         sensibilidad al sol"

LLM genérico: "Estos síntomas podrían tener varias 
causas. Te recomiendo consultar a un médico."

→ Respuesta GENÉRICA en tono GENÉRICO
```

### Después del fine-tuning:

```
Mismo prompt...

LLM fine-tuned: "Estos síntomas son consistentes con 
Lupus Eritematoso Sistémico (LES). La tríada de 
artralgia, rash malar y fotosensibilidad es 
característica. Recomiendo: ANA, anti-dsDNA, 
complemento C3/C4..."

→ Respuesta más PRECISA, DETALLADA, y en ESTILO médico
```

---

## Trade-offs del Fine-Tuning

### Ventaja:

```
✅ Performance MEJORADA en el dominio objetivo
✅ Respuestas más especializadas
✅ Estilo/tono apropiado para el dominio
```

### Desventaja:

```
❌ Performance DISMINUIDA en OTROS dominios

El proceso de fine-tuning solo optimiza para el dominio target.
Los ajustes pueden degradar performance en otras áreas.
```

### Cuándo vale la pena:

```
Si el modelo SOLO se usará en el dominio especializado:
→ El trade-off generalmente vale la pena

Ejemplo: Router en sistema agentic
├── Solo determina si un prompt necesita retrieval
├── Feliz de usar modelo pequeño
└── Heavy fine-tuning para ESA sola tarea
```

---

## Fine-Tuning NO Enseña Info Nueva

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   IMPORTANTE:                                          │
│                                                         │
│   Fine-tuning tiene mayor impacto en:                  │
│   ├── CÓMO responde (palabras, estilo, estructura)     │
│   └── No tanto en QUÉ INFORMACIÓN conoce              │
│                                                         │
│   Si querés que el LLM SEPA información nueva:         │
│   → RAG es la mejor solución                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## El Consenso Actual

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   RAG = mejor para KNOWLEDGE INJECTION                 │
│   (inyectar información nueva)                         │
│                                                         │
│   FINE-TUNING = mejor para DOMAIN ADAPTATION           │
│   (especializar en tareas/dominios)                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Cuándo usar cada uno:

| Necesidad | Solución |
|-----------|----------|
| Acceso a información nueva | RAG |
| Especializarse en un dominio | Fine-tuning |
| Manejar UN tipo específico de tarea | Fine-tuning |
| Routing en sistema agentic | Fine-tuning |
| Información que cambia frecuentemente | RAG |
| Estilo/tono específico | Fine-tuning |

---

## RAG + Fine-Tuning Juntos

### Combinación poderosa:

```
Fine-tune un modelo específicamente para 
INCORPORAR información recuperada en sus respuestas.

= Especializar el modelo en su ROL dentro del sistema RAG.
```

### Ejemplo:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   MODELO FINE-TUNED PARA RAG:                          │
│                                                         │
│   Entrenado para:                                      │
│   ├── Identificar info relevante en el contexto       │
│   ├── Citar fuentes correctamente                     │
│   ├── Admitir cuando no hay info suficiente           │
│   └── Formato de respuesta específico                 │
│                                                         │
│   +                                                    │
│                                                         │
│   RAG provee la información actual                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Opciones Prácticas

### No necesitás hacer fine-tuning vos mismo:

```
OPCIÓN 1: Modelos pre-fine-tuned
├── Hugging Face tiene miles de modelos fine-tuned
├── Para diferentes dominios y tareas
└── Usarlos directamente sin fine-tuning propio

OPCIÓN 2: Fine-tuning as a Service
├── OpenAI permite fine-tuning de GPT
├── APIs que simplifican el proceso
└── No necesitás infraestructura de training

OPCIÓN 3: Fine-tuning propio
├── Control total
├── Requiere conocimiento y recursos
└── Curso separado recomendado
```

---

## Aplicación para DONA 🎯

### ¿RAG o Fine-tuning para DONA?

```
CATÁLOGO DE PRODUCTOS (precios, stock, specs):
→ RAG ✅
├── Info que cambia frecuentemente
├── Miles de productos
└── Actualización sin re-entrenar

ESTILO DE COMUNICACIÓN (tono argentino, ventas):
→ Fine-tuning ✅ (o prompt engineering)
├── Cómo habla, no qué sabe
├── Consistente para todo el sistema
└── No cambia frecuentemente

ROUTER PARA TIPOS DE CONSULTA:
→ Fine-tuning ✅
├── Tarea específica y simple
├── Modelo pequeño puede ser fine-tuned
└── Una sola responsabilidad
```

### Setup híbrido para DONA:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   COMPONENTE          │ TÉCNICA                        │
│   ─────────────────────┼───────────────────────────────│
│   Router              │ Fine-tuned small model        │
│   Retriever           │ RAG (vector DB)               │
│   Generator           │ Base model + RAG context      │
│   Style/Tone          │ System prompt (o fine-tuning) │
│   Product info        │ RAG (actualizable)            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Modelos pre-fine-tuned útiles para DONA:

```
PARA ESPAÑOL:
├── Modelos fine-tuned en español de Hugging Face
└── Llama fine-tuned para español

PARA CHAT/CUSTOMER SERVICE:
├── Modelos instruction-tuned
├── Chat-optimized models
└── Models fine-tuned para seguir instrucciones

PARA CLASIFICACIÓN/ROUTING:
├── Modelos pequeños fine-tuned para NLI
└── BERT variants para clasificación
```

---

## Resumen del Capítulo 36

| Aspecto | RAG | Fine-Tuning |
|---------|-----|-------------|
| **Mejor para** | Knowledge injection | Domain adaptation |
| **Cambia** | El prompt | Los parámetros del modelo |
| **Info nueva** | ✅ Excelente | ❌ No tan efectivo |
| **Estilo/tono** | Limitado | ✅ Excelente |
| **Actualización** | Fácil (cambiar docs) | Difícil (re-entrenar) |
| **Costo inicial** | Bajo | Alto |
| **Costo ongoing** | Por query | Una vez |

---

## Key Takeaways:

```
1. RAG y Fine-tuning NO son alternativas competidoras
   → Son herramientas COMPLEMENTARIAS

2. RAG = Knowledge injection (qué sabe)
   Fine-tuning = Domain adaptation (cómo responde)

3. Fine-tuning puede DEGRADAR performance en otros dominios
   → Usar solo si el modelo se especializa en una tarea

4. Podés usar AMBOS juntos:
   Fine-tune para incorporar mejor la info de RAG

5. Muchos modelos pre-fine-tuned disponibles
   → No siempre necesitás hacer fine-tuning vos mismo
```

---

## Próximo: Wrap-up Módulo 4

Resumen de LLMs para RAG.

---
