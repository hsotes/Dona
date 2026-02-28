# Capítulo 46: Seguridad en RAG

---

## El Desafío de Seguridad en RAG

> "La ciberseguridad es un campo profundo y en constante evolución, así que sería imposible abordar cada riesgo de seguridad posible. En cambio, veamos algunos de los desafíos y oportunidades de seguridad que son únicos para un sistema RAG."

---

## El Foco Principal: Proteger tu Knowledge Base

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Una razón común para construir RAG es tener          │
│   información PRIVADA o PROPIETARIA.                   │
│                                                         │
│   Esa información se mantuvo fuera de la web abierta   │
│   intencionalmente (donde un LLM podría haberla        │
│   aprendido).                                          │
│                                                         │
│   Después de construir RAG, probablemente todavía      │
│   querés mantener esos datos PRIVADOS.                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Vectores de Ataque: Cómo Puede Filtrarse la Info

### 1. Solicitud Directa vía Prompt

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Un usuario podría solicitar info directamente:       │
│                                                         │
│   "Citame el contenido completo de los documentos      │
│    sobre costos de la empresa"                         │
│                                                         │
│   Un prompt bien redactado podría convencer al LLM     │
│   de citar directamente chunks recuperados.            │
│                                                         │
│   ASUNCIÓN RAZONABLE:                                  │
│   Usuarios de tu app pueden al menos INDIRECTAMENTE    │
│   acceder a los contenidos de tu knowledge base.       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Filtración a LLM Provider

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   El augmented prompt que enviás al LLM CONTIENE       │
│   documentos/chunks de tu knowledge base.              │
│                                                         │
│   Al enviarlo a un provider externo,                   │
│   PERDÉS CONTROL de la seguridad.                      │
│                                                         │
│   Dependiendo del nivel de seguridad requerido,        │
│   esto puede NO ser un riesgo tolerable.              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. Hackeo Directo del Database

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Como cualquier database tradicional,                 │
│   tu vector database puede ser hackeada directamente.  │
│                                                         │
│   Pero vector DBs tienen desafíos ÚNICOS...            │
│   (más sobre esto abajo)                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Solución 1: Autenticación de Usuarios

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Autenticar usuarios de manera apropiada              │
│   al nivel de información que pueden acceder.          │
│                                                         │
│   EJEMPLO:                                             │
│   Knowledge base con datos privados de la empresa:     │
│   → Solo empleados logueados pueden usar el sistema    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Solución 2: Multi-Tenancy con RBAC

### La idea:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   RBAC = Role-Based Access Control                     │
│                                                         │
│   Dividir datos en MÚLTIPLES TENANTS                   │
│   basados en privilegios de acceso por rol.            │
│                                                         │
│   Cuando un usuario hace retrieval:                    │
│   → Solo tiene acceso a documentos según su ROL        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Importante:

```
❌ METADATA FILTERING para seguridad:
   En teoría podrías tener todos los docs en un tenant
   y filtrar por metadata según acceso del usuario.
   
   EN PRÁCTICA: Esta técnica es MUY PROPENSA A FALLAR
   
   Metadata filtering es bueno para PERSONALIZACIÓN
   pero NO para SEGURIDAD.

✅ MULTI-TENANCY separada:
   Tener múltiples tenants SEPARADAMENTE almacenados
   es un approach mucho más CONFIABLE para seguridad.
```

---

## Solución 3: On-Premises Deployment

### Cuándo considerarlo:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Si el nivel de seguridad de tu knowledge base        │
│   no tolera enviar datos a providers externos:         │
│                                                         │
│   → Correr TODO el sistema RAG LOCALMENTE (on-prem)    │
│                                                         │
│   SIGNIFICA:                                           │
│   ├── Hostear el LLM en tu propio hardware            │
│   └── Hostear el vector database en tu propio hardware │
│                                                         │
│   TRADE-OFFS:                                          │
│   ├── Más complejidad                                  │
│   ├── Más costo de infraestructura                    │
│   └── PERO: Control total del pipeline                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Solución 4: Encriptación de Datos

### En databases tradicionales:

```
Encriptar contenido = incluso si hackean,
no pueden acceder fácilmente a la información.
```

### El desafío único de Vector DBs:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PROBLEMA:                                            │
│   Para que el algoritmo ANN funcione,                  │
│   los DENSE VECTORS deben estar en memoria             │
│   de forma DESENCRIPTADA.                              │
│                                                         │
│   SOLUCIÓN PARCIAL:                                    │
│   ├── El TEXTO de los chunks puede estar encriptado   │
│   ├── Se desencripta después del retrieval             │
│   └── Justo antes de construir el augmented prompt     │
│                                                         │
│   Algunos providers de vector DB ofrecen esto.         │
│   O podés encriptar/desencriptar chunks vos mismo.     │
│                                                         │
│   TRADE-OFF: Más complejidad + algo de latencia        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Riesgo Emergente: Reconstrucción desde Vectores

