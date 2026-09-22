import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../core/constants/theme';
import { DeviceType } from '../../domain/models/HealthRecord';
import { useTranslation } from '../../core/i18n/useTranslation';

interface CameraOverlayProps {
  deviceMode: DeviceType | 'AUTO';
  onSelectMode: (mode: DeviceType | 'AUTO') => void;
  torchOn: boolean;
  onToggleTorch: () => void;
  onCapture: () => void;
  onPickImage: () => void;
  onClose: () => void;
  isProcessing: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIEWFINDER_WIDTH = SCREEN_WIDTH * 0.85;
const VIEWFINDER_HEIGHT = SCREEN_WIDTH * 0.70; // 4:3 LCD screen ratio

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  deviceMode,
  onSelectMode,
  torchOn,
  onToggleTorch,
  onCapture,
  onPickImage,
  onClose,
  isProcessing,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top Bar with Mode Selector and Flash */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={onClose}>
          <Text style={styles.iconText}>✕</Text>
        </TouchableOpacity>

        {/* Mode Selector Pill */}
        <View style={styles.modePillContainer}>
          <TouchableOpacity
            style={[styles.modeButton, deviceMode === 'AUTO' && styles.modeButtonActive]}
            onPress={() => onSelectMode('AUTO')}
          >
            <Text style={[styles.modeText, deviceMode === 'AUTO' && styles.modeTextActive]}>
              {t.camera.modeAuto}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, deviceMode === 'BLOOD_PRESSURE' && styles.modeButtonActive]}
            onPress={() => onSelectMode('BLOOD_PRESSURE')}
          >
            <Text style={[styles.modeText, deviceMode === 'BLOOD_PRESSURE' && styles.modeTextActive]}>
              {t.camera.modeBp}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, deviceMode === 'BLOOD_GLUCOSE' && styles.modeButtonActive]}
            onPress={() => onSelectMode('BLOOD_GLUCOSE')}
          >
            <Text style={[styles.modeText, deviceMode === 'BLOOD_GLUCOSE' && styles.modeTextActive]}>
              {t.camera.modeGlucose}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.iconButton, torchOn && styles.iconButtonActive]}
          onPress={onToggleTorch}
        >
          <Text style={styles.iconText}>{torchOn ? '⚡' : '💡'}</Text>
        </TouchableOpacity>
      </View>

      {/* Central Viewfinder Mask */}
      <View style={styles.viewfinderCenterArea} pointerEvents="none">
        <View style={styles.reticleFrame}>
          {/* Corner Guides */}
          <View style={[styles.cornerBracket, styles.topLeft]} />
          <View style={[styles.cornerBracket, styles.topRight]} />
          <View style={[styles.cornerBracket, styles.bottomLeft]} />
          <View style={[styles.cornerBracket, styles.bottomRight]} />

          {/* Alignment Crosshairs / Guide Lines */}
          <View style={styles.horizontalGuideLine} />

          <View style={styles.guideTextContainer}>
            <Text style={styles.viewfinderText}>
              {deviceMode === 'BLOOD_PRESSURE'
                ? t.camera.alignBp
                : deviceMode === 'BLOOD_GLUCOSE'
                ? t.camera.alignGlucose
                : t.camera.alignDevice}
            </Text>
            <Text style={styles.viewfinderSubtext}>{t.camera.antiGlareTip}</Text>
          </View>
        </View>
      </View>

      {/* Bottom Controls Bar */}
      <View style={styles.bottomBar}>
        {/* Gallery picker */}
        <TouchableOpacity style={styles.secondaryButton} onPress={onPickImage} disabled={isProcessing}>
          <Text style={styles.secondaryButtonText}>{t.camera.gallery}</Text>
        </TouchableOpacity>

        {/* Shutter Capture Button */}
        <TouchableOpacity
          style={[styles.shutterOuter, isProcessing && styles.shutterDisabled]}
          onPress={onCapture}
          disabled={isProcessing}
        >
          <View style={[styles.shutterInner, isProcessing && styles.shutterInnerProcessing]} />
        </TouchableOpacity>

        {/* Info hint */}
        <View style={styles.secondaryButtonPlaceholder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#F59E0B',
  },
  iconText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modePillContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: RADIUS.full,
    padding: 3,
  },
  modeButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeText: {
    color: '#94A3B8',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  viewfinderCenterArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleFrame: {
    width: VIEWFINDER_WIDTH,
    height: VIEWFINDER_HEIGHT,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 148, 136, 0.45)',
    backgroundColor: 'rgba(13, 148, 136, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cornerBracket: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: COLORS.primaryLight,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  horizontalGuideLine: {
    position: 'absolute',
    width: '90%',
    height: 1,
    backgroundColor: 'rgba(45, 212, 191, 0.25)',
  },
  guideTextContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  viewfinderText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  viewfinderSubtext: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 48,
    paddingHorizontal: SPACING.xl,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '600',
  },
  secondaryButtonPlaceholder: {
    width: 80,
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.primary,
  },
  shutterInnerProcessing: {
    backgroundColor: '#F59E0B',
    transform: [{ scale: 0.85 }],
  },
});
