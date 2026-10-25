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

export const VENTANA_S = 10;
const PASO_MUESTREO_S = 1 / 60;

export interface GraficaRapidez {
  registrar(tiempo: number, velocidad: Vec2, colisiones?: readonly EventoColision[]): void;
  reiniciar(): void;
  destruir(): void;
}

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
            label: (c) =>
              `${c.dataset.label}: ${c.parsed.y?.toFixed(3)} m/s en t = ${c.parsed.x?.toFixed(3)} s`,
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
