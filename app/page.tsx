import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Gauge,
  Landmark,
  Layers3,
  LineChart,
  LockKeyhole,
  RadioTower,
  ShieldAlert,
  WalletCards,
} from 'lucide-react';

const metrics = [
  {
    title: 'Свободная ликвидность',
    value: '1.42 млрд',
    unit: 'KGS',
    change: '+186 млн',
    detail: 'к закрытию дня',
    state: 'good',
    icon: WalletCards,
  },
  {
    title: 'Риск разрыва',
    value: '312 млн',
    unit: 'KGS',
    change: '06.09',
    detail: 'ожидаемый минимум',
    state: 'critical',
    icon: AlertTriangle,
  },
  {
    title: 'FX позиция',
    value: '+4.8 млн',
    unit: 'USD',
    change: '61%',
    detail: 'от валютного лимита',
    state: 'good',
    icon: CircleDollarSign,
  },
  {
    title: 'Заявки',
    value: '18',
    unit: 'шт.',
    change: '5 срочных',
    detail: 'до операционного cut-off',
    state: 'warning',
    icon: FileCheck2,
  },
];

const forecast = [
  { day: '04.09', label: 'Сегодня', inflow: 980, outflow: 760, balance: 1420, limit: 900 },
  { day: '05.09', label: 'Сб', inflow: 620, outflow: 830, balance: 1210, limit: 900 },
  { day: '06.09', label: 'Вс', inflow: 410, outflow: 722, balance: 898, limit: 900 },
  { day: '07.09', label: 'Пн', inflow: 740, outflow: 515, balance: 1123, limit: 900 },
  { day: '08.09', label: 'Вт', inflow: 860, outflow: 690, balance: 1293, limit: 900 },
  { day: '09.09', label: 'Ср', inflow: 530, outflow: 610, balance: 1213, limit: 900 },
  { day: '10.09', label: 'Чт', inflow: 910, outflow: 640, balance: 1483, limit: 900 },
];

const flows = [
  {
    time: '09:30',
    source: 'Погашение кредитов МСБ',
    owner: 'Кредитный блок',
    type: 'Поступление',
    amount: '+245 млн KGS',
    status: 'Подтверждено',
    tone: 'good',
  },
  {
    time: '11:00',
    source: 'Возврат депозитов физлиц',
    owner: 'Депозитный отдел',
    type: 'Расход',
    amount: '-318 млн KGS',
    status: 'В прогнозе',
    tone: 'warning',
  },
  {
    time: '13:20',
    source: 'Покупка USD для клиента',
    owner: 'Валютные операции',
    type: 'FX',
    amount: '-2.1 млн USD',
    status: 'Согласование',
    tone: 'critical',
  },
  {
    time: '15:00',
    source: 'Межбанк overnight',
    owner: 'Казначейство',
    type: 'Размещение',
    amount: '-400 млн KGS',
    status: 'Рекомендация',
    tone: 'neutral',
  },
];

const limits = [
  { name: 'Минимальный остаток KGS', used: 99, value: '898 / 900 млн', state: 'critical' },
  { name: 'Корр. счет USD', used: 61, value: '12.4 / 20 млн', state: 'good' },
  { name: 'Межбанк overnight', used: 72, value: '1.8 / 2.5 млрд', state: 'warning' },
  { name: 'Крупные платежи', used: 48, value: '5 / 12 заявок', state: 'good' },
];

const actions = [
  {
    title: 'Заморозить размещение',
    body: 'Не размещать 400 млн KGS до подтверждения вечернего депозитного оттока.',
    priority: 'Critical',
  },
  {
    title: 'Подготовить FX сделку',
    body: 'Покупка 1.3 млн USD покроет сценарий роста клиентских заявок после 14:00.',
    priority: 'Watch',
  },
  {
    title: 'Уточнить поступления',
    body: 'Кредитный блок должен подтвердить график погашений на 06.09 до 12:30.',
    priority: 'Task',
  },
];

const navItems = [
  { label: 'Позиция', icon: Gauge },
  { label: 'Потоки', icon: Activity },
  { label: 'Лимиты', icon: ShieldAlert },
  { label: 'Заявки', icon: FileCheck2 },
  { label: 'Отчеты', icon: LineChart },
];

const currencies = [
  { code: 'KGS', amount: '1.42 млрд', delta: '+15.1%' },
  { code: 'USD', amount: '12.4 млн', delta: '+3.4%' },
  { code: 'EUR', amount: '3.1 млн', delta: '-1.8%' },
  { code: 'CNY', amount: '9.8 млн', delta: '+0.9%' },
];

