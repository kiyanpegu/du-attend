import { AppButton } from '@/components/app/AppButton';
import { AppScreen } from '@/components/app/AppScreen';
import { Card } from '@/components/app/Card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { APP_COLORS, APP_IDENTITY, TOKENS, TYPOGRAPHY } from '@/constants/duAttend';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <AppScreen>
      <Stack.Screen options={{ title: 'Not Found', headerShown: false }} />
      <View style={styles.container}>
        <Card style={styles.card} padded={false}>
          <View style={styles.cardContent}>
            <View style={styles.iconBox}>
              <IconSymbol size={36} name="exclamationmark.triangle.fill" color={APP_COLORS.secondaryWarm} />
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>ERROR 404</Text>
            </View>

            <Text style={styles.title}>Screen Not Found</Text>
            <Text style={styles.subtitle}>
              The requested view does not exist or has been relocated within the DU Attend portal.
            </Text>

            <AppButton
              title="Return to Welcome Portal"
              onPress={() => router.replace('/' as never)}
              variant="primary"
              size="large"
              style={styles.button}
            />
          </View>
        </Card>

        <Text style={styles.footerText}>
          {APP_IDENTITY.name} • {APP_IDENTITY.university}
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: TOKENS.spacing.xxxl,
    paddingHorizontal: TOKENS.spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: APP_COLORS.surface,
    borderRadius: TOKENS.rounded.card,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    overflow: 'hidden',
    ...TOKENS.shadows.subtle,
  },
  cardContent: {
    padding: TOKENS.spacing.xl,
    alignItems: 'center',
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: APP_COLORS.attentionBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 161, 51, 0.25)',
  },
  badge: {
    backgroundColor: APP_COLORS.subSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.rounded.full,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: APP_COLORS.obsidian,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: APP_COLORS.text,
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.bodySecondary,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  button: {
    width: '100%',
  },
  footerText: {
    fontSize: 11,
    color: APP_COLORS.textMuted,
    marginTop: 24,
    textAlign: 'center',
  },
});
