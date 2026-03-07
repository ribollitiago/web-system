import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

import { formatDateShortBR } from '../../utils/date.utils';
import { DatabaseService } from '../database/database.service';
import { SessionService } from '../core/session/session.service';

export interface RegisterData {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private readonly MAX_STEP = 4;

  private openContinuePopupSubject = new Subject<void>();
  public readonly openContinuePopup$ = this.openContinuePopupSubject.asObservable();

  private stepSubject = new BehaviorSubject<Record<string, number>>({});
  public readonly step$ = this.stepSubject.asObservable();

  private dataSubject = new BehaviorSubject<Record<string, RegisterData>>({});
  public readonly data$ = this.dataSubject.asObservable();

  private isInternalNavigation = false;

  constructor(
    private databaseService: DatabaseService,
    private sessionService: SessionService,
  ) {}

  triggerContinuePopup(): void {
    this.openContinuePopupSubject.next();
  }

  setInternalNavigation(value: boolean): void {
    this.isInternalNavigation = value;
  }

  resetNavigationFlag(): void {
    this.isInternalNavigation = false;
  }

  getInternalNavigation(): boolean {
    const val = this.isInternalNavigation;
    this.isInternalNavigation = false;
    return val;
  }

  isSameUser(entityType: string): boolean {
    const data = this.getData(entityType);
    const currentSessionId = this.sessionService.getSessionId();

    if (!data['savedSessionId'] || !currentSessionId) return true;
    return data['savedSessionId'] === currentSessionId;
  }

  getStep(entityType: string): number {
    return this.stepSubject.value[entityType] || 1;
  }

  nextStep(entityType: string): void {
    this.setInternalNavigation(true);

    const current = this.getStep(entityType);
    if (current >= this.MAX_STEP) return;

    this.updateStep(entityType, current + 1);
  }

  previousStep(entityType: string): void {
    const current = this.getStep(entityType);
    if (current <= 1) return;

    this.updateStep(entityType, current - 1);
  }

  setStep(entityType: string, step: number): void {
    if (step < 1 || step > this.MAX_STEP) return;
    this.updateStep(entityType, step);
  }

  updateData(entityType: string, partial: Partial<RegisterData>): void {
    const current = this.getData(entityType);
    const currentSessionId = this.sessionService.getSessionId();

    this.dataSubject.next({
      ...this.dataSubject.value,
      [entityType]: {
        ...current,
        ...partial,
        savedSessionId: currentSessionId,
      }
    });
  }

  getData(entityType: string): RegisterData {
    return this.dataSubject.value[entityType] || {};
  }

  reset(entityType: string = 'users'): void {
    this.dataSubject.next({
      ...this.dataSubject.value,
      [entityType]: {}
    });

    this.stepSubject.next({
      ...this.stepSubject.value,
      [entityType]: 1
    });

    this.isInternalNavigation = false;
  }

  async register(entityType: string): Promise<void> {
    const data = { ...this.getData(entityType) };
    data['createdAt'] = this.buildTimestamp();

    if (entityType === 'users') {
      await this.registerUser(data);
    } else if (entityType === 'groups') {
      await this.registerGroup(data);
    }

    this.reset(entityType);
  }

  hasUserProgress(entityType: string): boolean {
    const data = this.getData(entityType);
    if (!data) return false;

    return Boolean(
      data['name'] ||
      data['email'] ||
      data['phone'] ||
      data['enrollment'] ||
      data['password'] ||
      data['confirmPassword']
    );
  }

  private async registerUser(data: RegisterData): Promise<void> {
    const payload = {
      enrollment: data['enrollment'],
      name: data['name'],
      email: data['email'],
      password: data['password'],
      phone: data['phone'],
      description: data['description'],
      groupEnrollments: Array.isArray(data['groups']) ? data['groups'] : [],
      permissionCodes: Array.isArray(data['permissions']) ? data['permissions'] : [],
    };

    await this.databaseService.create('users', payload);
  }

  private async registerGroup(data: RegisterData): Promise<void> {
    const enrollment =
      data['enrollment'] ||
      data['key'] ||
      String(data['title'] || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const payload = {
      enrollment,
      title: data['title'],
      description: data['description'],
      permissionCodes: Array.isArray(data['permissions']) ? data['permissions'] : [],
    };

    await this.databaseService.create('groups', payload);
  }

  private updateStep(entityType: string, step: number): void {
    this.stepSubject.next({
      ...this.stepSubject.value,
      [entityType]: step
    });
  }

  private buildTimestamp(): string {
    return formatDateShortBR(new Date());
  }
}
