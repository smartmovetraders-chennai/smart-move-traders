/**
 * invoiceController.js
 * Controller handling invoice CRUD operations with server-side authoritative
 * GST margin scheme recalculation and owner authorization.
 */

const crypto = require('crypto');
const { supabase, isConfigured, mockDb } = require('../config/supabase');
const { validateAndCalculate, calculateGst } = require('../services/gstService');
const { GST_CONFIG } = require('../config/constants');

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter(it => it && (it.model || it.model_name) && Number(it.quantity) > 0)
    .map(it => ({
      model: String(it.model || it.model_name).trim(),
      quantity: parseInt(it.quantity, 10)
    }));
}

function extractItems(invoice) {
  if (!invoice) return invoice;
  const inv = { ...invoice };
  if (Array.isArray(inv.items) && inv.items.length > 0) {
    return inv;
  }
  if (inv.notes && inv.notes.includes('[ITEMS_JSON]:')) {
    try {
      const match = inv.notes.match(/\[ITEMS_JSON\]:(.+)$/m);
      if (match && match[1]) {
        inv.items = JSON.parse(match[1]);
        inv.notes = inv.notes.replace(/(\n)?\[ITEMS_JSON\]:.+$/m, '').trim() || null;
      }
    } catch {
      // ignore
    }
  }
  if (!Array.isArray(inv.items)) {
    inv.items = [];
  }
  return inv;
}

function isItemsColumnMissingError(dbErr) {
  if (!dbErr) return false;
  const msg = (dbErr.message || '').toLowerCase();
  const code = dbErr.code || '';
  return (
    code === 'PGRST204' ||
    msg.includes('schema cache') ||
    msg.includes('invoices.items') ||
    (msg.includes('items') && (msg.includes('column') || msg.includes('does not exist') || msg.includes('could not find')))
  );
}

/**
 * List invoices with pagination, status filtering, and search.
 */
