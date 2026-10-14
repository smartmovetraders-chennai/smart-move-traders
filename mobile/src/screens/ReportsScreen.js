import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { getSummaryReport, getMonthlyReport } from '../services/api';
import { colors } from '../theme/colors';
import { formatRupees } from '../utils/formatters';
import StatCard from '../components/StatCard';
import Card from '../components/Card';

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [showModels, setShowModels] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const [sumRes, monRes] = await Promise.all([
        getSummaryReport(),
        getMonthlyReport()
      ]);
      if (sumRes.data?.success) setSummary(sumRes.data.data);
      if (monRes.data?.success) setMonthly(monRes.data.data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Compiling GST & financial reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Financial Reports</Text>
          <Text style={styles.subtitle}>Smart Move Traders • GST Margin Scheme Analytics</Text>
        </View>

        {/* Aggregated Totals */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Turnover"
            value={formatRupees(summary?.totalSales || 0)}
            subtext="Gross wholesale sales"
            accentColor={colors.primary}
          />
          <StatCard
            label="Inventory Cost"
            value={formatRupees(summary?.totalPurchase || 0)}
            subtext="Total phones bought"
            accentColor="#64748B"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Gross Margin"
            value={formatRupees(summary?.grossProfit || 0)}
            subtext={`${summary?.profitMarginPercent || 0}% overall profit rate`}
            accentColor={summary?.grossProfit >= 0 ? colors.success : colors.danger}
          />
          <StatCard
            label="Net Profit"
            value={formatRupees(summary?.netProfit || 0)}
            subtext="After margin GST"
            accentColor="#059669"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Total Quantity"
            value={`${summary?.totalQuantity || summary?.invoiceCount || 0} Phones`}
            subtext={`${summary?.invoiceCount || 0} Lots Recorded`}
            accentColor="#4F46E5"
          />
        </View>

        {/* Total Quantity & Model Breakdown Section */}
        {summary?.modelBreakdown && summary.modelBreakdown.length > 0 ? (
          <Card style={styles.modelSummaryCard}>
            <View style={styles.modelSummaryHeaderRow}>
              <View>
                <Text style={styles.modelSummaryTitle}>Quantity by Model</Text>
                <Text style={styles.modelSummarySubtitle}>{summary?.totalQuantity || 0} Total Units Sold</Text>
              </View>
              <TouchableOpacity
                style={styles.modelSummaryToggleBtn}
                onPress={() => setShowModels(!showModels)}
                activeOpacity={0.7}
              >
                <Text style={styles.modelSummaryToggleText}>
                  {showModels ? 'Hide Models ▲' : 'Show Models ▼'}
                </Text>
              </TouchableOpacity>
            </View>

            {showModels ? (
              <View style={styles.modelSummaryList}>
                {summary.modelBreakdown.map((item, idx) => (
                  <View key={idx} style={styles.modelSummaryItem}>
                    <Text style={styles.modelSummaryName}>• {item.model}</Text>
                    <Text style={styles.modelSummaryQty}>{item.quantity} Qty</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        ) : null}

        {/* GST Tax Compliance Card */}
        <Card style={styles.taxSummaryCard}>
          <Text style={styles.cardTitle}>GST Compliance Summary (Rule 32(5))</Text>

          <View style={styles.taxLine}>
            <Text style={styles.taxLabel}>Total GST Collected on Margins:</Text>
            <Text style={styles.taxVal}>{formatRupees(summary?.totalGst || 0)}</Text>
          </View>
          <View style={styles.taxLine}>
            <Text style={styles.taxLabel}>Intra-State CGST (9%):</Text>
            <Text style={styles.taxVal}>{formatRupees(summary?.totalCgst || 0)}</Text>
          </View>
          <View style={styles.taxLine}>
            <Text style={styles.taxLabel}>Intra-State SGST (9%):</Text>
            <Text style={styles.taxVal}>{formatRupees(summary?.totalSgst || 0)}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.taxNotice}>
            • Margin scheme transactions do not incur 18% tax on full turnover, protecting dealer margins from double-taxation.
          </Text>
        </Card>

        {/* Monthly Performance */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Performance</Text>
        </View>

        {monthly.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No monthly history recorded yet.</Text>
          </Card>
        ) : (
          monthly.map((m) => (
            <Card key={m.month} style={styles.monthCard}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthName}>{m.month}</Text>
                <Text style={styles.monthLots}>{m.invoiceCount} Wholesale Lots</Text>
              </View>
              <View style={styles.monthGrid}>
                <View style={styles.monthCol}>
                  <Text style={styles.monthLabel}>Sales</Text>
                  <Text style={styles.monthVal}>{formatRupees(m.totalSales)}</Text>
                </View>
                <View style={styles.monthCol}>
                  <Text style={styles.monthLabel}>Margin</Text>
                  <Text style={[styles.monthVal, { color: colors.success }]}>{formatRupees(m.grossProfit)}</Text>
                </View>
                <View style={styles.monthCol}>
                  <Text style={styles.monthLabel}>GST Paid</Text>
                  <Text style={[styles.monthVal, { color: '#D97706' }]}>{formatRupees(m.totalGst)}</Text>
                </View>
                <View style={styles.monthCol}>
                  <Text style={styles.monthLabel}>Net Profit</Text>
                  <Text style={[styles.monthVal, { color: '#059669', fontWeight: '800' }]}>{formatRupees(m.netProfit)}</Text>
                </View>
              </View>
            </Card>
          ))
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
  scrollContent: {
    padding: 16,
    paddingBottom: 36
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
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  taxSummaryCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    marginVertical: 10
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  taxLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4
  },
  taxLabel: {
    fontSize: 12,
    color: '#78350F'
  },
  taxVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E'
  },
  divider: {
    height: 1,
    backgroundColor: '#FDE68A',
    marginVertical: 8
  },
  taxNotice: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16
  },
  sectionHeader: {
    marginTop: 14,
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted
  },
  monthCard: {
    marginBottom: 10,
    padding: 14
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 6
  },
  monthName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary
  },
  monthLots: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  monthGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  monthCol: {
    flex: 1
  },
  monthLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase'
  },
  monthVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2
  },
  modelSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    marginBottom: 10
  },
  modelSummaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modelSummaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase'
  },
  modelSummarySubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  modelSummaryToggleBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  modelSummaryToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  modelSummaryList: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  modelSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  modelSummaryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  modelSummaryQty: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  }
});
