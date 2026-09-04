import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  LineChart,
  ShieldAlert,
  WalletCards,
} from 'lucide-react';

const metrics = [
  {
    title: 'Свободная ликвидность',
    value: '1.42 млрд KGS',
    change: '+186 млн за день',
    status: 'stable',
    icon: WalletCards,
  },
  {
    title: 'Прогнозный разрыв',
    value: '312 млн KGS',
    change: 'ожидается 06.09',
    status: 'risk',
    icon: AlertTriangle,
  },
  {
    title: 'Валютная позиция',
    value: '+4.8 млн USD',
    change: 'в пределах лимита',
    status: 'stable',
    icon: CircleDollarSign,
  },
  {
    title: 'Заявки на сегодня',
    value: '18',
    change: '5 требуют согласования',
    status: 'attention',
    icon: FileCheck2,
  },
];

const forecast = [
  { day: 'Сегодня', inflow: 980, outflow: 760, balance: 1420, limit: 900 },
  { day: '05.09', inflow: 620, outflow: 830, balance: 1210, limit: 900 },
  { day: '06.09', inflow: 410, outflow: 722, balance: 898, limit: 900 },
  { day: '07.09', inflow: 740, outflow: 515, balance: 1123, limit: 900 },
  { day: '08.09', inflow: 860, outflow: 690, balance: 1293, limit: 900 },
  { day: '09.09', inflow: 530, outflow: 610, balance: 1213, limit: 900 },
  { day: '10.09', inflow: 910, outflow: 640, balance: 1483, limit: 900 },
];

const flows = [
  {
    time: '09:30',
    source: 'Погашение кредитов МСБ',
    type: 'Поступление',
    amount: '+245 млн KGS',
    status: 'Подтверждено',
  },
  {
    time: '11:00',
    source: 'Возврат депозитов физлиц',
    type: 'Расход',
    amount: '-318 млн KGS',
    status: 'В прогнозе',
  },
  {
    time: '13:20',
    source: 'Покупка USD для клиента',
    type: 'Валюта',
    amount: '-2.1 млн USD',
    status: 'На согласовании',
  },
  {
    time: '15:00',
    source: 'Межбанк: размещение overnight',
    type: 'Размещение',
    amount: '-400 млн KGS',
    status: 'Рекомендация',
  },
];

const limits = [
  { name: 'Минимальный остаток KGS', used: 84, label: '898 / 900 млн', state: 'critical' },
  { name: 'Корр. счет USD', used: 61, label: '12.4 / 20 млн', state: 'ok' },
  { name: 'Межбанк overnight', used: 72, label: '1.8 / 2.5 млрд', state: 'warning' },
  { name: 'Крупные платежи до 17:00', used: 48, label: '5 из 12', state: 'ok' },
];

const actions = [
  'Не размещать 400 млн KGS до подтверждения депозитных оттоков.',
  'Подготовить покупку 1.3 млн USD при росте клиентских заявок.',
  'Запросить у кредитного блока уточнение поступлений на 06.09.',
];

const navItems = ['Позиция', 'Потоки', 'Лимиты', 'Заявки', 'Отчеты'];

