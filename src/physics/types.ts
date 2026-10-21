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