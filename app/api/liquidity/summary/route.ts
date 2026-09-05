import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    operatingDay: '2026-09-04',
    currency: 'KGS',
    reserveLimit: 900_000_000,
    forecastMinBalance: 898_000_000,
    deficit: 2_000_000,
    pendingRequests: 2,
    alerts: [
      'Минимальный остаток приближается к лимиту',
      'Есть валютная операция на согласовании',
    ],
    sources: [
      { name: 'АБС банка', status: 'контракт готов, нужны тестовые доступы' },
      {
        name: 'Депозитный модуль',
        status: 'контракт готов, нужны тестовые доступы',
      },
      {
        name: 'Кредитный модуль',
        status: 'контракт готов, нужны тестовые доступы',
      },
      {
        name: 'Валютные операции',
        status: 'контракт готов, нужны тестовые доступы',
      },
    ],
  });
}
