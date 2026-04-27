import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { ProgressSteps } from './src/components/ProgressSteps';
import { StatusMessage } from './src/components/StatusMessage';
import { AuthScreen } from './src/screens/AuthScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { MealTrackerScreen } from './src/screens/MealTrackerScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { GymsScreen } from './src/screens/GymsScreen';
import { getOfflineQueueLength, startOfflineQueueWorker } from './src/sync/offlineQueue';
import { colors, spacing, typography } from './src/theme';

const STEPS = ['Sign In', 'Goals', 'Meals', 'Workout', 'Progress'];

function AppShell() {
  const [currentStep, setCurrentStep] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [showGyms, setShowGyms] = useState(false);

  useEffect(() => {
    getOfflineQueueLength()
      .then((count) => {
        if (count) setSyncStatus(`${count} action(s) pending sync`);
      })
      .catch(() => undefined);

    const stopWorker = startOfflineQueueWorker((result) => {
      if (result.remaining === 0) {
        setSyncStatus('');
      } else {
        setSyncStatus(`Synced ${result.flushed}, ${result.remaining} pending`);
      }
    });
    return stopWorker;
  }, []);

  const canGoBack = currentStep > 0 && !showGyms;
  const canGoForward = currentStep < STEPS.length - 1;

  const goBack = () => {
    if (showGyms) { setShowGyms(false); return; }
    if (canGoBack) setCurrentStep((s) => s - 1);
  };

  const goForward = () => {
    if (canGoForward) setCurrentStep((s) => s + 1);
  };

  const renderScreen = () => {
    if (showGyms) return <GymsScreen />;
    switch (currentStep) {
      case 0: return <AuthScreen onSuccess={() => setCurrentStep(1)} />;
      case 1: return <OnboardingScreen onSuccess={() => setCurrentStep(2)} />;
      case 2: return <MealTrackerScreen onSuccess={() => setCurrentStep(3)} />;
      case 3: return <WorkoutScreen onSuccess={() => setCurrentStep(4)} />;
      case 4: return <CalendarScreen />;
      default: return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* ── Header ── */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {(canGoBack || showGyms) ? (
              <TouchableOpacity
                onPress={goBack}
                style={styles.backButton}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={styles.backIcon}>‹</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
          </View>

          <Text style={styles.headerTitle}>GymBros</Text>

          <TouchableOpacity
            onPress={() => setShowGyms((v) => !v)}
            style={styles.gymsButton}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Browse gyms"
          >
            <Text style={styles.gymsIcon}>🏋️</Text>
          </TouchableOpacity>
        </View>

        {/* ── Progress steps (hide on gyms tab) ── */}
        {!showGyms && (
          <View style={styles.progressContainer}>
            <ProgressSteps steps={STEPS} current={currentStep} />
          </View>
        )}
      </SafeAreaView>

      {/* ── Offline / sync banner ── */}
      {!!syncStatus && (
        <View style={styles.syncBanner}>
          <StatusMessage variant="info" message={syncStatus} />
        </View>
      )}

      {/* ── Screen content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderScreen()}

        {/* ── Bottom navigation ── */}
        {!showGyms && (
          <View style={styles.bottomNav}>
            {canGoBack && (
              <TouchableOpacity
                onPress={goBack}
                style={[styles.navButton, styles.navButtonOutline]}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Previous step"
              >
                <Text style={styles.navButtonOutlineLabel}>← Back</Text>
              </TouchableOpacity>
            )}
            {canGoForward && (
              <TouchableOpacity
                onPress={goForward}
                style={[styles.navButton, styles.navButtonPrimary, !canGoBack && styles.navButtonFull]}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Next step"
              >
                <Text style={styles.navButtonPrimaryLabel}>Skip →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerSafe: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['4'],
    paddingTop: spacing['4'],
    paddingBottom: spacing['2'],
  },
  headerLeft: {
    width: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 40,
  },
  backIcon: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: typography.weight.bold,
    lineHeight: 32,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  gymsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymsIcon: {
    fontSize: 22,
  },
  progressContainer: {
    paddingHorizontal: spacing['4'],
    paddingBottom: spacing['3'],
  },
  syncBanner: {
    paddingHorizontal: spacing['4'],
    paddingTop: spacing['2'],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing['4'],
    paddingBottom: spacing['10'],
  },
  bottomNav: {
    flexDirection: 'row',
    gap: spacing['2'],
    paddingTop: spacing['4'],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing['4'],
  },
  navButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3'],
  },
  navButtonFull: {
    flex: 1,
  },
  navButtonPrimary: {
    backgroundColor: colors.surface2,
  },
  navButtonOutline: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtonPrimaryLabel: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  navButtonOutlineLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
});
