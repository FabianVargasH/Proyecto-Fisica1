import {
  Chart,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  ScatterController,
  Title,
  Tooltip,
} from "chart.js";
import { norma } from "../physics/index";
import type { EventoColision, Vec2 } from "../physics/index";
import { SerieTemporal } from "./series";

Chart.register(ScatterController, LinearScale, PointElement, LineElement, Legend, Tooltip, Title);

/** Duración visible del eje horizontal (s). */
export const VENTANA_S = 10;
/** Separación mínima entre puntos de la curva (s): ~60 puntos por segundo simulado. */
const PASO_MUESTREO_S = 1 / 60;

export interface GraficaRapidez {
  /**
   * Registra el estado de un paso de simulación.
   * @param tiempo tiempo simulado al final del paso (s)
   * @param velocidad velocidad de la bola (m/s)
   * @param colisiones eventos del paso (`ResultadoPaso.eventos`); cada uno agrega un punto rojo
   */
  registrar(tiempo: number, velocidad: Vec2, colisiones?: readonly EventoColision[]): void;
  /** Borra los datos (usar al reiniciar la simulación). */
  reiniciar(): void;
  /** Libera el canvas. */
  destruir(): void;
}

/**
 * G2: rapidez de la bola |v| (m/s) contra el tiempo (s), con un punto por cada colisión.
 * La conversión de unidades no es necesaria: la librería ya trabaja en SI.
 * El `canvas` debe estar dentro de un contenedor con altura definida (ver style.css).
 */
export function crearGraficaRapidez(canvas: HTMLCanvasElement): GraficaRapidez {
  const curva = new SerieTemporal(VENTANA_S, PASO_MUESTREO_S);
  const choques = new SerieTemporal(VENTANA_S, 0);

  const grafica = new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Rapidez de la bola",
          data: curva.datos,
          showLine: true,
          borderColor: "#1d4ed8",
          backgroundColor: "#1d4ed8",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0,
        },
        {
          label: "Colisión",
          data: choques.datos,
          showLine: false,
          borderColor: "#dc2626",
          backgroundColor: "#dc2626",
          pointRadius: 5,
          pointStyle: "circle",
        },
      ],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      plugins: {
        title: { display: true, text: "G2 · Rapidez de la bola vs tiempo" },
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (c) => `${c.dataset.label}: ${c.parsed.y?.toFixed(3)} m/s en t = ${c.parsed.x?.toFixed(3)} s`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: VENTANA_S,
          title: { display: true, text: "Tiempo (s)" },
        },
        y: {
          type: "linear",
          beginAtZero: true,
          title: { display: true, text: "Rapidez (m/s)" },
        },
      },
    },
  });

  return {
    registrar(tiempo, velocidad, colisiones = []) {
      const rapidez = norma(velocidad);
      curva.agregar(tiempo, rapidez);
      // Aproximación: la rapidez del punto es la del final del paso (dt = 1/240 s).
      for (const c of colisiones) choques.agregar(c.instante, rapidez, true);
      choques.recortar(tiempo);

      const x = grafica.options.scales!.x!;
      x.min = Math.max(0, tiempo - VENTANA_S);
      x.max = Math.max(VENTANA_S, tiempo);
      grafica.update("none");
    },
    reiniciar() {
      curva.limpiar();
      choques.limpiar();
      const x = grafica.options.scales!.x!;
      x.min = 0;
      x.max = VENTANA_S;
      grafica.update("none");
    },
    destruir() {
      grafica.destroy();
    },
  };
}
