# Especificación: Gestión Dinámica de Almacenamientos y Ajustes de Consola (Reunión 3)

## 1. Contexto y Objetivos
Derivado de la Reunión 3 (3.1 y 3.2), se evidenció la necesidad de modelar las capacidades de almacenamiento ("Módulos") basándonos estrictamente en especificaciones físicas, al igual que los perfiles de gas. La consola de despacho dejará de tener capacidades quemadas (hardcoded) y consumirá un tercer módulo principal llamado "Almacenamientos", donde se administrarán las cascadas estacionarias y los módulos de transporte.
Asimismo, se requiere refactorizar la terminología en la Consola de Despacho (DispatchConsole) para alinearla con el lenguaje del negocio.

## 2. Definición del Dominio (Backend & Prisma)

### 2.1 Nuevo Modelo de Base de Datos: `StorageModule`
Se debe añadir un nuevo modelo a `schema.prisma`:
- `id`: UUID.
- `name`: String (Ej: "Cascada 12x150L", "Tráiler 16x125L").
- `type`: String - "ESTACIONARIA" o "TRANSPORTE".
- `cylinderCount`: Int (Ej: 10, 12, 16).
- `cylinderCapacityLiters`: Float (Ej: 150.0, 125.0).
- `totalCapacityLiters`: Float (Calculado como `cylinderCount * cylinderCapacityLiters`).
- `createdAt`: DateTime.

### 2.2 Endpoints y API REST
- Crear las rutas necesarias en el backend (CRUD básico) bajo `/api/storage-modules`.
- Exponer un endpoint `GET` para obtener la lista de almacenamientos.
- Exponer `POST` para crear nuevos almacenamientos (útil para el frontend).

## 3. UI/UX y Frontend

### 3.1 Nuevo Módulo de Almacenamientos (`StorageModulesModule.tsx`)
- Crear una nueva vista principal similar a "Perfiles de Gas" pero para administrar "Almacenamientos".
- Debe permitir crear un almacenamiento seleccionando:
  - Tipo: Estacionario o Transporte.
  - Cantidad de cilindros: 10, 12 o 16.
  - Capacidad por cilindro: 150L, 125L, u otro valor dinámico.
- Mostrar una lista/tarjetas de los módulos creados.

### 3.2 Refactorización de `DispatchConsole.tsx`
- **Terminología**:
  - Cambiar "Flujo:" por **"Categoría de operación:"**.
  - Cambiar "P₁ Talón" / "P₁ Llegada" por **"P1 Inicial"**.
  - Cambiar "P₂ Corte" / "P₂ Remanente" por **"P2 Final"**.
  - Cambiar "Perfil de Gas" por **"Fuente de gas"**.
- **Integración del Selector de Almacenamientos**:
  - Reemplazar los botones quemados de 13,497L y 26,950L por un `<select>` que consuma el API de almacenamientos (similar al `<select>` de `selectedGasProfileId`).
  - Al seleccionar un almacenamiento, el `totalCapacity` y el `totalCylindersCount` de la interfaz deben acoplarse a los valores de la base de datos (`cylinderCount` y `totalCapacityLiters`).
- **Digital Twin (Grilla)**:
  - Ya no debe tener un tamaño hardcodeado de 12. Debe renderizar el array de cilindros basado en el `cylinderCount` del almacenamiento seleccionado (10, 12, 16, etc.).

## 4. Reglas Críticas (Para QA y Seguridad)
- La base de datos sigue siendo `.env.development`.
- `data-architect` debe usar tipado estricto en el esquema Prisma.
- `designer` debe usar Tailwind CSS y adherirse al sistema *minimalist-skill*.
