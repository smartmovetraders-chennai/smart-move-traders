import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions
} from 'react-native';
import { colors } from '../theme/colors';
import Card from '../components/Card';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Card */}
        <View style={styles.brandHero}>
          <View style={styles.logoFrame}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.heroTitle}>SMART MOVE TRADERS</Text>
          <Text style={styles.heroSubtitle}>Wholesale Smartphone Billing System</Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>GST Rule 32(5) Margin Scheme</Text>
          </View>
        </View>

        {/* Registered Enterprise Info */}
        <Card style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderIcon}>🏢</Text>
            <Text style={styles.cardHeader}>Business Identity</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Business Name:</Text>
            <Text style={styles.fieldValue}>Smart Move Traders</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Registered Address:</Text>
            <Text style={[styles.fieldValue, styles.addressText]}>
              Plot 8, GF, Bharathiyar Street,{'\n'}
              Maruthi Nagar, Phase 1,{'\n'}
              Thundalam,{'\n'}
              Chennai - 600077
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>State & Jurisdiction:</Text>
            <Text style={styles.fieldValue}>Tamil Nadu (State Code: 33)</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Primary Trade Goods:</Text>
            <Text style={styles.fieldValue}>Pre-Owned Wholesale Smartphones</Text>
          </View>

          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>HSN Classification:</Text>
            <Text style={styles.fieldValue}>8517 (Cellular Telephones)</Text>
          </View>
        </Card>

        {/* Tax Scheme & Billing Compliance */}
        <Card style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderIcon}>⚖️</Text>
            <Text style={styles.cardHeader}>Taxation & Scheme Compliance</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Statutory Valuation Scheme:</Text>
            <Text style={styles.fieldValue}>Rule 32(5) of CGST Rules, 2017</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Tax Base:</Text>
            <Text style={styles.fieldValue}>Positive Margin Only (Selling − Purchase)</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Standard Margin GST Rate:</Text>
            <Text style={styles.fieldValue}>18% (9% CGST + 9% SGST)</Text>
          </View>

          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Invoice Format:</Text>
            <Text style={styles.fieldValue}>Single Grand Total Tax Invoice</Text>
          </View>
        </Card>

        {/* System & Application Details */}
        <Card style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderIcon}>📱</Text>
            <Text style={styles.cardHeader}>Application Details</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Application Edition:</Text>
            <Text style={styles.fieldValue}>Enterprise Production Edition</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Software Version:</Text>
            <Text style={styles.fieldValue}>v1.0.0 (Lifetime License)</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Data Synchronization:</Text>
            <Text style={[styles.fieldValue, { color: colors.success, fontWeight: '700' }]}>
              🟢 Real-Time Cloud Sync
            </Text>
          </View>

          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>PDF Bill Generator:</Text>
            <Text style={styles.fieldValue}>Integrated WhatsApp & Print Engine</Text>
          </View>
        </Card>

        {/* Copyright Footer */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerText}>© 2026 Smart Move Traders. All rights reserved.</Text>
          <Text style={styles.footerSubtext}>Dedicated Enterprise Mobile Billing Platform</Text>
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
    paddingBottom: 50
  },
  brandHero: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  logoFrame: {
    width: 84,
    height: 84,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  heroLogo: {
    width: 76,
    height: 76,
    borderRadius: 14
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1.2
  },
  heroSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    fontWeight: '600'
  },
  badgePill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)'
  },
  badgeText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700'
  },
  infoCard: {
    marginBottom: 14,
    padding: 16,
    backgroundColor: '#FFFFFF'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  cardHeaderIcon: {
    fontSize: 16,
    marginRight: 8
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1.1,
    fontWeight: '500'
  },
  fieldValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1.4,
    textAlign: 'right'
  },
  addressText: {
    lineHeight: 18
  },
  footerWrap: {
    alignItems: 'center',
    paddingVertical: 16
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600'
  },
  footerSubtext: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
  }
});
