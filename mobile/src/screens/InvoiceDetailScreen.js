import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { getInvoice, updateInvoice, deleteInvoice } from '../services/api';
import { printInvoice, shareInvoicePdf, downloadInvoicePdf } from '../services/pdfService';
import { colors } from '../theme/colors';
import { formatRupees, formatDate } from '../utils/formatters';
import Card from '../components/Card';
import Badge from '../components/Badge';

export default function InvoiceDetailScreen({ route, navigation }) {
  const { invoiceId } = route.params;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isCustomerFacing, setIsCustomerFacing] = useState(true);
  const [showModelBreakdown, setShowModelBreakdown] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getInvoice(invoiceId);
      if (res.data && res.data.success) {
        setInvoice(res.data.data);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to retrieve invoice details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [invoiceId, navigation]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handlePrint = async () => {
    if (!invoice) return;
    try {
      await printInvoice(invoice, isCustomerFacing);
    } catch (err) {
      Alert.alert('Print Error', err.message || 'Unable to print bill.');
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    try {
      setSharing(true);
      await shareInvoicePdf(invoice, isCustomerFacing);
    } catch (err) {
      Alert.alert('Share Error', err.message || 'Unable to generate PDF.');
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = async () => {
    if (!invoice) return;
    try {
      setDownloading(true);
      await downloadInvoicePdf(invoice, isCustomerFacing);
    } catch (err) {
      Alert.alert('Download Error', err.message || 'Unable to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setActionLoading(true);
      const res = await updateInvoice(invoiceId, { status: newStatus });
      if (res.data && res.data.success) {
        setInvoice(res.data.data);
        Alert.alert('Status Updated', `Bill marked as ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this invoice? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await deleteInvoice(invoiceId);
              Alert.alert('Deleted', 'Invoice removed successfully.');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.error || err.message);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading || !invoice) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading invoice details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Business Header Card */}
        <Card style={styles.businessHeaderCard}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.cardLogo}
          />
          <Text style={styles.bizName}>SMART MOVE TRADERS</Text>
          <Text style={styles.bizAddress}>
            Plot 8, GF, Bharathiyar Street,{'\n'}
            Maruthi Nagar, Phase 1,{'\n'}
            Thundalam,{'\n'}
            Chennai - 600077
          </Text>
          <View style={styles.badgeContainer}>
            <Badge status={invoice.status} />
            <Text style={styles.docTypeBadge}>
              {isCustomerFacing ? 'Customer Tax Invoice' : 'Internal Margin Bill (Rule 32(5))'}
            </Text>
          </View>
        </Card>

        {/* View Toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Bill Mode:</Text>
          <TouchableOpacity
            style={[styles.toggleBtn, isCustomerFacing && styles.toggleBtnActive]}
            onPress={() => setIsCustomerFacing(true)}
          >
            <Text style={[styles.toggleBtnText, isCustomerFacing && styles.toggleBtnTextActive]}>
              Customer View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !isCustomerFacing && styles.toggleBtnActive]}
            onPress={() => setIsCustomerFacing(false)}
          >
            <Text style={[styles.toggleBtnText, !isCustomerFacing && styles.toggleBtnTextActive]}>
              Dealer Margin View
            </Text>
          </TouchableOpacity>
        </View>

        {/* Metadata Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Buyer / Customer:</Text>
            <Text style={styles.infoVal}>{invoice.client_name || 'Counter Sale / Cash Customer'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date Issued:</Text>
            <Text style={styles.infoVal}>{formatDate(invoice.created_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Invoice Reference:</Text>
            <Text style={styles.infoVal}>{invoice.invoice_number || 'N/A'}</Text>
          </View>
          {invoice.gst_invoice_number ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Official GST Invoice No:</Text>
              <Text style={[styles.infoVal, { color: colors.primary, fontWeight: '700' }]}>
                {invoice.gst_invoice_number}
              </Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method:</Text>
            <Text style={styles.infoVal}>{invoice.payment_method}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>HSN Classification:</Text>
            <Text style={styles.infoVal}>{invoice.hsn_code || '8517'}</Text>
          </View>
        </Card>

        {/* Items Table */}
        <Card style={styles.tableCard}>
          <View style={styles.tableTitleRow}>
            <Text style={styles.tableTitle}>Wholesale Lot Details</Text>
            {Array.isArray(invoice.items) && invoice.items.length > 0 ? (
              <TouchableOpacity
                style={styles.modelToggleBtn}
                onPress={() => setShowModelBreakdown(!showModelBreakdown)}
                activeOpacity={0.7}
              >
                <Text style={styles.modelToggleBtnText}>
                  {showModelBreakdown ? 'Hide Models ▲' : 'Show Models ▼'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.tableRowHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Description</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Total Qty</Text>
            <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>Selling Value</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.td, { flex: 2, fontWeight: '700' }]}>Second-Hand Smartphones</Text>
            <Text style={[styles.td, { flex: 1, textAlign: 'center', fontWeight: '800' }]}>
              {invoice.quantity}
            </Text>
            <Text style={[styles.td, { flex: 1.5, textAlign: 'right', fontWeight: '800' }]}>
              {formatRupees(invoice.selling_amount)}
            </Text>
          </View>

          {/* Model-wise Quantity Breakdown (Toggleable) */}
          {Array.isArray(invoice.items) && invoice.items.length > 0 && showModelBreakdown ? (
            <View style={styles.modelBreakdownBox}>
              <Text style={styles.modelBreakdownTitle}>Quantity by Model:</Text>
              {invoice.items.map((it, idx) => (
                <View key={idx} style={styles.modelBreakdownRow}>
                  <Text style={styles.modelNameText}>• {it.model}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {it.price > 0 ? (
                      <Text style={[styles.modelQtyBadge, { backgroundColor: '#F0FDF4', color: '#166534', marginRight: 6 }]}>
                        {formatRupees(it.price)}
                      </Text>
                    ) : null}
                    <Text style={styles.modelQtyBadge}>{it.quantity} Qty</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        {/* Financial / GST Calculation Card */}
        <Card style={styles.calcCard}>
          <Text style={styles.calcTitle}>GST Margin Scheme Calculation</Text>

          {!isCustomerFacing ? (
            <>
              <View style={styles.calcLine}>
                <Text style={styles.calcLineLabel}>Wholesale Purchase Cost:</Text>
                <Text style={styles.calcLineVal}>{formatRupees(invoice.purchase_amount)}</Text>
              </View>
              <View style={styles.calcLine}>
                <Text style={styles.calcLineLabel}>Wholesale Selling Price:</Text>
                <Text style={styles.calcLineVal}>{formatRupees(invoice.selling_amount)}</Text>
              </View>
              <View style={[styles.calcLine, styles.boldLine]}>
                <Text style={styles.boldText}>Gross Profit Margin:</Text>
                <Text style={[styles.boldText, { color: invoice.profit_amount >= 0 ? colors.success : colors.danger }]}>
                  {formatRupees(invoice.profit_amount)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.calcLine}>
              <Text style={styles.calcLineLabel}>Total Lot Value:</Text>
              <Text style={styles.calcLineVal}>{formatRupees(invoice.selling_amount)}</Text>
            </View>
          )}

          <View style={styles.calcLine}>
            <Text style={styles.calcLineLabel}>CGST (9% on margin):</Text>
            <Text style={styles.calcLineVal}>{formatRupees(invoice.cgst_amount || 0)}</Text>
          </View>
          <View style={styles.calcLine}>
            <Text style={styles.calcLineLabel}>SGST (9% on margin):</Text>
            <Text style={styles.calcLineVal}>{formatRupees(invoice.sgst_amount || 0)}</Text>
          </View>
          <View style={[styles.calcLine, { backgroundColor: '#FEF3C7', padding: 6, borderRadius: 4, marginTop: 4 }]}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400E' }}>Total GST on Margin (18%):</Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400E' }}>{formatRupees(invoice.gst_amount || 0)}</Text>
          </View>

          {!isCustomerFacing ? (
            <View style={[styles.calcLine, { marginTop: 8 }]}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>Dealer Net Profit:</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#059669' }}>{formatRupees(invoice.net_profit)}</Text>
            </View>
          ) : null}

          <View style={[styles.calcLine, styles.finalAmountLine]}>
            <Text style={styles.finalLabel}>Final Selling Amount:</Text>
            <Text style={styles.finalVal}>{formatRupees(invoice.selling_amount)}</Text>
          </View>
          <Text style={styles.ruleFootnote}>
            * Rule 32(5): GST is levied on the margin only. Final selling amount is inclusive of margin tax.
          </Text>
        </Card>

        {invoice.notes ? (
          <Card style={styles.notesCard}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </Card>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.downloadActionBtn}
            onPress={handleDownload}
            disabled={downloading}
            activeOpacity={0.8}
          >
            {downloading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 8 }} />
                <Text style={styles.downloadActionText}>Generating & Downloading PDF...</Text>
              </View>
            ) : (
              <Text style={styles.downloadActionText}>📥 Download Bill PDF</Text>
            )}
          </TouchableOpacity>

          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={styles.shareActionBtn}
              onPress={handleShare}
              disabled={sharing}
              activeOpacity={0.8}
            >
              {sharing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={colors.primary} size="small" style={{ marginRight: 6 }} />
                  <Text style={styles.shareActionText}>Sharing...</Text>
                </View>
              ) : (
                <Text style={styles.shareActionText}>📤 Share</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.printActionBtn}
              onPress={handlePrint}
              activeOpacity={0.8}
            >
              <Text style={styles.printActionText}>🖨️ Print</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Actions */}
        <View style={styles.statusActionsRow}>
          {invoice.status !== 'paid' ? (
            <TouchableOpacity
              style={[styles.statusBtn, { borderColor: colors.success }]}
              onPress={() => handleStatusChange('paid')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.success} />
              ) : (
                <Text style={{ color: colors.success, fontWeight: '700', fontSize: 12 }}>Mark as Paid</Text>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.statusBtn, { borderColor: colors.danger }]}
            onPress={handleDelete}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 12 }}>Delete Bill</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary
  },
  businessHeaderCard: {
    alignItems: 'center',
    paddingVertical: 18,
    borderTopWidth: 4,
    borderTopColor: colors.primary
  },
  cardLogo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginBottom: 8,
    resizeMode: 'contain'
  },
  bizName: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  bizAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12
  },
  docTypeBadge: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 6
  },
  toggleLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#E2E8F0'
  },
  toggleBtnActive: {
    backgroundColor: colors.primary
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  toggleBtnTextActive: {
    color: '#FFFFFF'
  },
  infoCard: {
    marginBottom: 10
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  tableCard: {
    marginBottom: 10
  },
  tableTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase'
  },
  tableTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  modelToggleBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  modelToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  modelBreakdownBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingBottom: 8,
    borderRadius: 6
  },
  modelBreakdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  modelBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3
  },
  modelNameText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  modelQtyBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  tableRowHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
    marginBottom: 6
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase'
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  td: {
    fontSize: 13,
    color: colors.textPrimary
  },
  calcCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    marginBottom: 10
  },
  calcTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  calcLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3
  },
  calcLineLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  calcLineVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  boldLine: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    marginTop: 4
  },
  boldText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary
  },
  finalAmountLine: {
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 8
  },
  finalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary
  },
  finalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.primary
  },
  ruleFootnote: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic'
  },
  notesCard: {
    marginBottom: 10
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  notesText: {
    fontSize: 12,
    color: colors.textPrimary
  },
  actionsContainer: {
    marginVertical: 12,
    gap: 10
  },
  downloadActionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  downloadActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10
  },
  shareActionBtn: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '40'
  },
  shareActionText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13
  },
  printActionBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  printActionText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13
  },
  statusActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4
  },
  statusBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center'
  }
});
