export class FailedCardPaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FailedCardPaymentError';
  }
}

export class InvalidCreditCardDetailsError extends Error {
  constructor() {
    super('InvalidCreditCardDetailsError');
    this.name = 'InvalidCreditCardDetailsError';
  }
}
