# MANUAL: Scripts Python para SAP2000 API

## Guía de Referencia basada en Experiencia Real

Este manual documenta las mejores prácticas, problemas conocidos y soluciones para automatizar SAP2000 con Python, basado en el proyecto "Galpón Deportivo Berisso" (2026).

---

## 1. CONFIGURACIÓN INICIAL

### 1.1 Conexión con SAP2000

```python
import comtypes.client

def conectar_sap2000(abrir_nuevo=True):
    """
    Conecta con SAP2000 y retorna el objeto SapModel.

    Args:
        abrir_nuevo: Si True, abre nueva instancia. Si False, conecta a existente.

    Returns:
        tuple: (SapObject, SapModel)
    """
    if abrir_nuevo:
        # Abrir nueva instancia
        helper = comtypes.client.CreateObject('SAP2000v1.Helper')
        helper = helper.QueryInterface(comtypes.client.gen.SAP2000v1.cHelper)
        SapObject = helper.CreateObjectProgID("CSI.SAP2000.API.SapObject")
        SapObject.ApplicationStart()
    else:
        # Conectar a instancia existente
        SapObject = comtypes.client.GetActiveObject("CSI.SAP2000.API.SapObject")

    SapModel = SapObject.SapModel

    # Inicializar nuevo modelo (unidades kN-m)
    ret = SapModel.InitializeNewModel(6)  # 6 = kN_m_C

    # Crear archivo nuevo
    ret = SapModel.File.NewBlank()

    return SapObject, SapModel
```

### 1.2 Unidades de SAP2000

| Código | Unidades |
|--------|----------|
| 1 | lb_in_F |
| 2 | lb_ft_F |
| 3 | kip_in_F |
| 4 | kip_ft_F |
| 5 | kN_mm_C |
| 6 | kN_m_C |
| 7 | kgf_mm_C |
| 8 | kgf_m_C |
| 9 | N_mm_C |
| 10 | N_m_C |

```python
# Cambiar unidades durante el script
SapModel.SetPresentUnits(6)  # kN_m_C
```

---

## 2. DEFINICIÓN DE MATERIALES

### 2.1 Acero Estructural

```python
def definir_acero_f24(SapModel):
    """
    Define acero F24 según CIRSOC 301.
    Fy = 240 MPa, Fu = 370 MPa
    """
    MATERIAL_STEEL = 1

    # Agregar material
    ret = SapModel.PropMaterial.SetMaterial("ACERO_F24", MATERIAL_STEEL)

    # Propiedades mecánicas
    ret = SapModel.PropMaterial.SetMPIsotropic(
        "ACERO_F24",
        200000000,  # E = 200,000 MPa (en kN/m² = 200,000,000 kN/m²)
        0.3,        # Poisson
        0.0000117   # Coef. dilatación térmica
    )

    # Propiedades de diseño
    ret = SapModel.PropMaterial.SetOSteel_1(
        "ACERO_F24",
        240000,     # Fy = 240 MPa (en kN/m²)
        370000,     # Fu = 370 MPa
        240000,     # Fye (esperado)
        370000,     # Fue (esperado)
        1,          # Tipo de curva esfuerzo-deformación
        1,          # SSHysType
        0.015,      # SHard (deformación de endurecimiento)
        0.11,       # SMax
        0.0,        # SRup
        0.0         # FinalSlope
    )

    return ret
```

### 2.2 Hormigón

```python
def definir_hormigon_h21(SapModel):
    """
    Define hormigón H21 para fundaciones.
    f'c = 21 MPa
    """
    MATERIAL_CONCRETE = 2

    ret = SapModel.PropMaterial.SetMaterial("H21", MATERIAL_CONCRETE)

    ret = SapModel.PropMaterial.SetMPIsotropic(
        "H21",
        21538000,   # E = 4700*sqrt(21) MPa ≈ 21,538 MPa
        0.2,        # Poisson
        0.00001     # Coef. dilatación
    )

    ret = SapModel.PropMaterial.SetOConcrete_1(
        "H21",
        21000,      # f'c = 21 MPa
        False,      # No es liviano
        0,          # Tipo de curva
        0,          # SSHysType
        0.002,      # SFc
        0.005,      # SCap
        0,          # FinalSlope
        0           # FAngle
    )

    return ret
```

---

## 3. DEFINICIÓN DE SECCIONES

### 3.1 Perfiles Estándar (Catálogo)

