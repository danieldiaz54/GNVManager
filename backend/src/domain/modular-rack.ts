// Entidad de Dominio: Batería / Canasta Modular de Cilindros
// Custodiado por: @data-architect & @domain-architect

import { Cylinder } from './cylinder';
import { CylinderProps, ModularRackProps, RackType } from './dispatch-types';

export class ModularRack implements ModularRackProps {
  public readonly id: string;
  public readonly plateCode: string;
  public readonly rackType: RackType;
  public readonly nominalVolumeLiters: number;
  public readonly maxWorkingPressureBar: number;
  public readonly cylinders: Cylinder[];

  constructor(props: {
    id: string;
    plateCode: string;
    rackType: RackType;
    nominalVolumeLiters: number;
    maxWorkingPressureBar: number;
    cylinders: (Cylinder | CylinderProps)[];
  }) {
    this.id = props.id;
    this.plateCode = props.plateCode;
    this.rackType = props.rackType;
    this.nominalVolumeLiters = props.nominalVolumeLiters;
    this.maxWorkingPressureBar = props.maxWorkingPressureBar;
    this.cylinders = props.cylinders.map((c) =>
      c instanceof Cylinder ? c : new Cylinder(c)
    );
  }

  public get cylinderCount(): number {
    return this.cylinders.length;
  }

  /**
   * Valida la vigencia de prueba hidrostática de cada cilindro individual.
   * Si al menos uno está vencido, lanza ExpiredHydrostaticTestException y bloquea la operación.
   */
  public assertAllCylindersValidForOperation(operationDate: Date = new Date()): void {
    for (const cylinder of this.cylinders) {
      cylinder.assertHydrostaticValid(operationDate);
    }
  }
}
