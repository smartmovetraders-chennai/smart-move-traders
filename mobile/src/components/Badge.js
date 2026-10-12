import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const statusConfig = {
  draft: { label: 'Draft', bg: '#F1F5F9', text: '#475569' },
  issued: { label: 'Issued', bg: '#EFF6FF', text: '#2563EB' },
  paid: { label: 'Paid', bg: '#ECFDF5', text: '#059669' },
  void: { label: 'Void', bg: '#FEF2F2', text: '#DC2626' }
};

export default function Badge({ status, text, color, bg }) {
  const conf = statusConfig[status] || { label: text || status, bg: bg || colors.primaryLight, text: color || colors.primary };

  return (
    <View style={[styles.badge, { backgroundColor: conf.bg }]}>
      <Text style={[styles.text, { color: conf.text }]}>{conf.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
});
