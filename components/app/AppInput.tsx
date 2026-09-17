import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { APP_COLORS, TOKENS } from '@/constants/duAttend';
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
  const isDisabled = props.editable === false;

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
            <IconSymbol 
              name={leftIcon} 
              size={18} 
              color={isFocused ? APP_COLORS.text : APP_COLORS.textMuted} 
            />
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            error && styles.inputError,
            isDisabled && styles.inputDisabled,
            leftIcon ? { paddingLeft: 42 } : undefined,
            rightElement ? { paddingRight: 42 } : undefined,
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
          accessibilityState={{ disabled: isDisabled }}
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
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: APP_COLORS.text,
    letterSpacing: 0.1,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  leftIconWrapper: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  rightElementWrapper: {
    position: 'absolute',
    right: 14,
    zIndex: 1,
  },
  input: {
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1.5,
    borderColor: APP_COLORS.border,
    borderRadius: TOKENS.rounded.md,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: APP_COLORS.text,
  },
  inputFocused: {
    borderColor: APP_COLORS.obsidian,
    backgroundColor: '#FFFFFF',
    shadowColor: '#101426',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: {
    borderColor: APP_COLORS.shortageText,
    backgroundColor: APP_COLORS.shortageBg,
  },
  inputDisabled: {
    backgroundColor: APP_COLORS.subSurface,
    color: APP_COLORS.textMuted,
    borderColor: 'transparent',
  },
  errorText: {
    color: APP_COLORS.shortageText,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
});
