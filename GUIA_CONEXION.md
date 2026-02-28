# Guía Detallada: Conectar el Servidor MCP a Claude Code

## ✅ Lo que acabamos de hacer

### 1. **Servidor MCP Creado**
   - Ubicación: `C:\Users\Hernan Soto\rag-estructuras-mcp\`
   - Compilado y listo para usar
   - Contiene 89 perfiles, 2,541 materiales, 6 normativas

### 2. **Configuración Agregada**
   - Archivo modificado: `C:\Users\Hernan Soto\.claude.json`
   - Sección agregada: `mcpServers` con el servidor `rag-estructuras`

---

## 🔄 Cómo Activar el Servidor (Paso a Paso)

### Opción A: Si estás en VSCode

**Paso 1: Recargar VSCode**
1. Presiona `Ctrl + Shift + P` (o `Cmd + Shift + P` en Mac)
2. Escribe: `Reload Window`
3. Presiona Enter
4. Espera a que VSCode se recargue completamente

**Paso 2: Verificar que el servidor está activo**
- Claude Code debería detectar automáticamente el servidor MCP
- No deberías ver ningún error en la consola

### Opción B: Si estás en la Terminal/CLI

**Paso 1: Simplemente continúa usando Claude Code**
- La configuración ya está en `.claude.json`
- El servidor se activará automáticamente en la próxima conversación

---

## 🧪 Cómo Probar que Funciona

### Prueba 1: Listar Resources Disponibles

Escribe en Claude Code:
```
List available resources
```

**Resultado esperado:**
Deberías ver una lista que incluye:
- `perfiles://HEB`
- `perfiles://IPE`
- `perfiles://IPN`
- `perfiles://UPN`
- `perfiles://HEA`
- `norma://CIRSOC_301`
- `norma://UNE_76201`
- `costos://`
- `pdf://cirsoc-301`
- Y más...

---

### Prueba 2: Leer un Perfil Específico

Escribe:
```
Read resource perfil://HEB/200
```

**Resultado esperado:**
```json
{
  "nombre": "HEB 200",
  "tipo": "HEB",
  "designacion": "200",
  "h": 200,
  "b": 200,
  "tw": 9,
  "tf": 15,
  "r": 18,
  "A": 78.1,
  "peso": 61.3,
  "Ix": 5696,
  "Iy": 2003,
  "Wx": 570,
  "Wy": 200,
  "Zx": 642,
  "Zy": 310,
  "ix": 8.54,
  "iy": 5.07
}
```

---

### Prueba 3: Usar Tool de Búsqueda

Escribe:
```
Use buscar_perfil to find HEB profiles with Wx greater than 500 cm³, ordered by weight, limit 5
```

**Resultado esperado:**
Una lista de perfiles HEB que cumplen el criterio, ordenados por peso.

---

### Prueba 4: Sugerir Perfiles para un Momento

Escribe:
```
Use sugerir_perfiles with momentoRequerido=150 kN·m, preferencia=economico, margen=1.2
```

**Resultado esperado:**
Lista de perfiles sugeridos con:
- Nombre del perfil
- Ratio de optimización
- Razón de la sugerencia
- Costo estimado
- Verificaciones

---

### Prueba 5: Consultar Costos

Escribe:
```
Use consultar_costos to search for "HEB 200"
```

**Resultado esperado:**
```json
{
  "resultados": [
    {
      "descripcion": "HEB 200",
      "tipo": "HEB",
      "rubro": "Metalúrgica y Herreria",
      "presentacion": "Barra de 12 m.",
      "costoFormateado": "ARS 584.016,90"
    }
  ],
  "moneda": "ARS"
}
```

---

## 🚨 Solución de Problemas

### Problema: "No se encontraron resources"

**Solución:**
1. Verifica que el servidor esté compilado:
   ```bash
   cd "C:\Users\Hernan Soto\rag-estructuras-mcp"
   npm run build
   ```

2. Verifica que el archivo `.claude.json` tiene la configuración:
   ```bash
   cat ~/.claude.json | grep -A 5 "mcpServers"
   ```

3. Reinicia Claude Code completamente

---

### Problema: "Error al ejecutar tool"

**Solución:**
1. Verifica que los datos están cargados:
   ```bash
   cd "C:\Users\Hernan Soto\rag-estructuras-mcp"
   npm run test
   ```

2. Si hay errores, re-ejecuta la migración:
   ```bash
   cd "C:\Users\Hernan Soto\App calculo estructural\structcalc-pro"
   npx tsx export-data.ts
   ```

---

### Problema: "Cannot find module"

**Solución:**
1. Reinstala las dependencias:
   ```bash
   cd "C:\Users\Hernan Soto\rag-estructuras-mcp"
   rm -rf node_modules
   npm install
   npm run build
   ```

---

## 📝 Comandos Útiles

### Ver logs del servidor
Si el servidor falla, puedes ver los logs en stderr de Claude Code.

### Actualizar datos
Si el proyecto original cambia:
```bash
cd "C:\Users\Hernan Soto\App calculo estructural\structcalc-pro"
npx tsx export-data.ts
cd "C:\Users\Hernan Soto\rag-estructuras-mcp"
npm run build
```

### Probar el servidor manualmente
```bash
cd "C:\Users\Hernan Soto\rag-estructuras-mcp"
npm run test
```

---

## 🎯 Ejemplos de Uso en Proyectos Reales

### Ejemplo 1: Diseñar viga carrilera

```
Use sugerir_perfiles with:
- momentoRequerido: 250 kN·m
- preferencia: economico
- margen: 1.3

Luego consulta el costo del perfil sugerido
```

### Ejemplo 2: Verificar si un perfil existe

```
Read resource perfil://IPE/300
```

### Ejemplo 3: Buscar perfiles para columna

```
Use buscar_perfil with:
- tipo: HEB
- minWx: 800
- minIx: 10000
- ordenarPor: peso
- limite: 3
```

### Ejemplo 4: Ver normativa aplicable

```
Read resource norma://CIRSOC_301

Luego pregunta: ¿Cuál es el factor de resistencia φ para flexión?
```

---

## ✨ Ventajas de Usar el Servidor MCP

1. **No duplicas archivos**: Todos los proyectos usan la misma base de datos
2. **Siempre actualizado**: Un solo lugar para actualizar datos
3. **Consistencia**: Mismos perfiles y precios en todos los proyectos
4. **Eficiencia**: Claude tiene acceso instantáneo a toda la información
5. **Escalable**: Fácil agregar más tools y resources

---

## 📚 Próximos Pasos

### Fase 2: Agregar más Tools
- `calcular_cargas` - Cálculos de puente grúa
- `verificar_perfil` - Verificaciones estructurales completas
- `buscar_en_norma` - Búsqueda en PDFs (con vectorización)

### Fase 3: Vectorización de PDFs
Cuando estés listo:
```bash
npm install pdf-parse openai chromadb
```

Luego implementar búsqueda semántica en los 10 PDFs de normativas.

---

## 🤝 Soporte

Si tienes problemas:
1. Revisa esta guía completa
2. Ejecuta `npm run test` para verificar
3. Revisa los logs de Claude Code
4. Compila de nuevo: `npm run build`

---

**¡Felicitaciones! 🎉**

Ahora tienes un servidor MCP centralizado con toda tu información de cálculo estructural, accesible desde cualquier proyecto en Claude Code.
