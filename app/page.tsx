'use client';

import { useMemo, useState, type FormEvent } from 'react';
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
  Download,
  FileCheck2,
  Gauge,
  Landmark,
  Layers3,
  LineChart,
  LockKeyhole,
  Plus,
  RadioTower,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Scenario = 'base' | 'stress' | 'optimistic';
type Currency = 'KGS' | 'USD' | 'EUR' | 'CNY';
type Tone = 'good' | 'warning' | 'critical' | 'neutral';

const scenarioConfig: Record<Scenario, { label: string; outflowFactor: number; inflowFactor: number }> = {
  base: { label: 'Базовый', outflowFactor: 1, inflowFactor: 1 },
  stress: { label: 'Стресс', outflowFactor: 1.18, inflowFactor: 0.88 },
  optimistic: { label: 'Оптимистичный', outflowFactor: 0.92, inflowFactor: 1.08 },
};

const currencyLimits: Record<Currency, { reserve: number; unit: string; balance: number }> = {
  KGS: { reserve: 900, unit: 'млн KGS', balance: 1420 },
  USD: { reserve: 8, unit: 'млн USD', balance: 12.4 },
  EUR: { reserve: 2.4, unit: 'млн EUR', balance: 3.1 },
  CNY: { reserve: 7, unit: 'млн CNY', balance: 9.8 },
};

const baseForecast = [
  { day: '04.09', label: 'Сегодня', inflow: 980, outflow: 760, balance: 1420 },
  { day: '05.09', label: 'Сб', inflow: 620, outflow: 830, balance: 1210 },
  { day: '06.09', label: 'Вс', inflow: 410, outflow: 722, balance: 898 },
  { day: '07.09', label: 'Пн', inflow: 740, outflow: 515, balance: 1123 },
  { day: '08.09', label: 'Вт', inflow: 860, outflow: 690, balance: 1293 },
  { day: '09.09', label: 'Ср', inflow: 530, outflow: 610, balance: 1213 },
  { day: '10.09', label: 'Чт', inflow: 910, outflow: 640, balance: 1483 },
];

const initialFlows = [
  {
    time: '09:30',
    source: 'Погашение кредитов МСБ',
    owner: 'Кредитный блок',
    type: 'Поступление',
    amount: '+245 млн KGS',
    impact: 245,
    status: 'Подтверждено',
    tone: 'good' as Tone,
  },
  {
    time: '11:00',
    source: 'Возврат депозитов физлиц',
    owner: 'Депозитный отдел',
    type: 'Расход',
    amount: '-318 млн KGS',
    impact: -318,
    status: 'В прогнозе',
    tone: 'warning' as Tone,
  },
  {
    time: '13:20',
    source: 'Покупка USD для клиента',
    owner: 'Валютные операции',
    type: 'FX',
    amount: '-2.1 млн USD',
    impact: -186,
    status: 'Согласование',
    tone: 'critical' as Tone,
  },
  {
    time: '15:00',
    source: 'Межбанк overnight',
    owner: 'Казначейство',
    type: 'Размещение',
    amount: '-400 млн KGS',
    impact: -400,
    status: 'Рекомендация',
    tone: 'neutral' as Tone,
  },
];

const roadmap = [
  { title: 'Роли и доступы', body: 'Казначей, риск-менеджер, руководитель, филиал, аудитор.', state: 'MVP' },
  { title: 'Заявки подразделений', body: 'Создание, согласование, исполнение, отмена, комментарии.', state: 'Next' },
  { title: 'Интеграции с АБС', body: 'Остатки, проводки, корр. счета, депозиты, кредиты, FX.', state: 'Core' },
  { title: 'Расчетный движок', body: 'Свободный ресурс, кассовый разрыв, лимиты, валютная позиция.', state: 'Core' },
  { title: 'Сценарии и стресс-тесты', body: 'Отток депозитов, задержка поступлений, валютный спрос.', state: 'Risk' },
  { title: 'Уведомления', body: 'Email, SMS, внутренние уведомления, критические алерты.', state: 'Ops' },
  { title: 'Отчетность', body: 'План-факт, лимиты, ликвидность, межбанк, экспорт Excel/PDF.', state: 'Reports' },
  { title: 'Аудит и безопасность', body: 'Журнал действий, история расчетов, шифрование, approvals.', state: 'Bank' },
];

