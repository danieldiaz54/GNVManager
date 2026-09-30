// Excepciones del Dominio Termodinámico
// Custodiado por: @domain-architect

export class ThermodynamicException extends Error {
  constructor(message: string) {
    super(`[ThermodynamicDomain] ${message}`);
    this.name = 'ThermodynamicException';
  }
}

export class InvalidChromatographyException extends ThermodynamicException {
  constructor(message: string) {
    super(`Cromatografía inválida: ${message}`);
    this.name = 'InvalidChromatographyException';
  }
}

export class ThermodynamicDivergenceException extends ThermodynamicException {
  constructor(message: string) {
    super(`Falla de convergencia en ecuación de estado: ${message}`);
    this.name = 'ThermodynamicDivergenceException';
  }
}

export class PhysicalInvariantException extends ThermodynamicException {
  constructor(message: string) {
    super(`Violación de invariante física: ${message}`);
    this.name = 'PhysicalInvariantException';
  }
}
