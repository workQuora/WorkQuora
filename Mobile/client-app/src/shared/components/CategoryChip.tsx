import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

interface CategoryChipProps {
  label: string;
  icon?: string;
  active?: boolean;
  onPress?: () => void;
}

export default function CategoryChip({ label, icon, active = false, onPress }: CategoryChipProps) {
  const { colors, isClient } = useTheme();

  const activeBg = isClient ? colors.primary : colors.accent;
  const activeText = isClient ? colors.white : colors.primary;
  const activeBorder = isClient ? colors.primary : colors.secondary;

  const inactiveBg = colors.card;
  const inactiveText = colors.textMuted;
  const inactiveBorder = colors.border;

  const bg = active ? activeBg : inactiveBg;
  const textColor = active ? activeText : inactiveText;
  const borderColor = active ? activeBorder : inactiveBorder;

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: borderColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && (
        <Feather
          name={icon as any}
          size={14}
          color={textColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
