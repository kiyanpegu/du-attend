import React from 'react';
import { StyleSheet, View, ViewStyle, DimensionValue } from 'react-native';
import { APP_COLORS } from '@/constants/duAttend';

interface ProgressBarProps {
  progress: number;
  standing?: 'good' | 'warning' | 'critical';
  style?: ViewStyle;
  height?: number;
}

export function ProgressBar({ progress, standing = 'good', style, height = 8 }: ProgressBarProps) {
  const safeProgress = isNaN(progress) ? 0 : Math.min(100, Math.max(0, progress));

  let fillColor = APP_COLORS.success;
  if (standing === 'warning') fillColor = APP_COLORS.warning;
  if (standing === 'critical') fillColor = APP_COLORS.danger;

  const trackColor = `${fillColor}20`;

  return (
    <View style={[styles.container, { height, backgroundColor: trackColor }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${safeProgress}%` as DimensionValue,
            backgroundColor: fillColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
