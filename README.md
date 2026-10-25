# Simulación de Física I — Sistema Dinámico de Mesa Inclinada y Pinball

Simulador interactivo web basado en un motor de física propio (determinista y desacoplado) desarrollado en TypeScript para el curso **Física I (FUN-18)** de la **Universidad CENFOTEC**.

**Integrantes:**
* Danny Jhoel Arias Jiménez
* Fabiola María Román Barrantes
* Luis Ángel Sánchez Badilla
* Fabián Vargas Hidalgo

---

## Comandos del Proyecto

| Acción | Comando | Descripción |
| :--- | :--- | :--- |
| **Instalar dependencias** | `npm install` | Instala TypeScript, Vite, Vitest y dependencias de graficación. |
| **Correr pruebas** | `npm test` | Ejecuta la suite de pruebas unitarias y de validación analítica (55 pruebas). |
| **Simulación headless** | `npm run headless` | Ejecuta el escenario determinista sin DOM y genera `output/simulacion.csv`. |
| **Servidor de desarrollo** | `npm run dev` | Inicia el servidor local interactivo de Vite en `http://localhost:5173/`. |
| **Verificación estricta de tipos** | `npm run typecheck` | Ejecuta `tsc` para la UI y `tsconfig.physics.json` (verifica que física no use DOM). |
| **Construcción de producción** | `npm run build` | Compila los paquetes optimizados en `dist/` para despliegue (ej. Vercel). |

---

## Arquitectura y Estructura del Código

El repositorio implementa una estricta separación de responsabilidades:

```
├── src/
│   ├── physics/               # Núcleo de física puro (SI: m, kg, s, rad, N, J)
│   │   ├── constants.ts       # Constantes del modelo (dimensiones, masas, rigideces, restituciones)
│   │   ├── types.ts           # Interfaces de datos inmutables (Vec2, Bola, Obstaculos, EstadoGlobal)
│   │   ├── vec2.ts            # Álgebra vectorial pura 2D
│   │   ├── gravity.ts         # Gravedad efectiva en plano inclinado (a = g·sen θ)
│   │   ├── integrator.ts      # Integración cinemática determinista
│   │   ├── collisions.ts      # Detección estática y continua (CCD) contra círculos y segmentos
│   │   ├── response.ts        # Respuesta dinámica al choque e impulso con restitución e
│   │   ├── launcher.ts        # Modelo elástico de compresión y velocidad de lanzamiento
│   │   ├── energy.ts          # Cálculos analíticos de K, Ug y Em
│   │   ├── flipper.ts         # Cinemática angular de paletas (fase final)
│   │   ├── world.ts           # Orquestador del paso temporal (avanzarSimulacion, setTheta)
│   │   └── index.ts           # Exportación de la API pública del motor
│   └── ui/                    # Capa de presentación y visualización web
│       ├── renderer.ts        # Renderizado en Canvas 2D (escala métrica, bola, obstáculos, vectores)
│       ├── controls.ts        # Enlace del panel de control (Play, Pause, Step, Reset, slider θ, presets)
│       ├── charts.ts          # Gráficas en tiempo real de Chart.js (G1 Energías y G2 Rapidez)
│       ├── series.ts          # Estructura de serie temporal con ventana deslizante (10 s)
│       ├── main.ts            # Integración del bucle temporal a 240 Hz y HUD de telemetría
│       └── style.css          # Estilo sobrio y claro (verde institucional, blanco, iconos SVG)
├── tests/
│   ├── physics/               # Pruebas de validación analítica, colisiones y balance energético
│   └── ui/                    # Pruebas unitarias de componentes de interfaz (series temporales)
├── scripts/
│   └── headless.ts            # Ejecución por consola de 10 s de simulación con exportación CSV
├── evidencia/
│   └── simulacion_ejemplo.csv # Registro determinista de referencia para auditoría científica
├── tsconfig.json              # Configuración general de TypeScript para el proyecto web
└── tsconfig.physics.json      # Configuración que aísla la física (`types: []`, sin DOM ni Window)
```

---

## Convenciones y Sistema de Unidades