```python
def definir_perfil_catalogo(SapModel, nombre, tipo, tamaño):
    """
    Define perfil desde catálogo de SAP2000.

    Args:
        nombre: Nombre a asignar al perfil
        tipo: "W", "C", "L", "HSS", etc.
        tamaño: Designación del perfil (ej: "W14X30")
    """
    ret = SapModel.PropFrame.SetAISC_Wide_flange(
        nombre,
        "ACERO_F24",
        tamaño
    )
    return ret
```

### 3.2 Perfiles con Propiedades Manuales (RECOMENDADO)

> **IMPORTANTE**: Usar `SetGeneral` es la forma más confiable de definir perfiles personalizados. Evita problemas con SetTube, SetColdBox, etc.

```python
def definir_seccion_general(SapModel, nombre, material, propiedades):
    """
    Define sección con propiedades manuales (método más confiable).

    Args:
        nombre: Nombre del perfil
        material: Nombre del material
        propiedades: dict con A, Ix, Iy, J, etc.

    Propiedades requeridas:
        - A: Área (m²)
        - Ix: Momento de inercia eje X (m⁴)
        - Iy: Momento de inercia eje Y (m⁴)
        - J: Constante torsional (m⁴)
        - As2: Área de corte eje 2 (m²)
        - As3: Área de corte eje 3 (m²)
        - S22: Módulo plástico eje 2 (m³)
        - S33: Módulo plástico eje 3 (m³)
        - Z22: Módulo elástico eje 2 (m³)
        - Z33: Módulo elástico eje 3 (m³)
        - R22: Radio de giro eje 2 (m)
        - R33: Radio de giro eje 3 (m)
    """
    ret = SapModel.PropFrame.SetGeneral(
        nombre,
        material,
        propiedades['t3'],      # Profundidad (altura)
        propiedades['t2'],      # Ancho
        propiedades['A'],       # Área
        propiedades['As2'],     # Área corte 2
        propiedades['As3'],     # Área corte 3
        propiedades['J'],       # Constante torsional
        propiedades['Ix'],      # I33 (eje mayor)
        propiedades['Iy'],      # I22 (eje menor)
        propiedades['S33'],     # S33
        propiedades['S22'],     # S22
        propiedades['Z33'],     # Z33
        propiedades['Z22'],     # Z22
        propiedades['R33'],     # R33
        propiedades['R22']      # R22
    )
    return ret


# EJEMPLO: Cajón 2×PGC 200×60×20×2.5
CAJON_2xPGC200 = {
    't3': 0.200,        # Altura 200mm
    't2': 0.120,        # Ancho 120mm (2×60)
    'A': 17.0e-4,       # 17.0 cm² → m²
    'Ix': 650e-8,       # 650 cm⁴ → m⁴
    'Iy': 180e-8,       # 180 cm⁴ → m⁴
    'J': 50e-8,         # Estimado
    'As2': 8.0e-4,      # ~50% del área
    'As3': 5.0e-4,
    'S33': 65e-6,       # Wx = Ix/c
    'S22': 30e-6,
    'Z33': 78e-6,       # Módulo plástico ≈ 1.2×S
    'Z22': 36e-6,
    'R33': 0.062,       # rx = 62mm
    'R22': 0.033        # ry = 33mm
}

definir_seccion_general(SapModel, "CAJON_2xPGC200", "ACERO_F24", CAJON_2xPGC200)
```

### 3.3 Perfiles Tipo Tubo/Cajón

> **⚠️ PROBLEMA CONOCIDO**: `SetTube` falla con ret=1 en SAP2000 v24.2.0

```python
# ❌ NO USAR - SetTube falla
ret = SapModel.PropFrame.SetTube(...)  # Retorna error 1

# ✅ ALTERNATIVA 1: SetColdBox (funciona pero propiedades difieren)
ret = SapModel.PropFrame.SetColdBox(
    nombre,
    "ACERO_F24",
    0.200,    # Altura
    0.120,    # Ancho
    0.0025,   # Espesor
    0.005     # Radio esquina
)

# ✅ ALTERNATIVA 2: SetGeneral (RECOMENDADO)
# Ver sección 3.2 - permite control exacto de propiedades
```

### 3.4 Perfiles Tipo Canal (C)

```python
def definir_canal_C(SapModel, nombre, h, b, t, r=0):
    """
    Define perfil canal C conformado en frío.

    Args:
        h: Altura (m)
        b: Ancho ala (m)
        t: Espesor (m)
        r: Radio esquina (m)
    """
    # Calcular propiedades
    A = t * (h + 2*b - 2*t)  # Área aproximada

    # Usar SetGeneral con propiedades calculadas
    # (ver fórmulas en literatura de perfiles conformados)
    pass
```

---

