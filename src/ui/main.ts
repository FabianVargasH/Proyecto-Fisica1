import "./style.css";
import {
  ANCHO_MESA,
  COMPRESION_MAXIMA,
  DT,
  E_CIRCULAR,
  E_PLANO,
  GRAVEDAD,
  INCLINACION_INICIAL,
  INCLINACION_MAX,
  INCLINACION_MIN,
  K_LANZADOR,
  LARGO_MESA,
  MASA_BOLA,
  RADIO_BOLA,
  avanzarSimulacion,
  energiaCinetica,
  energiaElastica,
  energiaMecanica,
  energiaPotencialGravitatoria,
  gravedadEfectiva,
  norma,
} from "../physics/index";
import type {
  EntradasUsuario,
  EstadoGlobal,
  ObstaculoCircular,
  ObstaculoPlano,
} from "../physics/index";
import { crearGraficaEnergia, crearGraficaRapidez } from "./charts";
import { PanelControles } from "./controls";
import { MesaRenderer } from "./renderer";

// Entradas por defecto (sin controles activos en el estado base)
const ENTRADAS_BASE: EntradasUsuario = {
  flipperIzquierdo: false,
  flipperDerecho: false,
  compresionLanzador: 0,
};

// Definición de escenarios de laboratorio
function crearEscenario(id: string): {
  planos: ObstaculoPlano[];
  circulos: ObstaculoCircular[];
  posicionInicial: { x: number; y: number };
} {
  switch (id) {
    case "laboratorio":
      return {
        planos: [
          // Pared izquierda
          { p1: { x: 0.005, y: 0.05 }, p2: { x: 0.005, y: 1.0 }, restitucion: E_PLANO },
          // Pared derecha
          { p1: { x: ANCHO_MESA - 0.005, y: 0.05 }, p2: { x: ANCHO_MESA - 0.005, y: 1.0 }, restitucion: E_PLANO },
          // Piso inferior
          { p1: { x: 0, y: 1.0 }, p2: { x: ANCHO_MESA, y: 1.0 }, restitucion: E_PLANO },
        ],
        circulos: [
          { centro: { x: 0.28, y: 0.42 }, radio: 0.045, restitucion: E_CIRCULAR },
          { centro: { x: 0.16, y: 0.65 }, radio: 0.04, restitucion: E_CIRCULAR },
          { centro: { x: 0.40, y: 0.65 }, radio: 0.04, restitucion: E_CIRCULAR },
        ],
        posicionInicial: { x: 0.28, y: 0.12 },
      };

    case "caida_libre":
      return {
        planos: [
          { p1: { x: 0, y: LARGO_MESA - 0.02 }, p2: { x: ANCHO_MESA, y: LARGO_MESA - 0.02 }, restitucion: E_PLANO },
        ],
        circulos: [],
        posicionInicial: { x: 0.28, y: 0.05 },
      };

    case "headless":
    default:
      // Escenario exacto del script headless
      return {
        planos: [
          { p1: { x: 0, y: 0.70 }, p2: { x: ANCHO_MESA, y: 0.70 }, restitucion: E_PLANO },
        ],
        circulos: [],
        posicionInicial: { x: 0.28, y: 0.10 },
      };
  }
}

// Variables globales de la sesión interactiva
/** Inclinación de la mesa (θ) en radianes, restringida a [INCLINACION_MIN, INCLINACION_MAX] */
let theta: number = INCLINACION_INICIAL;
let escenarioActualId = "headless";
let velocidadSimulacion = 1.0;
let reproduciendo = false;
let acumuladorTiempo = 0;
let ultimoFrame = 0;
let totalColisionesSesion = 0;
let totalEnergiaDisipadaSesion = 0;

// Historial para exportación CSV
interface RegistroCSV {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  k: number;
  ug: number;
  uel: number;
  e: number;
  colisiones: number;
  disipada: number;
}
const historialCSV: RegistroCSV[] = [];

// Estado inicial del sistema
function inicializarEstado(escenarioId = "headless", inclinacion = theta): EstadoGlobal {
  const conf = crearEscenario(escenarioId);
  return {
    bola: {
      posicion: { ...conf.posicionInicial },
      velocidad: { x: 0, y: 0 },
      radio: RADIO_BOLA,
      masa: MASA_BOLA,
    },
    obstaculosCirculares: conf.circulos,
    obstaculosPlanos: conf.planos,
    flippers: [],
    lanzador: {
      constanteElastica: K_LANZADOR,
      compresion: 0,
      direccion: { x: 0, y: -1 },
      compresionMaxima: COMPRESION_MAXIMA,
    },
    mesa: {
      inclinacion,
      gravedad: GRAVEDAD,
    },
    marcador: 0,
    vidas: 3,
    tiempo: 0,
  };
}

let estado: EstadoGlobal = inicializarEstado();

// Elementos DOM del HUD de telemetría
const canvasMesa = document.getElementById("mesa") as HTMLCanvasElement;
const canvasRapidez = document.getElementById("grafica-rapidez") as HTMLCanvasElement;
const canvasEnergia = document.getElementById("grafica-energia") as HTMLCanvasElement;

