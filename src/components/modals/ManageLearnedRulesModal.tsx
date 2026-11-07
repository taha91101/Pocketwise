import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { AppButton } from '../common/AppButton';
import { useAppStore } from '../../store/useAppStore';
import { LearnedMerchantRule } from '../../types';

interface ManageLearnedRulesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ManageLearnedRulesModal: React.FC<ManageLearnedRulesModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const learnedRules = useAppStore((state) => state.learnedMerchantRules);
  const deleteLearnedRule = useAppStore((state) => state.deleteLearnedRule);
  const clearLearnedRules = useAppStore((state) => state.clearLearnedRules);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredRules = learnedRules.filter(
    (r) =>
      r.merchantPattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteRule = (rule: LearnedMerchantRule) => {
    Alert.alert(
      'Delete Learned Rule',
      `Delete mapping for "${rule.merchantPattern}"? Future transactions will revert to standard category matching.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteLearnedRule(rule.id);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Learned Rules',
      'Are you sure you want to delete all learned merchant-to-category rules? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearLearnedRules();
          },
        },
      ]
    );
  };

  const renderRuleItem = ({ item }: { item: LearnedMerchantRule }) => {
    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';

    return (
      <View
        style={[
          styles.ruleCard,
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
        <View style={styles.cardMain}>
          <View style={{ flex: 1, paddingRight: spacing.sm }}>
            <View style={styles.merchantRow}>
              <Feather name="shopping-bag" size={14} color={colors.primary} />
              <AppText variant="subtitle2" weight="700" style={{ marginLeft: 6 }}>
                {item.merchantPattern}
              </AppText>
            </View>

            <View style={styles.categoryBadgeRow}>
              <View
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: item.categoryColor
                      ? `${item.categoryColor}20`
                      : `${colors.primary}20`,
                    borderColor: item.categoryColor || colors.primary,
                    borderRadius: radius.full,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  weight="700"
                  color={item.categoryColor || colors.primary}
                >
                  {item.categoryName}
                </AppText>
              </View>
              {formattedDate ? (
                <AppText variant="caption" color={colors.textMuted} style={{ marginLeft: 8 }}>
                  Added {formattedDate}
                </AppText>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleDeleteRule(item)}
            style={[
              styles.deleteBtn,
              { backgroundColor: `${colors.error}15`, borderRadius: radius.md },
            ]}
          >
            <Feather name="trash-2" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText variant="h3" weight="800">
              Learned Merchant Rules
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Auto-categorization memory
            </AppText>
          </View>
          {learnedRules.length > 0 ? (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
              <AppText variant="caption" weight="700" color={colors.error}>
                Clear
              </AppText>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {/* Info banner */}
        <View
          style={[
            styles.infoBanner,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.border,
              marginHorizontal: spacing.lg,
              marginTop: spacing.md,
              borderRadius: radius.lg,
              padding: spacing.md,
            },
          ]}
        >
          <Feather name="zap" size={16} color={colors.primary} />
          <AppText
            variant="caption"
            color={colors.textSecondary}
            style={{ marginLeft: 8, flex: 1, lineHeight: 18 }}
          >
            PocketWise remembers when you re-categorize a merchant and applies your preferred
            category to all future detections automatically.
          </AppText>
        </View>

        {/* Search */}
        {learnedRules.length > 0 && (
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                marginHorizontal: spacing.lg,
                marginTop: spacing.md,
                borderRadius: radius.lg,
                paddingHorizontal: spacing.md,
              },
            ]}
          >
            <Feather name="search" size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Search merchant or category..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* List */}
        <FlatList
          data={filteredRules}
          keyExtractor={(item) => item.id}
          renderItem={renderRuleItem}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
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
                <Feather name="book-open" size={32} color={colors.primary} />
              </View>
              <AppText variant="subtitle1" weight="700" style={{ marginTop: spacing.md }}>
                {searchQuery ? 'No matching rules found' : 'No Learned Rules Yet'}
              </AppText>
              <AppText
                variant="caption"
                color={colors.textSecondary}
                align="center"
                style={{ marginTop: 6, maxWidth: 280, lineHeight: 18 }}
              >
                {searchQuery
                  ? 'Try searching with another merchant or category keyword'
                  : 'Whenever you change the category of an auto-detected payment, PocketWise will remember it here.'}
              </AppText>
            </View>
          }
        />

        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
          <AppButton title="Done" variant="primary" onPress={onClose} fullWidth />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  ruleCard: {
    borderWidth: 1,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