## 4. CREACIÓN DE GEOMETRÍA

### 4.1 Crear Nodos

```python
def crear_nodo(SapModel, x, y, z, nombre=None):
    """
    Crea un nodo (joint) en coordenadas especificadas.

    Returns:
        str: Nombre asignado por SAP2000 al nodo
    """
    nombre_ret = ""
    ret, nombre_ret = SapModel.PointObj.AddCartesian(x, y, z, nombre_ret, nombre)
    return nombre_ret
```

### 4.2 Crear Elementos Frame

```python
def crear_frame_por_coordenadas(SapModel, x1, y1, z1, x2, y2, z2, seccion, nombre=None):
    """
    Crea elemento frame entre dos puntos.

    Args:
        x1, y1, z1: Coordenadas punto inicial
        x2, y2, z2: Coordenadas punto final
        seccion: Nombre de la sección a asignar
        nombre: Nombre opcional (SAP2000 asigna numérico si es None)

    Returns:
        str: Nombre asignado al frame

    NOTA: SAP2000 ignora nombres personalizados y asigna
          nombres numéricos ("1", "2", "3"...) en orden de creación.
    """
    nombre_ret = ""
    ret, nombre_ret = SapModel.FrameObj.AddByCoord(
        x1, y1, z1,
        x2, y2, z2,
        nombre_ret,
        seccion,
        nombre
    )
    return nombre_ret


def crear_frame_por_nodos(SapModel, nodo1, nodo2, seccion, nombre=None):
    """
    Crea elemento frame entre dos nodos existentes.
    """
    nombre_ret = ""
    ret, nombre_ret = SapModel.FrameObj.AddByPoint(
        nodo1,
        nodo2,
        nombre_ret,
        seccion,
        nombre
    )
    return nombre_ret
```

### 4.3 Crear Pórtico Típico

```python
def crear_portico_cercha(SapModel, y_coord, LUZ, H_COL, H_CERCHA, N_PANELES):
    """
    Crea un pórtico con cercha Warren.

    Args:
        y_coord: Posición Y del pórtico
        LUZ: Luz libre entre columnas
        H_COL: Altura de columnas
        H_CERCHA: Altura de la cercha
        N_PANELES: Número de paneles de la cercha
    """
    # Pendiente del techo
    pendiente = H_CERCHA / (LUZ / 2)

    # Ancho de panel
    w_panel = LUZ / N_PANELES

    # --- COLUMNAS ---
    # Columna izquierda
    crear_frame_por_coordenadas(
        SapModel,
        0, y_coord, 0,
        0, y_coord, H_COL,
        "SECCION_COLUMNA",
        f"COL_L_{y_coord}"
    )

    # Columna derecha
    crear_frame_por_coordenadas(
        SapModel,
        LUZ, y_coord, 0,
        LUZ, y_coord, H_COL,
        "SECCION_COLUMNA",
        f"COL_R_{y_coord}"
    )

    # --- CERCHA ---
    for i in range(N_PANELES):
        x1 = i * w_panel
        x2 = (i + 1) * w_panel

        # Altura del cordón superior (inclinado)
        z1_sup = H_COL + H_CERCHA + (abs(x1 - LUZ/2) / (LUZ/2)) * pendiente
        z2_sup = H_COL + H_CERCHA + (abs(x2 - LUZ/2) / (LUZ/2)) * pendiente

        # Cordón inferior (plano)
        z_inf = H_COL

        # Cordón superior
        crear_frame_por_coordenadas(
            SapModel,
            x1, y_coord, z1_sup,
            x2, y_coord, z2_sup,
            "SECCION_CORDON",
            f"CS_{i}_{y_coord}"
        )

        # Cordón inferior
        crear_frame_por_coordenadas(
            SapModel,
            x1, y_coord, z_inf,
            x2, y_coord, z_inf,
            "SECCION_CORDON",
            f"CI_{i}_{y_coord}"
        )

        # Diagonales (patrón Warren)
        if i % 2 == 0:
            # Diagonal ascendente
            crear_frame_por_coordenadas(
                SapModel,
                x1, y_coord, z_inf,
                x2, y_coord, z2_sup,
                "SECCION_DIAGONAL"
            )
        else:
            # Diagonal descendente
            crear_frame_por_coordenadas(
                SapModel,
                x1, y_coord, z1_sup,
                x2, y_coord, z_inf,
                "SECCION_DIAGONAL"
            )
```

---

## 5. CONDICIONES DE APOYO

### 5.1 Empotramientos y Articulaciones

