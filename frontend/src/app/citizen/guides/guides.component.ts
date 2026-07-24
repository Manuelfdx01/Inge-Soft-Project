import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { MOCK_GUIDES } from '../../core/mocks/guides.mock';

@Component({
  selector: 'app-guides',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './guides.component.html',
  styleUrl: './guides.component.scss'
})
export class GuidesComponent implements OnInit {
  guides: any[] = [];
  selectedGuide: any = null;
  useMock = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const source = this.useMock
      ? of(MOCK_GUIDES)
      : this.http.get<any[]>('http://localhost:8000/api/gamification/guides/');

    source.subscribe({ next: (data) => { this.guides = data; } });
  }

  select(guide: any): void {
    this.selectedGuide = guide === this.selectedGuide ? null : guide;
  }
}
