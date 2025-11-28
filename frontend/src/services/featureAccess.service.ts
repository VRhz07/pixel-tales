/**
 * Feature Access Control Service
 * Manages feature access based on user subscription level
 */

import { authService } from './auth.service';
import {
  FREE_USER_LIMITS,
  PREMIUM_FEATURES,
  ANONYMOUS_RESTRICTIONS,
  ERROR_MESSAGES,
} from '@/config/constants';
import type { FeatureAccess, UserLimits } from '@/types/api.types';

class FeatureAccessService {
  /**
   * Get feature access for current user
   */
  getFeatureAccess(): FeatureAccess {
    const subscriptionType = authService.getSubscriptionType();

    switch (subscriptionType) {
      case 'anonymous':
        return this.getAnonymousAccess();
      case 'free':
        return this.getFreeUserAccess();
      case 'premium':
      case 'pro':
        return this.getPremiumAccess();
      default:
        return this.getAnonymousAccess();
    }
  }

  /**
   * Anonymous user access (very limited)
   */
  private getAnonymousAccess(): FeatureAccess {
    return {
      can_create_stories: ANONYMOUS_RESTRICTIONS.CAN_CREATE_STORIES,
      can_publish_stories: false,
      can_use_ai: ANONYMOUS_RESTRICTIONS.CAN_USE_AI,
      can_use_social: ANONYMOUS_RESTRICTIONS.CAN_USE_SOCIAL,
      can_comment: ANONYMOUS_RESTRICTIONS.CAN_COMMENT,
      can_rate: ANONYMOUS_RESTRICTIONS.CAN_RATE,
      can_download: ANONYMOUS_RESTRICTIONS.CAN_DOWNLOAD,
      can_export_high_res: false,
      can_use_advanced_tools: false,
      can_use_animations: false,
      max_story_pages: 0,
      max_illustrations_per_story: 0,
    };
  }

  /**
   * Free user access (limited features)
   */
  private getFreeUserAccess(): FeatureAccess {
    return {
      can_create_stories: true,
      can_publish_stories: true,
      can_use_ai: true,
      can_use_social: true,
      can_comment: true,
      can_rate: true,
      can_download: true,
      can_export_high_res: false,
      can_use_advanced_tools: false,
      can_use_animations: false,
      max_story_pages: FREE_USER_LIMITS.MAX_STORY_PAGES,
      max_illustrations_per_story: FREE_USER_LIMITS.MAX_ILLUSTRATIONS_PER_STORY,
    };
  }

  /**
   * Premium user access (full features)
   */
  private getPremiumAccess(): FeatureAccess {
    return {
      can_create_stories: true,
      can_publish_stories: true,
      can_use_ai: true,
      can_use_social: true,
      can_comment: true,
      can_rate: true,
      can_download: true,
      can_export_high_res: PREMIUM_FEATURES.HIGH_RES_EXPORT,
      can_use_advanced_tools: PREMIUM_FEATURES.ADVANCED_DRAWING_TOOLS,
      can_use_animations: PREMIUM_FEATURES.ANIMATION_FEATURES,
      max_story_pages: -1, // unlimited
      max_illustrations_per_story: -1, // unlimited
    };
  }

  /**
   * Get user limits for current user
   */
  getUserLimits(): UserLimits {
    const subscriptionType = authService.getSubscriptionType();
    const isPremium = subscriptionType === 'premium' || subscriptionType === 'pro';

    return {
      stories: {
        current: 0, // This should be fetched from API
        max: isPremium ? -1 : FREE_USER_LIMITS.MAX_STORIES,
        unlimited: isPremium,
      },
      characters: {
        current: 0, // This should be fetched from API
        max: isPremium ? -1 : FREE_USER_LIMITS.MAX_CHARACTERS,
        unlimited: isPremium,
      },
      storage: {
        used_mb: 0, // This should be fetched from API
        max_mb: isPremium ? -1 : FREE_USER_LIMITS.MAX_STORAGE_MB,
        unlimited: isPremium,
      },
      ai_generations: {
        used_today: 0, // This should be fetched from API
        max_per_day: isPremium ? -1 : FREE_USER_LIMITS.AI_GENERATIONS_PER_DAY,
        unlimited: isPremium,
      },
    };
  }

