import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';

const allowedLimitManagers = new Set(['risk', 'admin']);
const defaultLimits = {
  KGS: 900,
  USD: 8,
  EUR: 2.4,
  CNY: 7,
};

function getDb() {
  return (env as { DB?: D1Database }).DB;
}

function prefixedId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeRole(role: string | null) {
  const roles: Record<string, string> = {
    risk: 'risk',
    admin: 'admin',
    treasury: 'treasury',
    executive: 'executive',
    auditor: 'auditor',
    'Риск-менеджер': 'risk',
    Казначей: 'treasury',
    Руководитель: 'executive',
    Аудитор: 'auditor',
  };

  return roles[role ?? ''] ?? 'anonymous';
}

function roleTitle(role: string) {
  const titles: Record<string, string> = {
    risk: 'Риск-менеджер',
    admin: 'Администратор',
    treasury: 'Казначей',
    executive: 'Руководитель',
    auditor: 'Аудитор',
  };

  return titles[role] ?? 'Гость';
}

function createHash(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return `AUD-${hash.toString(16).padStart(8, '0').toUpperCase()}`;
}

async function ensureActor(db: D1Database, role: string) {
  const actorId = `demo-${role}`;
  await db
    .prepare(
      `INSERT OR IGNORE INTO users (id, full_name, email, role, department)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      actorId,
      roleTitle(role),
      `${role}@demo.bank.local`,
      role,
      role === 'risk' ? 'Риск-менеджмент' : 'Казначейство',
    )
    .run();
  return actorId;
}

async function insertAudit(
  db: D1Database,
  actorId: string,
  action: string,
  entityId: string,
  payload: unknown,
) {
  const previous = await db
    .prepare(
      `SELECT event_hash FROM audit_events ORDER BY created_at DESC LIMIT 1`,
    )
    .first<{ event_hash: string }>();
  const payloadJson = JSON.stringify(payload);
  const eventHash = createHash(
    `${previous?.event_hash ?? 'GENESIS'}:${actorId}:${action}:${entityId}:${payloadJson}:${Date.now()}`,
  );

  await db
    .prepare(
      `INSERT INTO audit_events (id, actor_id, action, entity_type, entity_id, payload_json, previous_hash, event_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      prefixedId('AUD'),
      actorId,
      action,
      'liquidity_limit',
      entityId,
      payloadJson,
      previous?.event_hash ?? null,
      eventHash,
    )
    .run();
}

export async function GET() {
  const db = getDb();

  if (!db) {
    return NextResponse.json({
      limits: defaultLimits,
      storage: 'database_unavailable',
    });
  }

  try {
    const result = await db
      .prepare(
        `SELECT currency, amount_minor
         FROM liquidity_limits
         WHERE limit_type = ?
         ORDER BY updated_at DESC`,
      )
      .bind('minimum_balance')
      .all<{ currency: keyof typeof defaultLimits; amount_minor: number }>();

    const limits = { ...defaultLimits };
    for (const row of result.results) {
      limits[row.currency] = row.amount_minor / 1_000_000;
    }

    return NextResponse.json({ limits, storage: 'd1' });
  } catch (error) {
    return NextResponse.json({
      limits: defaultLimits,
      storage: 'schema_not_ready',
      message:
        error instanceof Error
          ? error.message
          : 'Схема базы данных пока не применена.',
    });
  }
}

export async function PATCH(request: NextRequest) {
  const role = normalizeRole(request.headers.get('x-demo-role'));

  if (!allowedLimitManagers.has(role)) {
    return NextResponse.json(
      {
        error: 'Доступ запрещен',
        message:
          'Изменение лимитов разрешено только риск-менеджеру или администратору.',
      },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    currency?: keyof typeof defaultLimits;
    reserve?: number;
  } | null;

  if (!body?.currency || !Number.isFinite(body.reserve) || !body.reserve) {
    return NextResponse.json(
      {
        error: 'Некорректный лимит',
        message: 'Нужно передать currency и reserve.',
      },
      { status: 400 },
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      {
        error: 'База данных недоступна',
        message: 'Сервер не получил binding DB.',
      },
      { status: 503 },
    );
  }

  const limitId = `LIMIT-${body.currency}-MINIMUM-BALANCE`;

  try {
    const actorId = await ensureActor(db, role);
    const amountMinor = Math.round(body.reserve * 1_000_000);

    await db
      .prepare(
        `INSERT INTO liquidity_limits
          (id, currency, limit_type, amount_minor, effective_from, updated_by, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
          amount_minor = excluded.amount_minor,
          updated_by = excluded.updated_by,
          updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        limitId,
        body.currency,
        'minimum_balance',
        amountMinor,
        '2026-09-04',
        actorId,
      )
      .run();

    await insertAudit(db, actorId, 'limit.updated', limitId, {
      currency: body.currency,
      reserve: body.reserve,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Лимит не сохранен',
        message:
          error instanceof Error
            ? error.message
            : 'Серверная база данных временно недоступна.',
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    currency: body.currency,
    reserve: body.reserve,
    storage: 'd1',
  });
}
