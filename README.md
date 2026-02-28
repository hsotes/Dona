# RAG Estructuras MCP Server

Servidor MCP (Model Context Protocol) que centraliza todos los assets de cálculo estructural para reutilizarlos en múltiples proyectos sin duplicar archivos.

## Características

- **89 Perfiles Estructurales**: IPN, IPE, UPN, HEB, HEA con propiedades geométricas e inerciales
- **2,541 Materiales con Precios**: Catálogo completo en pesos argentinos
- **6 Normativas**: CIRSOC 301/102/101, UNE 76-201, ASTM, Manual AHMSA
- **10 PDFs de Normativas**: Documentación técnica completa
- **Tools de Búsqueda y Cálculo**: Búsqueda avanzada, sugerencias optimizadas, consulta de costos

## Instalación

```bash
# Instalar dependencias
npm install

# Compilar el proyecto
npm run build
```

## Estructura de Datos

### Resources (Datos Estáticos)

| URI | Descripción |
|-----|-------------|
| `perfil://TIPO/DESIGNACION` | Obtener perfil específico (ej: `perfil://HEB/200`) |
| `perfiles://TIPO` | Listar perfiles por tipo (ej: `perfiles://HEB`) |
| `norma://CODIGO` | Contexto completo de norma (ej: `norma://CIRSOC_301`) |
| `costos://` | Catálogo de costos completo |
| `pdf://ID` | Metadata de PDF (ej: `pdf://cirsoc-301`) |

### Tools (Operaciones)

#### 1. buscar_perfil

Búsqueda avanzada de perfiles estructurales.

**Parámetros:**
- `tipo`: 'IPN' | 'IPE' | 'UPN' | 'HEB' | 'HEA'
- `minWx`: Módulo resistente elástico mínimo (cm³)
- `minIx`: Momento de inercia mínimo (cm⁴)
- `maxPeso`: Peso máximo (kg/m)
- `minAltura`, `maxAltura`: Rango de altura (mm)
- `ordenarPor`: 'peso' | 'Wx' | 'Ix' | 'h'
- `limite`: Número máximo de resultados

**Ejemplo:**
```json
{
  "tipo": "HEB",
  "minWx": 500,
  "ordenarPor": "peso",
  "limite": 5
}
```

#### 2. sugerir_perfiles

Sugerencias optimizadas de perfiles para condiciones específicas.

**Parámetros:**
- `momentoRequerido`: Momento último Mu (kN·m) [requerido]
- `margen`: Factor de seguridad adicional (default: 1.2)
- `preferencia`: 'liviano' | 'economico' | 'rigido'
- `maxResultados`: Número de sugerencias (default: 5)

**Ejemplo:**
```json
{
  "momentoRequerido": 150,
  "preferencia": "economico",
  "margen": 1.2
}
```

#### 3. consultar_costos

Consulta de precios de materiales en el catálogo argentino.

**Parámetros:**
- `query`: Texto a buscar
- `tipo`: Tipo de material (ej: "HEB", "Angulos")
- `rubro`: Rubro del material
- `maxResultados`: Límite de resultados

**Ejemplo:**
```json
{
  "query": "HEB 200",
  "maxResultados": 5
}
```

## Configuración en Claude Desktop

Editar el archivo `C:\Users\Hernan Soto\.claude\claude.json` y agregar:

```json
{
  "mcpServers": {
    "rag-estructuras": {
      "command": "node",
      "args": [
        "C:\\Users\\Hernan Soto\\rag-estructuras-mcp\\dist\\index.js"
      ]
    }
  }
}
```

Luego reiniciar Claude Desktop.

## Uso

Desde Claude, puedes:

1. **Listar resources disponibles:**
   ```
   List available resources
   ```

2. **Leer un perfil específico:**
   ```
   Read resource perfil://HEB/200
   ```

3. **Buscar perfiles:**
   ```
   Use buscar_perfil to find HEB profiles with Wx > 500
   ```

4. **Obtener sugerencias:**
   ```
   Use sugerir_perfiles with momentoRequerido=150 and preferencia=economico
   ```

5. **Consultar precios:**
   ```
   Use consultar_costos to search for "HEB 200"
   ```

## Testing

```bash
# Ejecutar tests
npm run test

# Ejecutar servidor en modo desarrollo
npm run dev
```

## Preparación para Vectorización (Futuro)

El servidor está preparado para agregar búsqueda semántica en PDFs:

1. Instalar dependencies adicionales:
   ```bash
   npm install pdf-parse openai chromadb
   ```

2. Modificar `src/data/loader.ts` para procesar PDFs
3. Implementar embeddings y búsqueda vectorial
4. Actualizar tool `buscar_en_norma`

## Assets Centralizados

- **Perfiles**: [knowledge/perfiles/perfiles.json](knowledge/perfiles/perfiles.json)
- **Costos**: [knowledge/costos/materiales-hierro.csv](knowledge/costos/materiales-hierro.csv)
- **Normas**: [knowledge/normas/contextos.json](knowledge/normas/contextos.json)
- **PDFs**: [knowledge/normas/pdfs/](knowledge/normas/pdfs/)
- **Wizard**: [knowledge/wizard/wizard-context.json](knowledge/wizard/wizard-context.json)

## Migración de Assets

Si el proyecto original cambia, re-ejecutar la migración:

```bash
cd "C:\Users\Hernan Soto\App calculo estructural\structcalc-pro"
npx tsx export-data.ts
```

## Licencia

MIT
