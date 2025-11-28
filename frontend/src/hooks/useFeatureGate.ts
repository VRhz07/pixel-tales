/**
 * Feature Gate Hook
 * Provides easy access control for features based on user subscription
 */

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { featureAccessService } from '@/services/featureAccess.service';
import type { FeatureAccess } from '@/types/api.types';

export function useFeatureGate() {
  const { featureAccess, userLimits } = useAuthStore();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'limit_reached' | 'premium_only' | 'anonymous'>('premium_only');
  const [blockedFeature, setBlockedFeature] = useState<string>('');

  /**
   * Check if user can access a feature
   */
  const canAccess = useCallback((feature: keyof FeatureAccess): boolean => {
    if (!featureAccess) return false;
    return featureAccess[feature] as boolean;
  }, [featureAccess]);

  /**
   * Check if user has reached a limit
   */
  const hasReachedLimit = useCallback((limitType: 'stories' | 'characters' | 'storage' | 'ai_generations'): boolean => {
    if (!userLimits) return false;
    const limit = userLimits[limitType];
    if (limit.unlimited) return false;
    return limit.current >= limit.max;
  }, [userLimits]);

  /**
   * Get remaining usage for a limit
   */
  const getRemainingUsage = useCallback((limitType: 'stories' | 'characters' | 'storage' | 'ai_generations'): number => {
    if (!userLimits) return 0;
    const limit = userLimits[limitType];
    if (limit.unlimited) return -1; // unlimited
    return Math.max(0, limit.max - limit.current);
  }, [userLimits]);

  /**
   * Get usage percentage
   */
  const getUsagePercentage = useCallback((limitType: 'stories' | 'characters' | 'storage' | 'ai_generations'): number => {
    if (!userLimits) return 0;
    const limit = userLimits[limitType];
    if (limit.unlimited || limit.max === 0) return 0;
    return Math.min(100, (limit.current / limit.max) * 100);
  }, [userLimits]);

  /**
   * Attempt to perform an action, showing upgrade prompt if blocked
   */
  const attemptAction = useCallback((
    feature: keyof FeatureAccess,
    featureName: string,
    onSuccess: () => void
  ): void => {
    if (canAccess(feature)) {
      onSuccess();
    } else {
      setBlockedFeature(featureName);
      setUpgradeReason(featureAccessService.getSubscriptionType() === 'anonymous' ? 'anonymous' : 'premium_only');
      setShowUpgradePrompt(true);
    }
  }, [canAccess]);

  /**
   * Attempt to use a limited resource, showing upgrade prompt if limit reached
   */
  const attemptLimitedAction = useCallback((
    limitType: 'stories' | 'characters' | 'storage' | 'ai_generations',
    featureName: string,
    onSuccess: () => void
  ): void => {
    if (!hasReachedLimit(limitType)) {
      onSuccess();
    } else {
      setBlockedFeature(featureName);
      setUpgradeReason('limit_reached');
      setShowUpgradePrompt(true);
    }
  }, [hasReachedLimit]);

  /**
   * Close upgrade prompt
   */
  const closeUpgradePrompt = useCallback(() => {
    setShowUpgradePrompt(false);
    setBlockedFeature('');
  }, []);

  /**
   * Check if should show upgrade CTA
   */
  const shouldShowUpgradeCTA = useCallback((): boolean => {
    return featureAccessService.shouldShowUpgradeCTA();
  }, []);

  /**
   * Get locked features list
   */
  const getLockedFeatures = useCallback((): string[] => {
    return featureAccessService.getLockedFeatures();
  }, []);

  return {
    // Access checks
    canAccess,
    hasReachedLimit,
    getRemainingUsage,
    getUsagePercentage,
    
    // Action attempts
    attemptAction,
    attemptLimitedAction,
    
    // Upgrade prompt state
    showUpgradePrompt,
    upgradeReason,
    blockedFeature,
    closeUpgradePrompt,
    
    // Utility
    shouldShowUpgradeCTA,
    getLockedFeatures,
    
    // Raw data
    featureAccess,
    userLimits,
  };
}