const elTiempo = document.getElementById("telemetria-tiempo");
const elRapidez = document.getElementById("telemetria-rapidez");
const elPosicion = document.getElementById("telemetria-posicion");
const elAceleracion = document.getElementById("telemetria-aceleracion");
const elAngulo = document.getElementById("telemetria-angulo");
const elEnergiaK = document.getElementById("telemetria-k");
const elEnergiaUg = document.getElementById("telemetria-ug");
const elEnergiaEm = document.getElementById("telemetria-em");
const elColisiones = document.getElementById("telemetria-colisiones");
const elDisipada = document.getElementById("telemetria-disipada");
const elEstadoSim = document.getElementById("estado-simulacion");

// Inicializar renderer y gráficas
const renderer = new MesaRenderer(canvasMesa);
const graficaRapidez = crearGraficaRapidez(canvasRapidez);
const graficaEnergia = crearGraficaEnergia(canvasEnergia);

// Registro en historial CSV
function registrarPuntoCSV(colisiones: number, disipada: number): void {
  const k = energiaCinetica(estado.bola);
  const ug = energiaPotencialGravitatoria(estado.bola, estado.mesa.gravedad, estado.mesa.inclinacion, LARGO_MESA);
  const uel = energiaElastica(estado.lanzador.constanteElastica, estado.lanzador.compresion);
  historialCSV.push({
    t: estado.tiempo,
    x: estado.bola.posicion.x,
    y: estado.bola.posicion.y,
    vx: estado.bola.velocidad.x,
    vy: estado.bola.velocidad.y,
    k,
    ug,
    uel,
    e: k + ug + uel,
    colisiones,
    disipada,
  });
}

// Actualizar textos de telemetría
function actualizarTelemetria(): void {
  const rap = norma(estado.bola.velocidad);
  const a = gravedadEfectiva(estado.mesa.gravedad, estado.mesa.inclinacion);
  const k = energiaCinetica(estado.bola);
  const ug = energiaPotencialGravitatoria(estado.bola, estado.mesa.gravedad, estado.mesa.inclinacion, LARGO_MESA);
  const uel = energiaElastica(estado.lanzador.constanteElastica, estado.lanzador.compresion);
  const em = energiaMecanica(estado.bola, estado.mesa.gravedad, estado.mesa.inclinacion, LARGO_MESA, uel);
  const anguloDeg = (estado.mesa.inclinacion * 180) / Math.PI;

  if (elTiempo) elTiempo.textContent = `${estado.tiempo.toFixed(3)} s`;
  if (elRapidez) elRapidez.textContent = `${rap.toFixed(3)} m/s`;
  if (elPosicion) elPosicion.textContent = `(${estado.bola.posicion.x.toFixed(2)}, ${estado.bola.posicion.y.toFixed(2)}) m`;
  if (elAceleracion) elAceleracion.textContent = `${a.y.toFixed(2)} m/s²`;
  if (elAngulo) elAngulo.textContent = `${anguloDeg.toFixed(1)}° (${estado.mesa.inclinacion.toFixed(3)} rad)`;
  if (elEnergiaK) elEnergiaK.textContent = `${k.toFixed(4)} J`;
  if (elEnergiaUg) elEnergiaUg.textContent = `${ug.toFixed(4)} J`;
  if (elEnergiaEm) elEnergiaEm.textContent = `${em.toFixed(4)} J`;
  if (elColisiones) elColisiones.textContent = `${totalColisionesSesion}`;
  if (elDisipada) elDisipada.textContent = `${totalEnergiaDisipadaSesion.toFixed(4)} J`;

  if (elEstadoSim) {
    elEstadoSim.textContent = reproduciendo ? "Simulando (en ejecución)" : "Pausado (en reposo)";
    elEstadoSim.className = reproduciendo ? "badge badge-activo" : "badge badge-pausado";
  }
}

/**
 * Modifica el ángulo de inclinación θ de la mesa (en radianes), actualizando los controles
 * y reiniciando la simulación: θ es constante durante la partida (Avance 1).
 * @param nuevoTheta ángulo en radianes, θ ∈ [INCLINACION_MIN, INCLINACION_MAX]
 */
export function setTheta(nuevoTheta: number): void {
  theta = Math.max(INCLINACION_MIN, Math.min(INCLINACION_MAX, nuevoTheta));
  panelControles.fijarAngulo(theta);
  // θ es constante durante la partida (Avance 1): cambiarlo reinicia la simulación.
  reiniciarSimulacion();
}

export const setAngle = setTheta;