export default function Home() {
  const maxBalance = Math.max(...forecast.map((item) => item.balance));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar px-4 py-5 text-sidebar-foreground lg:block">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <Building2 size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold">Liquidity Planner</p>
            <p className="text-xs text-muted-foreground">Казначейство банка</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1" aria-label="Основные разделы">
          {navItems.map((item, index) => (
            <a
              href="#"
              key={item}
              className={`flex h-10 items-center rounded-md px-3 text-sm font-medium ${
                index === 0
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent'
              }`}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="mt-8 rounded-md border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert size={18} className="text-amber-600" aria-hidden="true" />
            День закрытия
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            До операционного дедлайна осталось 4 часа 20 минут. Пять заявок требуют решения.
          </p>
        </div>
      </aside>

      <section className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b bg-background/95 px-5 py-4 backdrop-blur sm:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Операционный день · 04.09.2026
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                План ликвидности и денежных потоков
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium">
                <CalendarDays size={17} aria-hidden="true" />
                Горизонт: 7 дней
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
                <Bell size={17} aria-hidden="true" />
                Проверить риски
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ключевые показатели">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <article key={metric.title} className="rounded-md border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.title}</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">{metric.value}</p>
                    </div>
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-md ${
                        metric.status === 'risk'
                          ? 'bg-red-50 text-red-700'
                          : metric.status === 'attention'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      <Icon size={20} aria-hidden="true" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{metric.change}</p>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
            <article className="rounded-md border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Прогноз ликвидности</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Баланс на конец дня относительно минимального лимита.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                    Остаток
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                    Лимит
                  </span>
                </div>
              </div>

              <div className="mt-6 grid h-72 grid-cols-7 items-end gap-3 border-b border-l px-3 pb-4">
                {forecast.map((item) => (
                  <div key={item.day} className="flex h-full flex-col justify-end gap-2">
                    <div className="relative flex flex-1 items-end">
                      <div
                        className={`w-full rounded-t-md ${
                          item.balance < item.limit
                            ? 'bg-red-500'
                            : item.balance < item.limit + 250
                              ? 'bg-amber-500'
                              : 'bg-primary'
                        }`}
                        style={{ height: `${(item.balance / maxBalance) * 100}%` }}
                        title={`${item.balance} млн KGS`}
                      />
                    </div>
                    <div className="text-center text-xs text-muted-foreground">{item.day}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <FlowSummary label="Поступления" value="+5.05 млрд" tone="positive" />
                <FlowSummary label="Списания" value="-4.77 млрд" tone="negative" />
                <FlowSummary label="Чистый поток" value="+280 млн" tone="neutral" />
              </div>
            </article>

            <article className="rounded-md border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Рекомендации</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Действия для казначейства.</p>
                </div>
                <LineChart size={22} className="text-muted-foreground" aria-hidden="true" />
              </div>
              <ul className="mt-5 space-y-3">
                {actions.map((action, index) => (
                  <li key={action} className="flex gap-3 rounded-md bg-muted p-3 text-sm leading-5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-background text-xs font-semibold">
                      {index + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <article className="rounded-md border bg-card shadow-sm">
              <div className="border-b p-5">
                <h2 className="text-lg font-semibold">Денежные потоки на сегодня</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Крупные операции, влияющие на позицию до конца дня.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Время</th>
                      <th className="px-5 py-3 font-semibold">Источник</th>
                      <th className="px-5 py-3 font-semibold">Тип</th>
                      <th className="px-5 py-3 font-semibold">Сумма</th>
                      <th className="px-5 py-3 font-semibold">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flows.map((flow) => (
                      <tr key={`${flow.time}-${flow.source}`} className="border-t">
                        <td className="px-5 py-4 text-muted-foreground">{flow.time}</td>
                        <td className="px-5 py-4 font-medium">{flow.source}</td>
                        <td className="px-5 py-4">{flow.type}</td>
                        <td className="px-5 py-4 font-semibold">{flow.amount}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                            {flow.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-md border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Контроль лимитов</h2>
              <div className="mt-5 space-y-5">
                {limits.map((limit) => (
                  <div key={limit.name}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{limit.name}</span>
                      <span className="text-muted-foreground">{limit.label}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${
                          limit.state === 'critical'
                            ? 'bg-red-500'
                            : limit.state === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                        }`}
                        style={{ width: `${limit.used}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <DecisionCard
              icon={Banknote}
              title="Межбанк"
              value="400 млн KGS"
              text="Размещение доступно после подтверждения вечерних оттоков."
            />
            <DecisionCard
              icon={Clock3}
              title="Очередь заявок"
              value="5 на согласовании"
              text="Приоритет: валютные заявки и крупные платежи клиентов."
            />
            <DecisionCard
              icon={CheckCircle2}
              title="План внедрения"
              value="Этап 1"
              text="Дальше добавим ввод заявок, роли пользователей и расчетные правила."
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function FlowSummary({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral';
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-700'
      : tone === 'negative'
        ? 'text-red-700'
        : 'text-foreground';

  return (
    <div className="rounded-md bg-muted p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        {tone === 'positive' ? (
          <ArrowUpRight size={15} aria-hidden="true" />
        ) : tone === 'negative' ? (
          <ArrowDownRight size={15} aria-hidden="true" />
        ) : (
          <Banknote size={15} aria-hidden="true" />
        )}
        7-дневный горизонт
      </div>
    </div>
  );
}

function DecisionCard({
  icon: Icon,
  title,
  value,
  text,
}: {
  icon: typeof Banknote;
  title: string;
  value: string;
  text: string;
}) {
  return (
    <article className="rounded-md border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <Icon size={20} aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">{text}</p>
        </div>
      </div>
    </article>
  );
}