1. **Unidades del SI:** Toda la biblioteca física opera exclusivamente en metros ($m$), kilogramos ($kg$), segundos ($s$), radianes ($rad$), Newtons ($N$) y Joules ($J$).
2. **Sistema de Coordenadas:** Origen $(0, 0)$ en la esquina superior izquierda de la mesa. El eje $+x$ avanza hacia la derecha y el eje $+y$ avanza hacia abajo en la dirección de la pendiente.
3. **Determinismo y Pureza:** Las funciones del motor no mutan sus argumentos; toman un estado y retornan uno nuevo. Mismo estado inicial y mismo $\Delta t$ producen idéntico resultado matemático en cualquier plataforma.

---

## Documentación de la API Pública del Motor Físico (`src/physics/`)

### 1. Álgebra Vectorial (`vec2.ts`)
* `sumar(a: Vec2, b: Vec2): Vec2` — Suma de vectores.
* `restar(a: Vec2, b: Vec2): Vec2` — Resta de vectores.
* `escalar(v: Vec2, k: number): Vec2` — Multiplicación por escalar.
* `punto(a: Vec2, b: Vec2): number` — Producto escalar $a \cdot b$.
* `norma(v: Vec2): number` — Magnitud Euclidiana $\|v\|$ ($m$ o $m/s$).
* `normalizar(v: Vec2): Vec2` — Vector unitario en dirección de $v$.
* `perpendicular(v: Vec2): Vec2` — Vector rotado $90^\circ$ $(-y, x)$.

### 2. Gravedad Efectiva (`gravity.ts`)
* `gravedadEfectiva(g: number, theta: number): Vec2` — Aceleración sobre la mesa inclinada: $a = (0, g \sin\theta)$ en $m/s^2$.

### 3. Integración Temporal (`integrator.ts`)
* `avanzarBola(bola: Bola, aceleracion: Vec2, dt: number): Bola` — Integración analítica exacta con aceleración constante durante el paso:
  $$p(t + \Delta t) = p(t) + v(t)\Delta t + \frac{1}{2}a\Delta t^2$$
  $$v(t + \Delta t) = v(t) + a\Delta t$$

### 4. Detección de Colisiones (`collisions.ts`)
* `contactoBolaCirculo(bola, obstaculo): Contacto | null` — Contacto estático contra círculo.
* `contactoBolaSegmento(bola, obstaculo): Contacto | null` — Contacto estático contra segmento.
* `impactoContinuoCirculo(pAnterior, pSiguiente, radio, obstaculo): Impacto | null` — Detección continua de trayectoria contra círculo (evita efecto túnel).
* `impactoContinuoSegmento(pAnterior, pSiguiente, radio, obstaculo, vObstaculo?, dt?): Impacto | null` — Detección continua contra segmento, con obstáculo posiblemente móvil (`vObstaculo` en m/s, `dt` en s; omitir ambos para obstáculos fijos).
* `primerImpacto(pAnterior, pSiguiente, radio, circulos, planos): ImpactoIdentificado | null` — Determina cronológicamente la primera colisión dentro del paso.

