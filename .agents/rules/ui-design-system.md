# Manifiesto de UI/UX, Proporciones y Estilo de Negocio (`ui-design-system`)

> **Propósito**: Grabar la visión y directivas de diseño del usuario aprendidas durante las revisiones operativas, garantizando que todo desarrollo o refactorización en el frontend respete estas directivas sin requerir correcciones reiteradas.

---

## 1. Lenguaje de Negocio vs. Jerga de Desarrollo (Estricto)
- **Cero Jerga de Código en la Interfaz**: Queda prohibido usar nombres de algoritmos, librerías o variables técnicas en etiquetas visibles para el operador.
  - ❌ *"Volumen Transferido AGA-8"* ➔ ✅ **`Volumen Transferido`**
  - ❌ *"Perfil de gas"* ➔ ✅ **`Fuente de gas`**
  - ❌ *"Libro Mayor"* ➔ ✅ **`Cuenta de Balance`**
- **Cero Referencias Locales en UI**: Prohibido exhibir nombres, jerga o apodos de alcance local en títulos, sellos o presets públicos.
  - ❌ *"Aforo Sabanas"* o *"Aforo Estimado (Sabanas)"* ➔ ✅ **`Balance de Entrega y Aforo`** / **`Aforo Estimado`**
  - ❌ *"EDS GNC La Sabana (Bonga - Mamey)"* ➔ ✅ **`EDS GNC Bonga - Mamey`**
- **Prohibición de "Certificar" (Uso Obligatorio de "Estimar")**:
  - Queda prohibido usar *"certificar"*, *"certificado"* o *"certificación"* al referirse a aforos, volumen o condiciones contractuales.
  - Se debe utilizar siempre la semántica de aproximación y física termodinámica: **`estimar`**, **`estimado`**, **`estimación`** (ej. *«Aforo Estimado»*, *«estimar las condiciones contractuales»*, *«Aforo Est.»*).
  - ❌ *"Aforo Certificado"* / *"certificar las condiciones contractuales"* ➔ ✅ **`Aforo Estimado`** / **`estimar las condiciones contractuales`**

- **Prohibición Total del Carácter "&"**: En títulos, subtítulos, botones, modales y pestañas, usar siempre la conjunción natural castellana **`y`**.
  - ❌ *"Consola de Operaciones & Despacho"* ➔ ✅ **`Consola de Operaciones y Despacho`**
  - ❌ *"Cuenta de Balance & Conciliación"* ➔ ✅ **`Cuenta de Balance y Conciliación`**
  - ❌ *"Venta & Conciliación"* ➔ ✅ **`Venta y Conciliación`**
- **Sin Numeraciones Artificiales**: No colocar *"1."*, *"2."* en títulos de tarjetas o paneles ejecutivos.
  - ❌ *"1. Condiciones de Despacho"*, *"2. Balance de Entrega y Aforo"* ➔ ✅ **`Condiciones de Despacho`**, **`Balance de Entrega y Aforo`**
- **Limpieza de "Definiciones" y Glosarios**: No colocar tarjetas explicativas obvias (*"¿Qué es compresibilidad?"*, *"Operación Nominal"*, etc.). La herramienta es de uso profesional diario por operadores que ya conocen el negocio y requieren cero ruido visual.

---

## 2. Cromática Unificada: El Acento Único "Azul Gas"
- **Color de Acento Maestro**: El único color de acento de marca y foco interactivo es el **Azul Gas de la flama del logo**:
  - `var(--color-accent)` (`#0284c7` en light mode)
  - `var(--color-accent-subtle)` (`#f0f9ff`)
  - `var(--color-accent-border)` (`#bae6fd`)
- **Prohibición de Colores Arbitrarios por Categoría**:
  - ❌ Prohibido pintar módulos de transporte de color ámbar/naranja.
  - ❌ Prohibido pintar cascadas de color celeste diferenciado.
  - ❌ Prohibido colocar cintas decorativas verdes (`Award`) cuando no haya una acción que lo amerite.
  - ✅ Todas las pestañas activas, iconos de categoría (`Truck`, `Building2`, `Layers`), bordes de foco y badges identificadores usan exclusivamente el **Azul Gas**.
