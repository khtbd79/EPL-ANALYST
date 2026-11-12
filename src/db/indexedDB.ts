/**
 * EPL PREDICT - IndexedDB Storage Engine
 * 100% Offline, Zero Cloud, Browser-Persistent Local Database
 */

import {
  Team,
  Player,
  MatchRecord,
  PredictionResult,
  AppSettings,
  DEFAULT_SETTINGS,
} from '../types';
import { OFFICIAL_2026_27_EPL_TEAMS } from './defaultTeams';

const DB_NAME = 'EPL_PREDICT_LOCAL_DB';
const DB_VERSION = 1;

export class EPLDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  public async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Teams Store
        if (!db.objectStoreNames.contains('teams')) {
          const teamStore = db.createObjectStore('teams', { keyPath: 'id' });
          teamStore.createIndex('name', 'name', { unique: true });
        }

        // Players Store
        if (!db.objectStoreNames.contains('players')) {
          const playerStore = db.createObjectStore('players', { keyPath: 'id' });
          playerStore.createIndex('teamId', 'teamId', { unique: false });
          playerStore.createIndex('position', 'position', { unique: false });
        }

        // Matches Store
        if (!db.objectStoreNames.contains('matches')) {
          const matchStore = db.createObjectStore('matches', { keyPath: 'id' });
          matchStore.createIndex('season', 'season', { unique: false });
          matchStore.createIndex('date', 'date', { unique: false });
          matchStore.createIndex('homeTeamId', 'homeTeamId', { unique: false });
          matchStore.createIndex('awayTeamId', 'awayTeamId', { unique: false });
          matchStore.createIndex('status', 'status', { unique: false });
        }

        // Predictions Store
        if (!db.objectStoreNames.contains('predictions')) {
          const predStore = db.createObjectStore('predictions', { keyPath: 'id' });
          predStore.createIndex('predictionDate', 'predictionDate', { unique: false });
          predStore.createIndex('matchId', 'matchId', { unique: false });
          predStore.createIndex('season', 'season', { unique: false });
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  // --- PRELOAD DEFAULT 2026/27 PREMIER LEAGUE CLUBS ---
  public async preloadDefaultTeams(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('teams', 'readwrite');
      const store = tx.objectStore('teams');
      const req = store.getAll();

      req.onsuccess = () => {
        const existingTeams = (req.result as Team[]) || [];
        const now = new Date().toISOString();

        for (const defaultTeam of OFFICIAL_2026_27_EPL_TEAMS) {
          const matchById = existingTeams.find((t) => t.id === defaultTeam.id);
          const matchByName = existingTeams.find(
            (t) => t.name.trim().toLowerCase() === defaultTeam.name.trim().toLowerCase()
          );

          if (matchById) {
            // Already exists by ID: ensure 2026/27 season association is present
            const existingSeasons = matchById.seasons || (matchById.season ? [matchById.season] : []);
            if (!existingSeasons.includes('2026/27')) {
              const updatedTeam: Team = {
                ...matchById,
                seasons: [...existingSeasons, '2026/27'],
                season: matchById.season || '2026/27',
                updatedAt: now,
              };
              store.put(updatedTeam);
            }
          } else if (matchByName) {
            // Already exists by name: ensure 2026/27 season association is present
            const existingSeasons = matchByName.seasons || (matchByName.season ? [matchByName.season] : []);
            if (!existingSeasons.includes('2026/27')) {
              const updatedTeam: Team = {
                ...matchByName,
                seasons: [...existingSeasons, '2026/27'],
                season: matchByName.season || '2026/27',
                updatedAt: now,
              };
              store.put(updatedTeam);
            }
          } else {
            // Preload new team record
            const newTeam: Team = {
              ...defaultTeam,
              createdAt: now,
              updatedAt: now,
            };
            store.put(newTeam);
          }
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- TEAMS CRUD ---
  public async getTeams(season?: string): Promise<Team[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('teams', 'readonly');
      const store = tx.objectStore('teams');
      const req = store.getAll();
      req.onsuccess = () => {
        let teams = (req.result as Team[]) || [];
        if (season && season !== 'ALL') {
          teams = teams.filter((t) => {
            if (t.seasons && Array.isArray(t.seasons) && t.seasons.length > 0) {
              return t.seasons.includes(season);
            }
            if (t.season) {
              return t.season === season;
            }
            return true;
          });
        }
        resolve(teams.sort((a, b) => a.name.localeCompare(b.name)));
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async getTeam(id: string): Promise<Team | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('teams', 'readonly');
      const store = tx.objectStore('teams');
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as Team) || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async saveTeam(team: Team): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('teams', 'readwrite');
      const store = tx.objectStore('teams');
      const req = store.put(team);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async deleteTeam(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['teams', 'players'], 'readwrite');
      tx.objectStore('teams').delete(id);
      
      // Also delete players belonging to this team
      const playerStore = tx.objectStore('players');
      const index = playerStore.index('teamId');
      const req = index.openCursor(IDBKeyRange.only(id));
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- PLAYERS CRUD ---
  public async getPlayers(teamId?: string): Promise<Player[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('players', 'readonly');
      const store = tx.objectStore('players');
      let req: IDBRequest;
      if (teamId) {
        const index = store.index('teamId');
        req = index.getAll(IDBKeyRange.only(teamId));
      } else {
        req = store.getAll();
      }
      req.onsuccess = () => resolve((req.result as Player[]).sort((a, b) => a.name.localeCompare(b.name)));
      req.onerror = () => reject(req.error);
    });
  }

  public async savePlayer(player: Player): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('players', 'readwrite');
      const store = tx.objectStore('players');
      const req = store.put(player);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async deletePlayer(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('players', 'readwrite');
      const store = tx.objectStore('players');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- MATCHES CRUD ---
  public async getMatches(season?: string): Promise<MatchRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('matches', 'readonly');
      const store = tx.objectStore('matches');
      let req: IDBRequest;
      if (season && season !== 'ALL') {
        const index = store.index('season');
        req = index.getAll(IDBKeyRange.only(season));
      } else {
        req = store.getAll();
      }
      req.onsuccess = () => {
        const matches = (req.result as MatchRecord[]).sort((a, b) => b.date.localeCompare(a.date));
        resolve(matches);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async getMatch(id: string): Promise<MatchRecord | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('matches', 'readonly');
      const store = tx.objectStore('matches');
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as MatchRecord) || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async saveMatch(match: MatchRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('matches', 'readwrite');
      const store = tx.objectStore('matches');
      const req = store.put(match);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async deleteMatch(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('matches', 'readwrite');
      const store = tx.objectStore('matches');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- PREDICTIONS CRUD ---
  public async getPredictions(season?: string): Promise<PredictionResult[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('predictions', 'readonly');
      const store = tx.objectStore('predictions');
      let req: IDBRequest;
      if (season && season !== 'ALL') {
        const index = store.index('season');
        req = index.getAll(IDBKeyRange.only(season));
      } else {
        req = store.getAll();
      }
      req.onsuccess = () => {
        const preds = (req.result as PredictionResult[]).sort((a, b) => b.predictionDate.localeCompare(a.predictionDate));
        resolve(preds);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async savePrediction(pred: PredictionResult): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('predictions', 'readwrite');
      const store = tx.objectStore('predictions');
      const req = store.put(pred);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async deletePrediction(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('predictions', 'readwrite');
      const store = tx.objectStore('predictions');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- SETTINGS ---
  public async getSettings(): Promise<AppSettings> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('app_settings');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve({ ...DEFAULT_SETTINGS, ...req.result.value });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  }

  public async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put({ key: 'app_settings', value: settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- BACKUP & EXPORT/IMPORT ---
  public async exportBackupJSON(): Promise<string> {
    const [teams, players, matches, predictions, settings] = await Promise.all([
      this.getTeams(),
      this.getPlayers(),
      this.getMatches('ALL'),
      this.getPredictions('ALL'),
      this.getSettings(),
    ]);

    const backupData = {
      app: 'EPL PREDICT',
      version: 1,
      exportedAt: new Date().toISOString(),
      teams,
      players,
      matches,
      predictions,
      settings,
    };

    return JSON.stringify(backupData, null, 2);
  }

  public async importBackupJSON(jsonStr: string): Promise<{ teams: number; players: number; matches: number; predictions: number }> {
    const data = JSON.parse(jsonStr);
    if (!data || data.app !== 'EPL PREDICT') {
      throw new Error('Invalid backup file. Missing EPL PREDICT signature.');
    }

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['teams', 'players', 'matches', 'predictions', 'settings'], 'readwrite');
      
      const teamStore = tx.objectStore('teams');
      const playerStore = tx.objectStore('players');
      const matchStore = tx.objectStore('matches');
      const predStore = tx.objectStore('predictions');
      const settingsStore = tx.objectStore('settings');

      if (Array.isArray(data.teams)) {
        for (const t of data.teams) teamStore.put(t);
      }
      if (Array.isArray(data.players)) {
        for (const p of data.players) playerStore.put(p);
      }
      if (Array.isArray(data.matches)) {
        for (const m of data.matches) matchStore.put(m);
      }
      if (Array.isArray(data.predictions)) {
        for (const pr of data.predictions) predStore.put(pr);
      }
      if (data.settings) {
        settingsStore.put({ key: 'app_settings', value: data.settings });
      }

      tx.oncomplete = () => {
        resolve({
          teams: Array.isArray(data.teams) ? data.teams.length : 0,
          players: Array.isArray(data.players) ? data.players.length : 0,
          matches: Array.isArray(data.matches) ? data.matches.length : 0,
          predictions: Array.isArray(data.predictions) ? data.predictions.length : 0,
        });
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  public async exportMatchesCSV(): Promise<string> {
    const matches = await this.getMatches('ALL');
    const teams = await this.getTeams();
    const teamMap = new Map(teams.map((t) => [t.id, t.name]));

    const headers = [
      'Match ID',
      'Season',
      'Date',
      'Home Team',
      'Away Team',
      'Status',
      'Home Goals',
      'Away Goals',
      'Home xG',
      'Away xG',
      'Home Shots On Target %',
      'Away Shots On Target %',
      'Home Possession %',
      'Away Possession %',
      'Home PPDA',
      'Away PPDA',
      'Home Field Tilt %',
      'Away Field Tilt %',
    ];

    const rows = matches.map((m) => [
      m.id,
      m.season,
      m.date,
      `"${teamMap.get(m.homeTeamId) ?? m.homeTeamId}"`,
      `"${teamMap.get(m.awayTeamId) ?? m.awayTeamId}"`,
      m.status,
      m.score.homeGoals !== null && m.score.homeGoals !== undefined ? m.score.homeGoals : '',
      m.score.awayGoals !== null && m.score.awayGoals !== undefined ? m.score.awayGoals : '',
      m.homeStats.cat01.xg !== null && m.homeStats.cat01.xg !== undefined ? m.homeStats.cat01.xg : '',
      m.awayStats.cat01.xg !== null && m.awayStats.cat01.xg !== undefined ? m.awayStats.cat01.xg : '',
      m.homeStats.cat02.shotsOnTargetPct !== null && m.homeStats.cat02.shotsOnTargetPct !== undefined
        ? m.homeStats.cat02.shotsOnTargetPct
        : '',
      m.awayStats.cat02.shotsOnTargetPct !== null && m.awayStats.cat02.shotsOnTargetPct !== undefined
        ? m.awayStats.cat02.shotsOnTargetPct
        : '',
      m.homeStats.cat01.possessionPct !== null && m.homeStats.cat01.possessionPct !== undefined
        ? m.homeStats.cat01.possessionPct
        : '',
      m.awayStats.cat01.possessionPct !== null && m.awayStats.cat01.possessionPct !== undefined
        ? m.awayStats.cat01.possessionPct
        : '',
      m.homeStats.cat01.ppda !== null && m.homeStats.cat01.ppda !== undefined ? m.homeStats.cat01.ppda : '',
      m.awayStats.cat01.ppda !== null && m.awayStats.cat01.ppda !== undefined ? m.awayStats.cat01.ppda : '',
      m.homeStats.cat01.fieldTiltPct !== null && m.homeStats.cat01.fieldTiltPct !== undefined
        ? m.homeStats.cat01.fieldTiltPct
        : '',
      m.awayStats.cat01.fieldTiltPct !== null && m.awayStats.cat01.fieldTiltPct !== undefined
        ? m.awayStats.cat01.fieldTiltPct
        : '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public async clearAllData(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['teams', 'players', 'matches', 'predictions', 'settings'], 'readwrite');
      tx.objectStore('teams').clear();
      tx.objectStore('players').clear();
      tx.objectStore('matches').clear();
      tx.objectStore('predictions').clear();
      tx.objectStore('settings').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const localDB = new EPLDatabase();
