/** Forma de pagamento escolhida no momento da compra. */
export enum PaymentMethod {
  CASH = 'cash',
  FINANCING = 'financing',
  LEASING = 'leasing',
}

/** Canal pelo qual a compra foi realizada. */
export enum PurchaseChannel {
  DEALERSHIP = 'dealership',
  ONLINE = 'online',
  FLEET = 'fleet',
}