```python
def asignar_apoyo(SapModel, nodo, tipo="empotrado"):
    """
    Asigna restricciones a un nodo.

    Args:
        nodo: Nombre del nodo
        tipo: "empotrado", "articulado", "rodillo_x", "rodillo_y"

    Restricciones: [U1, U2, U3, R1, R2, R3]
        True = restringido, False = libre
    """
    restricciones = {
        "empotrado":    [True, True, True, True, True, True],
        "articulado":   [True, True, True, False, False, False],
        "rodillo_x":    [False, True, True, False, False, False],
        "rodillo_y":    [True, False, True, False, False, False],
        "libre":        [False, False, False, False, False, False]
    }

    r = restricciones.get(tipo, restricciones["empotrado"])

    ret = SapModel.PointObj.SetRestraint(
        nodo,
        r
    )
    return ret
```

### 5.2 Releases en Frames (Articulaciones)

```python
def asignar_releases(SapModel, frame, inicio=None, fin=None):
    """
    Asigna liberaciones en extremos de frame.

    Args:
        frame: Nombre del frame
        inicio: lista [P, V2, V3, T, M2, M3] para extremo I
        fin: lista [P, V2, V3, T, M2, M3] para extremo J

    Valores: True = liberado, False = continuo
    """
    # Por defecto, todo continuo
    ii = inicio or [False]*6
    jj = fin or [False]*6

    # StartValue y EndValue (rigidez parcial, 0 = release total)
    si = [0.0]*6
    sj = [0.0]*6

    ret = SapModel.FrameObj.SetReleases(
        frame,
        ii, jj,
        si, sj
    )
    return ret


# Ejemplo: articulación en extremo J (momento liberado)
asignar_releases(
    SapModel,
    "Frame1",
    inicio=[False, False, False, False, False, False],
    fin=[False, False, False, False, True, True]  # M2 y M3 liberados
)
```

---

## 6. CARGAS

### 6.1 Patrones de Carga

```python
def crear_patrones_carga(SapModel):
    """
    Crea patrones de carga típicos para estructuras.
    """
    # Tipos de patrón
    LTYPE_DEAD = 1
    LTYPE_LIVE = 3
    LTYPE_WIND = 7

    # Carga muerta (ya existe por defecto)
    SapModel.LoadPatterns.Add("DEAD", LTYPE_DEAD, 1, True)

    # Sobrecarga
    SapModel.LoadPatterns.Add("LIVE", LTYPE_LIVE, 0, True)

    # Viento
    SapModel.LoadPatterns.Add("WIND_PRES", LTYPE_WIND, 0, True)
    SapModel.LoadPatterns.Add("WIND_SUC", LTYPE_WIND, 0, True)
```

### 6.2 Cargas Distribuidas en Frames

```python
def asignar_carga_distribuida(SapModel, frame, patron, valor, direccion="Gravity"):
    """
    Asigna carga uniformemente distribuida a un frame.

    Args:
        frame: Nombre del frame
        patron: Nombre del patrón de carga
        valor: Magnitud de la carga (kN/m para unidades kN_m)
        direccion: "Gravity" (eje Z global), "Local 2", "Local 3", etc.
    """
    # Tipos de dirección
    DIR_LOCAL_1 = 1  # Axial
    DIR_LOCAL_2 = 2  # Corte menor
    DIR_LOCAL_3 = 3  # Corte mayor
    DIR_GLOBAL_X = 4
    DIR_GLOBAL_Y = 5
    DIR_GLOBAL_Z = 6  # Gravity

    dir_code = DIR_GLOBAL_Z if direccion == "Gravity" else DIR_LOCAL_3

    ret = SapModel.FrameObj.SetLoadDistributed(
        frame,
        patron,
        1,          # Tipo: 1 = Force
        dir_code,   # Dirección
        0, 1,       # Distancia relativa inicio/fin (0 a 1)
        valor, valor,  # Valor inicio/fin (uniforme)
        "Global",   # Sistema coordenadas
        True,       # Replace existing
        True        # Item (True = aplicar al frame especificado)
    )
    return ret
```

### 6.3 Cargas Puntuales en Frames

```python
def asignar_carga_puntual(SapModel, frame, patron, valor, posicion=0.5, direccion="Gravity"):
    """
    Asigna carga puntual a un frame.

    Args:
        posicion: Distancia relativa (0 a 1) desde inicio del frame
    """
    DIR_GLOBAL_Z = 6

    ret = SapModel.FrameObj.SetLoadPoint(
        frame,
        patron,
        1,          # Tipo: 1 = Force
        DIR_GLOBAL_Z,
        posicion,   # Distancia relativa
        valor,      # Magnitud
        "Global",
        True,
        True
    )
    return ret
```

