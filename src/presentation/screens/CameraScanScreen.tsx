import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ColorTheme, RADIUS, SPACING, TYPOGRAPHY } from '../../core/constants/theme';
import { useTheme } from '../../core/theme/useTheme';
import { useHealthStore } from '../state/useHealthStore';
import { CameraOverlay } from '../components/CameraOverlay';
import { VerificationModal } from '../components/VerificationModal';
import { useTranslation } from '../../core/i18n/useTranslation';

import { geminiVisionFallback } from '../../data/services/GeminiVisionFallbackService';
import { TextInput, Modal } from 'react-native';

export const CameraScanScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(geminiVisionFallback.getApiKey());
  const cameraRef = useRef<any>(null);

  const {
    activeTab,
    setActiveTab,
    forcedScanMode,
    setForcedScanMode,
    isProcessingOcr,
    processCapturedImage,
    verification,
    updateVerificationField,
    confirmAndSaveVerification,
    dismissVerification,
    isLoading,
  } = useHealthStore();

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessingOcr) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (photo && photo.uri) {
        await processCapturedImage(photo.uri, photo.width, photo.height);
      }
    } catch (err: any) {
      console.error('Failed to take picture:', err);
      Alert.alert('Capture Error', 'Could not capture photo. Please try again.');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processCapturedImage(asset.uri, asset.width, asset.height);
      }
    } catch (err: any) {
      console.error('Failed to pick image from gallery:', err);
      Alert.alert('Import Error', 'Could not load photo from gallery.');
    }
  };

  const handleSaveApiKey = () => {
    geminiVisionFallback.setApiKey(geminiKeyInput.trim());
    setSettingsVisible(false);
    Alert.alert('Saved', 'Gemini Vision AI configuration updated.');
  };

  // If permissions not yet granted
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>{t.camera.permissionTitle}</Text>
          <Text style={styles.permissionBody}>
            {t.camera.permissionBody}
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantButtonText}>{t.camera.grantAccess}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => setActiveTab('dashboard')}>
            <Text style={styles.backButtonText}>{t.camera.returnDashboard}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
      />

      {/* Viewfinder Overlay HUD */}
      <CameraOverlay
        deviceMode={forcedScanMode}
        onSelectMode={setForcedScanMode}
        torchOn={torchOn}
        onToggleTorch={() => setTorchOn(!torchOn)}
        onCapture={handleCapture}
        onPickImage={handlePickImage}
        onClose={() => setActiveTab('dashboard')}
        isProcessing={isProcessingOcr}
        onOpenSettings={() => {
          setGeminiKeyInput(geminiVisionFallback.getApiKey());
          setSettingsVisible(true);
        }}
      />

      {/* OCR Processing HUD Overlay */}
      {isProcessingOcr && (
        <View style={styles.processingHud}>
          <View style={styles.hudCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.hudTitle}>{t.camera.analyzingTitle}</Text>
            <Text style={styles.hudSubtitle}>
              {t.camera.analyzingSubtitle}
            </Text>
          </View>
        </View>
      )}

      {/* Gemini Vision Settings Modal */}
      <Modal visible={settingsVisible} transparent animationType="fade" onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>{t.camera.apiKeyTitle}</Text>
            <Text style={styles.settingsDesc}>{t.camera.apiKeyDesc}</Text>
            <TextInput
              style={styles.keyInput}
              placeholder={t.camera.apiKeyPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={geminiKeyInput}
              onChangeText={setGeminiKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <View style={styles.settingsBtnRow}>
              <TouchableOpacity style={styles.settingsCancelBtn} onPress={() => setSettingsVisible(false)}>
                <Text style={styles.settingsCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsSaveBtn} onPress={handleSaveApiKey}>
                <Text style={styles.settingsSaveText}>{t.camera.saveKey}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verification Modal */}
      <VerificationModal
        verification={verification}
        onUpdateField={updateVerificationField}
        onConfirm={confirmAndSaveVerification}
        onDismiss={dismissVerification}
        isLoading={isLoading}
      />
    </View>
  );
};

const getStyles = (colors: ColorTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    centerContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    permissionContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
    },
    permissionCard: {
      backgroundColor: colors.surface,
      padding: SPACING.xl,
      borderRadius: RADIUS.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    permissionIcon: {
      fontSize: 48,
      marginBottom: SPACING.md,
    },
    permissionTitle: {
      fontSize: TYPOGRAPHY.fontSizes.lg,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: SPACING.sm,
    },
    permissionBody: {
      fontSize: TYPOGRAPHY.fontSizes.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: SPACING.lg,
    },
    grantButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: RADIUS.md,
      width: '100%',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    grantButtonText: {
      color: '#FFFFFF',
      fontSize: TYPOGRAPHY.fontSizes.md,
      fontWeight: '700',
    },
    backButton: {
      paddingVertical: 10,
      alignItems: 'center',
    },
    backButtonText: {
      color: colors.textSecondary,
      fontSize: TYPOGRAPHY.fontSizes.sm,
      fontWeight: '600',
    },
    processingHud: {
      ...StyleSheet.absoluteFill,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(15, 23, 42, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 50,
    },
    hudCard: {
      backgroundColor: colors.surface,
      padding: SPACING.xl,
      borderRadius: RADIUS.lg,
      alignItems: 'center',
      width: '80%',
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.surfaceBorder,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    hudTitle: {
      fontSize: TYPOGRAPHY.fontSizes.md,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: SPACING.md,
      marginBottom: 4,
    },
    hudSubtitle: {
      fontSize: TYPOGRAPHY.fontSizes.xs,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    settingsOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.lg,
    },
    settingsCard: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.xl,
      width: '100%',
      maxWidth: 380,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    settingsTitle: {
      fontSize: TYPOGRAPHY.fontSizes.lg,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: SPACING.xs,
    },
    settingsDesc: {
      fontSize: TYPOGRAPHY.fontSizes.xs,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: SPACING.md,
    },
    keyInput: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      fontSize: TYPOGRAPHY.fontSizes.sm,
      color: colors.textPrimary,
      marginBottom: SPACING.md,
    },
    settingsBtnRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: SPACING.sm,
    },
    settingsCancelBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surfaceSubtle,
    },
    settingsCancelText: {
      fontSize: TYPOGRAPHY.fontSizes.sm,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    settingsSaveBtn: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: RADIUS.md,
      backgroundColor: colors.primary,
    },
    settingsSaveText: {
      fontSize: TYPOGRAPHY.fontSizes.sm,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
