import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { getApiBaseUrl, setApiBaseUrl, getHealth } from '../services/api';
import { colors } from '../theme/colors';
import Card from '../components/Card';

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const handleSaveUrl = () => {
    setApiBaseUrl(apiUrl);
    Alert.alert('Saved', 'API Base URL updated.');
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setConnectionStatus(null);
      setApiBaseUrl(apiUrl);
      const res = await getHealth();
      if (res.data && res.data.status === 'ok') {
        setConnectionStatus({
          success: true,
          message: `Connected to ${res.data.business} API successfully.`
        });
      }
    } catch (err) {
      setConnectionStatus({
        success: false,
        message: err.message || 'Connection failed. Ensure backend server is running.'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings & Business Info</Text>
          <Text style={styles.subtitle}>Smart Move Traders • Application Configuration</Text>
        </View>

        {/* Registered Business Profile */}
        <Card style={styles.profileCard}>
          <Text style={styles.cardHeader}>Business Identity</Text>

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
            <Text style={styles.fieldLabel}>GSTIN:</Text>
            <Text style={[styles.fieldValue, { color: colors.textMuted }]}>
              (Pending GST partner confirmation)
            </Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Default HSN Code:</Text>
            <Text style={styles.fieldValue}>8517 (Smartphones)</Text>
          </View>
        </Card>

        {/* Backend Connection Settings */}
        <Card style={styles.apiCard}>
          <Text style={styles.cardHeader}>Backend API Connection</Text>
          <Text style={styles.fieldDesc}>
            Configure the local or production Express server URL:
          </Text>

          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://localhost:4000/api"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.apiBtnRow}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveUrl}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save URL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={testing}
              activeOpacity={0.8}
            >
              {testing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.testBtnText}>Test Connection</Text>
              )}
            </TouchableOpacity>
          </View>

          {connectionStatus ? (
            <View
              style={[
                styles.statusBox,
                connectionStatus.success ? styles.statusSuccess : styles.statusError
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  connectionStatus.success ? styles.statusTextSuccess : styles.statusTextError
                ]}
              >
                {connectionStatus.message}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Statutory Scheme Notes */}
        <Card style={styles.notesCard}>
          <Text style={styles.cardHeader}>Statutory Margin Scheme (Rule 32(5))</Text>
          <Text style={styles.noteText}>
            • <Text style={styles.bold}>Tax Basis:</Text> GST is charged at 18% strictly on the positive profit margin (Selling Price − Purchase Cost).
          </Text>
          <Text style={styles.noteText}>
            • <Text style={styles.bold}>Intra-State Split:</Text> 9% CGST and 9% SGST.
          </Text>
          <Text style={styles.noteText}>
            • <Text style={styles.bold}>Zero/Negative Margins:</Text> If goods are sold at cost or at a loss, GST is ₹0.
          </Text>
          <Text style={styles.noteText}>
            • <Text style={styles.bold}>Turnover Protection:</Text> GST is never levied on the total selling turnover.
          </Text>
          <Text style={styles.noteText}>
            • <Text style={styles.bold}>Input Tax Credit:</Text> No ITC claimed on purchased second-hand lots.
          </Text>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Smart Move Traders Billing App v1.0.0 (JavaScript Edition)</Text>
          <Text style={styles.versionSubtext}>Built with Expo, Node.js, Express & Supabase</Text>
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
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  profileCard: {
    marginBottom: 14
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1.5,
    textAlign: 'right'
  },
  addressText: {
    lineHeight: 18
  },
  apiCard: {
    marginBottom: 14
  },
  fieldDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 10
  },
  apiBtnRow: {
    flexDirection: 'row',
    gap: 10
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  testBtn: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  testBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13
  },
  statusBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1
  },
  statusSuccess: {
    backgroundColor: colors.successLight,
    borderColor: '#A7F3D0'
  },
  statusError: {
    backgroundColor: colors.dangerLight,
    borderColor: '#FECACA'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  statusTextSuccess: {
    color: '#065F46'
  },
  statusTextError: {
    color: colors.danger
  },
  notesCard: {
    backgroundColor: '#F8FAFC',
    borderColor: colors.border,
    marginBottom: 16
  },
  noteText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary
  },
  footer: {
    alignItems: 'center',
    marginTop: 10
  },
  versionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  versionSubtext: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
  }
});
