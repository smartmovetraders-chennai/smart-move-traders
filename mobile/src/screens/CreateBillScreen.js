import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import { createInvoice } from '../services/api';
import { calculateMarginGst } from '../services/gstCalculator';
import { colors } from '../theme/colors';
import { formatRupees } from '../utils/formatters';
import Card from '../components/Card';

const PAYMENT_METHODS = ['UPI', 'Bank Transfer', 'Cash', 'Cheque'];

export default function CreateBillScreen({ navigation }) {
  const [quantity, setQuantity] = useState('');
  const [useModelBreakdown, setUseModelBreakdown] = useState(false);
  const [modelItems, setModelItems] = useState([
    { model: '', quantity: '', price: '' }
  ]);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [sellingAmount, setSellingAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [clientName, setClientName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const totalModelQty = useMemo(() => {
    return modelItems.reduce((acc, curr) => {
      const q = parseInt(curr.quantity, 10);
      return acc + (!isNaN(q) && q > 0 ? q : 0);
    }, 0);
  }, [modelItems]);

  const totalModelCost = useMemo(() => {
    return modelItems.reduce((acc, curr) => {
      const p = parseFloat(curr.price);
      return acc + (!isNaN(p) && p > 0 ? p : 0);
    }, 0);
  }, [modelItems]);

  // When model breakdown is used and prices are entered, auto-sync to purchaseAmount
  useEffect(() => {
    if (useModelBreakdown && totalModelCost > 0) {
      setPurchaseAmount(String(totalModelCost));
    }
  }, [useModelBreakdown, totalModelCost]);

  const handleAddModelRow = () => {
    setModelItems(prev => [...prev, { model: '', quantity: '', price: '' }]);
  };

  const handleRemoveModelRow = (index) => {
    if (modelItems.length > 1) {
      setModelItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleUpdateModelItem = (index, field, value) => {
    setModelItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Live real-time GST calculation as user types
  const liveGst = useMemo(() => {
    const p = parseFloat(purchaseAmount) || 0;
    const s = parseFloat(sellingAmount) || 0;
    return calculateMarginGst(p, s);
  }, [purchaseAmount, sellingAmount]);

  const handleSubmit = async () => {
    setFormError('');

    let finalQty = parseInt(quantity, 10);
    let itemsPayload = [];

    if (useModelBreakdown) {
      itemsPayload = modelItems
        .filter(it => it.model.trim() && parseInt(it.quantity, 10) > 0)
        .map(it => ({
          model: it.model.trim(),
          quantity: parseInt(it.quantity, 10),
          price: parseFloat(it.price) || 0
        }));

      if (itemsPayload.length === 0) {
        setFormError('Please enter at least one phone model with quantity (e.g. iPhone 17: 1 Qty)');
        return;
      }

      finalQty = itemsPayload.reduce((acc, curr) => acc + curr.quantity, 0);
    } else {
      if (!quantity || isNaN(finalQty) || finalQty <= 0) {
        setFormError('Please enter a valid whole quantity of smartphones (e.g. 25)');
        return;
      }
    }

    const purchase = parseFloat(purchaseAmount);
    const selling = parseFloat(sellingAmount);

    if (purchaseAmount === '' || isNaN(purchase) || purchase < 0) {
      setFormError('Please enter a valid non-negative lot purchase cost');
      return;
    }

    if (sellingAmount === '' || isNaN(selling) || selling < 0) {
      setFormError('Please enter a valid non-negative lot selling price');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        quantity: finalQty,
        items: itemsPayload,
        purchaseAmount: purchase,
        sellingAmount: selling,
        paymentMethod,
        clientName: clientName.trim() || null,
        invoiceNumber: invoiceNumber.trim() || null,
        notes: notes.trim() || null,
        status: 'issued'
      };

      const res = await createInvoice(payload);
      if (res.data && res.data.success) {
        Alert.alert(
          'Invoice Created',
          `Bill recorded successfully for ${finalQty} second-hand smartphones.`,
          [
            {
              text: 'View & Share Bill',
              onPress: () => {
                navigation.replace('InvoiceDetail', { invoiceId: res.data.data.id });
              }
            },
            {
              text: 'Create Another',
              onPress: () => {
                setQuantity('');
                setModelItems([{ model: '', quantity: '' }]);
                setPurchaseAmount('');
                setSellingAmount('');
                setClientName('');
                setInvoiceNumber('');
                setNotes('');
              }
            }
          ]
        );
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save bill';
      setFormError(msg);
      Alert.alert('Submission Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Wholesale Bill</Text>
          <Text style={styles.subtitle}>Smart Move Traders • CGST Rule 32(5) Margin Scheme</Text>
        </View>

        {formError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        ) : null}

        {/* Required Inputs */}
        <Card style={styles.formCard}>
          <Text style={styles.cardHeader}>Lot Details (Required)</Text>

          <View style={styles.fieldGroup}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.label}>Quantity of Smartphones *</Text>
                <Text style={styles.hint}>Total phone count in this wholesale lot</Text>
              </View>
              <View style={styles.modelToggleSwitchRow}>
                <Text style={styles.toggleSwitchLabel}>Split by Model</Text>
                <Switch
                  value={useModelBreakdown}
                  onValueChange={setUseModelBreakdown}
                  trackColor={{ false: '#CBD5E1', true: colors.primaryLight }}
                  thumbColor={useModelBreakdown ? colors.primary : '#94A3B8'}
                />
              </View>
            </View>

            {useModelBreakdown ? (
              <View style={styles.modelsContainer}>
                {modelItems.map((item, index) => (
                  <View key={index} style={styles.modelRow}>
                    <TextInput
                      style={[styles.input, styles.modelNameInput]}
                      placeholder="Model (e.g. iPhone 17)"
                      placeholderTextColor={colors.textMuted}
                      value={item.model}
                      onChangeText={(val) => handleUpdateModelItem(index, 'model', val)}
                    />
                    <TextInput
                      style={[styles.input, styles.modelQtyInput]}
                      placeholder="Qty"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      value={String(item.quantity || '')}
                      onChangeText={(val) => handleUpdateModelItem(index, 'quantity', val)}
                    />
                    <TextInput
                      style={[styles.input, styles.modelPriceInput]}
                      placeholder="Cost (₹)"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      value={String(item.price || '')}
                      onChangeText={(val) => handleUpdateModelItem(index, 'price', val)}
                    />
                    {modelItems.length > 1 ? (
                      <TouchableOpacity
                        onPress={() => handleRemoveModelRow(index)}
                        style={styles.removeModelBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.removeModelBtnText}>✕</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}

                <TouchableOpacity
                  onPress={handleAddModelRow}
                  style={styles.addModelBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addModelBtnText}>+ Add Another Model</Text>
                </TouchableOpacity>

                <View style={styles.totalModelQtyBanner}>
                  <View>
                    <Text style={styles.totalModelQtyLabel}>Total Quantity:</Text>
                    <Text style={styles.totalModelQtyVal}>{totalModelQty} Devices</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.totalModelQtyLabel}>Total Purchase Cost:</Text>
                    <Text style={[styles.totalModelQtyVal, { color: '#059669' }]}>
                      {formatRupees(totalModelCost)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="e.g. 50"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={quantity}
                onChangeText={setQuantity}
              />
            )}
          </View>

          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Total Purchase Cost (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 294000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={purchaseAmount}
                onChangeText={setPurchaseAmount}
              />
              <Text style={styles.hint}>
                {useModelBreakdown && totalModelCost > 0
                  ? 'Auto-calculated from model prices'
                  : 'Lot buy cost'}
              </Text>
            </View>

            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Total Selling Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 320000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={sellingAmount}
                onChangeText={setSellingAmount}
              />
              <Text style={styles.hint}>Lot sale price</Text>
            </View>
          </View>

          {/* Payment Method Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Payment Method *</Text>
            <View style={styles.paymentMethodsGrid}>
              {PAYMENT_METHODS.map((method) => {
                const isSelected = paymentMethod === method;
                return (
                  <TouchableOpacity
                    key={method}
                    style={[styles.paymentBtn, isSelected && styles.paymentBtnActive]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Text style={[styles.paymentBtnText, isSelected && styles.paymentBtnTextActive]}>
                      {method}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Live GST Calculation Preview */}
        <Card style={styles.calcPreviewCard}>
          <View style={styles.calcHeader}>
            <Text style={styles.calcTitle}>Live GST Calculation</Text>
            <Text style={styles.calcTag}>CGST Rule 32(5)</Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Selling Turnover:</Text>
            <Text style={styles.calcValue}>{formatRupees(parseFloat(sellingAmount) || 0)}</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Purchase Cost:</Text>
            <Text style={styles.calcValue}>− {formatRupees(parseFloat(purchaseAmount) || 0)}</Text>
          </View>
          <View style={[styles.calcRow, styles.calcRowBorder]}>
            <Text style={[styles.calcLabel, styles.bold]}>Gross Profit Margin:</Text>
            <Text style={[styles.calcValue, styles.bold, { color: liveGst.profitAmount >= 0 ? colors.success : colors.danger }]}>
              {formatRupees(liveGst.profitAmount)}
            </Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Total 18% GST on Margin:</Text>
            <Text style={[styles.calcValue, { color: '#D97706', fontWeight: '700' }]}>
              {formatRupees(liveGst.gstAmount)}
            </Text>
          </View>

          {liveGst.gstAmount > 0 ? (
            <View style={styles.splitTaxBox}>
              <Text style={styles.splitTaxText}>
                • CGST (9%): {formatRupees(liveGst.cgstAmount)}    • SGST (9%): {formatRupees(liveGst.sgstAmount)}
              </Text>
            </View>
          ) : null}

          <View style={[styles.calcRow, styles.netProfitRow]}>
            <Text style={styles.netProfitLabel}>Estimated Net Profit:</Text>
            <Text style={styles.netProfitValue}>{formatRupees(liveGst.netProfit)}</Text>
          </View>

          <Text style={styles.calcRuleNotice}>
            {liveGst.isLossOrBreakEven
              ? '✓ Margin is zero or negative: ₹0 GST charged under Rule 32(5).'
              : '✓ 18% GST applies strictly to the positive profit margin, never to the total selling turnover.'}
          </Text>
        </Card>

        {/* Optional Metadata */}
        <Card style={styles.formCard}>
          <Text style={styles.cardHeader}>Optional Details</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Customer / Buyer Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Metro Mobile Traders"
              placeholderTextColor={colors.textMuted}
              value={clientName}
              onChangeText={setClientName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Invoice Reference / Lot ID</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. LOT-2026-08 (optional reference)"
              placeholderTextColor={colors.textMuted}
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
            />
            <Text style={styles.hint}>Your business reference (official GST number assigned separately)</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Mixed 5G lots, checked working condition"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </Card>

        {/* Submit Action */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Saving Bill & Computing GST...</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>Generate & Save Bill</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  header: {
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  errorBanner: {
    backgroundColor: colors.dangerLight,
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600'
  },
  formCard: {
    marginBottom: 14
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  fieldGroup: {
    marginBottom: 14
  },
  rowFields: {
    flexDirection: 'row'
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top'
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  paymentBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  paymentBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  paymentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary
  },
  paymentBtnTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  calcPreviewCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    marginBottom: 14
  },
  calcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  calcTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534'
  },
  calcTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  calcRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingTop: 8,
    marginTop: 4
  },
  calcLabel: {
    fontSize: 13,
    color: '#374151'
  },
  calcValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500'
  },
  bold: {
    fontWeight: '700'
  },
  splitTaxBox: {
    backgroundColor: '#FEF3C7',
    padding: 6,
    borderRadius: 4,
    marginVertical: 4
  },
  splitTaxText: {
    fontSize: 11,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '600'
  },
  netProfitRow: {
    borderTopWidth: 2,
    borderTopColor: '#86EFAC',
    paddingTop: 8,
    marginTop: 8
  },
  netProfitLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534'
  },
  netProfitValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534'
  },
  calcRuleNotice: {
    fontSize: 11,
    color: '#166534',
    marginTop: 8,
    fontStyle: 'italic'
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  modelToggleSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  toggleSwitchLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  modelsContainer: {
    marginTop: 6
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  modelNameInput: {
    flex: 2,
    marginRight: 6
  },
  modelQtyInput: {
    flex: 0.9,
    marginRight: 6,
    textAlign: 'center'
  },
  modelPriceInput: {
    flex: 1.4,
    marginRight: 6
  },
  removeModelBtn: {
    width: 32,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8
  },
  removeModelBtnText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 14
  },
  addModelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
    alignSelf: 'flex-start',
    marginBottom: 10
  },
  addModelBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12
  },
  totalModelQtyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4
  },
  totalModelQtyLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  totalModelQtyVal: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '800'
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  submitBtnDisabled: {
    opacity: 0.6
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  }
});
