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

export class ExpiredHydrostaticTestException extends ThermodynamicException {
  constructor(serialNumber: string, dueDate: Date) {
    super(
      `Cilindro ${serialNumber} con prueba hidrostática vencida (Fecha límite: ${dueDate.toISOString().split('T')[0]}). Conexión a manifold rechazada por seguridad industrial.`
    );
    this.name = 'ExpiredHydrostaticTestException';
  }
}

export class InvalidFlowDirectionException extends ThermodynamicException {
  constructor(message: string) {
    super(`Invariante de flujo bidireccional violada: ${message}`);
    this.name = 'InvalidFlowDirectionException';
  }
}

export class LedgerTamperedException extends ThermodynamicException {
  constructor(index: number, reason: string) {
    super(
      `Violación de inmutabilidad criptográfica en asiento #${index}: ${reason}. Cadena de auditoría comprometida.`
    );
    this.name = 'LedgerTamperedException';
  }
}


