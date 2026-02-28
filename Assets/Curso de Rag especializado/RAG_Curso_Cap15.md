# Capítulo 15: Evaluación del Retriever

---

## ¿Qué Importa Medir?

> "Podés evaluar latencia, throughput, uso de recursos... pero lo que realmente importa es la **calidad de búsqueda**. ¿Está encontrando documentos relevantes?"

---

## Los Ingredientes para Evaluar

```
Para evaluar un retriever necesitás:

1. PROMPT: La consulta del usuario
2. RETRIEVED DOCS: Lista rankeada que el retriever retornó
3. GROUND TRUTH: Documentos que DEBERÍAN haberse retornado
                 (los tenés que marcar manualmente)
```

> "Si querés calificar tu retriever, necesitás saber las respuestas correctas."

---

## Las Dos Métricas Fundamentales

### Precision (Precisión)

```
           Documentos relevantes recuperados
Precision = ─────────────────────────────────
             Total de documentos recuperados

"¿Qué % de lo que trajo es relevante?"
```

### Recall (Exhaustividad)

```
         Documentos relevantes recuperados
Recall = ─────────────────────────────────────────
         Total de documentos relevantes en la KB

"¿Qué % de los relevantes encontró?"
```

---

## Ejemplo Práctico

### Situación:

```
Knowledge Base tiene 10 documentos relevantes para el prompt.
(Los marcaste manualmente como ground truth)
```

### Run 1:

```
Retriever retorna: 12 documentos
Relevantes encontrados: 8

Precision = 8/12 = 66%  (8 de 12 son relevantes)
Recall = 8/10 = 80%     (encontró 8 de los 10)
```

### Run 2 (después de ajustar settings):

```
Retriever retorna: 15 documentos
Relevantes encontrados: 9

Precision = 9/15 = 60%  (bajó - más basura)
Recall = 9/10 = 90%     (subió - encontró más)
```

> "Cambiaste un poco de precision por más recall."

---

## Precision vs Recall: El Trade-off

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PRECISION:                                           │
│   ├── Penaliza por retornar documentos IRRELEVANTES   │
│   └── Mide qué tan CONFIABLES son los resultados      │
│                                                         │
│   RECALL:                                              │
│   ├── Penaliza por OMITIR documentos relevantes       │
│   └── Mide qué tan COMPLETO es el retriever           │
│                                                         │
│   PERFECTO = Rankear los relevantes arriba            │
│              y SOLO retornar esos                      │
│                                                         │
│   EN LA PRÁCTICA: Hay trade-off entre ambos           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Precision@K y Recall@K

### ¿Por qué "@K"?

```
Las métricas dependen de CUÁNTOS documentos retornás.
Para estandarizar, se miden en "top K documentos".
```

### Ejemplo:

```
Ranking del retriever:
Rank 1: ✅ Relevante
Rank 2: ❌ Irrelevante
Rank 3: ❌ Irrelevante
Rank 4: ✅ Relevante
Rank 5: ✅ Relevante
Rank 6: ❌ Irrelevante
Rank 7: ✅ Relevante
Rank 8: ❌ Irrelevante
Rank 9: ✅ Relevante
Rank 10: ✅ Relevante

Precision@5 = 3/5 = 60%   (3 relevantes en top 5)
Precision@10 = 6/10 = 60% (6 relevantes en top 10)

Si hay 8 relevantes en total en la KB:
Recall@10 = 6/8 = 75%     (encontró 6 de 8)
```

### Valores típicos de K:

```
Estricto: @1, @2, @5
Generoso: @5 a @15 (más común)
```

---

## MAP@K (Mean Average Precision)

### ¿Qué mide?

```
Evalúa el PROMEDIO de precision para documentos relevantes.
Premia rankear los relevantes ARRIBA.
```

### Cálculo paso a paso:

```
Top 6 documentos del retriever:

Rank | Relevante? | Precision@K
─────┼────────────┼────────────
  1  |     ✅     | 1/1 = 1.0   ← sumar
  2  |     ❌     | 1/2 = 0.5
  3  |     ❌     | 1/3 = 0.33
  4  |     ✅     | 2/4 = 0.5   ← sumar
  5  |     ✅     | 3/5 = 0.6   ← sumar
  6  |     ❌     | 3/6 = 0.5

Solo sumamos las filas con documentos relevantes:
1.0 + 0.5 + 0.6 = 2.1

Dividimos por cantidad de relevantes encontrados (3):
AP@6 = 2.1 / 3 = 0.7

MAP = Promedio de AP sobre múltiples prompts
```

### Por qué MAP es útil:

```
Si un documento irrelevante se cuela arriba en el ranking,
baja la precision de TODOS los relevantes debajo de él.

Alto MAP = relevantes están bien rankeados arriba
```

