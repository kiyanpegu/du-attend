import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  progress: number; // 0 to 100
  radius?: number;
  strokeWidth?: number;
  standing?: 'good' | 'warning' | 'critical' | 'none';
  centerContent?: 'icon' | 'value' | 'none';
  showValue?: boolean;
  children?: React.ReactNode;
}

export function CircularProgress({ 
  progress, 
  radius = 60, 
  strokeWidth = 8,
  standing = 'good',
  centerContent = 'icon',
  showValue,
  children,
}: CircularProgressProps) {
  const safeProgress = isNaN(progress) ? 0 : Math.min(100, Math.max(0, progress));
  
  let fillColor = APP_COLORS.safeText;
  if (standing === 'warning') fillColor = APP_COLORS.attentionText;
  if (standing === 'critical') fillColor = APP_COLORS.shortageText;
  if (standing === 'none') fillColor = APP_COLORS.textMuted;
  
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;
  const size = radius * 2 + strokeWidth * 2;
  const centerSize = Math.max(0, radius * 2 - strokeWidth);

  const resolvedCenter = showValue !== undefined ? (showValue ? 'value' : 'none') : centerContent;

  const renderCenter = () => {
    if (children) return children;
    if (resolvedCenter === 'none') return null;

    if (resolvedCenter === 'icon') {
      const iconName =
        standing === 'good'
          ? 'checkmark'
          : standing === 'warning'
          ? 'exclamationmark.triangle.fill'
          : standing === 'critical'
          ? 'exclamationmark.circle.fill'
          : 'minus';
      const iconSize = Math.round(radius * 0.62);

      return (
        <IconSymbol
          size={iconSize}
          name={iconName}
          color={fillColor}
        />
      );
    }

    const valueFontSize = Math.max(10, Math.round(radius * 0.36));
    return (
      <Text
        style={[styles.valueText, { fontSize: valueFontSize }]}
        numberOfLines={1}
      >
        {safeProgress}%
      </Text>
    );
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg style={StyleSheet.absoluteFill}>
        {/* Track */}
        <Circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={`${fillColor}20`}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress */}
        <Circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={[styles.textContainer, { width: centerSize, height: centerSize }]}>
        {renderCenter()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontWeight: '800',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});

