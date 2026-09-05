import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const bindings = env as { DB?: unknown };

  return NextResponse.json({
    service: 'Планировщик ликвидности и денежных потоков',
    status: 'работает',
    database: bindings.DB
      ? 'D1 DB подключена логическим binding DB'
      : 'D1 DB недоступна в текущем окружении',
    date: new Date().toISOString(),
  });
}