- **Icono de la Flama (`Flame`)**: Siempre estilizado en el azul gas corporativo (`text-[var(--color-accent)]`).
- **Semáforo Operativo Restringido**: El verde (`var(--color-alert-green-*)`), amarillo (`var(--color-alert-yellow-*)`) y rojo (`var(--color-alert-red-*)`) se reservan **única y exclusivamente** para estados semafóricos de riesgo físico o contractual (merma > 2%, presión baja < 230 bar, o éxito de guardado).

---

## 3. Proporciones en Pantalla, Distribución y Espacio
- **Compactación Extrema en Paneles de Estado**:
  - ❌ Prohibido crear tarjetas gigantes de ~100px con párrafos explicativos largos para comunicar un estado de presión o telemetría.
  - ✅ Utilizar **barras de estado en fila única estilizadas** (~36px a 42px de alto, `px-4 py-3`), combinando:
    `[ Icono ] + [ Métrica Clave en Negrita ] + [ Badge de Estado a la Derecha ]`
- **Progressive Disclosure (Divulgación Progresiva)**:
  - En selectores complejos (ej. selector de módulos con 27 equipos): Nunca abrir todos los elementos de golpe.
  - Presentar inicialmente **únicamente las 2 categorías de nivel superior** (*Cascadas Estacionarias* y *Módulos de Transporte*) con sus contadores.
  - Desplegar los equipos específicos solo bajo demanda cuando el operador pulse una categoría.
- **Listas de Existencias Directas**:
  - En módulos de catálogo con pocos elementos (ej. Fuentes de Gas): No agregar acordeones ni categorías innecesarias. Mostrar directamente la tabla de existencias con búsqueda limpia.
- **Pantalla de Inicio / Dashboard Libre de Slop**:
  - Mantener solo accesos directos de valor operacional alto. Cero tarjetas de métricas estáticas "decorativas".

---

## 4. Ergonomía Numérica e Inicialización en Reposo
- **Inicialización Estricta en Cero (0)**:
  - La consola de despacho arranca siempre en `0` para presiones ($P_1 = 0, P_2 = 0$) y telemetría.
  - Prohibido precargar valores por defecto (como 50 bar, 250 bar, 30 bar), tanto al montar como al alternar entre *Cargue* y *Descargue*.
  - Mientras las presiones estén en 0, el sistema debe mostrar un estado neutral de *"Consola en Espera"* y no ejecutar cómputos de fondo innecesarios ni alertar falsos subllenados.
- **Edición Numérica Impecable (Sin ceros a la izquierda)**:
  - En cualquier input de presiones o medidas:
    1. `onFocus={(e) => e.target.select()}`: Selección total del contenido al hacer clic o tabular.
    2. Usar `type="text" inputMode="decimal"` sin los controles spinner (`▲ ▼`) que distorsionan el layout.
    3. Sanitizar dinámicamente: `val.replace(/^0+(?=\d)/, '')` para evitar `012`.
- **Afordancia Visual de Campos Editables Secundarios (Anti-Confusión)**:
  - Campos numéricos editables secundarios (como la temperatura en las tarjetas de presión) NUNCA deben mostrarse como texto plano transparente sin bordes (`🌡 0 °C`), pues parecen etiquetas inertes o telemetría de solo lectura.
  - Deben presentarse con una caja de entrada explícita con fondo de superficie, borde visible sutil, hover al azul gas, anillo de foco (`focus-within:ring-1 focus-within:ring-[var(--color-accent)]`) y etiqueta textual clara (*«Temperatura»*).


---

## 5. Tipografía y Estándar de Lectura
- **Fuente Principal**: **Inter** variable sin serifa, con cifras tabulares activas (`font-feature-settings: 'tnum'`). Facilita lecturas prolongadas de 8+ horas sin fatiga visual.
- **Fuente Técnica / Métrica**: **JetBrains Mono** (`font-mono`) reservada para números de instrumentación, presiones, unidades y códigos de identificación de equipo.
- **Prohibición de Tipografías Serifadas**: Cero Times New Roman o fuentes con serifa en interfaces operativas.

---