### 6.4 Cargas de Viento (ejemplo CIRSOC 102)

```python
def aplicar_cargas_viento(SapModel, elementos_barlovento, elementos_sotavento,
                          elementos_cubierta, ancho_tributario):
    """
    Aplica cargas de viento según CIRSOC 102.

    Ejemplo para V=46 m/s, Kz=0.77, Kd=0.85, I=1.15
    qz = 0.976 kN/m²
    """
    # Coeficientes de presión (Cp)
    Cp_barlovento = 0.8
    Cp_sotavento = -0.5
    Cp_cubierta = -0.7  # Succión

    qz = 0.976  # kN/m²
    G = 0.85    # Factor ráfaga

    # Presiones
    p_barlovento = qz * G * Cp_barlovento * ancho_tributario  # kN/m
    p_sotavento = qz * G * Cp_sotavento * ancho_tributario
    p_cubierta = qz * G * Cp_cubierta * ancho_tributario

    # Aplicar a elementos
    for elem in elementos_barlovento:
        asignar_carga_distribuida(SapModel, elem, "WIND_PRES", p_barlovento, "Local 2")

    for elem in elementos_sotavento:
        asignar_carga_distribuida(SapModel, elem, "WIND_PRES", p_sotavento, "Local 2")

    for elem in elementos_cubierta:
        asignar_carga_distribuida(SapModel, elem, "WIND_PRES", p_cubierta, "Local 3")
```

---

## 7. COMBINACIONES DE CARGA

### 7.1 Combinaciones LRFD

```python
def crear_combinaciones_LRFD(SapModel):
    """
    Crea combinaciones LRFD según CIRSOC 301.
    """
    # Tipos de combinación
    CTYPE_LINEAR_ADD = 0

    # COMB1: 1.4D
    SapModel.RespCombo.Add("COMB1", CTYPE_LINEAR_ADD)
    SapModel.RespCombo.SetCaseList("COMB1", 0, "DEAD", 1.4)

    # COMB2: 1.2D + 1.6L
    SapModel.RespCombo.Add("COMB2", CTYPE_LINEAR_ADD)
    SapModel.RespCombo.SetCaseList("COMB2", 0, "DEAD", 1.2)
    SapModel.RespCombo.SetCaseList("COMB2", 0, "LIVE", 1.6)

    # COMB3: 1.2D + 1.0W + 0.5L
    SapModel.RespCombo.Add("COMB3", CTYPE_LINEAR_ADD)
    SapModel.RespCombo.SetCaseList("COMB3", 0, "DEAD", 1.2)
    SapModel.RespCombo.SetCaseList("COMB3", 0, "WIND_PRES", 1.0)
    SapModel.RespCombo.SetCaseList("COMB3", 0, "LIVE", 0.5)

    # COMB5: 0.9D + 1.0W (levantamiento)
    SapModel.RespCombo.Add("COMB5", CTYPE_LINEAR_ADD)
    SapModel.RespCombo.SetCaseList("COMB5", 0, "DEAD", 0.9)
    SapModel.RespCombo.SetCaseList("COMB5", 0, "WIND_PRES", 1.0)
```

---

## 8. ANÁLISIS

### 8.1 Ejecutar Análisis

```python
def ejecutar_analisis(SapModel):
    """
    Ejecuta el análisis estructural.

    Returns:
        int: 0 si éxito, otro valor si error
    """
    # Guardar modelo antes de analizar
    SapModel.File.Save()

    # Ejecutar análisis
    ret = SapModel.Analyze.RunAnalysis()

    return ret
```

### 8.2 Configurar Casos de Análisis

```python
def configurar_casos_analisis(SapModel):
    """
    Configura qué casos ejecutar.
    """
    # Desactivar todos los casos
    SapModel.Analyze.SetRunCaseFlag("", False, True)

    # Activar solo los necesarios
    casos = ["DEAD", "LIVE", "WIND_PRES", "WIND_SUC"]
    for caso in casos:
        SapModel.Analyze.SetRunCaseFlag(caso, True)
```

---

## 9. EXTRACCIÓN DE RESULTADOS

### 9.1 Configurar Resultados

```python
def configurar_resultados(SapModel, combinacion):
    """
    Configura qué combinación usar para extraer resultados.
    """
    # Tipo de resultado
    SapModel.Results.Setup.DeselectAllCasesAndCombosForOutput()
    SapModel.Results.Setup.SetComboSelectedForOutput(combinacion, True)
```

### 9.2 Fuerzas en Frames

