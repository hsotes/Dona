export interface PerfilEstructural {
  // Identificación
  nombre: string;
  tipo: 'IPN' | 'IPE' | 'UPN' | 'HEB' | 'HEA' | 'HEM';
  designacion: string;

  // Dimensiones principales (mm)
  h: number;      // Altura total
  b: number;      // Ancho de alas
  tw: number;     // Espesor del alma
  tf: number;     // Espesor de alas
  r: number;      // Radio de acuerdo

  // Propiedades de sección
  A: number;      // Área (cm²)
  peso: number;   // Peso por metro (kg/m)

  // Momentos de inercia (cm⁴)
  Ix: number;     // Inercia eje fuerte
  Iy: number;     // Inercia eje débil

  // Módulos resistentes elásticos (cm³)
  Wx: number;     // Módulo resistente eje X
  Wy: number;     // Módulo resistente eje Y

  // Módulos plásticos (cm³)
  Zx: number;     // Módulo plástico eje X
  Zy: number;     // Módulo plástico eje Y

  // Radios de giro (cm)
  ix: number;     // Radio de giro eje X
  iy: number;     // Radio de giro eje Y

  // Propiedades adicionales para torsión
  It?: number;    // Constante de torsión (cm⁴)
  Iw?: number;    // Constante de alabeo (cm⁶)
}
