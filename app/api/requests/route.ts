import { NextRequest, NextResponse } from 'next/server';

const allowedCreators = new Set(['treasury', 'admin']);

export async function GET() {
  return NextResponse.json({
    items: [
      {
        id: 'REQ-2026-0001',
        title: 'Покупка USD для клиента',
        amount: -2_100_000,
        currency: 'USD',
        status: 'pending',
        route: ['Валютные операции', 'Риск-менеджер', 'Руководитель'],
      },
      {
        id: 'REQ-2026-0002',
        title: 'Межбанк overnight',
        amount: -400_000_000,
        currency: 'KGS',
        status: 'recommended',
        route: ['Казначейство', 'Руководитель'],
      },
    ],
  });
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-demo-role') ?? 'anonymous';

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
    currency?: string;
  } | null;

  if (!body?.title || !body.amount || !body.currency) {
    return NextResponse.json(
      {
        error: 'Некорректная заявка',
        message: 'Нужно передать title, amount и currency.',
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      id: `REQ-${Date.now()}`,
      status: 'pending',
      route:
        Math.abs(body.amount) > 250_000_000
          ? ['Подразделение', 'Казначейство', 'Руководитель']
          : ['Подразделение', 'Казначейство'],
      audit: {
        action: 'request.created',
        immutablePolicy: 'hash-chain',
      },
    },
    { status: 201 },
  );
}