### Investigación reciente:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ⚠️ Es POSIBLE reconstruir texto original             │
│      desde sus representaciones dense vector.          │
│                                                         │
│   IMPLICACIÓN:                                         │
│   Incluso si encriptás los chunks,                     │
│   un hacker podría reconstruirlos desde                │
│   los vectores NO encriptados.                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Técnicas en exploración:

```
MITIGACIONES EXPERIMENTALES:
├── Agregar RUIDO a los dense vectors
├── Aplicar TRANSFORMACIONES
└── Reducir DIMENSIONALIDAD de forma que preserve
    distancias pero oscurezca significado semántico

TRADE-OFFS:
├── Agregan complejidad al retriever
└── Tienden a REDUCIR performance del sistema
```

### Contexto:

```
Este ataque requiere:
├── Acceso directo a tu database
└── Técnicas experimentales de reconstrucción

Es una preocupación de seguridad POSIBLE
y un tema de investigación ACTIVO.
```

---

## Resumen de Estrategias de Seguridad

| Riesgo | Solución | Complejidad |
|--------|----------|-------------|
| **Acceso no autorizado** | Autenticación + RBAC | Media |
| **Filtración por rol** | Multi-tenancy separada | Media |
| **Leak a LLM provider** | On-premises deployment | Alta |
| **Hackeo de DB** | Encriptación de chunks | Media |
| **Reconstrucción de vectores** | Técnicas experimentales | Alta |

---

## Aplicación para DONA 🎯

### Análisis de seguridad para DONA:

```python
DONA_SECURITY_ASSESSMENT = {
    "data_sensitivity": {
        "product_catalog": "LOW - info pública",
        "prices": "MEDIUM - competencia podría usar",
        "costs": "HIGH - confidencial",
        "customer_data": "HIGH - privacidad",
        "supplier_info": "MEDIUM - comercial"
    },
    
    "current_risks": {
        "prompt_injection": "Usuario podría pedir info de costos",
        "data_leak_to_api": "Enviamos chunks a OpenAI",
        "unauthorized_access": "Sin autenticación actualmente"
    }
}
```

### Implementación de seguridad para DONA:

```python
# 1. AUTENTICACIÓN BÁSICA
def dona_authenticate(user):
    """
    Diferentes niveles de acceso
    """
    roles = {
        "customer": ["products", "prices", "availability"],
        "employee": ["products", "prices", "costs", "suppliers"],
        "admin": ["all"]
    }
    return roles.get(user.role, ["products"])

# 2. MULTI-TENANCY POR ROL
DONA_TENANTS = {
    "public": {
        "collections": ["products", "faq"],
        "access": "all users"
    },
    "internal": {
        "collections": ["costs", "suppliers", "margins"],
        "access": "employees only"
    }
}

def get_searchable_collections(user_role):
    if user_role == "customer":
        return DONA_TENANTS["public"]["collections"]
    elif user_role in ["employee", "admin"]:
        return (DONA_TENANTS["public"]["collections"] + 
                DONA_TENANTS["internal"]["collections"])

# 3. PROMPT SANITIZATION
def sanitize_prompt(prompt, user_role):
    """
    Detectar y bloquear intentos de acceder a info no autorizada
    """
    sensitive_terms = ["costo", "margen", "proveedor", "ganancia"]
    
    if user_role == "customer":
        for term in sensitive_terms:
            if term in prompt.lower():
                return {
                    "blocked": True,
                    "reason": "Consulta sobre información no disponible"
                }
    
    return {"blocked": False, "prompt": prompt}

# 4. RESPONSE FILTERING
def filter_response(response, user_role):
    """
    Remover información sensible de respuestas
    """
    if user_role == "customer":
        # Remover cualquier mención de costos/márgenes
        response = re.sub(r'costo.*?\$[\d.,]+', '', response)
        response = re.sub(r'margen.*?%', '', response)
    
    return response
```

### Decisión on-prem para DONA:

```python
DONA_DEPLOYMENT_DECISION = {
    "current": "API-based (OpenAI)",
    
    "risk_assessment": {
        "product_info_leak": "LOW - info pública de todos modos",
        "price_info_leak": "MEDIUM - pero cambia frecuentemente",
        "cost_info_leak": "HIGH - confidencial"
    },
    
    "recommendation": """
    Para DONA actual (catálogo público):
    → API-based está OK
    
    Si se agrega info de costos/márgenes:
    → Considerar:
      - Tenant separado para info sensible
      - O on-prem para queries internas
    """
}
```

---

## Key Takeaways:

```
1. Tu knowledge base probablemente contiene info PRIVADA
   → Entendé y controlá cómo se accede

2. MULTI-TENANCY con RBAC es más confiable que metadata filtering
   para SEGURIDAD

3. Si no tolerás leak a providers externos:
   → On-premises deployment

4. ENCRIPTACIÓN de chunks ayuda, pero vectors deben estar
   desencriptados para ANN

5. RIESGO EMERGENTE: Reconstrucción de texto desde vectors
   → Área de investigación activa

6. Combiná estas técnicas con precauciones de
   ciberseguridad generales
```

---

## Próximo: Multimodal RAG

Incorporando imágenes y PDFs en sistemas RAG.

---
