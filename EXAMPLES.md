# Ejemplos de Uso / Usage Examples

Esta guía contiene ejemplos prácticos de cómo usar el servidor MCP de Google Analytics con Claude.

## 📊 Lectura de Datos (Data API)

### Ejemplo 1: Usuarios activos por país (última semana)

**Pregunta a Claude**:
```
Muéstrame los 10 países con más usuarios activos en la última semana
```

**Lo que Claude hará**:
Claude utilizará la herramienta `ga_run_report` con estos parámetros:

```json
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "country"}],
  "metrics": [{"name": "activeUsers"}],
  "limit": 10,
  "orderBys": [{"metric": {"metricName": "activeUsers"}, "desc": true}]
}
```

**Resultado esperado**:
```
País                Usuarios Activos
Estados Unidos      15,234
México              8,721
España              6,543
Argentina           4,231
Colombia            3,876
...
```

### Ejemplo 2: Páginas más vistas (mes actual)

**Pregunta a Claude**:
```
¿Cuáles son las 5 páginas más visitadas este mes?
```

**Parámetros que Claude usará**:
```json
{
  "dateRanges": [{"startDate": "2024-01-01", "endDate": "today"}],
  "dimensions": [{"name": "pagePath"}],
  "metrics": [{"name": "screenPageViews"}],
  "limit": 5,
  "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": true}]
}
```

### Ejemplo 3: Tráfico por dispositivo (tiempo real)

**Pregunta a Claude**:
```
Muéstrame cuántos usuarios hay ahora mismo por tipo de dispositivo
```

**Herramienta**: `ga_run_realtime_report`

```json
{
  "dimensions": [{"name": "deviceCategory"}],
  "metrics": [{"name": "activeUsers"}],
  "limit": 10
}
```

**Resultado**:
```
Dispositivo    Usuarios Activos
mobile         127
desktop        89
tablet         12
```

### Ejemplo 4: Conversiones por fuente de tráfico

**Pregunta a Claude**:
```
Muéstrame las conversiones de la última semana agrupadas por fuente de tráfico
```

```json
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
  "dimensions": [{"name": "sessionSource"}],
  "metrics": [
    {"name": "sessions"},
    {"name": "conversions"}
  ],
  "limit": 15,
  "orderBys": [{"metric": {"metricName": "conversions"}, "desc": true}]
}
```

### Ejemplo 5: Análisis de embudo de conversión

**Pregunta a Claude**:
```
Analiza mi embudo de conversión: vista de producto → añadir al carrito → iniciar pago → compra
```

**Herramienta**: `ga_run_funnel_report`

```json
{
  "dateRanges": [{"startDate": "30daysAgo", "endDate": "today"}],
  "funnelSteps": [
    {"name": "view_item"},
    {"name": "add_to_cart"},
    {"name": "begin_checkout"},
    {"name": "purchase"}
  ]
}
```

### Ejemplo 6: Obtener dimensiones y métricas disponibles

**Pregunta a Claude**:
```
¿Qué dimensiones y métricas están disponibles en mi propiedad de GA4?
```

**Herramienta**: `ga_get_metadata`

⚠️ **Advertencia**: Este comando devuelve más de 500 items. Úsalo con moderación.

### Ejemplo 7: Reporte de tabla dinámica

**Pregunta a Claude**:
```
Crea una tabla dinámica mostrando usuarios activos por país y tipo de dispositivo
```

**Herramienta**: `ga_run_pivot_report`

```json
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
  "dimensions": [
    {"name": "country"},
    {"name": "deviceCategory"}
  ],
  "metrics": [{"name": "activeUsers"}],
  "pivots": [
    {"fieldNames": ["deviceCategory"], "limit": 3}
  ]
}
```

## 📤 Envío de Eventos (Measurement Protocol)

### Ejemplo 8: Enviar evento personalizado

**Pregunta a Claude**:
```
Envía un evento personalizado llamado "newsletter_signup" con el parámetro source="homepage"
```

**Herramienta**: `ga_send_event`

```json
{
  "events": [{
    "name": "newsletter_signup",
    "params": {
      "source": "homepage",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }],
  "user_id": "user_12345"
}
```

### Ejemplo 9: Enviar vista de página

**Pregunta a Claude**:
```
Registra una vista de página para https://ejemplo.com/productos
```

**Herramienta**: `ga_send_pageview`

```json
{
  "page_location": "https://ejemplo.com/productos",
  "page_title": "Productos - Mi Tienda",
  "page_referrer": "https://google.com",
  "user_id": "user_12345"
}
```

### Ejemplo 10: Registrar una compra

**Pregunta a Claude**:
```
Registra una compra: orden #ORD-12345, total $249.99 USD, 2 productos
```

**Herramienta**: `ga_send_purchase`

