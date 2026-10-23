/** Vector 2D. Posiciones en m, velocidades en m/s, aceleraciones en m/s². */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface Bola {
  posicion: Vec2; // m
  velocidad: Vec2; // m/s
  radio: number; // m
  masa: number; // kg
}

export interface ObstaculoCircular {
  centro: Vec2; // m
  radio: number; // m
  restitucion: number; // adimensional, 0 a 1
}

export interface ObstaculoPlano {
  p1: Vec2; // m
  p2: Vec2; // m
  restitucion: number; // adimensional, 0 a 1
}

export interface Flipper {
  pivote: Vec2; // m
  longitud: number; // m
  angulo: number; // rad
  velocidadAngular: number; // rad/s
  anguloReposo: number; // rad
  anguloActivo: number; // rad
  restitucion: number; // adimensional, 0 a 1
}

export interface Lanzador {
  constanteElastica: number; // N/m
  compresion: number; // m
  direccion: Vec2; // vector unitario
  compresionMaxima: number; // m
}

export interface ParametrosMesa {
  inclinacion: number; // rad
  gravedad: number; // m/s²
}

export interface EstadoGlobal {
  bola: Bola;
  obstaculosCirculares: ObstaculoCircular[];
  obstaculosPlanos: ObstaculoPlano[];
  flippers: Flipper[];
  lanzador: Lanzador;
  mesa: ParametrosMesa;
  marcador: number;
  vidas: number;
  tiempo: number; // s
}

/** Entradas del usuario para un paso de simulación. */
export interface EntradasUsuario {
  flipperIzquierdo: boolean; // true = control presionado
  flipperDerecho: boolean; // true = control presionado
  compresionLanzador: number; // m, entre 0 y compresionMaxima
}

/** Evento de colisión producido durante un paso. */
export interface EventoColision {
  instante: number; // s, tiempo simulado en que ocurre el impacto
  tipo: "circular" | "plano";
  indice: number; // posición del obstáculo en su lista
  energiaDisipada: number; // J
}

/** Resultado de avanzar la simulación un paso. */
export interface ResultadoPaso {
  estado: EstadoGlobal;
  eventos: EventoColision[];
}