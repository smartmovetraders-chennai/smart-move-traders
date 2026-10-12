import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { getInvoices } from '../services/api';
import { colors } from '../theme/colors';
import { formatRupees, formatDate } from '../utils/formatters';
import Card from '../components/Card';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

const STATUS_FILTERS = ['all', 'issued', 'paid', 'draft'];

export default function InvoiceListScreen({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchInvoices = useCallback(async () => {
    try {
      const params = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const res = await getInvoices(params);
      if (res.data && res.data.success) {
        setInvoices(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus, search]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const renderItem = ({ item }) => (
    <Card
      style={styles.invoiceCard}
      onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.clientName}>{item.client_name || 'Counter Sale'}</Text>
          <Text style={styles.invoiceDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Badge status={item.status} />
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBody}>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>Lot Quantity</Text>
          <Text style={styles.metricValue}>{item.quantity} Phones</Text>
        </View>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>Payment</Text>
          <Text style={styles.metricValue}>{item.payment_method}</Text>
        </View>
        <View style={[styles.metricCol, styles.alignRight]}>
          <Text style={styles.metricLabel}>Selling Amount</Text>
          <Text style={styles.amountValue}>{formatRupees(item.selling_amount)}</Text>
        </View>
      </View>

      <View style={styles.marginRow}>
        <Text style={styles.marginText}>
          Margin: <Text style={{ fontWeight: '700', color: item.profit_amount >= 0 ? colors.success : colors.danger }}>{formatRupees(item.profit_amount)}</Text>
          {'  '}•{'  '}
          GST: <Text style={{ fontWeight: '700', color: '#D97706' }}>{formatRupees(item.gst_amount)}</Text>
        </Text>
        {item.invoice_number ? (
          <Text style={styles.refBadge}>Ref: {item.invoice_number}</Text>
        ) : null}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer name or reference..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchInvoices}
          returnKeyType="search"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersBar}>
        {STATUS_FILTERS.map((st) => {
          const isActive = selectedStatus === st;
          return (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedStatus(st)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {st.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading invoices...</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              title="No Invoices Found"
              description={search ? "No bills match your current search criteria." : "Create your first bill to see it listed here."}
              actionText={search ? "Clear Search" : "Create Bill"}
              onAction={() => {
                if (search) {
                  setSearch('');
                  setSelectedStatus('all');
                } else {
                  navigation.navigate('CreateBill');
                }
              }}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.card
  },
  searchInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary
  },
  filtersBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9'
  },
  filterChipActive: {
    backgroundColor: colors.primary
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  filterChipTextActive: {
    color: '#FFFFFF'
  },
  listContent: {
    padding: 16,
    paddingBottom: 32
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary
  },
  invoiceCard: {
    padding: 14,
    marginBottom: 10
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    flex: 1
  },
  clientName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary
  },
  invoiceDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  metricCol: {
    flex: 1
  },
  alignRight: {
    alignItems: 'flex-end'
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase'
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2
  },
  marginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 6,
    marginTop: 4
  },
  marginText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  refBadge: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600'
  }
});
