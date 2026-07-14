import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { of } from 'rxjs';

const MOCK_ACHIEVEMENTS = [
  { id: '1', name: 'Iniciador del cambio', description: 'Hiciste tu primer reporte', icon: '🌱', points_required: 50,  earned: true,  earned_at: '2025-07-01' },
  { id: '2', name: 'Defensor del papel',   description: 'Hiciste 5 reportes',       icon: '📄', points_required: 100, earned: true,  earned_at: '2025-07-05' },
  { id: '3', name: 'Voz ciudadana',        description: 'Enviaste una propuesta',    icon: '📢', points_required: 30,  earned: false, earned_at: null },
  { id: '4', name: 'Guardián del vidrio',  description: 'Completaste 10 traslados', icon: '🏆', points_required: 200, earned: false, earned_at: null },
];

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
})
export class AchievementsComponent implements OnInit {
  achievements: any[] = [];
  userPoints = 0;
  useMock = true;

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    this.userPoints = this.auth.getUser()?.points ?? 0;
    const source = this.useMock
      ? of(MOCK_ACHIEVEMENTS)
      : this.http.get<any[]>('http://localhost:8000/api/gamification/achievements/');
    source.subscribe({ next: (data) => { this.achievements = data; } });
  }

  get earned()  { return this.achievements.filter(a => a.earned); }
  get locked()  { return this.achievements.filter(a => !a.earned); }
}