```json
{
  "transaction_id": "ORD-12345",
  "value": 249.99,
  "currency": "USD",
  "tax": 20.00,
  "shipping": 10.00,
  "items": [
    {
      "item_id": "SKU-001",
      "item_name": "Camiseta Premium",
      "price": 99.99,
      "quantity": 1,
      "item_brand": "MiMarca",
      "item_category": "Ropa"
    },
    {
      "item_id": "SKU-002",
      "item_name": "Pantalón Deportivo",
      "price": 149.99,
      "quantity": 1,
      "item_brand": "MiMarca",
      "item_category": "Ropa"
    }
  ],
  "user_id": "user_12345"
}
```

### Ejemplo 11: Validar evento antes de enviar

**Pregunta a Claude**:
```
Valida este evento antes de enviarlo: tipo "purchase", valor 500 USD
```

**Herramienta**: `ga_validate_event`

```json
{
  "events": [{
    "name": "purchase",
    "params": {
      "transaction_id": "TEST-001",
      "value": 500,
      "currency": "USD",
      "items": [{
        "item_id": "PROD-123",
        "item_name": "Producto Test",
        "price": 500,
        "quantity": 1
      }]
    }
  }],
  "user_id": "user_test"
}
```

**Resultado**:
Claude mostrará si hay errores o warnings en el evento antes de enviarlo a producción.

### Ejemplo 12: Registrar inicio de sesión

**Pregunta a Claude**:
```
Registra un inicio de sesión con Google para el usuario user_789
```

**Herramienta**: `ga_send_login`

```json
{
  "user_id": "user_789",
  "method": "Google",
  "user_properties": {
    "account_type": {"value": "premium"},
    "signup_date": {"value": "2024-01-01"}
  }
}
```

### Ejemplo 13: Agregar al carrito

**Pregunta a Claude**:
```
Registra que el usuario agregó un producto al carrito: ID "PROD-456", precio $79.99
```

**Herramienta**: `ga_send_add_to_cart`

```json
{
  "currency": "USD",
  "value": 79.99,
  "items": [{
    "item_id": "PROD-456",
    "item_name": "Zapatillas Running",
    "price": 79.99,
    "quantity": 1,
    "item_brand": "Nike",
    "item_category": "Calzado"
  }],
  "user_id": "user_456"
}
```

## 🎯 Casos de Uso Avanzados

### Ejemplo 14: Análisis de rendimiento semanal completo

**Pregunta a Claude**:
```
Dame un análisis completo de la última semana: usuarios, sesiones, páginas vistas, tasa de conversión, y los 5 países principales
```

Claude puede usar múltiples herramientas o `ga_batch_run_reports`:

```json
{
  "requests": [
    {
      "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
      "metrics": [
        {"name": "activeUsers"},
        {"name": "sessions"},
        {"name": "screenPageViews"},
        {"name": "conversions"}
      ]
    },
    {
      "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
      "dimensions": [{"name": "country"}],
      "metrics": [{"name": "activeUsers"}],
      "limit": 5,
      "orderBys": [{"metric": {"metricName": "activeUsers"}, "desc": true}]
    }
  ]
}
```

### Ejemplo 15: Seguimiento de campaña de marketing

**Pregunta a Claude**:
```
Muéstrame el rendimiento de mis campañas de marketing de la última semana: sesiones, conversiones y tasa de conversión
```

```json
{
  "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
  "dimensions": [
    {"name": "sessionCampaignName"}
  ],
  "metrics": [
    {"name": "sessions"},
    {"name": "conversions"}
  ],
  "dimensionFilter": {
    "filter": {
      "fieldName": "sessionCampaignName",
      "stringFilter": {
        "matchType": "EXACT",
        "value": "(not set)",
        "notExpression": true
      }
    }
  },
  "limit": 20,
  "orderBys": [{"metric": {"metricName": "conversions"}, "desc": true}]
}
```

### Ejemplo 16: Comparar dos períodos

**Pregunta a Claude**:
```
Compara los usuarios activos de esta semana con la semana pasada
```

```json
{
  "dateRanges": [
    {"startDate": "7daysAgo", "endDate": "today", "name": "Esta semana"},
    {"startDate": "14daysAgo", "endDate": "8daysAgo", "name": "Semana pasada"}
  ],
  "metrics": [{"name": "activeUsers"}]
}
```

## 🧭 Descubrimiento y Auditoría de la Propiedad

### Ejemplo 17: Ver todas mis cuentas y propiedades

**Pregunta a Claude**:
```
¿A qué cuentas y propiedades de Google Analytics tengo acceso?
```

**Herramienta**: `ga_get_account_summaries`

Devuelve en una sola llamada todas las cuentas accesibles con sus propiedades, incluyendo los identificadores que necesitas para configurar el servidor.

