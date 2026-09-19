# Integraciones de JARVIS

## Activas en esta entrega

- `POST /api/health`: comprobación del servidor.
- `POST /api/orchestrate`: valida un brief, estima un precio inicial por categoría y ejecuta el failover entre DeepSeek y OpenAI cuando existen credenciales server-side.
- `POST /api/costs/margin`: calcula costo total, utilidad, margen y autorización humana con el algoritmo definido en los requisitos.

## Pendientes de credenciales y revisión

Google Places, WhatsApp Cloud API, Nequi, base de datos persistente y despliegue de la fábrica web están documentados en `.env.example`, pero no se activan automáticamente. Esto evita exponer secretos, enviar mensajes no autorizados o tratar una notificación de pago como confirmación financiera.

La prospección de Google debe respetar los términos y límites de Google Maps/Places, además de las reglas locales de contacto comercial. WhatsApp requiere un número y una cuenta empresarial con plantillas aprobadas. Nequi debe integrarse mediante un webhook o proveedor autorizado; una captura o texto entrante nunca debe marcar un pago como confirmado sin validación humana.

## Contrato de orquestación

```json
{
  "brief": "Landing para una clínica dental en Bogotá",
  "salePrice": 800000,
  "hostingCost": 50000,
  "tokenCost": 10000,
  "apiCosts": 0
}
```

El resultado incluye `margin.status`. Aunque el margen sea aprobado, la producción sigue detenida hasta la aprobación humana explícita.
