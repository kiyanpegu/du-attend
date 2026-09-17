import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as Updates from 'expo-updates';

export interface AppUpdateStatus {
  isAvailable: boolean;
  type: 'ota' | 'apk' | 'none';
  version?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  message: string;
}

const GITHUB_REPO_LATEST_RELEASE_API =
  'https://api.github.com/repos/kiyanpegu/du-attend/releases/latest';

export const updateService = {
  getCurrentVersion(): string {
    return Constants.expoConfig?.version ?? '1.2.1';
  },

  getRuntimeVersion(): string {
    return String(Constants.expoConfig?.runtimeVersion ?? 'appVersion');
  },

  isOtaEnabled(): boolean {
    return Updates.isEnabled;
  },

  getUpdateId(): string | null {
    return Updates.updateId ?? null;
  },

  getChannel(): string | null {
    return Updates.channel ?? null;
  },

  /**
   * Check for updates: First checks EAS Over-The-Air (OTA) update if running in production/preview binary,
   * then falls back to GitHub releases check for direct APK downloads.
   */
  async checkForUpdate(): Promise<AppUpdateStatus> {
    const currentVersion = this.getCurrentVersion();

    // 1. Try EAS Over-The-Air (OTA) update if enabled in native binary
    if (Updates.isEnabled) {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          return {
            isAvailable: true,
            type: 'ota',
            version: currentVersion,
            message: 'New Over-The-Air update available. Ready to install without reinstalling the APK.',
          };
        }
      } catch (err) {
        // Fall through to remote release check if OTA check fails or offline
        console.warn('OTA update check notice:', err);
      }
    }

    // 2. Fallback check for remote GitHub Release APK
    try {
      const response = await fetch(GITHUB_REPO_LATEST_RELEASE_API, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const latestTag: string = (data.tag_name ?? '').replace(/^v/, '');
        const releaseNotes: string = data.body ?? 'Latest improvements and bug fixes.';
        const apkAsset = Array.isArray(data.assets)
          ? data.assets.find((a: { name?: string }) => a.name?.endsWith('.apk'))
          : null;

        const downloadUrl: string = apkAsset?.browser_download_url ?? data.html_url ?? '';

        if (latestTag && this.compareVersions(latestTag, currentVersion) > 0) {
          return {
            isAvailable: true,
            type: 'apk',
            version: latestTag,
            releaseNotes,
            downloadUrl,
            message: `New version v${latestTag} is available for download.`,
          };
        }
      }
    } catch {
      // Offline or GitHub rate limit reached; keep graceful
    }

    return {
      isAvailable: false,
      type: 'none',
      version: currentVersion,
      message: `You are running the latest version (v${currentVersion}).`,
    };
  },

  /**
   * Compare two semantic version strings (e.g., "1.1.0" vs "1.0.0")
   * Returns:
   *   1 if v1 > v2
   *  -1 if v1 < v2
   *   0 if equal
   */
  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map((p) => parseInt(p, 10) || 0);
    const parts2 = v2.split('.').map((p) => parseInt(p, 10) || 0);
    const maxLen = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLen; i++) {
      const n1 = parts1[i] ?? 0;
      const n2 = parts2[i] ?? 0;
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }
    return 0;
  },

  /**
   * Apply an update:
   * - For OTA: Fetches update package and reloads the app immediately.
   * - For APK / External: Opens the direct download URL in the device browser/installer.
   */
  async applyUpdate(status: AppUpdateStatus): Promise<{ ok: boolean; message: string }> {
    if (status.type === 'ota' && Updates.isEnabled) {
      try {
        const fetchResult = await Updates.fetchUpdateAsync();
        if (fetchResult.isNew) {
          await Updates.reloadAsync();
          return { ok: true, message: 'Update downloaded and applied.' };
        }
        return { ok: false, message: 'No new update file found.' };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to apply update.';
        return { ok: false, message: msg };
      }
    }

    if (status.downloadUrl) {
      try {
        await Linking.openURL(status.downloadUrl);
        return { ok: true, message: 'Opening download link...' };
      } catch {
        return { ok: false, message: 'Failed to open download link.' };
      }
    }

    return { ok: false, message: 'No update download available.' };
  },
};

