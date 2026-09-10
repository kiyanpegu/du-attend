import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { APP_COLORS } from '@/constants/duAttend';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: IconSymbolName;
  rightElement?: React.ReactNode;
  rightLabel?: React.ReactNode;
}

export function AppInput({ label, error, leftIcon, rightElement, rightLabel, style, ...props }: AppInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {(label || rightLabel) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {rightLabel && rightLabel}
        </View>
      )}
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIconWrapper}>
            <IconSymbol name={leftIcon} size={20} color={APP_COLORS.textMuted} />
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            isFocused ? styles.inputFocused : undefined,
            error ? styles.inputError : undefined,
            leftIcon ? { paddingLeft: 44 } : undefined,
            rightElement ? { paddingRight: 44 } : undefined,
            style,
          ]}
          placeholderTextColor={APP_COLORS.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          accessibilityLabel={label || props.placeholder}
          accessibilityState={{ disabled: props.editable === false }}
          {...props}
        />
        {rightElement && (
          <View style={styles.rightElementWrapper}>
            {rightElement}
          </View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: APP_COLORS.textSecondary,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  leftIconWrapper: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightElementWrapper: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  input: {
    backgroundColor: APP_COLORS.surfaceVariant, // Using surfaceVariant as surface is too dark if surface is Level 1, wait in Stitch bg-surface-container-high is #282a32. Let's use surfaceVariant.
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: APP_COLORS.text,
  },
  inputFocused: {
    borderColor: APP_COLORS.primary,
  },
  inputError: {
    borderColor: APP_COLORS.danger,
  },
  errorText: {
    color: APP_COLORS.danger,
    fontSize: 12,
    marginTop: 6,
  },
});
