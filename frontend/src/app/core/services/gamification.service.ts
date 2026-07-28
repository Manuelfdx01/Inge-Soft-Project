import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

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
  private LOCAL_STORE_KEY = 'gomi_gamification_local_v1';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private getLocalData() {
    const raw = localStorage.getItem(this.LOCAL_STORE_KEY);
    const currentUser = this.auth.getUser();
    const defaultData = {
      points: currentUser?.points || 0,
      xp: 45,
      actions_count: 0,
      transactions: [] as PointTransaction[],
      achievements_unlocked: [] as number[],
    };
    if (!raw) return defaultData;
    try {
      return { ...defaultData, ...JSON.parse(raw) };
    } catch {
      return defaultData;
    }
  }

  private saveLocalData(data: any) {
    localStorage.setItem(this.LOCAL_STORE_KEY, JSON.stringify(data));
  }

  private updateAuthPoints(points: number) {
    const u = this.auth.getUser();
    if (u) {
      u.points = points;
      localStorage.setItem('user', JSON.stringify(u));
    }
  }

  getSummary(): Observable<GamificationSummary> {
    return this.http.get<GamificationSummary>(`${this.apiUrl}/user/summary/`).pipe(
      tap((res) => {
        if (res && res.points !== undefined) {
          this.updateAuthPoints(res.points);
        }
      }),
      catchError(() => {
        const currentUser = this.auth.getUser();
        const local = this.getLocalData();
        const xp = local.xp || 45;
        const pts = local.points || currentUser?.points || 0;
        
        const fallbackSummary: GamificationSummary = {
          user_id: Number(currentUser?.id || 1),
          username: currentUser?.username || 'Ciudadano Eco',
          role: currentUser?.role || 'CIUDADANO',
          points: pts,
          xp: xp,
          level_info: {
            level: Math.floor(xp / 100) + 1,
            title: xp >= 300 ? 'Héroe del Reciclaje' : (xp >= 100 ? 'Guardian Verde' : 'Aprendiz de Reciclaje'),
            icon: xp >= 300 ? '🏆' : (xp >= 100 ? '🌱' : '🍃'),
            current_xp: xp,
            current_level_min_xp: 0,
            next_level_xp: (Math.floor(xp / 100) + 1) * 100,
            next_level_title: 'Nivel ' + (Math.floor(xp / 100) + 2),
            xp_to_next: ((Math.floor(xp / 100) + 1) * 100) - xp,
            progress_pct: Math.min(100, (xp % 100))
          },
          streak_days: 1,
          max_streak: 3,
          last_activity_date: new Date().toISOString(),
          statistics: {
            capacity_reports: 1,
            waste_reports: 1,
            proposals_count: 0,
            reviews_count: 0,
            transfers_count: 0,
            total_actions: local.actions_count || 2,
            kg_recycled: 5.5,
            co2_saved_kg: 9.9,
            ranking_position: 1
          },
          recent_transactions: local.transactions || [],
          redemptions: [],
          unlocked_achievements_count: (local.achievements_unlocked || []).length,
          total_achievements_count: 10
        };
        return of(fallbackSummary);
      })
    );
  }

  getAchievements(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/achievements/`).pipe(
      catchError(() => {
        const local = this.getLocalData();
        const unlockedIds = local.achievements_unlocked || [];
        const mockAch: Achievement[] = [
          {
            id: 1, name: 'Iniciador del cambio', description: 'Actualizaste la capacidad de un punto de reciclaje',
            icon: '🌱', category: 'REPORTE', points_reward: 50, xp_reward: 50, points_required: 0,
            condition_key: 'capacidad_count', condition_value: 1, earned: true, earned_at: new Date().toISOString(),
            progress_current: 1, progress_pct: 100
          },
          {
            id: 2, name: 'Maestro de la Memoria', description: 'Demostraste tu conocimiento jugando Memoria Reciclable',
            icon: '🎮', category: 'RECICLAJE', points_reward: 50, xp_reward: 50, points_required: 0,
            condition_key: 'juegos_count', condition_value: 1,
            earned: unlockedIds.includes(2) || local.actions_count > 0,
            earned_at: unlockedIds.includes(2) ? new Date().toISOString() : null,
            progress_current: local.actions_count > 0 ? 1 : 0, progress_pct: local.actions_count > 0 ? 100 : 0
          },
          {
            id: 3, name: 'Lector Erudito', description: 'Leíste una guía de reciclaje para informarte',
            icon: '📚', category: 'COMUNIDAD', points_reward: 30, xp_reward: 30, points_required: 0,
            condition_key: 'guias_count', condition_value: 1,
            earned: unlockedIds.includes(3), earned_at: unlockedIds.includes(3) ? new Date().toISOString() : null,
            progress_current: unlockedIds.includes(3) ? 1 : 0, progress_pct: unlockedIds.includes(3) ? 100 : 0
          },
          {
            id: 4, name: 'Explorador del Mapa', description: 'Verificaste o reportaste información sobre un punto de acopio',
            icon: '🗺️', category: 'REPORTE', points_reward: 40, xp_reward: 40, points_required: 0,
            condition_key: 'mapa_reportes_count', condition_value: 1,
            earned: unlockedIds.includes(4), earned_at: unlockedIds.includes(4) ? new Date().toISOString() : null,
            progress_current: unlockedIds.includes(4) ? 1 : 0, progress_pct: unlockedIds.includes(4) ? 100 : 0
          }
        ];
        return of(mockAch);
      })
    );
  }

  getRewards(): Observable<Reward[]> {
    return this.http.get<Reward[]>(`${this.apiUrl}/rewards/`).pipe(
      catchError(() => {
        const mockRew: Reward[] = [
          { id: 1, title: 'Bolsa Ecológica Reutilizable GOMI', description: 'Bolsa de algodón orgánico super resistente.', icon: '🛍️', category: 'PRODUCTO_ECO', points_cost: 150, level_required: 1, stock: 50, is_active: true, can_afford: true, level_met: true },
          { id: 2, title: '20% Descuento en Tienda Eco-Sostenible', description: 'Cupón de 20% de descuento.', icon: '🎟️', category: 'DESCUENTO', points_cost: 200, level_required: 1, stock: 100, is_active: true, can_afford: false, level_met: true }
        ];
        return of(mockRew);
      })
    );
  }

  redeemReward(rewardId: number): Observable<RedeemResponse> {
    return this.http.post<RedeemResponse>(`${this.apiUrl}/rewards/${rewardId}/redeem/`, {}).pipe(
      tap(res => {
        if (res && res.user_points !== undefined) {
          this.updateAuthPoints(res.user_points);
        }
      })
    );
  }

  getRanking(): Observable<RankingUser[]> {
    return this.http.get<RankingUser[]>(`${this.apiUrl}/user/ranking/`).pipe(
      catchError(() => {
        const currentUser = this.auth.getUser();
        const local = this.getLocalData();
        return of([
          { position: 1, id: Number(currentUser?.id || 1), username: currentUser?.username || 'Tú', role: 'CIUDADANO', points: local.points || 50, xp: local.xp || 45, level_info: { level: 1, title: 'Aprendiz', icon: '🌱', current_xp: 45, current_level_min_xp: 0, next_level_xp: 100, next_level_title: 'Guardia', xp_to_next: 55, progress_pct: 45 }, avatar: null }
        ]);
      })
    );
  }

  getHistory(): Observable<PointTransaction[]> {
    return this.http.get<PointTransaction[]>(`${this.apiUrl}/user/history/`).pipe(
      catchError(() => of(this.getLocalData().transactions || []))
    );
  }

  recordAction(actionType: string, payload?: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/user/record_action/`, {
      action_type: actionType,
      ...payload
    }).pipe(
      tap((res) => {
        if (res && res.total_points !== undefined) {
          this.updateAuthPoints(res.total_points);
        }
      }),
      catchError(() => {
        // Fallback para modo offline / desarrollo
        const pts = actionType === 'jugar_juego' 
          ? Math.max(10, Math.floor((payload?.score || 0) / 10)) 
          : (actionType === 'reportar_punto_mapa' ? 30 : 15);
        const xp = pts + 5;
        
        const local = this.getLocalData();
        local.points += pts;
        local.xp += xp;
        local.actions_count = (local.actions_count || 0) + 1;
        
        let desc = 'Acción realizada';
        if (actionType === 'jugar_juego') desc = `Puntos ganados en Memoria Reciclable (+${pts} pts)`;
        else if (actionType === 'leer_guia') desc = `Lectura de guía de reciclaje (+${pts} pts)`;
        else if (actionType === 'reportar_punto_mapa') desc = `Reporte en punto de acopio (+${pts} pts)`;

        const tx: PointTransaction = {
          id: Date.now(),
          points: pts,
          xp: xp,
          action_type: actionType,
          description: desc,
          created_at: new Date().toISOString()
        };

        local.transactions = [tx, ...(local.transactions || [])];

        if (actionType === 'jugar_juego' && !local.achievements_unlocked.includes(2)) local.achievements_unlocked.push(2);
        if (actionType === 'leer_guia' && !local.achievements_unlocked.includes(3)) local.achievements_unlocked.push(3);
        if (actionType === 'reportar_punto_mapa' && !local.achievements_unlocked.includes(4)) local.achievements_unlocked.push(4);

        this.saveLocalData(local);
        this.updateAuthPoints(local.points);

        return of({
          message: `¡Ganaste ${pts} puntos y ${xp} XP!`,
          points_earned: pts,
          xp_earned: xp,
          total_points: local.points,
          total_xp: local.xp
        });
      })
    );
  }
}
