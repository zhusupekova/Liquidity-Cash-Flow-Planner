import { NextRequest, NextResponse } from 'next/server';
import { env } from 'cloudflare:workers';

const allowedCreators = new Set(['treasury', 'admin']);
const allowedApprovers = new Set(['treasury', 'executive', 'admin']);

type StoredFlow = {
  flow_id: string;
  operation_date: string;
  source_system: string;
  department: string;
  operation_type: string;
  amount_minor: number;
  currency: string;
  flow_status: string;
  priority: string;
  expected_at: string | null;
  route_name: string;
  request_status: string;
  assigned_to_role: string;
  decision_comment: string | null;
  created_at: string;
};

function getDb() {
  return (env as { DB?: D1Database }).DB;
}

function prefixedId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeRole(role: string | null) {
  const roles: Record<string, string> = {
    treasury: 'treasury',
    admin: 'admin',
    risk: 'risk',
    executive: 'executive',
    auditor: 'auditor',
    Казначей: 'treasury',
    'Риск-менеджер': 'risk',
    Руководитель: 'executive',
    Аудитор: 'auditor',
  };

  return roles[role ?? ''] ?? 'anonymous';
}

function roleTitle(role: string) {
  const titles: Record<string, string> = {
    treasury: 'Казначей',
    admin: 'Администратор',
    risk: 'Риск-менеджер',
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

function routeForAmount(amountMinor: number, currency: string) {
  if (currency !== 'KGS') {
    return 'Подразделение → Казначейство → Риск-менеджер → Руководитель';
  }

  return Math.abs(amountMinor) > 250_000_000
    ? 'Подразделение → Казначейство → Руководитель'
    : 'Подразделение → Казначейство';
}

function flowFromRow(row: StoredFlow) {
  const amountMajor = row.amount_minor / 1_000_000;
  const status =
    row.request_status === 'approved'
      ? 'Согласовано'
      : row.request_status === 'rejected'
        ? 'Отклонено'
        : 'На согласовании';

  return {
    id: row.flow_id,
    time: row.expected_at ?? 'Новая',
    source: row.source_system,
    owner: row.department,
    type: row.operation_type,
    amount: `${amountMajor > 0 ? '+' : '-'}${Math.abs(amountMajor)} млн ${row.currency}`,
    currency: row.currency,
    impact: amountMajor,
    status,
    tone:
      status === 'Согласовано'
        ? 'good'
        : status === 'Отклонено'
          ? 'neutral'
          : Math.abs(amountMajor) > 250
            ? 'critical'
            : 'warning',
    priority: row.priority,
    route: row.route_name,
    comment:
      row.decision_comment ??
      'Заявка сохранена в серверной базе данных и ожидает решения по маршруту.',
  };
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
      role === 'risk'
        ? 'Риск-менеджмент'
        : role === 'executive'
          ? 'Руководство'
          : role === 'auditor'
            ? 'Внутренний аудит'
            : 'Казначейство',
    )
    .run();
  return actorId;
}

async function insertAudit(
  db: D1Database,
  actorId: string,
  action: string,
  entityType: string,
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
    `${previous?.event_hash ?? 'GENESIS'}:${actorId}:${action}:${entityType}:${entityId}:${payloadJson}:${Date.now()}`,
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
      entityType,
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
    return NextResponse.json({ items: [], storage: 'database_unavailable' });
  }

  try {
    const result = await db
      .prepare(
        `SELECT
          liquidity_flows.id AS flow_id,
          liquidity_flows.operation_date,
          liquidity_flows.source_system,
          liquidity_flows.department,
          liquidity_flows.operation_type,
          liquidity_flows.amount_minor,
          liquidity_flows.currency,
          liquidity_flows.status AS flow_status,
          liquidity_flows.priority,
          liquidity_flows.expected_at,
          approval_requests.route_name,
          approval_requests.status AS request_status,
          approval_requests.assigned_to_role,
          approval_requests.decision_comment,
          approval_requests.created_at
        FROM approval_requests
        INNER JOIN liquidity_flows ON liquidity_flows.id = approval_requests.flow_id
        ORDER BY approval_requests.created_at DESC
        LIMIT 100`,
      )
      .all<StoredFlow>();

    return NextResponse.json({
      items: result.results.map(flowFromRow),
      storage: 'd1',
    });
  } catch (error) {
    return NextResponse.json({
      items: [],
      storage: 'schema_not_ready',
      message:
        error instanceof Error
          ? error.message
          : 'Схема базы данных пока не применена.',
    });
  }
}

