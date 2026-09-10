import { APP_COLORS } from '@/constants/duAttend';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function FilterChip({ label, selected = false, onPress, style }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.chipSelected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface FilterRowProps {
  filters: { id: string; label: string }[];
  selectedId?: string;
  onSelect: (id: string) => void;
  style?: ViewStyle;
}

export function FilterRow({ filters, selectedId, onSelect, style }: FilterRowProps) {
  return (
    <View style={[styles.row, style]}>
      {filters.map((filter) => (
        <FilterChip
          key={filter.id}
          label={filter.label}
          selected={selectedId === filter.id}
          onPress={() => onSelect(filter.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: APP_COLORS.surfaceVariant,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: APP_COLORS.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: APP_COLORS.textSecondary,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
});