### 5. Respuesta Dinámica al Impacto (`response.ts`)
* `respuestaChoque(velocidad, normal, restitucion, masa, velocidadSuperficie?): ResultadoChoque` — Resuelve el impacto sin fricción conservando la componente tangencial e invirtiendo la componente normal según el coeficiente $e$:
  $$v' = v - (1 + e)[(v - v_s) \cdot n] n$$
  Calcula el impulso transmitido $J = m(v' - v)$ y la energía disipada:
  $$\Delta E = \frac{1}{2}m(1 - e^2)v_n^2$$

### 6. Mecánica del Lanzador Elástico (`launcher.ts`)
* `energiaElastica(k: number, compresion: number): number` — Energía potencial elástica $U_{el} = \frac{1}{2}kx^2$ ($J$).
* `velocidadLanzamiento(compresion, k, masa, direccion): Vec2` — Velocidad inicial teórica por conservación elástica: $v_0 = x\sqrt{k/m}$ ($m/s$).

### 7. Balance Energético (`energy.ts`)
* `energiaCinetica(bola: Bola): number` — $K = \frac{1}{2}m\|v\|^2$ ($J$).
* `energiaPotencialGravitatoria(bola, g, theta, largoMesa): number` — $U_g = mg(L - y)\sin\theta$ ($J$) con nivel de referencia en la base de la mesa ($y = L$).
* `energiaMecanica(bola, g, theta, largoMesa, uEl?): number` — Energía total $E = K + U_g + U_{el}$ ($J$).

### 8. Orquestador y Estado Global (`world.ts`)
* `avanzarSimulacion(estado: EstadoGlobal, dt: number, entradas: EntradasUsuario): ResultadoPaso` — Avanza el sistema un paso $\Delta t$. Resuelve gravedad efectiva, integración, detección continua y hasta 8 rebotes múltiples por paso sin atravesamiento, devolviendo el nuevo estado y el registro de eventos de colisión. Los impactos con rapidez normal menor que `UMBRAL_REPOSO` (0.01 m/s) se tratan como contacto en reposo: no generan evento y la bola queda apoyada sobre el obstáculo (no atraviesa).
* `setTheta(estado: EstadoGlobal, theta: number): EstadoGlobal` (alias `setAngle`) — Modifica el ángulo $\theta$ en radianes de forma pura, permitiendo ajustar la inclinación en reposo o durante la simulación.

Tipos de entrada y salida de `avanzarSimulacion`:

| Tipo | Campos |
| :--- | :--- |
| `EntradasUsuario` | `flipperIzquierdo` (boolean), `flipperDerecho` (boolean), `compresionLanzador` (m) |
| `EventoColision` | `instante` (s), `tipo` (`"circular"` o `"plano"`), `indice` (posición en su lista), `energiaDisipada` (J) |
| `ResultadoPaso` | `estado` (`EstadoGlobal`), `eventos` (`EventoColision[]`) |

---

## Validación Analítica y Pruebas Unitarias

La suite de Vitest certifica el cumplimiento riguroso de las leyes de Newton y la conservación energética:

1. **Caída por Plano Inclinado (`tests/physics/analytic.test.ts`):** Valida que la aceleración numérica coincida con $a = g\sin\theta$ (error $< 10^{-12}$) y que el tiempo de caída para recorrer una distancia $d$ satisfaga la solución cerrada $t = \sqrt{2d/a}$ con tolerancia inferior a $10^{-9}\text{ m}$.
2. **Balance del Lanzador (`tests/physics/launcher.test.ts`):** Certifica la equivalencia $\frac{1}{2}kx^2 = \frac{1}{2}mv_0^2$ y que la bola supere la longitud del carril inicial.
3. **Conservación de la Energía (`tests/physics/energy.test.ts`):** En ausencia de colisiones o con $e = 1.0$, la energía mecánica $E = K + U_g$ se mantiene constante dentro del $1\%$ tras 10 s de evolución temporal continua.
4. **Disipación Exacta por Choque (`tests/physics/response.test.ts`):** Confirma que cada impacto disipe exactamente $\Delta E = \frac{1}{2}m(1 - e^2)v_n^2$ con tolerancia relativa de $10^{-9}$.
5. **Balance Energético Global del Orquestador (`tests/physics/world.test.ts`):** Comprueba que en cada paso se cumpla $E_{antes} - E_{despues} = \sum \Delta E$ con tolerancia absoluta de $10^{-5}\text{ J}$, y que $E_0 - E_f$ coincida con la sumatoria de energía disipada en todos los rebotes.
6. **Contacto en reposo (`tests/physics/world.test.ts`):** Tras 20 s con $e = 0.60$ la bola queda apoyada en $y = 0.70 - r$ (tolerancia $10^{-6}\text{ m}$) y nunca atraviesa el piso.

---

## Escenario Headless y Auditoría de Telemetría

El comando `npm run headless` ejecuta una simulación automatizada sin interfaz gráfica durante $t = 10.0\text{ s}$ ($\Delta t = 1/240\text{ s}$, 2400 pasos) con una bola soltada desde $(0.28, 0.10)\text{ m}$ con $\theta = 6.5^\circ$ rebotando contra un piso en $y = 0.70\text{ m}$ ($e = 0.60$).

Genera `output/simulacion.csv` con las siguientes columnas para análisis científico:
* `t_s`: Tiempo simulado ($s$).
* `x_m`, `y_m`: Coordenadas de posición ($m$).
* `vx_m_s`, `vy_m_s`: Componentes de velocidad ($m/s$).
* `K_J`: Energía cinética ($J$).
* `Ug_J`: Energía potencial gravitatoria ($J$).
* `Uel_J`: Energía elástica ($J$).
* `E_J`: Energía mecánica total ($J$).
* `colisiones`: Número de impactos detectados en el paso.
* `E_disipada_J`: Joules disipados durante los impactos del paso.

---

## Interfaz de Usuario y Características Interactivas

* **Diseño Sobrio y Académico:** Paleta de colores clara estructurada en verde institucional CENFOTEC (`#15803d`), blanco y gris neutro pizarra (`#f1f5f9`, `#e2e8f0`), con iconos vectoriales SVG.
* **Control de Inclinación:** Control deslizante calibrado en el rango reglamentario $\theta \in [3.0^\circ, 15.0^\circ]$, con visualización simultánea en grados y radianes, actualizando en tiempo real la aceleración $a = g\sin\theta$. Cambiar $\theta$ reinicia la simulación ($\theta$ es constante durante la partida).
* **Controles de Laboratorio:** Iniciar, Pausar, Paso a paso ($\Delta t = 1/240\text{ s}$), Reiniciar y selector de velocidad de reproducción ($0.25\times, 0.50\times, 1.00\times, 2.00\times$) para inspección de colisiones en cámara lenta.
* **Interacción Directa en Mesa:** Posibilidad de hacer clic sobre cualquier punto de la mesa para posicionar y soltar la bola instantáneamente.
* **Escenarios Preconfigurados:**
  1. *Validación Headless:* Plano en $y = 0.70\text{ m}$ ($e = 0.60$).
  2. *Mesa con Bumpers:* Mesa completa con paredes laterales y parachoques circulares ($e = 0.80$).
  3. *Caída Libre:* Plano libre sin obstáculos para verificación analítica de tiempos y aceleración.
* **Doble Panel Gráfico en Tiempo Real (Chart.js):**
  * **G1 — Energías vs. Tiempo:** energía cinética (K), potencial gravitatoria (Ug), elástica del lanzador (Uel) y energía total (E), con disipación escalonada en cada rebote.
  * **G2 — Rapidez vs. Tiempo:** Curva continua de rapidez con marcadores rojos discretos en cada evento de impacto.
* **Exportador Telemétrico:** Botón de descarga de CSV con la sesión en vivo para análisis y auditoría.

---

## Estado del Proyecto

### Requisitos del Avance 2:
- [x] Motor de física puro, determinista y desacoplado (en SI, sin DOM ni canvas).
- [x] Suite de pruebas unitarias y de validación analítica pasando al 100% (55 pruebas).
- [x] Script headless ejecutable que genera el archivo CSV reproducible con 10 s de datos.
- [x] Interfaz interactiva desplegable con manipulación de parámetros ($\theta \in [3^\circ, 15^\circ]$, Play, Pause, Step, Reset).
- [x] Gráficas en tiempo real de Energías vs. Tiempo (G1) y Rapidez vs. Tiempo (G2) con unidades SI.

### Trabajo para la Entrega Final:
- [ ] `flipper.ts`: impacto con vc = ω × r (el flipper derecho es simétrico).
- [ ] Lanzador con ESPACIO y flippers con ← y →.
- [ ] Marcador, 3 vidas, drenaje y fin de partida.
- [ ] Obstáculos de al menos dos geometrías y modo bonificación.
- [ ] Gráfica G3: energía disipada por colisión, por tipo de obstáculo.
- [ ] Modo depuración (tecla D): vector de velocidad, normales de contacto y balance de energía.
- [ ] Pulido, pruebas de robustez y ensayo de la exposición.