```python
def obtener_fuerzas_frame(SapModel, frame):
    """
    Obtiene fuerzas internas de un frame.

    Returns:
        dict: Diccionario con fuerzas en cada estación
    """
    # Configurar para obtener resultados
    SapModel.Results.Setup.DeselectAllCasesAndCombosForOutput()
    SapModel.Results.Setup.SetComboSelectedForOutput("COMB2", True)

    # Obtener resultados
    NumberResults = 0
    Obj = []
    ObjSta = []
    Elm = []
    ElmSta = []
    LoadCase = []
    StepType = []
    StepNum = []
    P = []      # Axial
    V2 = []     # Corte menor
    V3 = []     # Corte mayor
    T = []      # Torsión
    M2 = []     # Momento menor
    M3 = []     # Momento mayor

    ret = SapModel.Results.FrameForce(
        frame,
        0,  # ItemTypeElm (0 = Object)
        NumberResults,
        Obj, ObjSta, Elm, ElmSta,
        LoadCase, StepType, StepNum,
        P, V2, V3, T, M2, M3
    )

    # ret[0] = código retorno
    # ret[1] = número de resultados
    # ret[2:] = arrays de resultados

    return {
        'P': ret[8],
        'V2': ret[9],
        'V3': ret[10],
        'T': ret[11],
        'M2': ret[12],
        'M3': ret[13]
    }
```

### 9.3 Desplazamientos en Nodos

> **⚠️ PROBLEMA CONOCIDO**: `JointDispl("ALL", ...)` retorna 0 registros. Solución: iterar nodo por nodo.

```python
def obtener_desplazamientos(SapModel, nodos):
    """
    Obtiene desplazamientos de una lista de nodos.

    NOTA: JointDispl("ALL") falla. Usar iteración.
    """
    resultados = {}

    for nodo in nodos:
        NumberResults = 0
        Obj = []
        Elm = []
        LoadCase = []
        StepType = []
        StepNum = []
        U1 = []
        U2 = []
        U3 = []
        R1 = []
        R2 = []
        R3 = []

        ret = SapModel.Results.JointDispl(
            nodo,
            0,  # ItemTypeElm
            NumberResults,
            Obj, Elm, LoadCase, StepType, StepNum,
            U1, U2, U3, R1, R2, R3
        )

        if ret[1] > 0:  # Si hay resultados
            resultados[nodo] = {
                'U1': ret[7],
                'U2': ret[8],
                'U3': ret[9],
                'R1': ret[10],
                'R2': ret[11],
                'R3': ret[12]
            }

    return resultados
```

### 9.4 Reacciones en Apoyos

```python
def obtener_reacciones(SapModel, nodos_apoyo):
    """
    Obtiene reacciones en nodos de apoyo.
    """
    resultados = {}

    for nodo in nodos_apoyo:
        NumberResults = 0
        Obj = []
        Elm = []
        LoadCase = []
        StepType = []
        StepNum = []
        F1 = []
        F2 = []
        F3 = []
        M1 = []
        M2 = []
        M3 = []

        ret = SapModel.Results.JointReact(
            nodo,
            0,
            NumberResults,
            Obj, Elm, LoadCase, StepType, StepNum,
            F1, F2, F3, M1, M2, M3
        )

        if ret[1] > 0:
            resultados[nodo] = {
                'Fx': ret[7],
                'Fy': ret[8],
                'Fz': ret[9],
                'Mx': ret[10],
                'My': ret[11],
                'Mz': ret[12]
            }

    return resultados
```

---

## 10. DISEÑO DE ACERO

### 10.1 Configurar Diseño

```python
def configurar_diseno_acero(SapModel, codigo="AISC 360-16"):
    """
    Configura parámetros de diseño de acero.
    """
    # Establecer código de diseño
    ret = SapModel.DesignSteel.SetCode(codigo)

    # Seleccionar combinaciones para diseño
    # (usar combinaciones existentes)
    pass
```

### 10.2 Longitud No Arriostrada

> **IMPORTANTE**: SAP2000 usa la longitud total del frame por defecto. Para columnas reticuladas o elementos arriostrados, especificar L_unbr manualmente.

```python
def configurar_longitud_no_arriostrada(SapModel, frame, Lb_33, Lb_22=None):
    """
    Configura longitud no arriostrada para diseño.

    Args:
        frame: Nombre del frame
        Lb_33: Longitud no arriostrada eje mayor (m)
        Lb_22: Longitud no arriostrada eje menor (m), si None = Lb_33
    """
    if Lb_22 is None:
        Lb_22 = Lb_33

    # Items 19 y 20 son L_unbr para ejes 33 y 22
    ret = SapModel.DesignSteel.SetOverwrite(
        frame,
        19,     # Item número (L_unbr 33)
        Lb_33
    )

    ret = SapModel.DesignSteel.SetOverwrite(
        frame,
        20,     # Item número (L_unbr 22)
        Lb_22
    )

    return ret
```

