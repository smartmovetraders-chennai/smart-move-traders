const request = require('supertest');
const app = require('../app');
const { mockDb } = require('../config/supabase');

describe('Invoice API Endpoints & Security Checks', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  const userAHeaders = {
    'Authorization': 'Bearer dev-token',
    'x-dev-user-id': '11111111-1111-1111-1111-111111111111'
  };

  const userBHeaders = {
    'Authorization': 'Bearer dev-token',
    'x-dev-user-id': '22222222-2222-2222-2222-222222222222'
  };

  test('7. Invoice reference handling: user-entered reference is preserved without forced sequence', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set(userAHeaders)
      .send({
        quantity: 25,
        purchaseAmount: 150000,
        sellingAmount: 175000,
        paymentMethod: 'UPI',
        invoiceNumber: 'REF-LOT-2026-X',
        clientName: 'Kaveri Mobile World'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoice_number).toBe('REF-LOT-2026-X');
    expect(res.body.data.id).toBeDefined(); // UUID exists separately
  });

  test('8. Nullable official GST invoice number: stays null until officially assigned', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set(userAHeaders)
      .send({
        quantity: 10,
        purchaseAmount: 80000,
        sellingAmount: 90000,
        paymentMethod: 'Cash'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.gst_invoice_number).toBeNull();
  });

  test('8b. Nullable official GST invoice number: can be updated when officially assigned', async () => {
    const createRes = await request(app)
      .post('/api/invoices')
      .set(userAHeaders)
      .send({
        quantity: 10,
        purchaseAmount: 80000,
        sellingAmount: 90000,
        paymentMethod: 'Cash'
      });

    const invoiceId = createRes.body.data.id;

    const patchRes = await request(app)
      .patch(`/api/invoices/${invoiceId}`)
      .set(userAHeaders)
      .send({
        gstInvoiceNumber: 'GST/2026/TN/0091'
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.gst_invoice_number).toBe('GST/2026/TN/0091');
  });

  test('9. Unauthorized invoice access: User B cannot view or modify User A invoices', async () => {
    // User A creates an invoice
    const createRes = await request(app)
      .post('/api/invoices')
      .set(userAHeaders)
      .send({
        quantity: 30,
        purchaseAmount: 200000,
        sellingAmount: 220000,
        paymentMethod: 'Bank Transfer'
      });

    const invoiceId = createRes.body.data.id;

    // User B tries to view User A's invoice -> 403 Forbidden
    const getRes = await request(app)
      .get(`/api/invoices/${invoiceId}`)
      .set(userBHeaders);

    expect(getRes.status).toBe(403);
    expect(getRes.body.success).toBe(false);

    // User B tries to patch User A's invoice -> 403 Forbidden
    const patchRes = await request(app)
      .patch(`/api/invoices/${invoiceId}`)
      .set(userBHeaders)
      .send({ notes: 'Malicious modification' });

    expect(patchRes.status).toBe(403);

    // User B tries to delete User A's invoice -> 403 Forbidden
    const delRes = await request(app)
      .delete(`/api/invoices/${invoiceId}`)
      .set(userBHeaders);

    expect(delRes.status).toBe(403);
  });

  test('Backend authoritatively recalculates GST even if client attempts to tamper', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set(userAHeaders)
      .send({
        quantity: 50,
        purchaseAmount: 294000,
        sellingAmount: 320000,
        paymentMethod: 'UPI',
        // Client attempts to tamper with profit or GST:
        profit_amount: 100,
        gst_amount: 0
      });

    expect(res.status).toBe(201);
    // Server must have computed true margin scheme values
    expect(res.body.data.profit_amount).toBe(26000);
    expect(res.body.data.gst_amount).toBe(4680);
    expect(res.body.data.cgst_amount).toBe(2340);
    expect(res.body.data.sgst_amount).toBe(2340);
    expect(res.body.data.net_profit).toBe(21320);
  });
});
