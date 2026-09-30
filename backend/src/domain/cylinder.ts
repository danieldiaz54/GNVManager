// Entidad de Dominio: Cilindro Individual
// Custodiado por: @data-architect & @domain-architect

import { CylinderProps } from './dispatch-types';
import { ExpiredHydrostaticTestException } from './exceptions';

export class Cylinder implements CylinderProps {
  public readonly id: string;
  public readonly serialNumber: string;
  public readonly waterCapacityLiters: number;
  public readonly tareWeightKg: number;
  public readonly manufacturingDate: Date;
  public readonly hydrostaticTestDate: Date;
  public readonly nextHydrostaticDueDate: Date;

  constructor(props: CylinderProps) {
    this.id = props.id;
    this.serialNumber = props.serialNumber;
    this.waterCapacityLiters = props.waterCapacityLiters;
    this.tareWeightKg = props.tareWeightKg;
    this.manufacturingDate = props.manufacturingDate;
    this.hydrostaticTestDate = props.hydrostaticTestDate;
    this.nextHydrostaticDueDate = props.nextHydrostaticDueDate;
  }

  /**
   * Verifica si la prueba hidrostática del cilindro está vigente para la fecha de operación
   */
  public isHydrostaticValid(operationDate: Date = new Date()): boolean {
    return this.nextHydrostaticDueDate.getTime() >= operationDate.getTime();
  }

  /**
   * Lanza excepción de seguridad industrial si la prueba hidrostática está vencida
   */
  public assertHydrostaticValid(operationDate: Date = new Date()): void {
    if (!this.isHydrostaticValid(operationDate)) {
      throw new ExpiredHydrostaticTestException(
        this.serialNumber,
        this.nextHydrostaticDueDate
      );
    }
  }
}
