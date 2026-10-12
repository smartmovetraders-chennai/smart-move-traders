import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function StatCard({ label, value, subtext, accentColor = colors.primary }) {
  return (
    <View style={styles.card}>
      <View style={[styles.accentIndicator, { backgroundColor: accentColor }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginVertical: 4,
    flex: 1,
    minWidth: '46%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1
  },
  accentIndicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
    marginBottom: 8
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 4
  },
  subtext: {
    fontSize: 11,
    color: colors.textMuted
  }
});
