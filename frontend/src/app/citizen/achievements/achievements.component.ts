import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GamificationService,
  GamificationSummary,
  Achievement,
  Reward,
  RankingUser,
  PointTransaction,
  RewardRedemption
} from '../../core/services/gamification.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './achievements.component.html',
  styleUrl: './achievements.component.scss'
})
export class AchievementsComponent implements OnInit {
  activeTab: 'ACHIEVEMENTS' | 'REWARDS' | 'RANKING' | 'HISTORY' = 'ACHIEVEMENTS';
  activeCategoryFilter = 'ALL';

  loading = true;
  redeemingId: number | null = null;
  redeemMessage: { text: string; success: boolean } | null = null;

  summary: GamificationSummary | null = null;
  achievements: Achievement[] = [];
  rewards: Reward[] = [];
  ranking: RankingUser[] = [];
  history: PointTransaction[] = [];

  categoryFilters = [
    { label: 'Todos', value: 'ALL', icon: '✨' },
    { label: 'Reportes', value: 'REPORTE', icon: '📍' },
    { label: 'Reciclaje', value: 'RECICLAJE', icon: '♻️' },
    { label: 'Comunidad', value: 'COMUNIDAD', icon: '🤝' },
    { label: 'Rachas', value: 'RACHA', icon: '🔥' },
  ];

  constructor(
    private gamificationService: GamificationService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading = true;

    this.gamificationService.getSummary().subscribe({
      next: (summaryData) => {
        this.summary = summaryData;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar resumen de gamificación:', err);
        this.loading = false;
      }
    });

    this.gamificationService.getAchievements().subscribe({
      next: (achData) => {
        this.achievements = achData;
      },
      error: (err) => console.error('Error al cargar logros:', err)
    });

    this.gamificationService.getRewards().subscribe({
      next: (rewData) => {
        this.rewards = rewData;
      },
      error: (err) => console.error('Error al cargar recompensas:', err)
    });

    this.gamificationService.getRanking().subscribe({
      next: (rankData) => {
        this.ranking = rankData;
      },
      error: (err) => console.error('Error al cargar ranking:', err)
    });
  }

  setTab(tab: 'ACHIEVEMENTS' | 'REWARDS' | 'RANKING' | 'HISTORY'): void {
    this.activeTab = tab;
    this.redeemMessage = null;
  }

  setCategoryFilter(category: string): void {
    this.activeCategoryFilter = category;
  }

  get filteredAchievements(): Achievement[] {
    if (this.activeCategoryFilter === 'ALL') {
      return this.achievements;
    }
    return this.achievements.filter(a => a.category === this.activeCategoryFilter);
  }

  get unlockedAchievements(): Achievement[] {
    return this.filteredAchievements.filter(a => a.earned);
  }

  get lockedAchievements(): Achievement[] {
    return this.filteredAchievements.filter(a => !a.earned);
  }

  redeem(reward: Reward): void {
    if (!reward.can_afford || !reward.level_met || reward.stock <= 0) {
      return;
    }

    if (!confirm(`¿Deseas canjear "${reward.title}" por ${reward.points_cost} puntos?`)) {
      return;
    }

    this.redeemingId = reward.id;
    this.redeemMessage = null;

    this.gamificationService.redeemReward(reward.id).subscribe({
      next: (res) => {
        this.redeemingId = null;
        this.redeemMessage = { text: res.message, success: true };
        this.loadAllData();
      },
      error: (err) => {
        this.redeemingId = null;
        const msg = err.error?.error || 'No se pudo realizar el canje.';
        this.redeemMessage = { text: msg, success: false };
      }
    });
  }

  getRankBadge(position: number): string {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  }
}
