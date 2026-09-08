/**
 * Offline-First Storage & Background Sync Queue for Field Gangmen
 * PS 26027 - Indian Railways AI Block Planning Platform
 * Task V5-11: Offline-First PWA for Field Operations
 *
 * Implements persistent local storage queue for track defect requisitions
 * captured in remote rural areas without cellular connectivity.
 * Captures device hardware GPS coordinates and WebP-compressed photos,
 * and synchronizes automatically upon network reconnection.
 */

import { MaintenanceRequestPayload, createMaintenanceRequest } from './api';

export interface OfflineTicket extends MaintenanceRequestPayload {
  local_id: string;
  created_at: string;
  sync_status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  gps_latitude?: number;
  gps_longitude?: number;
  gps_accuracy_meters?: number;
  photo_preview_base64?: string;
  sync_attempts?: number;
  last_error?: string;
}

const OFFLINE_QUEUE_KEY = 'ir_field_offline_tickets';

class OfflineStoreService {
  private syncListeners: Array<(pendingCount: number) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[OfflineStore] Cellular network restored. Flushing offline queue...');
        this.syncPendingTickets();
      });
    }
  }

  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public getPendingTickets(): OfflineTicket[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return [];
      const items: OfflineTicket[] = JSON.parse(raw);
      return items.filter((t) => t.sync_status === 'PENDING' || t.sync_status === 'FAILED');
    } catch {
      return [];
    }
  }

  public getAllTickets(): OfflineTicket[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public async saveOfflineTicket(
    payload: MaintenanceRequestPayload,
    gps?: { latitude: number; longitude: number; accuracy: number },
    photoBase64?: string
  ): Promise<OfflineTicket> {
    const ticket: OfflineTicket = {
      ...payload,
      local_id: `OFFLINE_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      created_at: new Date().toISOString(),
      sync_status: 'PENDING',
      gps_latitude: gps?.latitude,
      gps_longitude: gps?.longitude,
      gps_accuracy_meters: gps?.accuracy,
      photo_preview_base64: photoBase64,
      sync_attempts: 0,
    };

    const current = this.getAllTickets();
    current.unshift(ticket);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(current));
    this.notifyListeners();
    return ticket;
  }

  public async captureDeviceGPS(): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    });
  }

  public async syncPendingTickets(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline()) {
      return { synced: 0, failed: 0 };
    }

    const all = this.getAllTickets();
    let syncedCount = 0;
    let failedCount = 0;

    for (const ticket of all) {
      if (ticket.sync_status === 'PENDING' || ticket.sync_status === 'FAILED') {
        ticket.sync_status = 'SYNCING';
        ticket.sync_attempts = (ticket.sync_attempts || 0) + 1;

        try {
          await createMaintenanceRequest({
            department: ticket.department,
            division_id: ticket.division_id,
            section_id: ticket.section_id,
            from_km: ticket.from_km,
            to_km: ticket.to_km,
            asset_type: ticket.asset_type,
            defect_type: ticket.defect_type,
            severity: ticket.severity,
            estimated_duration_minutes: ticket.estimated_duration_minutes,
            required_machine_type: ticket.required_machine_type,
          });
          ticket.sync_status = 'SYNCED';
          syncedCount++;
        } catch (err: any) {
          ticket.sync_status = 'FAILED';
          ticket.last_error = err?.message || 'Network error';
          failedCount++;
        }
      }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(all));
    this.notifyListeners();
    return { synced: syncedCount, failed: failedCount };
  }

  public onQueueChange(cb: (pendingCount: number) => void): () => void {
    this.syncListeners.push(cb);
    cb(this.getPendingTickets().length);
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners() {
    const count = this.getPendingTickets().length;
    this.syncListeners.forEach((cb) => cb(count));
  }
}

export const offlineStore = new OfflineStoreService();
