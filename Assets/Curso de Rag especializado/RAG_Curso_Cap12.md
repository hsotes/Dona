# Capítulo 12: BM25 (Best Matching 25)

---

## ¿Qué es BM25?

> "Mientras TF-IDF sigue siendo un algoritmo clásico, el algoritmo usado en la mayoría de los retrievers se llama **Best Matching 25**, o simplemente **BM25**."

### ¿Por qué "25"?

```
Fue la variante #25 en una serie de funciones de scoring
propuestas por sus creadores.

(Probaron 24 variantes antes de llegar a esta)
```

---

## BM25 vs TF-IDF

### Similitudes:

```
Ambos:
├── Convierten texto a sparse vectors
├── Cuentan frecuencia de palabras
├── Usan IDF para palabras raras
└── Rankean documentos por score
```

### Mejoras de BM25:

| TF-IDF | BM25 |
|--------|------|
| Más keywords = más puntos (lineal) | Rendimientos decrecientes |
| Penaliza docs largos agresivamente | Penalización más suave |
| Sin parámetros ajustables | 2 hyperparámetros tuneables |

---

## Mejora 1: Term Frequency Saturation

### El problema con TF-IDF:

```
TF-IDF piensa:
├── "pizza" 10 veces = score X
├── "pizza" 20 veces = score 2X
└── "pizza" 100 veces = score 10X

Pero en realidad:
├── Un doc con "pizza" 20 veces NO es 2x más relevante
│   que uno con "pizza" 10 veces
└── Después de cierto punto, más repeticiones no ayudan
```

### La solución de BM25:

```
TERM FREQUENCY SATURATION (Saturación de Frecuencia)

                    TF-IDF (lineal)
Score              /
  │              /
  │            /
  │          /  
  │        / ___________  BM25 (saturación)
  │      //
  │    //
  │  //
  │_//____________________
  0     10    20    30    40    Frecuencia de keyword

BM25: Después de cierto punto, más repeticiones 
      dan menos puntos adicionales.
```

---

## Mejora 2: Document Length Normalization

### El problema con TF-IDF:

```
TF-IDF penaliza docs largos MUY agresivamente

Puede descartar documentos largos pero MUY relevantes
solo porque son largos.
```

### La solución de BM25:

```
DOCUMENT LENGTH NORMALIZATION (Normalización de Longitud)

├── Sigue penalizando documentos largos
├── PERO con penalizaciones DECRECIENTES
└── Docs largos con alta frecuencia de keywords todavía pueden ganar

Resultado: Documentos largos pueden tener score alto
           si tienen frecuencia alta de keywords.
```

---

## Mejora 3: Hyperparámetros Tuneables

### Los dos parámetros de BM25:

| Parámetro | Controla | Valor típico |
|-----------|----------|--------------|
| **k1** | Term frequency saturation | 1.2 - 2.0 |
| **b** | Document length normalization | 0.75 |

### ¿Qué hacen?

```
k1 (saturation):
├── k1 alto → más recompensa por repeticiones
└── k1 bajo → saturación más rápida

b (length normalization):
├── b = 1 → penalización completa por longitud
├── b = 0 → sin penalización por longitud
└── b = 0.75 → balance típico
```

### Ventaja para producción:

```
Podés TUNEAR estos valores para tu dataset específico.

Ejemplo:
├── Knowledge base con docs muy variados en longitud → ajustar b
├── Knowledge base técnica donde repetición importa → ajustar k1
```

---

## Por Qué BM25 es el Estándar

| Aspecto | BM25 vs TF-IDF |
|---------|----------------|
| **Performance** | Significativamente mejor |
| **Recursos** | Aproximadamente iguales |
| **Flexibilidad** | Hyperparámetros tuneables |
| **Tiempo** | Probado por décadas |

> "BM25 logra un buen balance entre complejidad y performance en aplicaciones del mundo real."

---

## Resumen de Keyword Search

### El concepto core:

```
Matchear documentos al prompt basándose en 
qué tan FRECUENTEMENTE aparecen keywords del prompt 
en cada documento.
```

### El proceso:

```
1. Prompt → Sparse Vector (conteo de palabras)
2. Documento → Sparse Vector
3. BM25 calcula score considerando:
   ├── Frecuencia del keyword (con saturación)
   ├── Rareza del keyword (IDF)
   └── Longitud del documento (normalizada)
4. Rankear documentos por score
5. Retornar top documents
```

---

## Fortalezas de Keyword Search

| Fortaleza | Explicación |
|-----------|-------------|
| **Simplicidad** | Fácil de entender y debuggear |
| **Efectividad** | Funciona muy bien en práctica |
| **Benchmark competitivo** | Técnicas avanzadas luchan por superarlo |
| **Exact matching** | Garantiza que docs contengan las keywords |

### Cuándo es especialmente importante:

```
✅ Terminología técnica (el usuario SABE la palabra exacta)
✅ Nombres de productos exactos
✅ Códigos o identificadores
✅ Jerga especializada del dominio
```

---

## Debilidades de Keyword Search

### El problema fundamental:

```
❌ Depende de que el query contenga keywords 
   que EXACTAMENTE matcheen palabras en el documento.

Si el usuario usa palabras DIFERENTES pero con 
el MISMO SIGNIFICADO → keyword search NO encuentra el match.
```

### Ejemplo:

```
Documento: "El automóvil tiene motor V8"
Query: "carro con motor potente"

Keyword search NO encuentra este documento porque:
├── "carro" ≠ "automóvil"
├── "potente" ≠ "V8"
└── Aunque el significado es similar
```

---

## Aplicación para DONA 🎯

### Dónde keyword search funciona bien:

```
✅ "cemento portland" → busca "cemento portland"
✅ "hierro del 8" → busca "hierro del 8"
✅ "varilla adn42" → busca código exacto
✅ "loma negra" → busca marca exacta
```

### Dónde keyword search FALLA:

```
❌ "fierro" → no encuentra "hierro"
❌ "cemento gris" → no encuentra "cemento portland"
❌ "material para columnas" → no sabe qué material
❌ "algo para pegar ladrillos" → no encuentra "mortero"
```

### Hyperparámetros para DONA:

```
Consideraciones:
├── Docs cortos (productos) vs largos (manuales)
├── ¿Importa repetición? (probablemente no mucho)
└── Experimentar con k1 y b

Posible config inicial:
├── k1 = 1.5 (saturación moderada)
└── b = 0.5 (penalización moderada por longitud)
```

---

## Resumen del Capítulo 12

| Concepto | Explicación |
|----------|-------------|
| **BM25** | Algoritmo estándar de keyword search |
| **Saturation** | Rendimientos decrecientes por repetición |
| **Length norm** | Penalización suave para docs largos |
| **k1, b** | Hyperparámetros tuneables |
| **Fortaleza** | Exact matching, simple, efectivo |
| **Debilidad** | No entiende significado/sinónimos |

---

## Key Takeaway:

> "BM25 es excelente para encontrar documentos con las palabras EXACTAS. Pero si el usuario usa palabras diferentes con el mismo significado, necesitamos **Semantic Search**."

---

## Próximo: Semantic Search

Cómo encontrar documentos por SIGNIFICADO, no solo por palabras exactas.

---
