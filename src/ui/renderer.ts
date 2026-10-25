import type { EstadoGlobal, EventoColision, Vec2 } from "../physics/index";
import { ANCHO_MESA, LARGO_MESA, norma } from "../physics/index";

export interface EfectoImpacto {
  x: number;
  y: number;
  radioMaximo: number;
  radioActual: number;
  opacidad: number;
}

export interface RendererOptions {
  mostrarVectores?: boolean;
  mostrarRastro?: boolean;
  mostrarRejilla?: boolean;
}

export class MesaRenderer {
  private ctx: CanvasRenderingContext2D;
  private escala = 600; // px por metro
  private offsetX = 0;
  private offsetY = 0;
  private rastro: Vec2[] = [];
  private maxPuntosRastro = 60;
  private efectosImpacto: EfectoImpacto[] = [];
  private opciones: RendererOptions = {
    mostrarVectores: true,
    mostrarRastro: true,
    mostrarRejilla: true,
  };

  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo obtener el contexto 2D del canvas");
    this.ctx = context;
    this.redimensionar();
  }

  setOpciones(opcionesParciales: Partial<RendererOptions>): void {
    this.opciones = { ...this.opciones, ...opcionesParciales };
  }

  redimensionar(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    const anchoCss = rect.width > 0 ? rect.width : 420;
    const altoCss = rect.height > 0 ? rect.height : 640;

    this.canvas.width = Math.round(anchoCss * dpr);
    this.canvas.height = Math.round(altoCss * dpr);

    const margen = 16 * dpr;
    const anchoDisponible = this.canvas.width - margen * 2;
    const altoDisponible = this.canvas.height - margen * 2;

    const escalaX = anchoDisponible / ANCHO_MESA;
    const escalaY = altoDisponible / LARGO_MESA;
    this.escala = Math.min(escalaX, escalaY);

    this.offsetX = (this.canvas.width - ANCHO_MESA * this.escala) / 2;
    this.offsetY = (this.canvas.height - LARGO_MESA * this.escala) / 2;
  }

  limpiarRastro(): void {
    this.rastro = [];
    this.efectosImpacto = [];
  }

  agregarImpacto(posicionMesa: Vec2): void {
    this.efectosImpacto.push({
      x: posicionMesa.x,
      y: posicionMesa.y,
      radioMaximo: 18 * (window.devicePixelRatio || 1),
      radioActual: 4 * (window.devicePixelRatio || 1),
      opacidad: 0.8,
    });
  }

  pantallaAMesa(clientX: number, clientY: number): Vec2 | null {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const canvasX = (clientX - rect.left) * dpr;
    const canvasY = (clientY - rect.top) * dpr;

    const mesaX = (canvasX - this.offsetX) / this.escala;
    const mesaY = (canvasY - this.offsetY) / this.escala;

    if (mesaX < 0 || mesaX > ANCHO_MESA || mesaY < 0 || mesaY > LARGO_MESA) {
      return null;
    }

    return { x: mesaX, y: mesaY };
  }

  render(estado: EstadoGlobal, eventos: readonly EventoColision[] = []): void {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;

    for (const evento of eventos) {
      if (evento.tipo === "plano" && estado.obstaculosPlanos[evento.indice]) {
        this.agregarImpacto(estado.bola.posicion);
      } else if (evento.tipo === "circular" && estado.obstaculosCirculares[evento.indice]) {
        this.agregarImpacto(estado.bola.posicion);
      }
    }

    if (this.opciones.mostrarRastro) {
      this.rastro.push({ ...estado.bola.posicion });
      if (this.rastro.length > this.maxPuntosRastro) {
        this.rastro.shift();
      }
    }

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);

    // 1. Superficie limpia
    this.dibujarSuperficieMesa();

    // 2. Rejilla métrica
    if (this.opciones.mostrarRejilla) {
      this.dibujarRejillaMetrica();
    }

    // 3. Obstáculos planos
    this.dibujarObstaculosPlanos(estado);

    // 4. Obstáculos circulares
    this.dibujarObstaculosCirculares(estado);

    // 5. Rastro
    if (this.opciones.mostrarRastro && this.rastro.length > 1) {
      this.dibujarRastro();
    }

    // 6. Impactos
    this.dibujarEfectosImpacto();

    // 7. Bola
    this.dibujarBola(estado);

    // 8. Vector
    if (this.opciones.mostrarVectores) {
      this.dibujarVectorVelocidad(estado);
    }

    // 9. Marco
    this.dibujarMarcoMesa(estado, dpr);

    ctx.restore();
  }

  private dibujarSuperficieMesa(): void {
    const ctx = this.ctx;
    const w = ANCHO_MESA * this.escala;
    const h = LARGO_MESA * this.escala;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }

  private dibujarRejillaMetrica(): void {
    const ctx = this.ctx;
    const pasoMetrico = 0.1;
    ctx.save();
    ctx.strokeStyle = "#f1f3f5";
    ctx.lineWidth = 1;

    for (let x = pasoMetrico; x < ANCHO_MESA; x += pasoMetrico) {
      const px = x * this.escala;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, LARGO_MESA * this.escala);
      ctx.stroke();
    }

    for (let y = pasoMetrico; y < LARGO_MESA; y += pasoMetrico) {
      const py = y * this.escala;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(ANCHO_MESA * this.escala, py);
      ctx.stroke();
    }

    ctx.fillStyle = "#adb5bd";
    ctx.font = "10px monospace";
    for (let y = 0.2; y < LARGO_MESA; y += 0.2) {
      ctx.fillText(`${y.toFixed(1)}m`, 4, y * this.escala - 3);
    }
    ctx.restore();
  }

  private dibujarObstaculosPlanos(estado: EstadoGlobal): void {
    const ctx = this.ctx;
    ctx.save();
    for (const plano of estado.obstaculosPlanos) {
      const x1 = plano.p1.x * this.escala;
      const y1 = plano.p1.y * this.escala;
      const x2 = plano.p2.x * this.escala;
      const y2 = plano.p2.y * this.escala;

      ctx.strokeStyle = "#198754";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private dibujarObstaculosCirculares(estado: EstadoGlobal): void {
    const ctx = this.ctx;
    ctx.save();
    for (const obstaculo of estado.obstaculosCirculares) {
      const cx = obstaculo.centro.x * this.escala;
      const cy = obstaculo.centro.y * this.escala;
      const r = obstaculo.radio * this.escala;

      ctx.fillStyle = "#198754";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#146c43";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  private dibujarRastro(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "rgba(108, 117, 125, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < this.rastro.length; i++) {
      const px = this.rastro[i].x * this.escala;
      const py = this.rastro[i].y * this.escala;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  private dibujarEfectosImpacto(): void {
    const ctx = this.ctx;
    ctx.save();
    for (let i = this.efectosImpacto.length - 1; i >= 0; i--) {
      const ef = this.efectosImpacto[i];
      const px = ef.x * this.escala;
      const py = ef.y * this.escala;

      ctx.strokeStyle = `rgba(220, 53, 69, ${ef.opacidad})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, ef.radioActual, 0, Math.PI * 2);
      ctx.stroke();

      ef.radioActual += 1.4;
      ef.opacidad -= 0.06;

      if (ef.opacidad <= 0 || ef.radioActual >= ef.radioMaximo) {
        this.efectosImpacto.splice(i, 1);
      }
    }
    ctx.restore();
  }

  private dibujarBola(estado: EstadoGlobal): void {
    const ctx = this.ctx;
    const bx = estado.bola.posicion.x * this.escala;
    const by = estado.bola.posicion.y * this.escala;
    const radioPx = Math.max(4, estado.bola.radio * this.escala);

    ctx.save();

    // Sombra suave
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.beginPath();
    ctx.arc(bx + 1, by + 1.5, radioPx, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo de la bola
    ctx.fillStyle = "#343a40";
    ctx.beginPath();
    ctx.arc(bx, by, radioPx, 0, Math.PI * 2);
    ctx.fill();

    // Reflejo
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.arc(bx - radioPx * 0.3, by - radioPx * 0.3, radioPx * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private dibujarVectorVelocidad(estado: EstadoGlobal): void {
    const ctx = this.ctx;
    const v = estado.bola.velocidad;
    const rap = norma(v);
    if (rap < 0.02) return;

    const bx = estado.bola.posicion.x * this.escala;
    const by = estado.bola.posicion.y * this.escala;

    const escalaVector = 25;
    const vxPx = v.x * escalaVector;
    const vyPx = v.y * escalaVector;
    const longitud = Math.sqrt(vxPx * vxPx + vyPx * vyPx);

    ctx.save();
    ctx.strokeStyle = "#0d6efd";
    ctx.fillStyle = "#0d6efd";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + vxPx, by + vyPx);
    ctx.stroke();

    if (longitud > 6) {
      const angulo = Math.atan2(vyPx, vxPx);
      const tamanoCabeza = 6;
      ctx.beginPath();
      ctx.moveTo(bx + vxPx, by + vyPx);
      ctx.lineTo(
        bx + vxPx - tamanoCabeza * Math.cos(angulo - Math.PI / 6),
        by + vyPx - tamanoCabeza * Math.sin(angulo - Math.PI / 6),
      );
      ctx.lineTo(
        bx + vxPx - tamanoCabeza * Math.cos(angulo + Math.PI / 6),
        by + vyPx - tamanoCabeza * Math.sin(angulo + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private dibujarMarcoMesa(estado: EstadoGlobal, dpr: number): void {
    const ctx = this.ctx;
    const w = ANCHO_MESA * this.escala;
    const h = LARGO_MESA * this.escala;

    ctx.save();

    ctx.strokeStyle = "#ced4da";
    ctx.lineWidth = 1.5 * dpr;
    ctx.strokeRect(0, 0, w, h);

    const anguloDeg = ((estado.mesa.inclinacion * 180) / Math.PI).toFixed(1);
    const aEfectiva = (estado.mesa.gravedad * Math.sin(estado.mesa.inclinacion)).toFixed(2);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(6, 6, 126, 34);
    ctx.strokeStyle = "#ced4da";
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, 126, 34);

    ctx.fillStyle = "#212529";
    ctx.font = `600 ${Math.max(10, 11 * dpr * 0.7)}px system-ui, sans-serif`;
    ctx.fillText(`θ = ${anguloDeg}°`, 12, 19);

    ctx.fillStyle = "#198754";
    ctx.font = `500 ${Math.max(9, 10 * dpr * 0.7)}px monospace`;
    ctx.fillText(`a = ${aEfectiva} m/s²`, 12, 31);

    ctx.restore();
  }
}
