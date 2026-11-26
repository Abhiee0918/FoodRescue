import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, '../firebase-config.json');

// Helper to convert JS values to Firestore REST API value format
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Helper to convert Firestore REST API value back to JS
function fromFirestoreValue(val) {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('stringValue' in val) return val.stringValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    const list = val.arrayValue.values || [];
    return list.map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    const obj = {};
    const fields = val.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

export class FirebaseBackendService {
  constructor() {
    this.config = this.loadConfig();
    this.status = {
      connected: false,
      mode: this.config.projectId ? 'cloud' : 'local_emulated',
      lastSynced: null,
      error: null
    };
  }

  loadConfig() {
    const defaults = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'foodrescue-ai-production',
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'foodrescue-ai-production.firebaseapp.com',
      databaseURL: process.env.FIREBASE_DATABASE_URL || '',
      emulatorHost: process.env.FIRESTORE_EMULATOR_HOST || ''
    };

    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        return { ...defaults, ...saved };
      } catch (err) {
        console.warn('Could not read firebase-config.json', err);
      }
    }
    return defaults;
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing firebase-config.json', err);
    }
  }

  getBaseUrl() {
    if (this.config.emulatorHost) {
      return `http://${this.config.emulatorHost}/v1/projects/${this.config.projectId}/databases/(default)/documents`;
    }
    return `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents`;
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.config.apiKey) {
      // API key can be appended or passed as header
    }
    return headers;
  }

  async testConnection() {
    const testDocId = `health_ping_${Date.now()}`;
    const url = `${this.getBaseUrl()}/_health/${testDocId}${this.config.apiKey ? `?key=${this.config.apiKey}` : ''}`;

    try {
      // Try writing a ping document
      const payload = {
        fields: {
          timestamp: toFirestoreValue(new Date().toISOString()),
          service: toFirestoreValue('FoodRescue AI Platform Backend'),
          status: toFirestoreValue('online')
        }
      };

      const res = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        this.status.connected = true;
        this.status.mode = this.config.emulatorHost ? 'emulator' : 'cloud';
        this.status.error = null;
        this.status.lastSynced = new Date().toISOString();
        return {
          success: true,
          mode: this.status.mode,
          projectId: this.config.projectId,
          message: `Successfully connected to Firebase Firestore (${this.status.mode})!`
        };
      } else {
        const errorData = await res.json().catch(() => ({}));
        this.status.connected = false;
        this.status.error = errorData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        return {
          success: false,
          mode: 'local_sync',
          projectId: this.config.projectId,
          message: `Firestore returned status ${res.status}. Falling back to local persistent store.`,
          error: this.status.error
        };
      }
    } catch (err) {
      this.status.connected = false;
      this.status.error = err.message;
      return {
        success: false,
        mode: 'local_sync',
        projectId: this.config.projectId,
        message: 'Could not connect directly to Firestore cloud host. Operating in high-performance local persistent store mode.',
        error: err.message
      };
    }
  }

  // Save document to Firestore collection
  async setDocument(collection, docId, data) {
    if (!this.config.projectId) return false;

    const url = `${this.getBaseUrl()}/${collection}/${docId}${this.config.apiKey ? `?key=${this.config.apiKey}` : ''}`;
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
      fields[k] = toFirestoreValue(v);
    }

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ fields })
      });
      return res.ok;
    } catch (err) {
      console.warn(`Firestore sync warning for ${collection}/${docId}:`, err.message);
      return false;
    }
  }

  // Delete document from Firestore collection
  async deleteDocument(collection, docId) {
    if (!this.config.projectId) return false;

    const url = `${this.getBaseUrl()}/${collection}/${docId}${this.config.apiKey ? `?key=${this.config.apiKey}` : ''}`;
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return res.ok;
    } catch (err) {
      console.warn(`Firestore delete warning for ${collection}/${docId}:`, err.message);
      return false;
    }
  }

  // Bulk Seed Initial Data into Firestore
  async seedAll(db) {
    const results = {
      users: 0,
      donations: 0,
      notifications: 0,
      impact: 0
    };

    const users = db.getUsers();
    for (const u of users) {
      const { password, ...safeUser } = u;
      const ok = await this.setDocument('users', safeUser.id, safeUser);
      if (ok) results.users++;
    }

    const donations = db.getDonations();
    for (const d of donations) {
      const ok = await this.setDocument('donations', d.id, d);
      if (ok) results.donations++;
    }

    const notifications = db.getNotifications();
    for (const n of notifications) {
      const ok = await this.setDocument('notifications', n.id, n);
      if (ok) results.notifications++;
    }

    const impact = db.getImpactStats();
    const ok = await this.setDocument('impactStats', 'current', impact);
    if (ok) results.impact++;

    this.status.lastSynced = new Date().toISOString();
    return results;
  }
}

export const firebaseService = new FirebaseBackendService();