export default function Home() {
  const maxBalance = Math.max(...forecast.map((item) => item.balance));

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(44,62,80,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(44,62,80,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(23,151,139,0.18),transparent_62%)]" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[280px] border-r border-white/10 bg-sidebar px-4 py-5 text-sidebar-foreground lg:block">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_14px_34px_rgba(20,184,166,0.25)]">
            <Landmark size={23} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold">Liquidity Planner</p>
            <p className="text-xs text-white/55">Treasury command center</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1" aria-label="Основные разделы">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <a
                href="#"
                key={item.label}
                className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                  index === 0
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-inner'
                    : 'text-white/62 hover:bg-sidebar-accent hover:text-white'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
                {index === 0 ? <ChevronRight className="ml-auto" size={16} aria-hidden="true" /> : null}
              </a>
            );
          })}
        </nav>

        <div className="mt-7 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <RadioTower size={18} className="text-teal-300" aria-hidden="true" />
              Live feed
            </div>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-300" />
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/58">
            Последняя синхронизация с АБС, депозитами и валютным модулем: 22 секунды назад.
          </p>
        </div>

        <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-white/10 bg-white/[0.06] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <LockKeyhole size={17} className="text-amber-300" aria-hidden="true" />
            Контур банка
          </div>
          <p className="mt-2 text-xs leading-5 text-white/55">
            Демо-экран. Следующий этап: роли, заявки и журнал аудита.
          </p>
        </div>
      </aside>

      <section className="relative z-10 lg:pl-[280px]">
        <header className="border-b bg-background/75 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Операционный день · 04.09.2026 · Бишкек
              </p>
              <h1 className="mt-1 max-w-4xl text-2xl font-semibold tracking-tight sm:text-4xl">
                Центр управления ликвидностью банка
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card/80 px-3 text-sm font-medium shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
                <CalendarDays size={17} aria-hidden="true" />
                7 дней
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-[0_14px_30px_rgba(15,118,110,0.25)] transition hover:-translate-y-0.5">
                <Bell size={17} aria-hidden="true" />
                Проверить риски
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-8">
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
            <article className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-[0_24px_70px_rgba(31,41,55,0.09)] sm:p-6">
              <div className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(115deg,transparent,rgba(20,184,166,0.11),rgba(245,158,11,0.09))]" />
              <div className="relative grid gap-6 xl:grid-cols-[1fr_300px]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Real-time treasury cockpit
                  </div>
                  <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                    Видно, где деньги простаивают и где появится разрыв.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Дашборд связывает остатки, заявки подразделений, валютные операции и лимиты в одну
                    операционную картину для казначейства и руководства.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <MiniSignal label="LCR proxy" value="118%" trend="OK" />
                    <MiniSignal label="Cut-off" value="16:30" trend="4ч 20м" />
                    <MiniSignal label="Idle cash" value="226 млн" trend="к размещению" />
                  </div>
                </div>

                <div className="rounded-xl border bg-background/82 p-4 shadow-inner backdrop-blur">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Liquidity pulse</p>
                    <Activity size={18} className="text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="mt-5 h-40 overflow-hidden rounded-lg bg-[linear-gradient(180deg,rgba(20,184,166,0.11),rgba(255,255,255,0.35))] p-2">
                    <svg viewBox="0 0 280 145" className="h-full w-full" role="img" aria-label="Динамика ликвидности">
                      <path
                        d="M0 104 C32 82 48 96 72 68 C96 40 126 52 148 74 C172 100 196 94 220 54 C238 24 258 36 280 26"
                        fill="none"
                        stroke="rgba(15,118,110,0.18)"
                        strokeWidth="18"
                        strokeLinecap="round"
                      />
                      <path
                        className="cash-line"
                        d="M0 104 C32 82 48 96 72 68 C96 40 126 52 148 74 C172 100 196 94 220 54 C238 24 258 36 280 26"
                        fill="none"
                        stroke="rgb(15,118,110)"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      <line x1="0" y1="96" x2="280" y2="96" stroke="rgb(239,68,68)" strokeDasharray="6 8" />
                      <circle className="cash-dot" cx="220" cy="54" r="6" fill="rgb(245,158,11)" />
                    </svg>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {currencies.map((currency) => (
                      <div key={currency.code} className="rounded-lg border bg-card p-3">
                        <p className="text-xs text-muted-foreground">{currency.code}</p>
                        <p className="mt-1 text-sm font-semibold">{currency.amount}</p>
                        <p className="mt-1 text-xs text-emerald-700">{currency.delta}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-xl border bg-card p-5 shadow-[0_24px_70px_rgba(31,41,55,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Risk queue</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Что требует решения сейчас.</p>
                </div>
                <ShieldAlert className="text-amber-600" size={22} aria-hidden="true" />
              </div>
              <div className="mt-5 space-y-3">
                {actions.map((action, index) => (
                  <div
                    key={action.title}
                    className="group rounded-lg border bg-background/75 p-4 transition hover:-translate-y-0.5 hover:bg-card hover:shadow-md"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{action.title}</p>
                      <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                        {action.priority}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-muted-foreground">{action.body}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ключевые показатели">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <article
                  key={metric.title}
                  className="metric-card rounded-xl border bg-card/86 p-4 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.title}</p>
                      <div className="mt-2 flex items-end gap-2">
                        <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
                        <p className="pb-1 text-xs font-semibold text-muted-foreground">{metric.unit}</p>
                      </div>
                    </div>
                    <div className={`grid h-10 w-10 place-items-center rounded-lg ${stateIconClass(metric.state)}`}>
                      <Icon size={20} aria-hidden="true" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3 text-sm">
                    <span className={stateTextClass(metric.state)}>{metric.change}</span>
                    <span className="text-muted-foreground">{metric.detail}</span>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
            <article className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">7-дневный прогноз</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Остаток на конец дня, поступления, списания и критический лимит.
                  </p>
                </div>
                <div className="inline-flex rounded-lg border bg-muted p-1 text-xs font-medium">
                  <span className="rounded-md bg-card px-3 py-1 shadow-sm">База</span>
                  <span className="px-3 py-1 text-muted-foreground">Стресс</span>
                  <span className="px-3 py-1 text-muted-foreground">Оптимист.</span>
                </div>
              </div>

              <div className="mt-6 grid h-80 grid-cols-7 items-end gap-3 border-b border-l px-3 pb-4">
                {forecast.map((item, index) => (
                  <div key={item.day} className="flex h-full flex-col justify-end gap-2">
                    <div className="relative flex flex-1 items-end">
                      <span
                        className="absolute inset-x-0 border-t border-dashed border-red-400/70"
                        style={{ bottom: `${(item.limit / maxBalance) * 100}%` }}
                      />
                      <div
                        className={`forecast-bar w-full rounded-t-lg ${
                          item.balance < item.limit
                            ? 'bg-red-500'
                            : item.balance < item.limit + 250
                              ? 'bg-amber-500'
                              : 'bg-primary'
                        }`}
                        style={{
                          height: `${(item.balance / maxBalance) * 100}%`,
                          animationDelay: `${index * 80}ms`,
                        }}
                        title={`${item.balance} млн KGS`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.day}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <FlowSummary label="Поступления" value="+5.05 млрд" tone="positive" />
                <FlowSummary label="Списания" value="-4.77 млрд" tone="negative" />
                <FlowSummary label="Чистый поток" value="+280 млн" tone="neutral" />
              </div>
            </article>

            <article className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Лимиты ликвидности</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Контроль приближения к границам.</p>
                </div>
                <Layers3 size={22} className="text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="mt-6 space-y-5">
                {limits.map((limit) => (
                  <div key={limit.name}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{limit.name}</span>
                      <span className="text-muted-foreground">{limit.value}</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`limit-fill h-2.5 rounded-full ${limitFillClass(limit.state)}`}
                        style={{ width: `${limit.used}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-xl border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Операционный поток</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Крупные события дня с владельцем, статусом и влиянием на позицию.
                </p>
              </div>
              <button className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-md">
                <Banknote size={17} aria-hidden="true" />
                Новая заявка
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Время</th>
                    <th className="px-5 py-3 font-semibold">Операция</th>
                    <th className="px-5 py-3 font-semibold">Владелец</th>
                    <th className="px-5 py-3 font-semibold">Тип</th>
                    <th className="px-5 py-3 font-semibold">Сумма</th>
                    <th className="px-5 py-3 font-semibold">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {flows.map((flow) => (
                    <tr key={`${flow.time}-${flow.source}`} className="border-t transition hover:bg-muted/45">
                      <td className="px-5 py-4 text-muted-foreground">{flow.time}</td>
                      <td className="px-5 py-4 font-medium">{flow.source}</td>
                      <td className="px-5 py-4 text-muted-foreground">{flow.owner}</td>
                      <td className="px-5 py-4">{flow.type}</td>
                      <td className="px-5 py-4 font-semibold">{flow.amount}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(flow.tone)}`}>
                          {flow.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <DecisionCard
              icon={Building2}
              title="Интеграции"
              value="АБС · депозиты · кредиты"
              text="Следующий слой: заменить демо-данные автоматической загрузкой из банковских систем."
            />
            <DecisionCard
              icon={Clock3}
              title="Согласования"
              value="5 ожидают решения"
              text="Добавим маршруты заявок, роли согласующих и журнал действий."
            />
            <DecisionCard
              icon={CheckCircle2}
              title="План развития"
              value="Этап 2"
              text="Форма заявок, фильтры, сценарии прогноза и экспорт отчетов."
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function MiniSignal({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="rounded-lg border bg-background/70 p-3 backdrop-blur">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className="mt-1 text-xs text-teal-700">{trend}</p>
    </div>
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
    tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-red-700' : 'text-foreground';

  return (
    <div className="rounded-lg border bg-background/70 p-4">
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
    <article className="rounded-xl border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
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

function stateIconClass(state: string) {
  if (state === 'critical') return 'bg-red-50 text-red-700';
  if (state === 'warning') return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
}

function stateTextClass(state: string) {
  if (state === 'critical') return 'font-semibold text-red-700';
  if (state === 'warning') return 'font-semibold text-amber-700';
  return 'font-semibold text-emerald-700';
}

function limitFillClass(state: string) {
  if (state === 'critical') return 'bg-red-500';
  if (state === 'warning') return 'bg-amber-500';
  return 'bg-emerald-600';
}

function statusClass(tone: string) {
  if (tone === 'critical') return 'bg-red-50 text-red-700';
  if (tone === 'warning') return 'bg-amber-50 text-amber-700';
  if (tone === 'good') return 'bg-emerald-50 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
}
