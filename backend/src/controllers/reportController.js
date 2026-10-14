/**
 * reportController.js
 * Financial summaries and monthly analytics for Smart Move Traders dashboard.
 */

const { supabase, isConfigured, mockDb } = require('../config/supabase');

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

/**
 * Returns overall business financial summary for the current dealer.
 */
async function getSummary(req, res, next) {
  try {
    const ownerId = req.user.id;

    let invoices = [];
    if (!isConfigured) {
      invoices = Array.from(mockDb.invoices.values()).filter(inv => inv.owner_id === ownerId);
    } else {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      invoices = data || [];
    }

    let totalSales = 0;
    let totalPurchase = 0;
    let grossProfit = 0;
    let totalGst = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let netProfit = 0;
    let totalQuantity = 0;
    const modelQuantityMap = new Map();

    for (const inv of invoices) {
      const invParsed = extractItems(inv);
      totalSales += Number(invParsed.selling_amount) || 0;
      totalPurchase += Number(invParsed.purchase_amount) || 0;
      grossProfit += Number(invParsed.profit_amount) || 0;
      totalGst += Number(invParsed.gst_amount) || 0;
      totalCgst += Number(invParsed.cgst_amount) || 0;
      totalSgst += Number(invParsed.sgst_amount) || 0;
      netProfit += Number(invParsed.net_profit) || 0;
      totalQuantity += Number(invParsed.quantity) || 0;

      // Group and aggregate item quantities by model/device name
      if (Array.isArray(invParsed.items) && invParsed.items.length > 0) {
        for (const it of invParsed.items) {
          const modelName = String(it.model || it.model_name || '').trim();
          const q = parseInt(it.quantity, 10) || 0;
          if (modelName && q > 0) {
            modelQuantityMap.set(modelName, (modelQuantityMap.get(modelName) || 0) + q);
          }
        }
      }
    }

    const round2 = (val) => Math.round(val * 100) / 100;

    const modelBreakdown = Array.from(modelQuantityMap.entries())
      .map(([model, quantity]) => ({ model, quantity }))
      .sort((a, b) => b.quantity - a.quantity);

    const summary = {
      totalSales: round2(totalSales),
      totalPurchase: round2(totalPurchase),
      grossProfit: round2(grossProfit),
      totalGst: round2(totalGst),
      totalCgst: round2(totalCgst),
      totalSgst: round2(totalSgst),
      netProfit: round2(netProfit),
      invoiceCount: invoices.length,
      totalQuantity: totalQuantity,
      modelBreakdown: modelBreakdown,
      profitMarginPercent: totalSales > 0 ? round2((grossProfit / totalSales) * 100) : 0,
      recentInvoices: invoices.slice(0, 5).map(extractItems)
    };

    return res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Returns monthly breakdown of sales, purchases, margin, and GST.
 */
async function getMonthlyBreakdown(req, res, next) {
  try {
    const ownerId = req.user.id;

    let invoices = [];
    if (!isConfigured) {
      invoices = Array.from(mockDb.invoices.values()).filter(inv => inv.owner_id === ownerId);
    } else {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      invoices = data || [];
    }

    const monthsMap = new Map();

    for (const inv of invoices) {
      const date = new Date(inv.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthsMap.has(key)) {
        monthsMap.set(key, {
          month: key,
          totalSales: 0,
          totalPurchase: 0,
          grossProfit: 0,
          totalGst: 0,
          netProfit: 0,
          invoiceCount: 0
        });
      }

      const item = monthsMap.get(key);
      item.totalSales += Number(inv.selling_amount) || 0;
      item.totalPurchase += Number(inv.purchase_amount) || 0;
      item.grossProfit += Number(inv.profit_amount) || 0;
      item.totalGst += Number(inv.gst_amount) || 0;
      item.netProfit += Number(inv.net_profit) || 0;
      item.invoiceCount += 1;
    }

    const round2 = (val) => Math.round(val * 100) / 100;

    const monthly = Array.from(monthsMap.values()).map(m => ({
      ...m,
      totalSales: round2(m.totalSales),
      totalPurchase: round2(m.totalPurchase),
      grossProfit: round2(m.grossProfit),
      totalGst: round2(m.totalGst),
      netProfit: round2(m.netProfit)
    }));

    return res.json({
      success: true,
      data: monthly
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getMonthlyBreakdown
};