---

## MRR (Mean Reciprocal Rank)

### ¿Qué mide?

```
La posición del PRIMER documento relevante.

"¿Qué tan rápido encontrás algo útil?"
```

### Fórmula:

```
Reciprocal Rank = 1 / (posición del primer relevante)

Si el primer relevante está en:
├── Rank 1 → RR = 1/1 = 1.0
├── Rank 2 → RR = 1/2 = 0.5
├── Rank 4 → RR = 1/4 = 0.25
└── Rank 6 → RR = 1/6 = 0.17
```

### MRR sobre múltiples prompts:

```
4 búsquedas, primer relevante en posiciones: 1, 3, 6, 2

RR de cada una: 1, 1/3, 1/6, 1/2

MRR = (1 + 0.33 + 0.17 + 0.5) / 4 = 0.5
```

### Cuándo usar MRR:

```
Cuando importa tener AL MENOS UN relevante lo más arriba posible.
```

---

## Resumen de Métricas

| Métrica | Qué mide | Cuándo usar |
|---------|----------|-------------|
| **Recall@K** | % de relevantes encontrados | Siempre (la más fundamental) |
| **Precision@K** | % de resultados que son relevantes | Cuando importa no traer basura |
| **MAP@K** | Promedio de precision en relevantes | Cuando importa el ranking |
| **MRR** | Posición del primer relevante | Cuando un buen resultado basta |

---

## Cómo Usar las Métricas

### Para evaluar y mejorar:

```python
# Ejemplo: Comparar configuraciones de hybrid search

config_a = {"beta": 0.7}  # 70% semantic
config_b = {"beta": 0.5}  # 50% semantic
config_c = {"beta": 0.3}  # 30% semantic

# Correr sobre conjunto de prompts de prueba con ground truth

results_a = evaluate(config_a, test_prompts)
results_b = evaluate(config_b, test_prompts)
results_c = evaluate(config_c, test_prompts)

# Comparar
print(f"Config A - Recall@5: {results_a.recall_5}, Precision@5: {results_a.precision_5}")
print(f"Config B - Recall@5: {results_b.recall_5}, Precision@5: {results_b.precision_5}")
print(f"Config C - Recall@5: {results_c.recall_5}, Precision@5: {results_c.precision_5}")

# Elegir la mejor configuración
```

---

## El Desafío: Ground Truth

### El problema:

```
❌ Todas las métricas requieren GROUND TRUTH
❌ Alguien tiene que marcar manualmente qué docs son relevantes
❌ Es un proceso lento y tedioso
```

### La recompensa:

```
✅ Sistema que podés monitorear durante desarrollo
✅ Sistema que podés monitorear en producción
✅ Sabés si tus cambios mejoran o empeoran las cosas
```

---

## Aplicación para DONA 🎯

### Crear un test set:

```
1. Seleccionar 20-50 prompts reales de usuarios
2. Para cada prompt, marcar manualmente:
   "¿Qué productos DEBERÍAN aparecer?"

Ejemplo:
Prompt: "hierro del 8 acindar"
Ground Truth: [prod_001, prod_002, prod_015]

Prompt: "cemento para revocar"
Ground Truth: [prod_100, prod_101, prod_105, prod_108]
```

### Métricas para DONA:

```
RECALL@5: ¿Encuentra los productos correctos?
          → Lo más importante para DONA

PRECISION@5: ¿Trae mucha basura?
             → Importante pero secundario

MRR: ¿El producto correcto está arriba?
     → Importante para UX
```

### Diagnóstico con métricas:

```
Si Recall@5 es bajo:
├── Problema de embeddings
├── Problema de chunking
└── Documentos no están en la KB

Si Precision@5 es bajo:
├── Trae muchos docs irrelevantes
├── Ajustar metadata filtering
└── Ajustar beta (keyword vs semantic)

Si MRR es bajo:
├── Los relevantes están muy abajo
├── Ajustar RRF parameters
└── Revisar ranking
```

---

## Resumen del Capítulo 15

| Concepto | Explicación |
|----------|-------------|
| **Precision** | % de resultados que son relevantes |
| **Recall** | % de relevantes que encontró |
| **@K** | Métricas sobre top K documentos |
| **MAP** | Promedio de precision (premia buen ranking) |
| **MRR** | Posición del primer relevante |
| **Ground Truth** | Respuestas correctas marcadas manualmente |

---

## Key Takeaway:

> "Recall es la métrica más fundamental porque captura el objetivo más básico del retriever: encontrar documentos relevantes."

---

## Próximo: Wrap-up Módulo 2

Resumen de todas las técnicas de Information Retrieval.

---
