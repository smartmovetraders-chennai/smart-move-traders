import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { getSummaryReport } from '../services/api';
import { colors } from '../theme/colors';
import { formatRupees, formatDate } from '../utils/formatters';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setError(null);
      const res = await getSummaryReport();
      if (res.data && res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
          />
          <View>
            <Text style={styles.businessTitle}>SMART MOVE TRADERS</Text>
            <Text style={styles.businessSubtitle}>Wholesale Smartphone Billing • Rule 32(5)</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.newBillBtn}
          onPress={() => navigation.navigate('CreateBill')}
          activeOpacity={0.8}
        >
          <Text style={styles.newBillBtnText}>+ New Bill</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading financial dashboard...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Connection Notice</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchSummary}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Financial Overview</Text>
              <Text style={styles.sectionBadge}>GST Margin Scheme</Text>
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                label="Total Sales"
                value={formatRupees(summary?.totalSales || 0)}
                subtext={`${summary?.invoiceCount || 0} Lots Sold`}
                accentColor={colors.primary}
              />
              <StatCard
                label="Purchase Cost"
                value={formatRupees(summary?.totalPurchase || 0)}
                subtext="Total Inventory Cost"
                accentColor="#64748B"
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                label="Gross Profit"
                value={formatRupees(summary?.grossProfit || 0)}
                subtext={`${summary?.profitMarginPercent || 0}% Margin`}
                accentColor={summary?.grossProfit >= 0 ? colors.success : colors.danger}
              />
              <StatCard
                label="GST on Margin (18%)"
                value={formatRupees(summary?.totalGst || 0)}
                subtext={`CGST: ${formatRupees(summary?.totalCgst || 0)} | SGST: ${formatRupees(summary?.totalSgst || 0)}`}
                accentColor="#F59E0B"
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                label="Net Profit"
                value={formatRupees(summary?.netProfit || 0)}
                subtext="After 18% Tax on Margin"
                accentColor="#059669"
              />
              <StatCard
                label="Total Bills"
                value={String(summary?.invoiceCount || 0)}
                subtext="Invoices Recorded"
                accentColor="#4F46E5"
              />
            </View>

            {/* Rule 32(5) Highlight Card */}
            <Card style={styles.ruleCard}>
              <Text style={styles.ruleHeading}>Tax Scheme Note (CGST Rule 32(5))</Text>
              <Text style={styles.ruleText}>
                GST is charged at 18% strictly on the positive profit margin (Selling − Purchase). No tax is charged on zero/negative margin lots.
              </Text>
            </Card>

            {/* Recent Invoices */}
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Recent Invoices</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Invoices')}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            {(!summary?.recentInvoices || summary.recentInvoices.length === 0) ? (
              <EmptyState
                title="No Invoices Yet"
                description="Create your first wholesale smartphone bill to see real-time financials here."
                actionText="Create Bill"
                onAction={() => navigation.navigate('CreateBill')}
              />
            ) : (
              summary.recentInvoices.map((inv) => (
                <Card
                  key={inv.id}
                  onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: inv.id })}
                >
                  <View style={styles.invoiceRow}>
                    <View style={styles.invoiceLeft}>
                      <Text style={styles.clientName}>{inv.client_name || 'Counter Sale'}</Text>
                      <Text style={styles.invoiceMeta}>
                        {formatDate(inv.created_at)} • {inv.quantity} Devices • {inv.payment_method}
                      </Text>
                      {inv.invoice_number ? (
                        <Text style={styles.refText}>Ref: {inv.invoice_number}</Text>
                      ) : null}
                    </View>
                    <View style={styles.invoiceRight}>
                      <Text style={styles.sellingAmt}>{formatRupees(inv.selling_amount)}</Text>
                      <View style={styles.badgeWrap}>
                        <Badge status={inv.status} />
                      </View>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  headerLogo: {
    width: 42,
    height: 42,
    borderRadius: 8,
    marginRight: 10,
    resizeMode: 'contain'
  },
  businessTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5
  },
  businessSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  newBillBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  newBillBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 16,
    marginVertical: 16
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: 4
  },
  errorMsg: {
    fontSize: 13,
    color: '#991B1B',
    marginBottom: 12
  },
  retryBtn: {
    backgroundColor: colors.danger,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  ruleCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    marginTop: 6,
    marginBottom: 12
  },
  ruleHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  ruleText: {
    fontSize: 12,
    color: '#4338CA',
    lineHeight: 16
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  invoiceLeft: {
    flex: 1,
    marginRight: 12
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2
  },
  invoiceMeta: {
    fontSize: 12,
    color: colors.textSecondary
  },
  refText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  invoiceRight: {
    alignItems: 'flex-end'
  },
  sellingAmt: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4
  },
  badgeWrap: {
    alignSelf: 'flex-end'
  }
});