### 10.3 Elementos Tension-Only

> **⚠️ PROBLEMA CONOCIDO**: La API no funciona correctamente para configurar tension-only. Solución: configurar manualmente en SAP2000.

```python
def configurar_tension_only(SapModel, frame):
    """
    Configura elemento como tension-only (sin compresión).

    NOTA: Esta función puede fallar en algunas versiones.
    Verificar manualmente en SAP2000:
    Assign > Frame > Tension/Compression Limits > Compression = 0
    """
    try:
        ret = SapModel.FrameObj.SetTCLimits(
            frame,
            True,   # Limit tension
            True,   # Limit compression
            1e10,   # Max tension (muy alto)
            0       # Max compression = 0 (tension only)
        )
        return ret
    except:
        print(f"ADVERTENCIA: No se pudo configurar tension-only para {frame}")
        print("Configurar manualmente en SAP2000")
        return 1
```

### 10.4 Ejecutar Diseño

```python
def ejecutar_diseno_acero(SapModel):
    """
    Ejecuta el diseño de acero.
    """
    # Primero ejecutar análisis
    SapModel.Analyze.RunAnalysis()

    # Iniciar diseño
    ret = SapModel.DesignSteel.StartDesign()

    return ret
```

### 10.5 Obtener Ratios de Diseño

> **⚠️ PROBLEMA CONOCIDO**: `GetSummaryResults` falla con TypeError. Solución: exportar a CSV desde SAP2000.

```python
def obtener_ratios_diseno(SapModel, frames):
    """
    Obtiene ratios de diseño de elementos.

    NOTA: GetSummaryResults puede fallar.
    Alternativa: File > Export > Tables > Steel Design Summary
    """
    ratios = {}

    for frame in frames:
        try:
            ret = SapModel.DesignSteel.GetSummaryResults(
                frame,
                0,  # NumberItems
                [], # FrameName
                [], # Ratio
                [], # RatioType
                [], # Location
                [], # ComboName
                [], # ErrorSummary
                [], # WarningSummary
            )

            if ret[1] > 0:
                ratios[frame] = {
                    'ratio': ret[3][0],
                    'combo': ret[5][0]
                }
        except Exception as e:
            print(f"Error obteniendo ratio de {frame}: {e}")

    return ratios


def exportar_resultados_diseno(SapModel, ruta_csv):
    """
    Exporta resultados de diseño a CSV.

    Alternativa cuando la API falla.
    """
    # Configurar tablas a exportar
    SapModel.DatabaseTables.SetOutputOptionsForDisplay()

    # Exportar
    ret = SapModel.DatabaseTables.ExportToCSV(
        ruta_csv,
        "Steel Frame Design Summary"
    )

    return ret
```

---

## 11. PROBLEMAS CONOCIDOS Y SOLUCIONES

### 11.1 Resumen de Problemas API

| Problema | Descripción | Solución |
|----------|-------------|----------|
| SetTube falla | Retorna error 1 | Usar SetGeneral o SetColdBox |
| SetColdBox propiedades | Propiedades ≠ perfil real | Usar SetGeneral con propiedades manuales |
| Nombres de frames | SAP ignora nombres custom | Usar números de frame en orden |
| Modelo pierde elementos | Al guardar/reabrir | Eliminar paso de reapertura |
| JointDispl("ALL") | Retorna 0 registros | Iterar nodo por nodo |
| GetSummaryResults | TypeError | Exportar a CSV manualmente |
| Tension-only API | No funciona correctamente | Configurar manual en SAP2000 |

### 11.2 Código de Diagnóstico

```python
def verificar_modelo(SapModel):
    """
    Verifica la integridad del modelo.
    """
    # Contar elementos
    n_frames = SapModel.FrameObj.Count()
    n_joints = SapModel.PointObj.Count()
    n_patterns = SapModel.LoadPatterns.Count()

    print(f"Frames: {n_frames}")
    print(f"Joints: {n_joints}")
    print(f"Load Patterns: {n_patterns}")

    # Verificar conectividad
    ret = SapModel.Analyze.CheckModel()
    if ret[0] != 0:
        print("ADVERTENCIA: Modelo tiene errores de conectividad")

    return {
        'frames': n_frames,
        'joints': n_joints,
        'patterns': n_patterns
    }
```

