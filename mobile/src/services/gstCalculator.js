/**
 * gstCalculator.js
 * Client-side GST Margin Scheme (CGST Rule 32(5)) calculation for instant live previews.
 * Uses identical integer-paise math as the authoritative backend.
 */

export const GST_RATE = 0.18;
export const CGST_SHARE = 0.5;

export function calculateMarginGst(purchaseAmount, sellingAmount) {
  const p = Number(purchaseAmount) || 0;
  const s = Number(sellingAmount) || 0;

  const purchasePaise = Math.round(p * 100);
  const sellingPaise = Math.round(s * 100);
  const profitPaise = sellingPaise - purchasePaise;

  if (profitPaise <= 0) {
    return {
      profitAmount: Math.round(profitPaise) / 100,
      gstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      netProfit: Math.round(profitPaise) / 100,
      isLossOrBreakEven: true
    };
  }

  const gstPaise = Math.round(profitPaise * GST_RATE);
  const cgstPaise = Math.round(gstPaise * CGST_SHARE);
  const sgstPaise = gstPaise - cgstPaise;
  const netProfitPaise = profitPaise - gstPaise;

  return {
    profitAmount: Math.round(profitPaise) / 100,
    gstAmount: Math.round(gstPaise) / 100,
    cgstAmount: Math.round(cgstPaise) / 100,
    sgstAmount: Math.round(sgstPaise) / 100,
    netProfit: Math.round(netProfitPaise) / 100,
    isLossOrBreakEven: false
  };
}