### Ejemplo 18: Descubrir dimensiones y métricas personalizadas

**Pregunta a Claude**:
```
¿Qué dimensiones y métricas personalizadas tiene configuradas mi propiedad?
```

**Herramientas**: `ga_list_custom_dimensions` y `ga_list_custom_metrics`

Devuelven los nombres de API (por ejemplo, `customEvent:plan_type`) que luego puedes usar directamente en cualquier reporte.

### Ejemplo 19: Saber qué cuenta como conversión

**Pregunta a Claude**:
```
¿Qué eventos están marcados como conversiones en mi propiedad?
```

**Herramienta**: `ga_list_key_events`

Útil antes de armar reportes de conversión o de decidir qué eventos enviar por Measurement Protocol.

### Ejemplo 20: Verificar compatibilidad antes de un reporte

**Pregunta a Claude**:
```
¿Puedo combinar la dimensión "city" con la métrica "activeUsers" en un reporte?
```

**Herramienta**: `ga_check_compatibility`

```json
{
  "dimensions": [{"name": "city"}],
  "metrics": [{"name": "activeUsers"}],
  "compatibilityFilter": "COMPATIBLE"
}
```

Valida la combinación **antes** de gastar una consulta, y lista qué otros campos siguen siendo compatibles. Evita los ciclos de prueba y error que consumen tokens.

## 🛒 Ciclo de Comercio Completo

Con `ga_send_view_item` y `ga_send_refund` puedes registrar el ciclo entero: vista de producto → carrito → checkout → compra → reembolso. Recuerda usar el **mismo `client_id`** en cada paso para que GA los agrupe en una sesión.

### Ejemplo 21: Registrar vista de producto

**Pregunta a Claude**:
```
Registra que el usuario vio el producto "Zapatillas Running" de $79.99
```

**Herramienta**: `ga_send_view_item`

```json
{
  "client_id": "555.1717000000",
  "currency": "USD",
  "value": 79.99,
  "items": [{
    "item_id": "PROD-456",
    "item_name": "Zapatillas Running",
    "price": 79.99,
    "quantity": 1
  }]
}
```

### Ejemplo 22: Registrar un reembolso

**Pregunta a Claude**:
```
Registra un reembolso parcial de $79.99 de la orden ORD-12345
```

**Herramienta**: `ga_send_refund`

```json
{
  "transaction_id": "ORD-12345",
  "currency": "USD",
  "value": 79.99,
  "items": [{"item_id": "PROD-456", "quantity": 1}]
}
```

Usa el mismo `transaction_id` de la compra original. Para un reembolso total, omite `items`.

## 💡 Tips para Optimización

### ✅ Buenas Prácticas

1. **Usa límites siempre**:
   ```
   "limit": 10  // Empieza pequeño, aumenta si necesitas
   ```

2. **Fechas específicas**:
   ```
   "7daysAgo", "yesterday", "today"  // Más eficiente que rangos largos
   ```

3. **Ordena por métricas clave**:
   ```json
   "orderBys": [{"metric": {"metricName": "conversions"}, "desc": true}]
   ```

4. **Filtra datos irrelevantes**:
   ```json
   "metricFilter": {
     "filter": {
       "fieldName": "sessions",
       "numericFilter": {
         "operation": "GREATER_THAN",
         "value": {"int64Value": "10"}
       }
     }
   }
   ```

### ❌ Evitar

1. No pedir "todos los datos" sin límites
2. No usar múltiples dimensiones sin necesidad
3. No consultar rangos de fechas muy amplios (>90 días) sin filtros
4. No llamar `ga_get_metadata` repetidamente

## 🔍 Dimensiones y Métricas Comunes

### Dimensiones Populares
- `date` - Fecha
- `country` - País
- `city` - Ciudad
- `deviceCategory` - Tipo de dispositivo
- `browser` - Navegador
- `pagePath` - Ruta de página
- `eventName` - Nombre del evento
- `sessionSource` - Fuente de sesión
- `sessionMedium` - Medio de sesión
- `sessionCampaignName` - Nombre de campaña

### Métricas Populares
- `activeUsers` - Usuarios activos
- `sessions` - Sesiones
- `screenPageViews` - Vistas de página
- `conversions` - Conversiones
- `totalRevenue` - Ingresos totales
- `engagementRate` - Tasa de engagement
- `averageSessionDuration` - Duración promedio de sesión
- `bounceRate` - Tasa de rebote

## 📞 Soporte

Si tienes preguntas:
- [GitHub Issues](https://github.com/leonardosepulvedat/mcp-google-analytics/issues)
- [Documentación de GA4](https://developers.google.com/analytics/devguides/reporting/data/v1)

---

**¡Feliz análisis! 📊**
