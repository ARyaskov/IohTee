import { DatabaseSync } from 'node:sqlite'

type TokenStatus = 'accepted' | 'verified'

export interface StoredPaywallToken {
  token: string
  status: TokenStatus
  expiresAtMs: number
  createdAtMs: number
  payloadJson: string | null
}

export class SqliteTokenStore {
  private readonly db: DatabaseSync

  constructor(path: string) {
    this.db = new DatabaseSync(path)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS paywall_tokens (
        token TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        expires_at_ms INTEGER NOT NULL,
        created_at_ms INTEGER NOT NULL,
        payload_json TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_paywall_tokens_expires_at_ms
      ON paywall_tokens (expires_at_ms);
    `)
  }

  putAcceptedToken(token: string, ttlMs: number, payload?: unknown) {
    const now = Date.now()
    const expiresAtMs = now + ttlMs
    const payloadJson =
      payload === undefined ? null : JSON.stringify(payload, null, 0)

    this.db
      .prepare(
        `
          INSERT INTO paywall_tokens (token, status, expires_at_ms, created_at_ms, payload_json)
          VALUES (?, 'accepted', ?, ?, ?)
          ON CONFLICT(token) DO UPDATE SET
            status='accepted',
            expires_at_ms=excluded.expires_at_ms,
            created_at_ms=excluded.created_at_ms,
            payload_json=excluded.payload_json
        `,
      )
      .run(token, expiresAtMs, now, payloadJson)
  }

  markVerified(token: string, ttlMs: number) {
    const now = Date.now()
    const expiresAtMs = now + ttlMs
    this.db
      .prepare(
        `
          INSERT INTO paywall_tokens (token, status, expires_at_ms, created_at_ms, payload_json)
          VALUES (?, 'verified', ?, ?, NULL)
          ON CONFLICT(token) DO UPDATE SET
            status='verified',
            expires_at_ms=excluded.expires_at_ms
        `,
      )
      .run(token, expiresAtMs, now)
  }

  getToken(token: string): StoredPaywallToken | null {
    const row = this.db
      .prepare(
        `
          SELECT token, status, expires_at_ms, created_at_ms, payload_json
          FROM paywall_tokens
          WHERE token = ?
        `,
      )
      .get(token) as
      | {
          token: string
          status: TokenStatus
          expires_at_ms: number
          created_at_ms: number
          payload_json: string | null
        }
      | undefined

    if (!row) return null

    return {
      token: row.token,
      status: row.status,
      expiresAtMs: row.expires_at_ms,
      createdAtMs: row.created_at_ms,
      payloadJson: row.payload_json,
    }
  }

  isTokenValid(token: string, nowMs = Date.now()): boolean {
    const row = this.getToken(token)
    return !!row && row.expiresAtMs > nowMs
  }

  cleanupExpired(nowMs = Date.now()): number {
    const result = this.db
      .prepare('DELETE FROM paywall_tokens WHERE expires_at_ms <= ?')
      .run(nowMs)
    return Number(result.changes)
  }

  close() {
    this.db.close()
  }
}