export async function POST(request: NextRequest) {
  const role = normalizeRole(request.headers.get('x-demo-role'));

  if (!allowedCreators.has(role)) {
    return NextResponse.json(
      {
        error: 'Доступ запрещен',
        message:
          'Создание заявки разрешено только казначейству или администратору.',
      },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    amount?: number;
    amountMillions?: number;
    currency?: string;
  } | null;

  const amountMinor =
    Math.round(
      Math.abs(body?.amountMillions ?? (body?.amount ?? 0) / 1_000_000) *
        1_000_000,
    ) * -1;

  if (
    !body?.title ||
    !Number.isFinite(amountMinor) ||
    amountMinor === 0 ||
    !body.currency
  ) {
    return NextResponse.json(
      {
        error: 'Некорректная заявка',
        message: 'Нужно передать title, amount и currency.',
      },
      { status: 400 },
    );
  }

  const db = getDb();
  const flowId = prefixedId('FLOW');
  const requestId = prefixedId('REQ');
  const route = routeForAmount(amountMinor, body.currency);

  if (!db) {
    return NextResponse.json(
      {
        error: 'База данных недоступна',
        message: 'Сервер не получил binding DB.',
      },
      { status: 503 },
    );
  }

  try {
    const actorId = await ensureActor(db, role);

    await db.batch([
      db
        .prepare(
          `INSERT INTO liquidity_flows
            (id, operation_date, source_system, department, operation_type, amount_minor, currency, status, priority, expected_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          flowId,
          '2026-09-04',
          body.title,
          'Подразделение',
          'Заявка',
          amountMinor,
          body.currency,
          'pending',
          Math.abs(amountMinor) > 250_000_000 ? 'Высокий' : 'Средний',
          'Новая',
        ),
      db
        .prepare(
          `INSERT INTO approval_requests
            (id, flow_id, status, route_name, requested_by, assigned_to_role)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          requestId,
          flowId,
          'pending',
          route,
          actorId,
          route.includes('Руководитель') ? 'executive' : 'treasury',
        ),
    ]);

    await insertAudit(
      db,
      actorId,
      'request.created',
      'approval_request',
      requestId,
      {
        title: body.title,
        amountMinor,
        currency: body.currency,
        route,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Заявка не сохранена',
        message:
          error instanceof Error
            ? error.message
            : 'Серверная база данных временно недоступна.',
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      id: requestId,
      status: 'pending',
      route: route.split(' → '),
      storage: 'd1',
      flow: {
        id: flowId,
        time: 'Новая',
        source: body.title,
        owner: 'Подразделение',
        type: 'Заявка',
        amount: `-${Math.abs(amountMinor / 1_000_000)} млн ${body.currency}`,
        currency: body.currency,
        impact: amountMinor / 1_000_000,
        status: 'На согласовании',
        tone: Math.abs(amountMinor) > 250_000_000 ? 'critical' : 'warning',
        priority: Math.abs(amountMinor) > 250_000_000 ? 'Высокий' : 'Средний',
        route,
        comment:
          'Заявка сохранена в серверной базе данных и ожидает решения по маршруту.',
      },
      audit: {
        action: 'request.created',
        immutablePolicy: 'hash-chain',
      },
    },
    { status: 201 },
  );
}

export async function PATCH(request: NextRequest) {
  const role = normalizeRole(request.headers.get('x-demo-role'));

  if (!allowedApprovers.has(role)) {
    return NextResponse.json(
      {
        error: 'Доступ запрещен',
        message:
          'Согласование заявок разрешено казначею, руководителю или администратору.',
      },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    status?: 'Согласовано' | 'Отклонено';
  } | null;

  if (!body?.id || !body.status) {
    return NextResponse.json(
      {
        error: 'Некорректное решение',
        message: 'Нужно передать id заявки и статус.',
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

  const serverStatus = body.status === 'Согласовано' ? 'approved' : 'rejected';
  try {
    const existing = await db
      .prepare(`SELECT id FROM approval_requests WHERE flow_id = ? LIMIT 1`)
      .bind(body.id)
      .first<{ id: string }>();

    if (!existing) {
      return NextResponse.json(
        {
          error: 'Заявка не найдена',
          message: 'В базе данных нет заявки с таким идентификатором.',
        },
        { status: 404 },
      );
    }

    const actorId = await ensureActor(db, role);

    await db.batch([
      db
        .prepare(
          `UPDATE approval_requests
           SET status = ?, decision_comment = ?, decided_at = CURRENT_TIMESTAMP
           WHERE flow_id = ?`,
        )
        .bind(serverStatus, `${roleTitle(role)}: ${body.status}`, body.id),
      db
        .prepare(`UPDATE liquidity_flows SET status = ? WHERE id = ?`)
        .bind(serverStatus, body.id),
    ]);

    await insertAudit(
      db,
      actorId,
      'request.decided',
      'liquidity_flow',
      body.id,
      {
        status: body.status,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Решение не сохранено',
        message:
          error instanceof Error
            ? error.message
            : 'Серверная база данных временно недоступна.',
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    id: body.id,
    status: body.status,
    storage: 'd1',
    audit: {
      action: 'request.decided',
      immutablePolicy: 'hash-chain',
    },
  });
}
