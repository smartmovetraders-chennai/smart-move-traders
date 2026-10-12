const {
  calculateGst,
  validateTransactionInput,
  ValidationError,
  toPaise,
  toRupees
} = require('../services/gstService');

describe('gstService — Margin Scheme (CGST Rule 32(5)) Logic', () => {
  test('1. Positive profit: GST is 18% of profit only, never of selling amount', () => {
    // Wholesale lot: Purchase ₹2,94,000, Selling ₹3,20,000 -> Profit ₹26,000
    const result = calculateGst({
      quantity: 50,
      purchaseAmount: 294000,
      sellingAmount: 320000,
      paymentMethod: 'UPI'
    });

    expect(result.profitAmount).toBe(26000);
    // 18% of ₹26,000 = ₹4,680 (NOT 18% of ₹3,20,000 which would be ₹57,600)
    expect(result.gstAmount).toBe(4680);
    expect(result.cgstAmount).toBe(2340);
    expect(result.sgstAmount).toBe(2340);
    expect(result.cgstAmount + result.sgstAmount).toBe(result.gstAmount);
    expect(result.netProfit).toBe(21320);
  });

  test('2. Zero profit: no GST charged (₹0)', () => {
    const result = calculateGst({
      quantity: 10,
      purchaseAmount: 100000,
      sellingAmount: 100000,
      paymentMethod: 'Cash'
    });

    expect(result.profitAmount).toBe(0);
    expect(result.gstAmount).toBe(0);
    expect(result.cgstAmount).toBe(0);
    expect(result.sgstAmount).toBe(0);
    expect(result.netProfit).toBe(0);
  });

  test('3. Negative profit (sold at loss): no GST charged (₹0)', () => {
    const result = calculateGst({
      quantity: 10,
      purchaseAmount: 120000,
      sellingAmount: 100000,
      paymentMethod: 'Bank Transfer'
    });

    expect(result.profitAmount).toBe(-20000);
    expect(result.gstAmount).toBe(0);
    expect(result.cgstAmount).toBe(0);
    expect(result.sgstAmount).toBe(0);
    expect(result.netProfit).toBe(-20000);
  });

  test('4a. Invalid quantity (zero or negative or non-integer) is rejected', () => {
    expect(() => validateTransactionInput({ quantity: 0, purchaseAmount: 1000, sellingAmount: 1200, paymentMethod: 'Cash' }))
      .toThrow(ValidationError);
    expect(() => validateTransactionInput({ quantity: -5, purchaseAmount: 1000, sellingAmount: 1200, paymentMethod: 'Cash' }))
      .toThrow(ValidationError);
    expect(() => validateTransactionInput({ quantity: 2.5, purchaseAmount: 1000, sellingAmount: 1200, paymentMethod: 'Cash' }))
      .toThrow(ValidationError);
  });

  test('4b. Negative purchase amount is rejected', () => {
    expect(() => validateTransactionInput({ quantity: 5, purchaseAmount: -500, sellingAmount: 1200, paymentMethod: 'Cash' }))
      .toThrow(ValidationError);
  });

  test('4c. Negative selling amount is rejected', () => {
    expect(() => validateTransactionInput({ quantity: 5, purchaseAmount: 500, sellingAmount: -100, paymentMethod: 'Cash' }))
      .toThrow(ValidationError);
  });

  test('5. Decimal rounding: fractional rupee amounts remain currency-safe in integer paise', () => {
    const result = calculateGst({
      quantity: 3,
      purchaseAmount: 10000.10,
      sellingAmount: 11000.35,
      paymentMethod: 'UPI'
    });

    // Profit: 11000.35 - 10000.10 = 1000.25
    expect(result.profitAmount).toBe(1000.25);
    // 1000.25 * 0.18 = 180.045 -> rounds to 180.05
    expect(result.gstAmount).toBe(180.05);
    expect(result.cgstAmount).toBe(90.03);
    expect(result.sgstAmount).toBe(90.02);
    expect(result.cgstAmount + result.sgstAmount).toBeCloseTo(result.gstAmount, 2);
    expect(result.netProfit).toBe(820.20);
  });

  test('6. Unsupported payment methods are rejected', () => {
    expect(() => validateTransactionInput({ quantity: 5, purchaseAmount: 500, sellingAmount: 1200, paymentMethod: 'Crypto' }))
      .toThrow(ValidationError);
    expect(() => validateTransactionInput({ quantity: 5, purchaseAmount: 500, sellingAmount: 1200, paymentMethod: 'Barter' }))
      .toThrow(ValidationError);

    // All 4 valid methods must pass
    for (const method of ['Bank Transfer', 'UPI', 'Cash', 'Cheque']) {
      expect(() => validateTransactionInput({ quantity: 1, purchaseAmount: 100, sellingAmount: 200, paymentMethod: method }))
        .not.toThrow();
    }
  });

  test('toPaise and toRupees conversion integrity', () => {
    expect(toPaise(100)).toBe(10000);
    expect(toPaise(99.99)).toBe(9999);
    expect(toRupees(9999)).toBe(99.99);
  });
});
