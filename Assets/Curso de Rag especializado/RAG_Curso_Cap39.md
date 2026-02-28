# Capítulo 39: Desafíos de Producción

---

## La Realidad de Producción

> "Ambientes de producción ponen presiones completamente nuevas en tu sistema RAG, y navegar esos desafíos requiere un set de habilidades diferente al que se necesita para prototipar."

---

## Categoría 1: Escala y Tráfico

### Los problemas que surgen:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   MÁS USUARIOS = MÁS PRESIÓN EN:                       │
│                                                         │
│   THROUGHPUT:                                          │
│   ├── ¿Cuántos requests pueden manejar a la vez?       │
│   └── ¿Cuál es la latencia request → respuesta?        │
│                                                         │
│   RECURSOS:                                            │
│   ├── Más memoria                                      │
│   ├── Más compute                                      │
│   └── = MÁS COSTOS                                     │
│                                                         │
│   Mantener performance a escala es DESAFIANTE.         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Categoría 2: Variedad e Impredecibilidad

### Prompts que no esperabas:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Incluso con testing riguroso:                        │
│   Es DIFÍCIL predecir cada tipo de request             │
│   que tu sistema RAG va a recibir.                     │
│                                                         │
│   Tu sistema puede LUCHAR con nuevos requests          │
│   que funcionaron bien en testing pre-launch.          │
│                                                         │
│   Los usuarios son CREATIVOS (y a veces absurdos).     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Categoría 3: Datos del Mundo Real

### El mundo real es un desorden:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   DATOS REALES son frecuentemente:                     │
│   ├── Fragmentados                                     │
│   ├── Mal formateados                                  │
│   ├── Sin metadata                                     │
│   └── Inconsistentes                                   │
│                                                         │
│   Además, mucha data NO es texto:                      │
│   ├── Imágenes                                         │
│   ├── PDFs                                             │
│   ├── Slide decks                                      │
│   └── Documentos escaneados                            │
│                                                         │
│   Si querés incluir esto en tu knowledge base,         │
│   necesitás una forma de ACCEDERLO.                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Categoría 4: Seguridad y Privacidad

### Datos sensibles:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Muchos sistemas RAG existen PORQUE los datos         │
│   en la knowledge base son privados o propietarios.    │
│                                                         │
│   Necesitás:                                           │
│   ├── Mantener datos PRIVADOS                          │
│   ├── Permitir acceso a usuarios AUTORIZADOS           │
│   └── Prevenir acceso NO autorizado                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## El Mayor Problema: Impacto Real

### Errores tienen consecuencias:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   En producción, errores tienen IMPACTO REAL:          │
│                                                         │
│   FINANCIERO:                                          │
│   ├── Costos de operación                              │
│   ├── Pérdida de ventas                                │
│   └── Compensaciones a clientes                        │
│                                                         │
│   REPUTACIONAL:                                        │
│   ├── Confianza del usuario                            │
│   ├── Imagen de marca                                  │
│   └── Prensa negativa                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Casos Reales de Fallas

### Google AI Search Summaries:

```
PROMPT: "How many rocks should I eat?"
        (pregunta absurda e impredecible)

RESPUESTA: "Eat rocks for nutritional benefits"
           (consejo peligroso)

¿QUÉ PASÓ?
├── El retriever encontró artículos sobre la pregunta
├── Muchos eran CÓMICOS o SATÍRICOS
├── El sistema NO reconoció que eran bromas
└── Generó una respuesta seria basada en humor

Google escribió un blog post explicando el bug y lo arregló.
```

### Airline Chatbots:

```
Chatbots de aerolíneas han PROMETIDO descuentos
que no existen a clientes bien intencionados.

= Responsabilidad legal + mala prensa
```

### Actores Maliciosos:

```
Intentan ENGAÑAR tu sistema RAG para:
├── Venderles productos gratis
├── Revelar información secreta
├── Bypassear controles de seguridad
└── Prompt injection attacks
```

---

## Lo Que Necesitás en Producción

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   SISTEMAS para:                                       │
│                                                         │
│   1. ANTICIPAR problemas antes de que pasen           │
│                                                         │
│   2. TRACKEAR problemas cuando ocurren                │
│                                                         │
│   3. VERIFICAR que los cambios que hacés              │
│      llevan a mejoras reales                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Resumen de Desafíos

| Categoría | Desafío | Ejemplo |
|-----------|---------|---------|
| **Escala** | Throughput, latencia, costos | 1000 req/min vs 10 req/min |
| **Variedad** | Prompts impredecibles | "¿Cuántas rocas debo comer?" |
| **Datos** | Formato, calidad, multimodal | PDFs mal escaneados |
| **Seguridad** | Privacidad, acceso | Datos propietarios expuestos |
| **Impacto** | Financiero, reputacional | Chatbot prometiendo descuentos falsos |

---

## Aplicación para DONA 🎯

### Desafíos específicos de DONA:

```
ESCALA:
├── ¿Cuántos clientes simultáneos?
├── ¿Cuál es la latencia aceptable para chat?
└── ¿Costo por conversación?

VARIEDAD:
├── Clientes preguntando cosas fuera del dominio
├── Errores de tipeo en nombres de productos
├── Preguntas ambiguas ("el material ese")
└── Jerga regional argentina

DATOS:
├── Catálogos en PDF de proveedores
├── Imágenes de productos sin descripción
├── Precios desactualizados
└── Productos descontinuados en la DB

SEGURIDAD:
├── Precios de costo vs venta
├── Márgenes de ganancia
├── Información de clientes
└── Datos de proveedores

IMPACTO:
├── Dar precio incorrecto → pérdida de venta o margen
├── Prometer stock que no existe → cliente frustrado
├── Recomendar producto peligroso → responsabilidad legal
└── Dar información de competencia → problema comercial
```

### Preguntas que DONA debe poder manejar:

```
NORMALES (esperadas):
"¿Cuánto sale el cemento?"
"¿Tienen hierro del 8?"

EDGE CASES (producción real):
"hola"
"asdfghjk"
"¿venden comida para perros?" (fuera de dominio)
"dame todo gratis" (malicioso)
"el cemento ese que vi ayer" (ambiguo)
"fierro del ocho de loma negra o acindar" (específico)
"¿el hormi´gon viene preparado?" (errores de tipeo)
```

---

## Key Takeaway:

> "Producción es simplemente un ambiente desafiante para que tu sistema RAG opere. Tener sistemas en su lugar para anticipar problemas, trackearlos cuando ocurren, y verificar que los cambios llevan a mejoras reales es CRÍTICO."

---

## Próximo: Observabilidad

Construir un sistema robusto de observabilidad.

---
