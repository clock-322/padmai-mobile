import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = '#2F6FED',
  onPress,
  accessibilityLabel,
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[styles.container, { borderLeftColor: color }]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || `${title}: ${value}`}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {icon && <Text style={styles.icon}>{icon}</Text>}
        </View>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    width: '48%',
    minHeight: 110,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    minHeight: 22,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
    lineHeight: 18,
    marginRight: 6,
    letterSpacing: 0.2,
  },
  icon: {
    fontSize: 18,
    flexShrink: 0,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
    marginTop: 2,
  },
});

export default StatCard;