  /**
   * Check if user can perform action
   */
  canPerformAction(action: keyof FeatureAccess): boolean {
    const access = this.getFeatureAccess();
    return access[action] as boolean;
  }

  /**
   * Check if user has reached limit
   */
  hasReachedLimit(limitType: 'stories' | 'characters' | 'storage' | 'ai_generations'): boolean {
    const limits = this.getUserLimits();
    const limit = limits[limitType];

    if (limit.unlimited) return false;
    return limit.current >= limit.max;
  }

  /**
   * Get upgrade prompt message
   */
  getUpgradeMessage(feature: string): string {
    const subscriptionType = authService.getSubscriptionType();

    if (subscriptionType === 'anonymous') {
      return ERROR_MESSAGES.ANONYMOUS_LIMIT;
    }

    return `Upgrade to Premium to unlock ${feature}!`;
  }

  /**
   * Check if feature requires upgrade
   */
  requiresUpgrade(action: keyof FeatureAccess): boolean {
    return !this.canPerformAction(action);
  }

  /**
   * Get feature availability summary
   */
  getFeatureSummary() {
    const access = this.getFeatureAccess();
    const limits = this.getUserLimits();
    const subscriptionType = authService.getSubscriptionType();

    return {
      subscription_type: subscriptionType,
      access,
      limits,
      is_premium: subscriptionType === 'premium' || subscriptionType === 'pro',
      is_free: subscriptionType === 'free',
      is_anonymous: subscriptionType === 'anonymous',
    };
  }

  /**
   * Check if anonymous session should show upgrade prompt
   */
  shouldShowAnonymousUpgradePrompt(): boolean {
    if (!authService.isAnonymous()) return false;
    return authService.isAnonymousSessionExpired();
  }

  /**
   * Get remaining usage for a limit
   */
  getRemainingUsage(limitType: 'stories' | 'characters' | 'storage' | 'ai_generations'): number {
    const limits = this.getUserLimits();
    const limit = limits[limitType];

    if (limit.unlimited) return -1; // unlimited
    return Math.max(0, limit.max - limit.current);
  }

  /**
   * Get usage percentage for a limit
   */
  getUsagePercentage(limitType: 'stories' | 'characters' | 'storage' | 'ai_generations'): number {
    const limits = this.getUserLimits();
    const limit = limits[limitType];

    if (limit.unlimited || limit.max === 0) return 0;
    return Math.min(100, (limit.current / limit.max) * 100);
  }

  /**
   * Check if user should see upgrade CTA
   */
  shouldShowUpgradeCTA(): boolean {
    const subscriptionType = authService.getSubscriptionType();
    return subscriptionType === 'free' || subscriptionType === 'anonymous';
  }

  /**
   * Get features available in premium
   */
  getPremiumFeatures(): string[] {
    return [
      'Unlimited stories and characters',
      'Advanced drawing tools',
      'High-resolution export',
      'Animation features',
      'Voice acting tools',
      'Commercial licensing',
      'Priority support',
      'No ads',
      'Cloud backup',
      'Collaboration features',
    ];
  }

  /**
   * Get features locked for current user
   */
  getLockedFeatures(): string[] {
    const access = this.getFeatureAccess();
    const locked: string[] = [];

    if (!access.can_create_stories) locked.push('Story Creation');
    if (!access.can_use_ai) locked.push('AI Story Generation');
    if (!access.can_use_social) locked.push('Social Features');
    if (!access.can_export_high_res) locked.push('High-Res Export');
    if (!access.can_use_advanced_tools) locked.push('Advanced Drawing Tools');
    if (!access.can_use_animations) locked.push('Animation Features');

    return locked;
  }
}

export const featureAccessService = new FeatureAccessService();
export default featureAccessService;
