# Pinball — Simulación de física (Física I, FUN-18)

Proyecto 6: Pinball (nivel Reto). Universidad CENFOTEC.

Integrantes: Danny Jhoel Arias Jiménez, Fabiola María Román Barrantes, Luis Ángel Sánchez Badilla, Fabián Vargas Hidalgo.

## Comandos

| Acción | Comando |
| --- | --- |
| Instalar dependencias | `npm install` |
| Correr pruebas | `npm test` |
| Ejecución headless (genera `output/simulacion.csv`; ver columnas más abajo) | `npm run headless` |
| Servidor de desarrollo | `npm run dev` |
| Verificar tipos (incluye la librería sin tipos del DOM) | `npm run typecheck` |

## Estructura

- `src/physics/`: librería de física. No usa `document`, `window`, `canvas` ni `requestAnimationFrame`.
- `src/ui/`: interfaz que consume la librería.
- `tests/physics/`: pruebas unitarias y de validación analítica.
- `scripts/headless.ts`: escenario fijo sin interfaz que escribe un CSV en `output/`.
- `evidencia/`: copia versionada del CSV headless (`simulacion_ejemplo.csv`), para auditar el modelo sin ejecutar nada. Es determinista: regenerarlo con `npm run headless` produce el mismo contenido.

Restricciones: solo tecnologías web, sin motores físicos de terceros. Dependencia de ejecución: Chart.js (graficación).

## Convenciones

Todo el núcleo opera en el Sistema Internacional: m, kg, s, rad, N, J. El origen está en la esquina superior izquierda de la mesa, con x hacia la derecha e y hacia abajo. Las funciones son puras y deterministas.

## API pública (`src/physics/index.ts`)

### Álgebra vectorial (`vec2`)

| Función | Recibe | Devuelve |
| --- | --- | --- |
| `sumar(a, b)` / `restar(a, b)` | dos `Vec2` | `Vec2` |
| `escalar(v, k)` | `Vec2`, escalar | `Vec2` |
| `punto(a, b)` | dos `Vec2` | número |
| `norma(v)` | `Vec2` | número (m o m/s) |
| `normalizar(v)` | `Vec2` | `Vec2` unitario (nulo si \|v\| = 0) |
| `perpendicular(v)` | `Vec2` | `Vec2` rotado 90° |

### Gravedad (`gravity`)

| Función | Recibe | Devuelve |
| --- | --- | --- |
| `gravedadEfectiva(g, theta)` | g (m/s²), θ (rad) | `Vec2` aceleración (m/s²) = (0, g·sen θ) |

### Integración (`integrator`)

| Función | Recibe | Devuelve |
| --- | --- | --- |
| `avanzarBola(bola, aceleracion, dt)` | `Bola`, aceleración (m/s²), Δt (s) | `Bola` actualizada |

### Colisiones (`collisions`)

| Función | Recibe | Devuelve |
| --- | --- | --- |
| `contactoBolaCirculo(bola, obstaculo)` | `Bola`, `ObstaculoCircular` | `null` o `{ punto (m), normal, profundidad (m) }` |
| `contactoBolaSegmento(bola, obstaculo)` | `Bola`, `ObstaculoPlano` | `null` o `{ punto (m), normal, profundidad (m) }` |
| `impactoContinuoCirculo(pAnterior, pSiguiente, radioBola, obstaculo)` | posiciones (m), radio (m), `ObstaculoCircular` | `null` o `{ t ∈ [0,1], punto (m), normal }` |
| `impactoContinuoSegmento(pAnterior, pSiguiente, radioBola, obstaculo, vObstaculo?, dt?)` | posiciones (m), radio (m), `ObstaculoPlano`, velocidad del obstáculo (m/s), Δt (s) | `null` o `{ t ∈ [0,1], punto (m), normal }` |
| `primerImpacto(pAnterior, pSiguiente, radioBola, circulos, planos)` | posiciones (m), radio (m), listas de obstáculos | `null` o impacto con `tipo` e `indice` |

### Resolución de impactos (`response`)

