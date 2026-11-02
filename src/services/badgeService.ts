import { supabase, isSupabaseConfigured, getInitialProgress, saveUserProgress } from '../lib/supabase.ts';
import {
  BadgeDefinition,
  SYSTEM_BADGES,
  UserBadgeProgressState,
  evaluateStudentBadges,
  BadgeProgressInfo,
} from '../utils/badgeEngine.ts';

export interface UserEarnedBadge {
  badgeId: string;
  earnedAt: string;
  progressSnapshot?: any;
}

/**
 * Fetch all available badges from Supabase or system catalog
 */
export async function getBadgesCatalog(): Promise<BadgeDefinition[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('points_reward', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((b: any) => ({
          id: b.id,
          code: b.code,
          name: b.name,
          titleEn: b.title_en || b.name,
          description: b.description,
          icon: b.icon || 'Award',
          category: b.category,
          tier: b.tier,
          requiredCriteria: b.required_criteria,
          pointsReward: b.points_reward,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch badges from Supabase, using local catalog:', err);
    }
  }
  return SYSTEM_BADGES;
}

/**
 * Fetch earned badges for a specific student
 */
export async function getUserEarnedBadges(userId: string): Promise<UserEarnedBadge[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at, progress_snapshot')
        .eq('user_id', userId);

      if (!error && data) {
        return data.map((r: any) => ({
          badgeId: r.badge_id,
          earnedAt: r.earned_at,
          progressSnapshot: r.progress_snapshot,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch user badges from Supabase, using local progress:', err);
    }
  }

  // Fallback to local progress
  const progress = getInitialProgress(userId);
  const earnedBadgeIds = progress?.badges || ['badge_explorer', 'badge_circuit_master'];
  return earnedBadgeIds.map((id) => ({
    badgeId: id,
    earnedAt: new Date().toISOString(),
  }));
}

/**
 * Authoritatively evaluate and award any new badges earned by the student
 */
export async function checkAndAwardBadges(
  userId: string,
  currentState: UserBadgeProgressState
): Promise<{ newlyAwarded: BadgeDefinition[]; allProgress: Record<string, BadgeProgressInfo> }> {
  // 1. Try Supabase RPC first
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('evaluate_and_award_badges', {
        p_user_id: userId,
      });

      if (!error && data) {
        const awardedIds: string[] = data.awarded_badge_ids || [];
        const catalog = await getBadgesCatalog();
        const newlyAwarded = catalog.filter((b) => awardedIds.includes(b.id));

        // Evaluate full progress for UI
        const evalResult = evaluateStudentBadges(currentState, catalog);
        return {
          newlyAwarded,
          allProgress: evalResult.allProgress,
        };
      }
    } catch (err) {
      console.warn('Supabase evaluate_and_award_badges RPC failed, using local engine:', err);
    }
  }

  // 2. Fallback to local pure logic engine
  const evalResult = evaluateStudentBadges(currentState, SYSTEM_BADGES);

  if (evalResult.newlyAwardedBadges.length > 0) {
    try {
      const progress = getInitialProgress(userId);
      if (progress) {
        const updatedBadges = Array.from(
          new Set([...progress.badges, ...evalResult.newlyAwardedBadges.map((b) => b.id)])
        );
        saveUserProgress({
          ...progress,
          badges: updatedBadges,
          points: (progress.points || 0) + evalResult.totalPointsEarned,
          lastActive: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to update local storage progress:', err);
    }
  }

  return {
    newlyAwarded: evalResult.newlyAwardedBadges,
    allProgress: evalResult.allProgress,
  };
}
