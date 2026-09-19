# QA visual

- La primera captura móvil mostró que la geometría, espaciado y navegación se renderizan correctamente.
- Se detectó un contraste incorrecto: el esquema del sistema se inicializaba en claro en el preview web.
- Corrección aplicada: el proveedor de tema inicia JARVIS en esquema oscuro y se eliminó el log de depuración que ensuciaba la consola.
- Siguiente verificación: recapturar `/`, `/factory`, `/approvals` y `/settings` a 390×844.
