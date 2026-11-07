import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { useAppStore } from '../../store/useAppStore';
import { DetectionDiagnosticEvent } from '../../types';

export interface DetectionDiagnosticsScreenProps {
  navigation: any;
}

type FilterOutcome = 'ALL' | 'DETECTED' | 'DROPPED_FAILURE' | 'DROPPED_NOISE' | 'DROPPED_OTP' | 'DROPPED_REQUEST';

export const DetectionDiagnosticsScreen: React.FC<DetectionDiagnosticsScreenProps> = ({
  navigation,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const diagnostics = useAppStore((state) => state.detectionDiagnostics);
  const clearDiagnostics = useAppStore((state) => state.clearDiagnostics);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol) || '₹';

  const [selectedFilter, setSelectedFilter] = useState<FilterOutcome>('ALL');

  const filteredEvents = diagnostics.filter((event) => {
    if (selectedFilter === 'ALL') return true;
    return event.outcome === selectedFilter;
  });

  const handleClear = () => {
    Alert.alert(
      'Clear Diagnostics Log',
      'Are you sure you want to delete all recorded notification diagnostic events?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearDiagnostics();
          },
        },
      ]
    );
  };

  const getOutcomeBadge = (outcome: DetectionDiagnosticEvent['outcome']) => {
    switch (outcome) {
      case 'DETECTED':
        return { label: 'DETECTED', color: colors.success, bg: colors.successLight };
      case 'DROPPED_FAILURE':
        return { label: 'FAILED PARSE', color: colors.error, bg: `${colors.error}20` };
      case 'DROPPED_OTP':
        return { label: 'OTP FILTERED', color: colors.warning || '#D97706', bg: '#FEF3C7' };
      case 'DROPPED_REQUEST':
        return { label: 'PAYMENT REQUEST', color: colors.info || '#2563EB', bg: '#DBEAFE' };
      case 'DROPPED_NOISE':
        return { label: 'PROMO / NOISE', color: colors.textSecondary, bg: colors.surfaceVariant };
      case 'DROPPED_UNSUPPORTED':
        return { label: 'UNSUPPORTED APP', color: '#7C3AED', bg: '#EDE9FE' };
      default:
        return { label: outcome, color: colors.textSecondary, bg: colors.surfaceVariant };
    }
  };

  const renderDiagnosticItem = ({ item }: { item: DetectionDiagnosticEvent }) => {
    const badge = getOutcomeBadge(item.outcome);
    const dateStr = new Date(item.timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const dayStr = new Date(item.timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });

    return (
      <View
        style={[
          styles.eventCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.sm,
            ...shadows.soft,
          },
        ]}
      >
        {/* Top Header of card */}
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.outcomeBadge,
              { backgroundColor: badge.bg, borderRadius: radius.full },
            ]}
          >
            <AppText variant="caption" weight="800" color={badge.color}>
              {badge.label}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.textMuted}>
            {dayStr} • {dateStr}
          </AppText>
        </View>

        {/* Package & Reason */}
        <View style={{ marginTop: 6 }}>
          <AppText variant="caption" color={colors.textMuted} weight="600">
            {item.packageName}
          </AppText>
          <AppText variant="body2" color={colors.textPrimary} style={{ marginTop: 2 }}>
            {item.reason}
          </AppText>
        </View>

        {/* Parsed summary if detected */}
        {item.parsedAmount !== undefined && (
          <View
            style={[
              styles.parsedSummary,
              {
                backgroundColor: colors.successLight,
                borderColor: colors.success,
                borderRadius: radius.md,
                padding: spacing.xs,
                marginTop: 6,
              },
            ]}
          >
            <Feather name="check-circle" size={14} color={colors.success} />
            <AppText variant="caption" weight="700" color={colors.success} style={{ marginLeft: 6 }}>
              {currencySymbol}{item.parsedAmount} to {item.parsedMerchant || 'Merchant'}
            </AppText>
          </View>
        )}

        {/* Snippet preview */}
        <View
          style={[
            styles.snippetBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: spacing.sm,
              marginTop: 8,
            },
          ]}
        >
          {item.titleSnippet ? (
            <AppText variant="caption" weight="700" color={colors.textPrimary}>
              {item.titleSnippet}
            </AppText>
          ) : null}
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            {item.textSnippet}
          </AppText>
        </View>
      </View>
    );
  };

  const filterTabs: Array<{ key: FilterOutcome; label: string }> = [
    { key: 'ALL', label: 'All' },
    { key: 'DETECTED', label: 'Detected' },
    { key: 'DROPPED_FAILURE', label: 'Failed' },
    { key: 'DROPPED_NOISE', label: 'Noise' },
    { key: 'DROPPED_OTP', label: 'OTP' },
    { key: 'DROPPED_REQUEST', label: 'Requests' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Nav */}
      <View
        style={[
          styles.topNav,
          {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.navBtn,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
          ]}
        >
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="h3" weight="800">
            Detection Diagnostics
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Notification parsing event log
          </AppText>
        </View>
        {diagnostics.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <AppText variant="caption" weight="700" color={colors.error}>
              Clear
            </AppText>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* Filter Chips */}
      <View style={{ paddingVertical: spacing.sm }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterTabs}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item.key;
            return (
              <TouchableOpacity
                onPress={() => setSelectedFilter(item.key)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: radius.full,
                    marginRight: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  weight="700"
                  color={isSelected ? '#FFF' : colors.textSecondary}
                >
                  {item.label}
                </AppText>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderDiagnosticItem}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xs,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconWrap,
                { backgroundColor: `${colors.primary}15`, borderRadius: radius.full },
              ]}
            >
              <Feather name="activity" size={32} color={colors.primary} />
            </View>
            <AppText variant="subtitle1" weight="700" style={{ marginTop: spacing.md }}>
              No Diagnostic Events
            </AppText>
            <AppText
              variant="caption"
              color={colors.textSecondary}
              align="center"
              style={{ marginTop: 6, maxWidth: 280, lineHeight: 18 }}
            >
              As incoming notifications arrive from payment apps, parsing decisions, noise filters, and dropped OTPs will appear here in real-time.
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  filterPill: {
    borderWidth: 1,
  },
  eventCard: {
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  parsedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  snippetBox: {
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