| Función | Recibe | Devuelve |
| --- | --- | --- |
| `respuestaChoque(velocidad, normal, restitucion, masa, velocidadSuperficie?)` | velocidad (m/s), normal, e (adimensional), masa (kg), velocidad de la superficie (m/s) | `{ velocidad (m/s), impulso (kg·m/s), energiaDisipada (J) }` |

### Lanzador (`launcher`)

| Función | Recibe | Devuelve |
| --- | --- | --- |
| `energiaElastica(k, compresion)` | k (N/m), x (m) | energía (J) |
| `velocidadLanzamiento(compresion, k, masa, direccion)` | x (m), k (N/m), masa (kg), dirección | `Vec2` velocidad (m/s) |

### Energía (`energy`)

| Función | Recibe | Devuelve |
| --- | --- | --- |
| `energiaCinetica(bola)` | `Bola` | K (J) |
| `energiaPotencialGravitatoria(bola, g, theta, largoMesa)` | `Bola`, g (m/s²), θ (rad), L (m) | Ug (J) |
| `energiaMecanica(bola, g, theta, largoMesa, energiaElasticaLanzador?)` | ídem, Uel (J) | E = K + Ug + Uel (J) |

### Orquestador (`world`)

| Función | Recibe | Devuelve |
| --- | --- | --- |
| `avanzarSimulacion(estado, dt, entradas)` | `EstadoGlobal`, Δt (s), `EntradasUsuario` | `ResultadoPaso` = `{ estado: EstadoGlobal, eventos: EventoColision[] }` |

Orden dentro del paso: gravedad efectiva, integración de la bola, detección continua (`primerImpacto`), resolución con la restitución del obstáculo y la masa de la bola, y repetición con el tiempo restante del paso (contactos múltiples, hasta `MAX_CONTACTOS_POR_PASO` = 8). No modifica `estado`: mismo estado y mismo `dt` dan el mismo resultado. En el Avance 2 los flippers, el lanzador, el marcador y las vidas viajan en el estado pero aún no se actualizan.

| Tipo | Campos |
| --- | --- |
| `EntradasUsuario` | `flipperIzquierdo` (boolean), `flipperDerecho` (boolean), `compresionLanzador` (m) |
| `EventoColision` | `instante` (s), `tipo` (`"circular"` o `"plano"`), `indice` (posición en su lista), `energiaDisipada` (J) |
| `ResultadoPaso` | `estado` (`EstadoGlobal`), `eventos` (`EventoColision[]`) |

## Pruebas de validación analítica

1. Caída por el plano inclinado: t = √(2d/a) con a = g·sen θ (`tests/physics/analytic.test.ts`).
2. Balance de energía del lanzador: ½·k·x² = ½·m·v₀² y la bola alcanza el final del carril (`tests/physics/launcher.test.ts`).
3. Sistema sin disipación: la energía mecánica se mantiene dentro del 1% tras 10 s simulados (`tests/physics/energy.test.ts`).

Además, `tests/physics/response.test.ts` valida la disipación por choque ΔE = ½·m·(1 − e²)·vₙ².

`tests/physics/world.test.ts` valida el orquestador: pureza (no modifica el estado de entrada), determinismo, contactos múltiples en un mismo paso sin atravesar obstáculos, energía disipada del evento = ½·m·(1 − e²)·vₙ² (tolerancia relativa 1e-9) y balance de energía con disipación (E antes − E después = energía disipada, tolerancia absoluta 1e-5 J por paso).

## Escenario y CSV del headless

La bola parte del reposo en (0.28, 0.10) m con θ = 6.5° y rebota 10 s contra un piso horizontal en y = 0.70 m (e = 0.60, restitución de obstáculo plano). Columnas de `output/simulacion.csv`: `t_s` (s), `x_m`, `y_m` (m), `vx_m_s`, `vy_m_s` (m/s), `K_J`, `Ug_J`, `Uel_J`, `E_J` (J), `colisiones` (impactos en el paso) y `E_disipada_J` (J disipados en el paso).

## Estado

Implementado: núcleo vectorial, gravedad efectiva, integración, detección de colisiones (estática y continua), resolución de impactos, lanzador, energías y orquestador (`avanzarSimulacion`). Pendiente para la Entrega Final: flippers, mecánica de juego (marcador, vidas, fin de partida), interfaz completa y gráficas G1 a G3.