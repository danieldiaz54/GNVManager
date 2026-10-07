export class InvalidReconciliationDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidReconciliationDataError';
  }
}
