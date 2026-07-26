import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LevelInfo {
  level: number;
  title: string;
  icon: string;
  current_xp: number;
  current_level_min_xp: number;
  next_level_xp: number;
  next_level_title: string;
  xp_to_next: number;
  progress_pct: number;
}

export interface UserStatistics {
  capacity_reports: number;
  waste_reports: number;
  proposals_count: number;
  reviews_count: number;
  transfers_count: number;
  total_actions: number;
  kg_recycled: number;
  co2_saved_kg: number;
  ranking_position: number;
}

export interface PointTransaction {
  id: number;
  points: number;
  xp: number;
  action_type: string;
  description: string;
  created_at: string;
}

export interface RewardRedemption {
  id: number;
  reward: number;
  reward_title: string;
  reward_icon: string;
  code: string;
  points_spent: number;
  redeemed_at: string;
  status: string;
}

export interface GamificationSummary {
  user_id: number;
  username: string;
  role: string;
  points: number;
  xp: number;
  level_info: LevelInfo;
  streak_days: number;
  max_streak: number;
  last_activity_date: string | null;
  statistics: UserStatistics;
  recent_transactions: PointTransaction[];
  redemptions: RewardRedemption[];
  unlocked_achievements_count: number;
  total_achievements_count: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  points_reward: number;
  xp_reward: number;
  points_required: number;
  condition_key: string;
  condition_value: number;
  earned: boolean;
  earned_at: string | null;
  progress_current: number;
  progress_pct: number;
}

export interface Reward {
  id: number;
  title: string;
  description: string;
  icon: string;
  category: string;
  points_cost: number;
  level_required: number;
  stock: number;
  is_active: boolean;
  can_afford: boolean;
  level_met: boolean;
}

export interface RankingUser {
  position: number;
  id: number;
  username: string;
  role: string;
  points: number;
  xp: number;
  level_info: LevelInfo;
  avatar: string | null;
}

export interface RedeemResponse {
  message: string;
  redemption: RewardRedemption;
  user_points: number;
}

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private readonly apiUrl = `${environment.apiUrl}/gamification`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<GamificationSummary> {
    return this.http.get<GamificationSummary>(`${this.apiUrl}/user/summary/`);
  }

  getAchievements(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/achievements/`);
  }

  getRewards(): Observable<Reward[]> {
    return this.http.get<Reward[]>(`${this.apiUrl}/rewards/`);
  }

  redeemReward(rewardId: number): Observable<RedeemResponse> {
    return this.http.post<RedeemResponse>(`${this.apiUrl}/rewards/${rewardId}/redeem/`, {});
  }

  getRanking(): Observable<RankingUser[]> {
    return this.http.get<RankingUser[]>(`${this.apiUrl}/user/ranking/`);
  }

  getHistory(): Observable<PointTransaction[]> {
    return this.http.get<PointTransaction[]>(`${this.apiUrl}/user/history/`);
  }
}
