# Guía: Actualizar y Expandir el MCP

## 📄 Agregar PDFs (Normas, Guías, Libros, Ejemplos)

### Método 1: Copiar Manualmente

**Paso 1: Copiar el PDF a la carpeta**
```bash
# Ejemplo: Agregar CIRSOC 201 (Hormigón Armado)
cp "ruta/del/nuevo/pdf/cirsoc-201.pdf" "C:\Users\Hernan Soto\rag-estructuras-mcp\knowledge\normas\pdfs\"

# Ejemplo: Agregar un libro de diseño estructural
cp "Descargas\Manual-Diseno-Acero-McCormac.pdf" "C:\Users\Hernan Soto\rag-estructuras-mcp\knowledge\normas\pdfs\"

# Ejemplo: Agregar ejemplo de cálculo
cp "Proyectos\ejemplo-calculo-columna.pdf" "C:\Users\Hernan Soto\rag-estructuras-mcp\knowledge\normas\pdfs\"
```

**Paso 2: Reiniciar el servidor (opcional)**
El servidor carga los PDFs al iniciar. Para ver el nuevo PDF:
```bash
cd "C:\Users\Hernan Soto\rag-estructuras-mcp"
npm run build
```

**Paso 3: Verificar**
En Claude Code:
```
List available resources
# Deberías ver: pdf://cirsoc-201, pdf://manual-diseno-acero-mccormac, etc.
```

---

### Método 2: Script Automatizado (Recomendado)

Crea un script para agregar PDFs fácilmente:

ya se creo, la guia de carga es GUIA_CONEXION.md

---

## 📊 Agregar Perfiles Nuevos

### Método 1: Editar JSON Directamente

**Archivo: `knowledge/perfiles/perfiles.json`**

```json
[
  ...perfiles existentes,
  {
    "nombre": "HEM 200",
    "tipo": "HEM",
    "designacion": "200",
    "h": 220,
    "b": 220,
    "tw": 11.5,
    "tf": 17.5,
    "r": 18,
    "A": 107,
    "peso": 83.9,
    "Ix": 8091,
    "Iy": 2896,
    "Wx": 736,
    "Wy": 263,
    "Zx": 836,
    "Zy": 409,
    "ix": 8.7,
    "iy": 5.21
  }
]
```

**Verificar:**
```bash
cd "C:\Users\Hernan Soto\rag-estructuras-mcp"
npm run test
# O en Claude Code:
# Read resource perfil://HEM/200
```

---

### Método 2: Re-ejecutar Migración desde Proyecto Original

Si actualizas el proyecto original:

```bash
# 1. Actualizar perfiles en el proyecto original
# Editar: C:\Users\Hernan Soto\App calculo estructural\structcalc-pro\src\data\perfiles\index.ts

# 2. Re-exportar datos
cd "C:\Users\Hernan Soto\App calculo estructural\structcalc-pro"
npx tsx export-data.ts

# 3. Recompilar MCP
cd "C:\Users\Hernan Soto\rag-estructuras-mcp"
npm run build
```

---

## 📚 Agregar Contexto de Normas (para IA)

Para que Claude entienda mejor una norma nueva:

**Archivo: `knowledge/normas/contextos.json`**

```json
[
  ...normas existentes,
  {
    "codigo": "CIRSOC_201",
    "nombre": "CIRSOC 201-2005",
    "descripcion": "Reglamento Argentino de Estructuras de Hormigón Armado",
    "aplicacion": "Diseño de estructuras de hormigón armado",
    "tablasClave": [
      "Tabla 8.1: Factores de reducción de resistencia φ",
      "Tabla 9.1: Recubrimientos mínimos",
      "Tabla 12.1: Longitud de desarrollo"
    ],
    "formulasClave": [
      "Mn = As × fy × (d - a/2)",
      "Vn = Vc + Vs",
      "ld = (fy × ψt × ψe × ψs) / (25 × λ × √f'c) × db"
    ],
    "valores": {
      "phi_flexion": 0.9,
      "phi_corte": 0.75,
      "phi_compresion_con_estribos": 0.65,
      "phi_compresion_con_espiral": 0.75
    }
  },
  {
    "codigo": "AISC_341",
    "nombre": "AISC 341-16",
    "descripcion": "Seismic Provisions for Structural Steel Buildings",
    "aplicacion": "Diseño sismorresistente de estructuras de acero",
    "tablasClave": [
      "Table D1.1: SMF Beam-to-Column Connection Prequalification",
      "Table F2.1: Highly Ductile Member Limitations"
    ],
    "formulasClave": [
      "Mpr = Cpr × Ry × Fy × Z",
      "Ve = 2Mp/Lh + Vgravity"
    ],
    "valores": {
      "Ry_A992": 1.1,
      "Cpr": 1.15,
      "omega_0": 3.0
    }
  }
]
```

---

## 💰 Actualizar Catálogo de Costos

### Método 1: Actualizar CSV

**Archivo: `knowledge/costos/materiales-hierro.csv`**

```csv
codigo,descripcion,rubro,tipo,presentacion,costo_presentacion
,HEB 100,Metalúrgica y Herreria,HEB,Barra de 12 m.,"650.000,00"
,IPE 300,Metalúrgica y Herreria,IPE,Barra de 12 m.,"485.500,50"
```

**Formato importante:**
- Precios en formato argentino: `"16.292,19"` (punto miles, coma decimal)
- Con comillas dobles

---

### Método 2: Script de Actualización de Precios

**Archivo: `scripts/update-prices.ts`**

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

// Factor de actualización (ej: inflación 10%)
const FACTOR = 1.10;

