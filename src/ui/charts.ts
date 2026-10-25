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
          borderColor: "#15803d",
          backgroundColor: "#15803d",
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
        title: {
          display: true,
          text: "G2 · Rapidez de la bola vs tiempo",
          color: "#0f172a",
          font: { size: 13, weight: "bold", family: "Inter, sans-serif" },
        },
        legend: {
          position: "bottom",
          labels: { color: "#334155", font: { family: "Inter, sans-serif", size: 11 } },
        },
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
          title: { display: true, text: "Tiempo (s)", color: "#475569", font: { size: 11 } },
          grid: { color: "rgba(0, 0, 0, 0.06)" },
          ticks: { color: "#64748b", font: { size: 10 } },
        },
        y: {
          type: "linear",
          beginAtZero: true,
          title: { display: true, text: "Rapidez (m/s)", color: "#475569", font: { size: 11 } },
          grid: { color: "rgba(0, 0, 0, 0.06)" },
          ticks: { color: "#64748b", font: { size: 10 } },
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

export interface GraficaEnergia {
  registrar(tiempo: number, k: number, ug: number, em: number): void;
  reiniciar(): void;
  destruir(): void;
}

export function crearGraficaEnergia(canvas: HTMLCanvasElement): GraficaEnergia {
  const serieK = new SerieTemporal(VENTANA_S, PASO_MUESTREO_S);
  const serieUg = new SerieTemporal(VENTANA_S, PASO_MUESTREO_S);
  const serieEm = new SerieTemporal(VENTANA_S, PASO_MUESTREO_S);

  const grafica = new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Cinética (K)",
          data: serieK.datos,
          showLine: true,
          borderColor: "#1d4ed8",
          backgroundColor: "#1d4ed8",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0,
        },
        {
          label: "Potencial Grav. (Ug)",
          data: serieUg.datos,
          showLine: true,
          borderColor: "#b45309",
          backgroundColor: "#b45309",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0,
        },
        {
          label: "Mecánica Total (Em)",
          data: serieEm.datos,
          showLine: true,
          borderColor: "#15803d",
          backgroundColor: "#15803d",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0,
        },
      ],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      plugins: {
        title: {
          display: true,
          text: "G3 · Balance de Energía vs tiempo",
          color: "#0f172a",
          font: { size: 13, weight: "bold", family: "Inter, sans-serif" },
        },
        legend: {
          position: "bottom",
          labels: { color: "#334155", font: { family: "Inter, sans-serif", size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: (c) =>
              `${c.dataset.label}: ${c.parsed.y?.toFixed(4)} J en t = ${c.parsed.x?.toFixed(3)} s`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: VENTANA_S,
          title: { display: true, text: "Tiempo (s)", color: "#475569", font: { size: 11 } },
          grid: { color: "rgba(0, 0, 0, 0.06)" },
          ticks: { color: "#64748b", font: { size: 10 } },
        },
        y: {
          type: "linear",
          beginAtZero: true,
          title: { display: true, text: "Energía (J)", color: "#475569", font: { size: 11 } },
          grid: { color: "rgba(0, 0, 0, 0.06)" },
          ticks: { color: "#64748b", font: { size: 10 } },
        },
      },
    },
  });

  return {
    registrar(tiempo, k, ug, em) {
      serieK.agregar(tiempo, k);
      serieUg.agregar(tiempo, ug);
      serieEm.agregar(tiempo, em);

      const x = grafica.options.scales!.x!;
      x.min = Math.max(0, tiempo - VENTANA_S);
      x.max = Math.max(VENTANA_S, tiempo);
      grafica.update("none");
    },
    reiniciar() {
      serieK.limpiar();
      serieUg.limpiar();
      serieEm.limpiar();
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
