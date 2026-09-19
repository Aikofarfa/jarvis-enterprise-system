# JARVIS Mobile

Aplicación móvil Expo/React Native para la consola **JARVIS · Fábrica web**. Esta versión conserva la identidad visual del proyecto entregado y añade una experiencia móvil independiente con navegación por módulos, persistencia local y guardrails explícitos.

## Incluido

- Tablero de mando con brief de nueva corrida.
- Fábrica web con listado, expansión y eliminación reversible de corridas locales.
- Bandeja de revisión humana sin ejecuciones automáticas.
- Ajustes de privacidad y borrado controlado de datos locales.
- Persistencia con `AsyncStorage`.
- Iconos, splash y paleta HUD de JARVIS.
- Navegación Expo Router y feedback háptico en pestañas.

## Alcance seguro

Los briefs se guardan únicamente en el dispositivo. No se configuraron ni ejecutaron Google Maps, WhatsApp, Nequi, pagos, proveedores de IA, despliegues ni credenciales externas. La app no inventa métricas de costos, margen, ventas o clientes: cuando no existe una conexión real, muestra estados vacíos o `—`.

El proyecto web original se conserva aparte en la entrega final bajo `original-reference/`.

## Desarrollo

```bash
pnpm dev
pnpm check
pnpm lint
pnpm test
```

## Estructura principal

- `app/(tabs)/index.tsx`: centro de mando.
- `app/(tabs)/factory.tsx`: cola de producción local.
- `app/(tabs)/approvals.tsx`: revisión humana.
- `app/(tabs)/settings.tsx`: privacidad y datos locales.
- `lib/jarvis-context.tsx`: estado y persistencia local.
- `components/jarvis-ui.tsx`: sistema visual compartido.
