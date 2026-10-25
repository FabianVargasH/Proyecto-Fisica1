import {
  INCLINACION_INICIAL,
  INCLINACION_MAX,
  INCLINACION_MIN,
} from "../physics/index";

export interface ControlCallbacks {
  onTogglePlay: (reproduciendo: boolean) => void;
  onPaso: () => void;
  onReiniciar: () => void;
  onCambioAngulo: (thetaRad: number) => void;
  onCambioEscenario: (escenarioId: string) => void;
  onCambioVelocidad: (multiplicador: number) => void;
  onAlternarVectores: (mostrar: boolean) => void;
  onAlternarRastro: (mostrar: boolean) => void;
  onAlternarRejilla: (mostrar: boolean) => void;
  onExportarCSV: () => void;
}

export class PanelControles {
  private reproduciendo = false;
  private btnPlay!: HTMLButtonElement;
  private btnPaso!: HTMLButtonElement;
  private btnReiniciar!: HTMLButtonElement;
  private sliderAngulo!: HTMLInputElement;
  private valorAngulo!: HTMLElement;
  private selectEscenario!: HTMLSelectElement;
  private selectVelocidad!: HTMLSelectElement;
  private checkVectores!: HTMLInputElement;
  private checkRastro!: HTMLInputElement;
  private checkRejilla!: HTMLInputElement;
  private btnExportar!: HTMLButtonElement;

  constructor(private callbacks: ControlCallbacks) {
    this.obtenerElementos();
    this.enlazarEventos();
    this.actualizarBotonPlay();
  }

  private obtenerElementos(): void {
    this.btnPlay = document.getElementById("btn-play") as HTMLButtonElement;
    this.btnPaso = document.getElementById("btn-paso") as HTMLButtonElement;
    this.btnReiniciar = document.getElementById("btn-reiniciar") as HTMLButtonElement;
    this.sliderAngulo = document.getElementById("slider-angulo") as HTMLInputElement;
    this.valorAngulo = document.getElementById("valor-angulo") as HTMLElement;
    this.selectEscenario = document.getElementById("select-escenario") as HTMLSelectElement;
    this.selectVelocidad = document.getElementById("select-velocidad") as HTMLSelectElement;
    this.checkVectores = document.getElementById("check-vectores") as HTMLInputElement;
    this.checkRastro = document.getElementById("check-rastro") as HTMLInputElement;
    this.checkRejilla = document.getElementById("check-rejilla") as HTMLInputElement;
    this.btnExportar = document.getElementById("btn-exportar") as HTMLButtonElement;

    // Configurar límites del slider de ángulo
    if (this.sliderAngulo) {
      const minDeg = (INCLINACION_MIN * 180) / Math.PI;
      const maxDeg = (INCLINACION_MAX * 180) / Math.PI;
      const initDeg = (INCLINACION_INICIAL * 180) / Math.PI;
      this.sliderAngulo.min = minDeg.toFixed(1);
      this.sliderAngulo.max = maxDeg.toFixed(1);
      this.sliderAngulo.step = "0.1";
      this.sliderAngulo.value = initDeg.toFixed(1);
      this.actualizarEtiquetaAngulo(initDeg);
    }
  }

  private enlazarEventos(): void {
    if (this.btnPlay) {
      this.btnPlay.addEventListener("click", () => {
        this.reproduciendo = !this.reproduciendo;
        this.actualizarBotonPlay();
        this.callbacks.onTogglePlay(this.reproduciendo);
      });
    }

    if (this.btnPaso) {
      this.btnPaso.addEventListener("click", () => {
        if (this.reproduciendo) {
          this.reproduciendo = false;
          this.actualizarBotonPlay();
          this.callbacks.onTogglePlay(false);
        }
        this.callbacks.onPaso();
      });
    }

    if (this.btnReiniciar) {
      this.btnReiniciar.addEventListener("click", () => {
        this.callbacks.onReiniciar();
      });
    }

    if (this.sliderAngulo) {
      this.sliderAngulo.addEventListener("input", () => {
        const grados = parseFloat(this.sliderAngulo.value);
        this.actualizarEtiquetaAngulo(grados);
        const rad = (grados * Math.PI) / 180;
        this.callbacks.onCambioAngulo(rad);
      });
    }

    if (this.selectEscenario) {
      this.selectEscenario.addEventListener("change", () => {
        this.callbacks.onCambioEscenario(this.selectEscenario.value);
      });
    }

    if (this.selectVelocidad) {
      this.selectVelocidad.addEventListener("change", () => {
        const mult = parseFloat(this.selectVelocidad.value) || 1;
        this.callbacks.onCambioVelocidad(mult);
      });
    }

    if (this.checkVectores) {
      this.checkVectores.addEventListener("change", () => {
        this.callbacks.onAlternarVectores(this.checkVectores.checked);
      });
    }

    if (this.checkRastro) {
      this.checkRastro.addEventListener("change", () => {
        this.callbacks.onAlternarRastro(this.checkRastro.checked);
      });
    }

    if (this.checkRejilla) {
      this.checkRejilla.addEventListener("change", () => {
        this.callbacks.onAlternarRejilla(this.checkRejilla.checked);
      });
    }

    if (this.btnExportar) {
      this.btnExportar.addEventListener("click", () => {
        this.callbacks.onExportarCSV();
      });
    }
  }

  public actualizarBotonPlay(): void {
    if (!this.btnPlay) return;
    if (this.reproduciendo) {
      this.btnPlay.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg> <span>Pausar</span>`;
      this.btnPlay.classList.add("activo");
    } else {
      this.btnPlay.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg> <span>Iniciar</span>`;
      this.btnPlay.classList.remove("activo");
    }
  }

  public pausar(): void {
    if (this.reproduciendo) {
      this.reproduciendo = false;
      this.actualizarBotonPlay();
      this.callbacks.onTogglePlay(false);
    }
  }

  public fijarAngulo(radianes: number): void {
    const grados = (radianes * 180) / Math.PI;
    if (this.sliderAngulo) {
      this.sliderAngulo.value = grados.toFixed(1);
    }
    this.actualizarEtiquetaAngulo(grados);
  }

  private actualizarEtiquetaAngulo(grados: number): void {
    if (this.valorAngulo) {
      const rad = ((grados * Math.PI) / 180).toFixed(3);
      this.valorAngulo.textContent = `${grados.toFixed(1)}° (${rad} rad)`;
    }
  }
}
