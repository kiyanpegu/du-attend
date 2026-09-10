import { APP_COLORS } from '@/constants/duAttend';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  progress: number; // 0 to 100
  radius?: number;
  strokeWidth?: number;
  standing?: 'good' | 'warning' | 'critical' | 'none';
}

export function CircularProgress({ 
  progress, 
  radius = 60, 
  strokeWidth = 8,
  standing = 'good' 
}: CircularProgressProps) {
  const safeProgress = isNaN(progress) ? 0 : Math.min(100, Math.max(0, progress));
  
  let fillColor = APP_COLORS.success;
  if (standing === 'warning') fillColor = APP_COLORS.warning;
  if (standing === 'critical') fillColor = APP_COLORS.danger;
  
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <View style={{ width: radius * 2 + strokeWidth * 2, height: radius * 2 + strokeWidth * 2, alignItems: 'center', justifyContent: 'center' }}>
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
          originX={(radius * 2 + strokeWidth * 2) / 2}
          originY={(radius * 2 + strokeWidth * 2) / 2}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.valueText}>{safeProgress}%</Text>
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
    fontSize: 28,
    fontWeight: '800',
    color: APP_COLORS.text,
    fontVariant: ['tabular-nums'],
  },
});