// Inicializar controles
const panelControles: PanelControles = new PanelControles({
  onTogglePlay: (reproducir) => {
    reproduciendo = reproducir;
    if (reproducir) {
      ultimoFrame = performance.now();
    }
    actualizarTelemetria();
  },
  onPaso: () => {
    ejecutarPaso(DT);
    renderer.render(estado);
    actualizarTelemetria();
  },
  onReiniciar: () => {
    reiniciarSimulacion();
  },
  onCambioAngulo: (thetaRad) => {
    setTheta(thetaRad);
  },
  onCambioEscenario: (escenarioId) => {
    escenarioActualId = escenarioId;
    reiniciarSimulacion();
  },
  onCambioVelocidad: (mult) => {
    velocidadSimulacion = mult;
  },
  onAlternarVectores: (mostrar) => {
    renderer.setOpciones({ mostrarVectores: mostrar });
    renderer.render(estado);
  },
  onAlternarRastro: (mostrar) => {
    renderer.setOpciones({ mostrarRastro: mostrar });
    renderer.render(estado);
  },
  onAlternarRejilla: (mostrar) => {
    renderer.setOpciones({ mostrarRejilla: mostrar });
    renderer.render(estado);
  },
  onExportarCSV: () => {
    exportarTelemetriaCSV();
  },
});

// Manejador de clic interactivo en la mesa para reposicionar la bola
canvasMesa.addEventListener("pointerdown", (evt) => {
  const pos = renderer.pantallaAMesa(evt.clientX, evt.clientY);
  if (pos) {
    estado = {
      ...estado,
      bola: {
        ...estado.bola,
        posicion: pos,
        velocidad: { x: 0, y: 0 },
      },
    };
    renderer.limpiarRastro();
    renderer.render(estado);
    actualizarTelemetria();
  }
});

// Reinicio de la simulación
function reiniciarSimulacion(): void {
  estado = inicializarEstado(escenarioActualId, theta);
  totalColisionesSesion = 0;
  totalEnergiaDisipadaSesion = 0;
  acumuladorTiempo = 0;
  historialCSV.length = 0;
  registrarPuntoCSV(0, 0);

  graficaRapidez.reiniciar();
  graficaEnergia.reiniciar();
  renderer.limpiarRastro();
  renderer.render(estado);
  actualizarTelemetria();
}

// Ejecución de un paso determinista del motor de física
function ejecutarPaso(deltaT: number): void {
  const resultado = avanzarSimulacion(estado, deltaT, ENTRADAS_BASE);
  estado = resultado.estado;

  let disipadaPaso = 0;
  for (const evento of resultado.eventos) {
    totalColisionesSesion++;
    totalEnergiaDisipadaSesion += evento.energiaDisipada;
    disipadaPaso += evento.energiaDisipada;
  }

  // Registrar en telemetría gráfica
  graficaRapidez.registrar(estado.tiempo, estado.bola.velocidad, resultado.eventos);
  const k = energiaCinetica(estado.bola);
  const ug = energiaPotencialGravitatoria(estado.bola, estado.mesa.gravedad, estado.mesa.inclinacion, LARGO_MESA);
  const uel = energiaElastica(estado.lanzador.constanteElastica, estado.lanzador.compresion);
  const em = energiaMecanica(estado.bola, estado.mesa.gravedad, estado.mesa.inclinacion, LARGO_MESA, uel);
  graficaEnergia.registrar(estado.tiempo, k, ug, uel, em);

  // Registrar en buffer CSV
  registrarPuntoCSV(resultado.eventos.length, disipadaPaso);

  // Renderizar escena
  renderer.render(estado, resultado.eventos);
}

// Bucle de animación (con sub-stepping determinista DT = 1/240 s)
function bucleAnimacion(tiempoActual: number): void {
  requestAnimationFrame(bucleAnimacion);

  if (!ultimoFrame) {
    ultimoFrame = tiempoActual;
    return;
  }

  const deltaRealSegundos = Math.min((tiempoActual - ultimoFrame) / 1000, 0.1);
  ultimoFrame = tiempoActual;

  if (reproduciendo) {
    acumuladorTiempo += deltaRealSegundos * velocidadSimulacion;
    const maxPasosPorFrame = 16;
    let pasosEjecutados = 0;

    while (acumuladorTiempo >= DT && pasosEjecutados < maxPasosPorFrame) {
      ejecutarPaso(DT);
      acumuladorTiempo -= DT;
      pasosEjecutados++;
    }

    actualizarTelemetria();
  }
}

// Exportación CSV
function exportarTelemetriaCSV(): void {
  if (historialCSV.length === 0) return;
  const encabezado = "t_s,x_m,y_m,vx_m_s,vy_m_s,K_J,Ug_J,Uel_J,E_J,colisiones,E_disipada_J";
  const lineas = [encabezado];

  for (const r of historialCSV) {
    lineas.push(
      [
        r.t.toFixed(4),
        r.x.toFixed(6),
        r.y.toFixed(6),
        r.vx.toFixed(6),
        r.vy.toFixed(6),
        r.k.toFixed(6),
        r.ug.toFixed(6),
        r.uel.toFixed(6),
        r.e.toFixed(6),
        r.colisiones,
        r.disipada.toFixed(6),
      ].join(","),
    );
  }

  const blob = new Blob([lineas.join("\n") + "\n"], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `telemetria_mesa_inclinada_${Date.now()}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}

// Evento de cambio de tamaño de ventana
window.addEventListener("resize", () => {
  renderer.redimensionar();
  renderer.render(estado);
});

// Inicialización de la pantalla al cargar
registrarPuntoCSV(0, 0);
renderer.render(estado);
actualizarTelemetria();
requestAnimationFrame(bucleAnimacion);