# Reglas obligatorias de trabajo

Estas instrucciones aplican a todo cambio futuro en este repositorio.

## Idioma

- Responder a la persona usuaria en español.
- Escribir todo el código, nombres de identificadores, textos técnicos y comentarios de código en inglés.

## Flujo de trabajo

1. Antes de iniciar cualquier implementación, entregar un resumen completo de lo que se hará, el alcance, los archivos previsiblemente afectados, riesgos y validaciones.
2. Esperar una confirmación explícita antes de modificar la aplicación.
3. Trabajar directamente en `main`; no crear branches locales salvo instrucción explícita de la persona usuaria.
4. No crear commits salvo solicitud explícita de la persona usuaria.
5. Al terminar, entregar un análisis del resultado, archivos modificados, validaciones realizadas, riesgos pendientes y trabajo no cubierto. No hacer commit automáticamente.
6. Si se solicita un commit, hacerlo solo de forma local y sin coautoría. Antes del commit, actualizar los documentos afectados y `docs/changelog.md`.

## Implementación

- Analizar el cambio minuciosamente, aunque tome más tiempo, y aplicar la solución mínima que resuelva el requerimiento.
- Identificar oportunidades concretas para eliminar duplicación; no refactorizar código ajeno al alcance sin aprobación explícita.
- No introducir valores hardcoded. Si fuera imprescindible, explicar la necesidad y solicitar aprobación antes de introducirlos.
- No usar `any` ni `unknown`. `null` solo se permite en casos excepcionales y debe justificarse por el dominio.
- No usar `setTimeout`.
- No usar `querySelector`.
- Para asincronía en React, usar Promises con `useEffect` cuando corresponda al ciclo de vida del componente.
- Usar Linaria para los estilos.

## Pruebas y calidad

- Cuando un cambio requiera pruebas unitarias, crearlas como parte del mismo cambio.
- Evaluar la utilidad real de las pruebas existentes afectadas por el cambio. Refactorizar o eliminar las redundantes o que no protejan comportamiento relevante.
- Validar el cambio en proporción al riesgo; incluir pruebas, comprobación de tipos y compilación cuando aplique.
