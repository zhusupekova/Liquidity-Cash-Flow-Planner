import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    title: 'Промышленная готовность системы',
    items: [
      {
        id: 1,
        name: 'База данных',
        status: 'спроектировано',
        evidence: 'D1 binding DB, SQL-схема и миграция',
      },
      {
        id: 2,
        name: 'Серверное API',
        status: 'реализован контур',
        evidence: '/api/health, /api/liquidity/summary, /api/requests',
      },
      {
        id: 3,
        name: 'Авторизация',
        status: 'требует политики банка',
        evidence: 'описан серверный контракт ролей',
      },
      {
        id: 4,
        name: 'Серверная ролевая модель',
        status: 'реализован демонстрационный контроль',
        evidence: 'POST /api/requests проверяет роль',
      },
      {
        id: 5,
        name: 'Банковские источники',
        status: 'требует доступов',
        evidence: 'описаны АБС, кредиты, депозиты, FX',
      },
      {
        id: 6,
        name: 'Маршруты согласования',
        status: 'спроектировано',
        evidence: 'сумма, валюта, риск, руководитель',
      },
      {
        id: 7,
        name: 'Неизменяемый аудит',
        status: 'спроектировано',
        evidence: 'таблица audit_events с hash-chain',
      },
      {
        id: 8,
        name: 'Уведомления',
        status: 'спроектировано',
        evidence: 'таблица notification_events и правила эскалации',
      },
      {
        id: 9,
        name: 'Отчеты XLS/PDF',
        status: 'частично реализовано',
        evidence: 'выгрузка таблицы и печатный PDF-отчет в интерфейсе',
      },
      {
        id: 10,
        name: 'Безопасность и нагрузка',
        status: 'план испытаний',
        evidence: 'документирован чек-лист тестирования',
      },
    ],
  });
}