async function updatePrices() {
  const csvPath = path.join(__dirname, '..', 'knowledge', 'costos', 'materiales-hierro.csv');
  const content = await fs.readFile(csvPath, 'utf-8');
  const lines = content.split('\n');

  const updated = lines.map((line, index) => {
    if (index === 0) return line; // Header

    const parts = line.split(',');
    if (parts.length < 6) return line;

    const oldPrice = parts[5].replace(/"/g, '').replace(/\./g, '').replace(',', '.');
    const newPrice = parseFloat(oldPrice) * FACTOR;

    // Formato argentino
    const formatted = newPrice.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    parts[5] = `"${formatted}"`;
    return parts.join(',');
  });

  await fs.writeFile(csvPath, updated.join('\n'));
  console.log(`✓ Precios actualizados con factor ${FACTOR}`);
}

updatePrices();
```

**Uso:**
```bash
cd "C:\Users\Hernan Soto\rag-estructuras-mcp"
npx tsx scripts/update-prices.ts
npm run build
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Agregar Norma Nueva (CIRSOC 201)

```bash
# 1. Copiar PDF
cp "Descargas\cirsoc-201.pdf" "rag-estructuras-mcp\knowledge\normas\pdfs\"

# 2. Agregar contexto (opcional, pero recomendado)
# Editar: knowledge/normas/contextos.json
# Agregar entrada como se mostró arriba

# 3. Recompilar
cd "rag-estructuras-mcp"
npm run build

# 4. Verificar en Claude Code
# List available resources
# Read resource norma://CIRSOC_201
```

---

### Caso 2: Agregar Libro de Diseño Estructural

```bash
# 1. Copiar libro
cp "Biblioteca\McCormac-Diseno-Acero.pdf" "rag-estructuras-mcp\knowledge\normas\pdfs\"

# 2. No requiere contexto adicional

# 3. Recompilar
npm run build

# 4. Usar en Claude
# "Busca en el libro de McCormac información sobre diseño de columnas"
```

---

### Caso 3: Agregar Ejemplo de Cálculo Resuelto

```bash
# 1. Copiar ejemplo
cp "Proyectos\ejemplos\calculo-viga-continua.pdf" "rag-estructuras-mcp\knowledge\normas\pdfs\"

# 2. Recompilar
npm run build

# 3. Usar como referencia
# "Muéstrame el ejemplo de cálculo de viga continua"
# "Compara mi diseño con el ejemplo calculo-viga-continua"
```

---

### Caso 4: Actualizar Precios por Inflación

```bash
# Opción A: Manual
# Editar: knowledge/costos/materiales-hierro.csv
# Actualizar cada precio manualmente

# Opción B: Script (después de crearlo)
cd "rag-estructuras-mcp"
# Editar FACTOR en scripts/update-prices.ts
npx tsx scripts/update-prices.ts
npm run build
```

---

### Caso 5: Agregar Perfiles de Otro País

```bash
# 1. Conseguir datos de perfiles (ej: perfiles europeos)
# 2. Editar: knowledge/perfiles/perfiles.json
# 3. Agregar perfiles siguiendo el formato:

{
  "nombre": "HEA 200",
  "tipo": "HEA",
  "designacion": "200",
  ...propiedades
}

# 4. Recompilar
npm run build

# 5. Usar
# Read resource perfil://HEA/200
```

---

## ⚡ Script Completo de Actualización

**Archivo: `scripts/sync-all.ts`**

```typescript
/**
 * Script para sincronizar todo desde el proyecto original
 */

import { execSync } from 'child_process';

console.log('🔄 Sincronizando datos desde proyecto original...\n');

// 1. Re-exportar datos del proyecto original
console.log('📦 Exportando datos...');
execSync(
  'npx tsx export-data.ts',
  { cwd: 'C:\\Users\\Hernan Soto\\App calculo estructural\\structcalc-pro', stdio: 'inherit' }
);

// 2. Recompilar servidor MCP
console.log('\n🔨 Recompilando servidor MCP...');
execSync('npm run build', { stdio: 'inherit' });

console.log('\n✅ Sincronización completa!');
console.log('   Reinicia Claude Code para ver los cambios');
```

**Agregar al package.json:**
```json
{
  "scripts": {
    "sync": "tsx scripts/sync-all.ts",
    "add-pdf": "tsx scripts/add-pdf.ts",
    "update-prices": "tsx scripts/update-prices.ts"
  }
}
```

**Uso:**
```bash
npm run sync
```

---

## 📝 Checklist de Actualización

Después de agregar contenido:

- [ ] Copiar archivos a carpetas correctas
- [ ] Actualizar JSONs si es necesario
- [ ] Ejecutar `npm run build`
- [ ] Verificar con `npm run test` (opcional)
- [ ] En Claude Code: `List available resources`
- [ ] Probar el nuevo resource/tool

---

## 🚨 Notas Importantes

1. **PDFs grandes**: El servidor carga metadata, no el contenido completo (por ahora)
2. **Vectorización**: Cuando implementes RAG, los PDFs se indexarán automáticamente
3. **Backup**: Antes de actualizar, haz backup de `knowledge/`
4. **Formato de precios**: Siempre usar formato argentino en CSV
5. **Nombres de archivo**: Sin espacios en nombres de PDF (usar guiones)

---

## 🔮 Próximos Pasos (Vectorización)

Cuando agregues vectorización, cada PDF nuevo se indexará automáticamente:

```typescript
// Futuro: scripts/vectorize-pdfs.ts
import { embed } from 'openai';
import { ChromaClient } from 'chromadb';

async function vectorizePDF(pdfPath: string) {
  // 1. Extraer texto
  // 2. Crear chunks
  // 3. Generar embeddings
  // 4. Almacenar en ChromaDB
}
```

Entonces solo ejecutarás:
```bash
npm run vectorize
```

Y todos los PDFs (incluyendo nuevos) se indexarán para búsqueda semántica.
