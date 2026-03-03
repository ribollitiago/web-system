import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, switchMap, timer } from 'rxjs';

import { BackendHealthService, BackendHealthState } from '../../../core/services/backend/backend-health.service';

type BackendStatus = 'checking' | 'online' | 'offline';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  backendStatus: BackendStatus = 'checking';
  backendStatusLabel = 'Verificando...';
  lastCheckedAt = '';

  private healthSubscription?: Subscription;
  private readonly healthCheckIntervalMs = 10000;

  constructor(private readonly backendHealthService: BackendHealthService) {}

  ngOnInit(): void {
    this.startBackendHealthMonitor();
  }

  ngOnDestroy(): void {
    this.healthSubscription?.unsubscribe();
  }

  private startBackendHealthMonitor(): void {
    this.healthSubscription = timer(0, this.healthCheckIntervalMs)
      .pipe(switchMap(() => this.backendHealthService.checkBackend()))
      .subscribe((healthState) => this.updateBackendStatus(healthState));
  }

  private updateBackendStatus(healthState: BackendHealthState): void {
    this.backendStatus = healthState.online ? 'online' : 'offline';
    this.backendStatusLabel = healthState.online ? 'Online' : 'Offline';

    const checkedAt = new Date(healthState.checkedAt);
    this.lastCheckedAt = Number.isNaN(checkedAt.getTime()) ? '' : checkedAt.toLocaleString('pt-BR');
  }
}