## 6. Diseño Responsive de Grado Industrial (Mobile-First a Pantallas de Planta)
- **Principio de Fluidez Total**:
  - Toda vista, modal, tabla y consola de despacho debe ser 100% responsiva y operativa en resoluciones desde móviles compactos (360px) hasta monitores industriales Ultra-Wide (4K).
- **Prohibición de Desbordamiento Horizontal (Anti-Horizontal-Scroll)**:
  - Cero anchos fijos no responsivos (prohibido `w-[800px]` o `w-[600px]` sin `max-w-full`).
  - Todo contenedor raíz de página debe contener `w-full max-w-7xl mx-auto overflow-hidden` o clases adaptativas.
  - Tablas densas de datos (Libro de Conciliación, Catálogo de Almacenamiento, Cromatografías) DEBEN estar estrictamente envueltas en contenedores con scroll horizontal autónomo (`overflow-x-auto w-full`).
- **Comportamiento por Breakpoints**:
  - **Móvil (< 640px / `sm`)**:
    - Disposición en 1 columna vertical fluida (`grid-cols-1`).
    - Las tarjetas de *Condiciones de Despacho* y *Balance de Entrega y Aforo* se apilan verticalmente.
    - Los selectores de presiones y temperatura se dividen en 1 o 2 columnas (`grid-cols-1 sm:grid-cols-2`).
    - Botones principales de acción táctil se expanden al 100% del ancho (`w-full sm:w-auto`) para facilitar la ergonomía del pulgar en campo.
    - Navegación lateral: Sidebar móvil colapsable mediante Drawer/Menú hamburguesa accesible, sin bloquear la visibilidad principal.
    - Modales: Ancho completo con márgenes mínimos (`mx-2 sm:mx-auto max-w-full sm:max-w-xl`), altura máxima controlada (`max-h-[90vh]`) y scroll interno suave (`overflow-y-auto`).
  - **Tablet (640px - 1024px / `md`)**:
    - Rejillas de 2 columnas equilibradas (`md:grid-cols-2`).
    - Filtros y barras de búsqueda utilizan `flex-wrap` con `gap-3` sin provocar desbordamiento.
  - **Desktop e Industrial (> 1024px / `lg` - `xl`)**:
    - Rejillas de alta densidad con proporciones optimizadas (`lg:grid-cols-12` o `grid-cols-3`).
    - Barras de estado y telemetría en fila única horizontal compacta (~40px alto).
- **Áreas Táctiles Mínimas**:
  - En móviles y tablets industriales, los botones, pestañas y controles de selección deben contar con un área táctil mínima de 40px a 44px (`min-h-[40px]` / `py-2.5 px-4`) para uso confiable con guantes o en campo.
- **Truncado Seguro y Legibilidad de Cifras**:
  - Toda celda métrica con valores largos debe usar `min-w-0` y evitar que el texto numérico rompa los contenedores flexibles.

---

## 7. Prohibición Absoluta de Transparencias (Superficies 100% Sólidas y Opacas)
- **Cero Efectos de Vidrio Esmerilado o Capas Translúcidas**:
  - Está **terminantemente prohibido** el uso de transparencias, opacidades parciales (`/40`, `/60`, `/80`, `/10`), `backdrop-blur` o fondos semi-transparentes en menús desplegables, listas flotantes, tarjetas, modales o filas de datos.
  - Ningún elemento del fondo, texto inferior o botón debe traslucirse o verse a través de un panel desplegado.
- **Fondos Sólidos Explícitos**:
  - Todo selector emergente, dropdown, menú jerárquico o modal DEBE poseer un fondo 100% sólido y opaco (`bg-white dark:bg-[#18181b]` o `bg-[var(--color-surface)]`).
  - Las listas y cada uno de los botones/filas de opciones deben declarar su propio color de fondo sólido explícito para impedir que hereden transparencias del árbol DOM.
- **Prohibición de Animaciones de Opacidad en Dropdowns**:
  - Queda prohibido aplicar `animate-fade-in` u otras animaciones con transición de `opacity: 0` a `1` en menús desplegables o selectores de formulario. Los dropdowns deben abrirse de manera inmediata y completamente opacos.