const navItems = [
  { label: 'Позиция', icon: Gauge },
  { label: 'Потоки', icon: Activity },
  { label: 'Лимиты', icon: ShieldAlert },
  { label: 'Заявки', icon: FileCheck2 },
  { label: 'Доработки', icon: Layers3 },
];

export default function Home() {
  const [scenario, setScenario] = useState<Scenario>('base');
  const [currency, setCurrency] = useState<Currency>('KGS');
  const [manualOutflow, setManualOutflow] = useState(0);
  const [requestAmount, setRequestAmount] = useState('120');
  const [requestTitle, setRequestTitle] = useState('Крупный клиентский платеж');
  const [flows, setFlows] = useState(initialFlows);

  const reserve = currencyLimits[currency].reserve;
  const forecast = useMemo(() => {
    const cfg = scenarioConfig[scenario];
    return baseForecast.map((item, index) => {
      const adjustedInflow = Math.round(item.inflow * cfg.inflowFactor);
      const adjustedOutflow = Math.round(item.outflow * cfg.outflowFactor) + (index === 0 ? manualOutflow : 0);
      const delta = adjustedInflow - adjustedOutflow;
      return {
        ...item,
        inflow: adjustedInflow,
        outflow: adjustedOutflow,
        balance: Math.max(0, item.balance + delta - (item.inflow - item.outflow)),
      };
    });
  }, [scenario, manualOutflow]);

  const minBalance = Math.min(...forecast.map((item) => item.balance));
  const riskDay = forecast.find((item) => item.balance <= reserve + 20)?.day ?? 'нет';
  const deficit = Math.max(0, reserve - minBalance);
  const totalInflow = forecast.reduce((sum, item) => sum + item.inflow, 0);
  const totalOutflow = forecast.reduce((sum, item) => sum + item.outflow, 0);
  const maxBalance = Math.max(...forecast.map((item) => item.balance), reserve);

  function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(requestAmount) || 0;
    if (!requestTitle.trim() || value <= 0) return;

    setFlows((current) => [
      {
        time: 'Новая',
        source: requestTitle.trim(),
        owner: 'Подразделение',
        type: 'Заявка',
        amount: `-${value} млн ${currency}`,
        impact: -value,
        status: 'На согласовании',
        tone: value > 250 ? 'critical' : 'warning',
      },
      ...current,
    ]);
    setManualOutflow((current) => current + value);
    setRequestTitle('');
    setRequestAmount('120');
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <AnimatedBackdrop />

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
                href={`#${item.label.toLowerCase()}`}
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

        <Card className="mt-7 border-white/10 bg-white/[0.06] text-white shadow-none ring-white/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <RadioTower size={18} className="text-teal-300" aria-hidden="true" />
                Live feed
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-300" />
              </span>
            </CardTitle>
            <CardDescription className="text-white/58">
              Синхронизация с АБС, депозитами и FX: 22 секунды назад.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="absolute bottom-5 left-4 right-4 border-white/10 bg-white/[0.06] text-white shadow-none ring-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <LockKeyhole size={17} className="text-amber-300" aria-hidden="true" />
              Банковский контур
            </CardTitle>
            <CardDescription className="text-white/55">
              Это интерактивный прототип. Следующий шаг: хранение заявок и роли.
            </CardDescription>
          </CardHeader>
        </Card>
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
              <Button variant="outline" size="lg">
                <CalendarDays aria-hidden="true" />
                7 дней
              </Button>
              <Button size="lg" className="shadow-[0_14px_30px_rgba(15,118,110,0.25)]">
                <Bell aria-hidden="true" />
                Проверить риски
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-8">
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_420px]">
            <Card className="relative overflow-hidden border bg-card/92 shadow-[0_24px_70px_rgba(31,41,55,0.09)]">
              <div className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(115deg,transparent,rgba(20,184,166,0.11),rgba(245,158,11,0.09))]" />
              <CardContent className="relative grid gap-6 xl:grid-cols-[1fr_310px]">
                <div>
                  <Badge variant="outline" className="h-7 gap-2 bg-background/70">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Tailwind CSS · Shadcn UI · Aceternity-style motion
                  </Badge>
                  <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                    Не просто дашборд, а рабочее место казначея.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Сценарии, фильтры, заявки и лимиты уже связаны: изменение заявки сразу влияет на
                    прогнозный остаток и риск дефицита.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <MiniSignal label="Мин. остаток" value={`${minBalance} млн`} trend={deficit > 0 ? 'дефицит' : 'OK'} />
                    <MiniSignal label="День риска" value={riskDay} trend={scenarioConfig[scenario].label} />
                    <MiniSignal label="Свободно" value={`${Math.max(0, minBalance - reserve)} млн`} trend={currency} />
                  </div>
                </div>

                <PulseCard reserve={reserve} maxBalance={maxBalance} forecast={forecast} currency={currency} />
              </CardContent>
            </Card>

            <Card className="shadow-[0_24px_70px_rgba(31,41,55,0.08)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Панель управления</span>
                  <SlidersHorizontal size={20} className="text-muted-foreground" aria-hidden="true" />
                </CardTitle>
                <CardDescription>Меняет расчет прогноза прямо на экране.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-medium">Сценарий</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(scenarioConfig).map(([key, config]) => (
                      <Button
                        key={key}
                        type="button"
                        variant={scenario === key ? 'default' : 'outline'}
                        onClick={() => setScenario(key as Scenario)}
                      >
                        {config.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Валюта</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.keys(currencyLimits).map((code) => (
                      <Button
                        key={code}
                        type="button"
                        variant={currency === code ? 'secondary' : 'outline'}
                        onClick={() => setCurrency(code as Currency)}
                      >
                        {code}
                      </Button>
                    ))}
                  </div>
                </div>

                <form onSubmit={createRequest} className="rounded-xl border bg-background/70 p-4">
                  <p className="text-sm font-semibold">Новая заявка</p>
                  <div className="mt-3 space-y-3">
                    <Input
                      aria-label="Название заявки"
                      value={requestTitle}
                      onChange={(event) => setRequestTitle(event.target.value)}
                      placeholder="Название операции"
                    />
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <Input
                        aria-label="Сумма заявки"
                        type="number"
                        min="1"
                        value={requestAmount}
                        onChange={(event) => setRequestAmount(event.target.value)}
                        placeholder="Сумма"
                      />
                      <Button type="submit">
                        <Plus aria-hidden="true" />
                        Добавить
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ключевые показатели">
            <MetricCard title="Свободная ликвидность" value={`${Math.max(0, minBalance - reserve)} млн`} detail={currency} state={deficit > 0 ? 'critical' : 'good'} icon={Banknote} />
            <MetricCard title="Прогнозный дефицит" value={`${deficit} млн`} detail={deficit > 0 ? `риск ${riskDay}` : 'лимит не нарушен'} state={deficit > 0 ? 'critical' : 'good'} icon={AlertTriangle} />
            <MetricCard title="Поступления 7 дней" value={`${totalInflow} млн`} detail="по выбранному сценарию" state="good" icon={ArrowUpRight} />
            <MetricCard title="Списания 7 дней" value={`${totalOutflow} млн`} detail={`${manualOutflow} млн ручных заявок`} state={manualOutflow > 250 ? 'warning' : 'neutral'} icon={ArrowDownRight} />
          </section>

          <Tabs defaultValue="forecast" className="space-y-4">
            <TabsList className="h-10">
              <TabsTrigger value="forecast" className="px-4">Прогноз</TabsTrigger>
              <TabsTrigger value="flows" className="px-4">Потоки</TabsTrigger>
              <TabsTrigger value="limits" className="px-4">Лимиты</TabsTrigger>
              <TabsTrigger value="roadmap" className="px-4">Все доработки</TabsTrigger>
            </TabsList>

            <TabsContent value="forecast">
              <Card>
                <CardHeader>
                  <CardTitle>7-дневный прогноз ликвидности</CardTitle>
                  <CardDescription>Бары пересчитываются при смене сценария или добавлении заявки.</CardDescription>
                  <CardAction>
                    <Badge variant={deficit > 0 ? 'destructive' : 'secondary'}>
                      {deficit > 0 ? 'Action required' : 'OK'}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="grid h-80 grid-cols-7 items-end gap-3 border-b border-l px-3 pb-4">
                    {forecast.map((item, index) => (
                      <div key={item.day} className="flex h-full flex-col justify-end gap-2">
                        <div className="relative flex flex-1 items-end">
                          <span
                            className="absolute inset-x-0 border-t border-dashed border-red-400/70"
                            style={{ bottom: `${(reserve / maxBalance) * 100}%` }}
                          />
                          <div
                            className={`forecast-bar w-full rounded-t-lg ${
                              item.balance < reserve
                                ? 'bg-red-500'
                                : item.balance < reserve + 250
                                  ? 'bg-amber-500'
                                  : 'bg-primary'
                            }`}
                            style={{
                              height: `${(item.balance / maxBalance) * 100}%`,
                              animationDelay: `${index * 80}ms`,
                            }}
                            title={`${item.balance} млн`}
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
                    <FlowSummary label="Поступления" value={`+${totalInflow} млн`} tone="positive" />
                    <FlowSummary label="Списания" value={`-${totalOutflow} млн`} tone="negative" />
                    <FlowSummary label="Чистый поток" value={`${totalInflow - totalOutflow} млн`} tone="neutral" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flows">
              <Card>
                <CardHeader>
                  <CardTitle>Операционный поток</CardTitle>
                  <CardDescription>Заявки, подтвержденные потоки и операции, влияющие на позицию.</CardDescription>
                  <CardAction>
                    <Button variant="outline">
                      <Download aria-hidden="true" />
                      Экспорт
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Время</TableHead>
                        <TableHead>Операция</TableHead>
                        <TableHead>Владелец</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flows.map((flow) => (
                        <TableRow key={`${flow.time}-${flow.source}-${flow.amount}`}>
                          <TableCell className="text-muted-foreground">{flow.time}</TableCell>
                          <TableCell className="font-medium">{flow.source}</TableCell>
                          <TableCell className="text-muted-foreground">{flow.owner}</TableCell>
                          <TableCell>{flow.type}</TableCell>
                          <TableCell className="font-semibold">{flow.amount}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusClass(flow.tone)}>
                              {flow.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="limits">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <LimitCard name="Минимальный остаток" used={Math.min(100, Math.round((reserve / Math.max(minBalance, 1)) * 100))} value={`${minBalance} / ${reserve} млн`} state={deficit > 0 ? 'critical' : 'good'} />
                <LimitCard name="Межбанк overnight" used={72} value="1.8 / 2.5 млрд" state="warning" />
                <LimitCard name="Корреспондентский счет USD" used={61} value="12.4 / 20 млн" state="good" />
                <LimitCard name="Крупные платежи до 17:00" used={48} value={`${flows.length} операций`} state="good" />
              </div>
            </TabsContent>

            <TabsContent value="roadmap">
              <Card>
                <CardHeader>
                  <CardTitle>Все необходимые доработки до банковского уровня</CardTitle>
                  <CardDescription>Это полный backlog системы, который будем закрывать постепенно.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {roadmap.map((item) => (
                      <div key={item.title} className="rounded-xl border bg-background/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.title}</p>
                            <p className="mt-2 text-sm leading-5 text-muted-foreground">{item.body}</p>
                          </div>
                          <Badge variant="secondary">{item.state}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <section className="grid gap-6 xl:grid-cols-3">
            <DecisionCard
              icon={Building2}
              title="Что есть сейчас"
              value="Интерактивный MVP"
              text="Сценарии, ручная заявка, пересчет прогноза, таблица операций и лимиты."
            />
            <DecisionCard
              icon={RefreshCw}
              title="Следующий этап"
              value="Заявки + роли"
              text="Сделать сохранение заявок, маршруты согласования и права пользователей."
            />
            <DecisionCard
              icon={CheckCircle2}
              title="Финальная цель"
              value="Bank-grade system"
              text="Интеграции, аудит, лимиты, стресс-тесты, отчеты и уведомления."
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function AnimatedBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-70">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(44,62,80,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(44,62,80,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(23,151,139,0.18),transparent_62%)]" />
      <div className="moving-spot absolute left-1/3 top-16 h-36 w-36 rounded-full bg-teal-400/12 blur-3xl" />
    </div>
  );
}

function PulseCard({
  reserve,
  maxBalance,
  forecast,
  currency,
}: {
  reserve: number;
  maxBalance: number;
  forecast: Array<{ balance: number }>;
  currency: Currency;
}) {
  const lastPoint = forecast[Math.min(3, forecast.length - 1)].balance;
  const y = 122 - (lastPoint / maxBalance) * 92;

  return (
    <Card className="border bg-background/82 shadow-inner backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          Liquidity pulse
          <Activity size={18} className="text-muted-foreground" aria-hidden="true" />
        </CardTitle>
        <CardDescription>{currency} · линия лимита показана красным</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-40 overflow-hidden rounded-lg bg-[linear-gradient(180deg,rgba(20,184,166,0.11),rgba(255,255,255,0.35))] p-2">
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
            <line x1="0" y1={122 - (reserve / maxBalance) * 92} x2="280" y2={122 - (reserve / maxBalance) * 92} stroke="rgb(239,68,68)" strokeDasharray="6 8" />
            <circle className="cash-dot" cx="148" cy={y} r="6" fill="rgb(245,158,11)" />
          </svg>
        </div>
      </CardContent>
    </Card>
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

function MetricCard({
  title,
  value,
  detail,
  state,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  state: Tone;
  icon: LucideIcon;
}) {
  return (
    <Card className="metric-card bg-card/86 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <CardAction>
          <div className={`grid h-10 w-10 place-items-center rounded-lg ${stateIconClass(state)}`}>
            <Icon size={20} aria-hidden="true" />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function FlowSummary({ label, value, tone }: { label: string; value: string; tone: 'positive' | 'negative' | 'neutral' }) {
  const toneClass = tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-red-700' : 'text-foreground';
  return (
    <div className="rounded-lg border bg-background/70 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        {tone === 'positive' ? <ArrowUpRight size={15} aria-hidden="true" /> : tone === 'negative' ? <ArrowDownRight size={15} aria-hidden="true" /> : <Banknote size={15} aria-hidden="true" />}
        выбранный сценарий
      </div>
    </div>
  );
}

function LimitCard({ name, used, value, state }: { name: string; used: number; value: string; state: Tone }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{value}</CardDescription>
        <CardAction>
          <Badge variant={state === 'critical' ? 'destructive' : 'outline'} className={stateTextClass(state)}>
            {state === 'critical' ? 'Critical' : state === 'warning' ? 'Watch' : 'OK'}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div className={`limit-fill h-2.5 rounded-full ${limitFillClass(state)}`} style={{ width: `${Math.min(100, used)}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

function DecisionCard({ icon: Icon, title, value, text }: { icon: LucideIcon; title: string; value: string; text: string }) {
  return (
    <Card className="transition hover:-translate-y-1 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
            <Icon size={20} aria-hidden="true" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold tracking-tight">{value}</p>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

function stateIconClass(state: Tone) {
  if (state === 'critical') return 'bg-red-50 text-red-700';
  if (state === 'warning') return 'bg-amber-50 text-amber-700';
  if (state === 'good') return 'bg-emerald-50 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
}

function stateTextClass(state: Tone) {
  if (state === 'critical') return 'font-semibold text-red-700';
  if (state === 'warning') return 'font-semibold text-amber-700';
  if (state === 'good') return 'font-semibold text-emerald-700';
  return 'font-semibold text-slate-700';
}

function limitFillClass(state: Tone) {
  if (state === 'critical') return 'bg-red-500';
  if (state === 'warning') return 'bg-amber-500';
  if (state === 'good') return 'bg-emerald-600';
  return 'bg-slate-500';
}

function statusClass(tone: Tone) {
  if (tone === 'critical') return 'border-red-200 bg-red-50 text-red-700';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (tone === 'good') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-slate-200 bg-slate-100 text-slate-700';
}
