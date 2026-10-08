# Reglas de Pureza de Dominio (`domain-architect`)

1. **Cero Dependencias de Infraestructura**:
   - `backend/src/domain/` no debe importar Express, Prisma, base de datos ni librerías de infraestructura externa.
   - Toda dependencia debe invertirse mediante interfaces y repositorios en `backend/src/domain/repositories/`.

2. **Resolución Termodinámica y Convergencia**:
   - Todo algoritmo iterativo (Newton-Raphson para factor Z, Dranchuk-Abu-Kassem o AGA-8) debe lanzar una excepción de dominio tipada (`DivergenceException`) si no converge.
   - Prohibido silenciar excepciones termodinámicas o truncar resultados divergentes.
