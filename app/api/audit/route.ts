import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';

type AuditRow = {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor_name: string | null;
  event_hash: string;
};

function getDb() {
  return (env as { DB?: D1Database }).DB;
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
          audit_events.id,
          audit_events.created_at,
          audit_events.action,
          audit_events.entity_type,
          audit_events.entity_id,
          users.full_name AS actor_name,
          audit_events.event_hash
        FROM audit_events
        LEFT JOIN users ON users.id = audit_events.actor_id
        ORDER BY audit_events.created_at DESC
        LIMIT 50`,
      )
      .all<AuditRow>();

    return NextResponse.json({
      storage: 'd1',
      items: result.results.map((row) => ({
        id: row.id,
        time: new Intl.DateTimeFormat('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(row.created_at)),
        action:
          row.action === 'request.created'
            ? 'Создана заявка'
            : row.action === 'request.decided'
              ? 'Решение по заявке'
              : row.action === 'limit.updated'
                ? 'Изменен лимит'
                : row.action,
        detail: `${row.actor_name ?? 'Система'} · ${row.entity_type} ${row.entity_id} · ${row.event_hash}`,
      })),
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