async function listInvoices(req, res, next) {
  try {
    const ownerId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const { status, search } = req.query;

    if (!isConfigured) {
      let items = Array.from(mockDb.invoices.values()).filter(inv => inv.owner_id === ownerId);
      if (status && status !== 'all') {
        items = items.filter(inv => inv.status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        items = items.filter(inv =>
          (inv.client_name && inv.client_name.toLowerCase().includes(q)) ||
          (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q))
        );
      }
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const totalCount = items.length;
      const paginated = items.slice(offset, offset + limit).map(extractItems);

      return res.json({
        success: true,
        data: paginated,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1
        }
      });
    }

    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`client_name.ilike.%${search}%,invoice_number.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return res.json({
      success: true,
      data: (data || []).map(extractItems),
      pagination: {
        page,
        limit,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit) || 1
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single invoice by ID with strict ownership check.
 */
async function getInvoiceById(req, res, next) {
  try {
    const ownerId = req.user.id;
    const { id } = req.params;

    if (!isConfigured) {
      const invoice = mockDb.invoices.get(id);
      if (!invoice) {
        return res.status(404).json({ success: false, error: 'Invoice not found.' });
      }
      if (invoice.owner_id !== ownerId) {
        return res.status(403).json({ success: false, error: 'Unauthorized: access denied to this invoice.' });
      }
      return res.json({ success: true, data: extractItems(invoice) });
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found.' });
    }

    if (invoice.owner_id !== ownerId) {
      return res.status(403).json({ success: false, error: 'Unauthorized: access denied to this invoice.' });
    }

    return res.json({ success: true, data: extractItems(invoice) });
  } catch (err) {
    next(err);
  }
}

/**
 * Create invoice with server-side authoritative GST calculation.
 */
async function createInvoice(req, res, next) {
  try {
    const ownerId = req.user.id;
    const {
      quantity,
      purchaseAmount,
      sellingAmount,
      paymentMethod,
      clientName,
      invoiceNumber,
      gstInvoiceNumber,
      notes,
      status = 'draft',
      hsnCode = GST_CONFIG.DEFAULT_HSN
    } = req.body;

    const normalizedItems = normalizeItems(req.body.items);
    let finalQty = quantity;
    if ((finalQty === undefined || finalQty === null || finalQty === '') && normalizedItems.length > 0) {
      finalQty = normalizedItems.reduce((acc, curr) => acc + curr.quantity, 0);
    }

    // Server-side authoritative margin scheme recalculation
    const calculated = validateAndCalculate({
      quantity: finalQty,
      purchaseAmount,
      sellingAmount,
      paymentMethod
    });

    const newInvoice = {
      id: crypto.randomUUID(),
      owner_id: ownerId,
      invoice_number: invoiceNumber ? String(invoiceNumber).trim() : null,
      gst_invoice_number: gstInvoiceNumber ? String(gstInvoiceNumber).trim() : null,
      quantity: calculated.quantity,
      purchase_amount: calculated.purchaseAmount,
      selling_amount: calculated.sellingAmount,
      profit_amount: calculated.profitAmount,
      gst_amount: calculated.gstAmount,
      cgst_amount: calculated.cgstAmount,
      sgst_amount: calculated.sgstAmount,
      net_profit: calculated.netProfit,
      client_name: clientName ? String(clientName).trim() : null,
      payment_method: calculated.paymentMethod,
      status: status || 'draft',
      hsn_code: hsnCode || GST_CONFIG.DEFAULT_HSN,
      notes: notes ? String(notes).trim() : null,
      items: normalizedItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!isConfigured) {
      mockDb.invoices.set(newInvoice.id, newInvoice);
      return res.status(201).json({ success: true, data: extractItems(newInvoice) });
    }

    let data;
    try {
      const resInsert = await supabase
        .from('invoices')
        .insert([newInvoice])
        .select()
        .single();
      if (resInsert.error) throw resInsert.error;
      data = resInsert.data;
    } catch (dbErr) {
      if (isItemsColumnMissingError(dbErr)) {
        const fallbackInvoice = { ...newInvoice };
        delete fallbackInvoice.items;
        if (normalizedItems.length > 0) {
          const itemsTag = `[ITEMS_JSON]:${JSON.stringify(normalizedItems)}`;
          fallbackInvoice.notes = fallbackInvoice.notes ? `${fallbackInvoice.notes}\n${itemsTag}` : itemsTag;
        }
        const fallbackRes = await supabase
          .from('invoices')
          .insert([fallbackInvoice])
          .select()
          .single();
        if (fallbackRes.error) throw fallbackRes.error;
        data = { ...fallbackRes.data, items: normalizedItems };
      } else {
        throw dbErr;
      }
    }

    return res.status(201).json({ success: true, data: extractItems(data) });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an invoice. If amounts changed, recalculates financial metrics.
 */
async function updateInvoice(req, res, next) {
  try {
    const ownerId = req.user.id;
    const { id } = req.params;

    let existing;
    if (!isConfigured) {
      existing = mockDb.invoices.get(id);
    } else {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();
      if (!error) existing = data;
    }

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Invoice not found.' });
    }

    if (existing.owner_id !== ownerId) {
      return res.status(403).json({ success: false, error: 'Unauthorized: access denied to this invoice.' });
    }

    const quantity = req.body.quantity !== undefined ? req.body.quantity : existing.quantity;
    const purchaseAmount = req.body.purchaseAmount !== undefined ? req.body.purchaseAmount : Number(existing.purchase_amount);
    const sellingAmount = req.body.sellingAmount !== undefined ? req.body.sellingAmount : Number(existing.selling_amount);
    const paymentMethod = req.body.paymentMethod !== undefined ? req.body.paymentMethod : existing.payment_method;

    // Recalculate financial breakdown
    const recalculated = calculateGst({
      quantity,
      purchaseAmount,
      sellingAmount,
      paymentMethod
    });

    const updates = {
      quantity,
      purchase_amount: purchaseAmount,
      selling_amount: sellingAmount,
      profit_amount: recalculated.profitAmount,
      gst_amount: recalculated.gstAmount,
      cgst_amount: recalculated.cgstAmount,
      sgst_amount: recalculated.sgstAmount,
      net_profit: recalculated.netProfit,
      payment_method: paymentMethod,
      updated_at: new Date().toISOString()
    };

    if (req.body.clientName !== undefined) updates.client_name = req.body.clientName;
    if (req.body.invoiceNumber !== undefined) updates.invoice_number = req.body.invoiceNumber;
    if (req.body.gstInvoiceNumber !== undefined) updates.gst_invoice_number = req.body.gstInvoiceNumber;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.hsnCode !== undefined) updates.hsn_code = req.body.hsnCode;

    if (req.body.items !== undefined) {
      updates.items = normalizeItems(req.body.items);
    }

    if (!isConfigured) {
      const updated = { ...existing, ...updates };
      mockDb.invoices.set(id, updated);
      return res.json({ success: true, data: extractItems(updated) });
    }

    let updated;
    try {
      const resUp = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (resUp.error) throw resUp.error;
      updated = resUp.data;
    } catch (dbErr) {
      if (isItemsColumnMissingError(dbErr) && updates.items !== undefined) {
        const fallbackUpdates = { ...updates };
        const normItems = fallbackUpdates.items;
        delete fallbackUpdates.items;
        if (normItems.length > 0) {
          const itemsTag = `[ITEMS_JSON]:${JSON.stringify(normItems)}`;
          fallbackUpdates.notes = fallbackUpdates.notes ? `${fallbackUpdates.notes}\n${itemsTag}` : itemsTag;
        }
        const fallbackRes = await supabase
          .from('invoices')
          .update(fallbackUpdates)
          .eq('id', id)
          .select()
          .single();
        if (fallbackRes.error) throw fallbackRes.error;
        updated = { ...fallbackRes.data, items: normItems };
      } else {
        throw dbErr;
      }
    }

    return res.json({ success: true, data: extractItems(updated) });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete an invoice with ownership check.
 */
async function deleteInvoice(req, res, next) {
  try {
    const ownerId = req.user.id;
    const { id } = req.params;

    let existing;
    if (!isConfigured) {
      existing = mockDb.invoices.get(id);
    } else {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();
      if (!error) existing = data;
    }

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Invoice not found.' });
    }

    if (existing.owner_id !== ownerId) {
      return res.status(403).json({ success: false, error: 'Unauthorized: access denied to this invoice.' });
    }

    if (!isConfigured) {
      mockDb.invoices.delete(id);
      return res.json({ success: true, message: 'Invoice deleted successfully.' });
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.json({ success: true, message: 'Invoice deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
};