---

## 12. PLANTILLA COMPLETA

```python
"""
PLANTILLA: Script SAP2000 para Estructuras Metálicas
Basado en proyecto Galpón Berisso 2026
"""

import comtypes.client
import sys

# =============================================================================
# PARÁMETROS DEL PROYECTO
# =============================================================================
NOMBRE_PROYECTO = "MiEstructura"
RUTA_ARCHIVO = f"C:/SAP2000/{NOMBRE_PROYECTO}.sdb"

# Geometría
LUZ = 22.60      # m
H_COLUMNAS = 7.65
H_CERCHA = 1.60
N_PORTICOS = 7
SEP_PORTICOS = 5.60

# Material
FY = 240000      # kN/m² (240 MPa)
FU = 370000
E = 200000000    # kN/m² (200,000 MPa)

# =============================================================================
# FUNCIONES PRINCIPALES
# =============================================================================

def main():
    """Función principal del script."""

    print("=" * 60)
    print(f"GENERACIÓN DE MODELO: {NOMBRE_PROYECTO}")
    print("=" * 60)

    # 1. Conectar con SAP2000
    print("\n[1/8] Conectando con SAP2000...")
    SapObject, SapModel = conectar_sap2000()

    # 2. Definir materiales
    print("[2/8] Definiendo materiales...")
    definir_acero_f24(SapModel)

    # 3. Definir secciones
    print("[3/8] Definiendo secciones...")
    definir_secciones(SapModel)

    # 4. Crear geometría
    print("[4/8] Creando geometría...")
    crear_estructura(SapModel)

    # 5. Asignar apoyos
    print("[5/8] Asignando condiciones de apoyo...")
    asignar_apoyos(SapModel)

    # 6. Definir cargas
    print("[6/8] Definiendo cargas...")
    crear_patrones_carga(SapModel)
    aplicar_cargas(SapModel)
    crear_combinaciones_LRFD(SapModel)

    # 7. Guardar modelo
    print("[7/8] Guardando modelo...")
    SapModel.File.Save(RUTA_ARCHIVO)

    # 8. Ejecutar análisis
    print("[8/8] Ejecutando análisis...")
    ret = ejecutar_analisis(SapModel)

    if ret == 0:
        print("\n" + "=" * 60)
        print("ANÁLISIS COMPLETADO EXITOSAMENTE")
        print("=" * 60)

        # Verificar modelo
        stats = verificar_modelo(SapModel)

        print(f"\nEstadísticas del modelo:")
        print(f"  - Frames: {stats['frames']}")
        print(f"  - Nodos: {stats['joints']}")
        print(f"  - Patrones de carga: {stats['patterns']}")

    else:
        print(f"\n*** ERROR EN ANÁLISIS: código {ret} ***")

    print(f"\nModelo guardado en: {RUTA_ARCHIVO}")

    return SapModel


# =============================================================================
# FUNCIONES DE DEFINICIÓN (completar según proyecto)
# =============================================================================

def definir_secciones(SapModel):
    """Define todas las secciones del proyecto."""
    # TODO: Agregar secciones específicas del proyecto
    pass

def crear_estructura(SapModel):
    """Crea la geometría completa."""
    # TODO: Crear pórticos, correas, arriostramientos
    pass

def asignar_apoyos(SapModel):
    """Asigna condiciones de apoyo."""
    # TODO: Empotramientos en bases
    pass

def aplicar_cargas(SapModel):
    """Aplica cargas gravitatorias y de viento."""
    # TODO: Cargas según CIRSOC
    pass


# =============================================================================
# EJECUCIÓN
# =============================================================================

if __name__ == "__main__":
    try:
        SapModel = main()
    except Exception as e:
        print(f"\n*** ERROR: {e} ***")
        sys.exit(1)
```

---

## 13. RECURSOS ADICIONALES

### Documentación Oficial
- SAP2000 API Reference Manual (incluido en instalación)
- CSI Knowledge Base: https://wiki.csiamerica.com/

### Códigos de Diseño
- CIRSOC 301: Estructuras de Acero
- CIRSOC 101: Cargas Gravitatorias
- CIRSOC 102: Cargas de Viento
- AISC 360-16: Steel Construction Manual

### Tablas de Perfiles
- Catálogo Ternium (perfiles argentinos)
- Catálogo Siderca (tubos estructurales)
- AISC Steel Manual (perfiles americanos)

---

**Documento generado: 2026-01-16**
**Basado en: Proyecto Galpón Deportivo Berisso**
**Versión SAP2000: 24.2.0**
