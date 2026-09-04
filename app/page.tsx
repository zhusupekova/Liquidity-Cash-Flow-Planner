'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Bell,
  BookOpenCheck,
  Building2,
  CalendarDays,
  Check,
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
  Search,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  History,
  UsersRound,
  X,
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
type FlowStatus = 'Подтверждено' | 'В прогнозе' | 'Согласование' | 'Рекомендация' | 'На согласовании' | 'Согласовано' | 'Отклонено';
type StatusFilter = 'Все' | 'На согласовании' | 'Согласовано' | 'Отклонено';
type UserRole = 'Казначей' | 'Риск-менеджер' | 'Руководитель' | 'Аудитор';

type Flow = {
  id: number;
  time: string;
  source: string;
  owner: string;
  type: string;
  amount: string;
  currency: Currency;
  impact: number;
  status: FlowStatus;
  tone: Tone;
};

type AuditEvent = {
  id: number;
  time: string;
  action: string;
  detail: string;
};

const scenarioConfig: Record<Scenario, { label: string; outflowFactor: number; inflowFactor: number }> = {
  base: { label: 'Базовый', outflowFactor: 1, inflowFactor: 1 },
  stress: { label: 'Стресс', outflowFactor: 1.18, inflowFactor: 0.88 },
  optimistic: { label: 'Оптимистичный', outflowFactor: 0.92, inflowFactor: 1.08 },
};

const currencyLimits: Record<Currency, { reserve: number; balance: number }> = {
  KGS: { reserve: 900, balance: 1420 },
  USD: { reserve: 8, balance: 12.4 },
  EUR: { reserve: 2.4, balance: 3.1 },
  CNY: { reserve: 7, balance: 9.8 },
};

const roleAccess: Record<UserRole, { canCreate: boolean; canApprove: boolean; canSetLimits: boolean; description: string }> = {
  Казначей: {
    canCreate: true,
    canApprove: true,
    canSetLimits: false,
    description: 'Создает и согласовывает операционные заявки.',
  },
  'Риск-менеджер': {
    canCreate: false,
    canApprove: false,
    canSetLimits: true,
    description: 'Настраивает лимиты и контролирует нарушения.',
  },
  Руководитель: {
    canCreate: false,
    canApprove: true,
    canSetLimits: false,
    description: 'Видит сводку и может утверждать критические решения.',
  },
  Аудитор: {
    canCreate: false,
    canApprove: false,
    canSetLimits: false,
    description: 'Только просмотр и контроль журнала действий.',
  },
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

const initialFlows: Flow[] = [
  {
    id: 1,
    time: '09:30',
    source: 'Погашение кредитов МСБ',
    owner: 'Кредитный блок',
    type: 'Поступление',
    amount: '+245 млн KGS',
    currency: 'KGS',
    impact: 245,
    status: 'Подтверждено',
    tone: 'good',
  },
  {
    id: 2,
    time: '11:00',
    source: 'Возврат депозитов физлиц',
    owner: 'Депозитный отдел',
    type: 'Расход',
    amount: '-318 млн KGS',
    currency: 'KGS',
    impact: -318,
    status: 'В прогнозе',
    tone: 'warning',
  },
  {
    id: 3,
    time: '13:20',
    source: 'Покупка USD для клиента',
    owner: 'Валютные операции',
    type: 'FX',
    amount: '-2.1 млн USD',
    currency: 'USD',
    impact: -186,
    status: 'Согласование',
    tone: 'critical',
  },
  {
    id: 4,
    time: '15:00',
    source: 'Межбанк overnight',
    owner: 'Казначейство',
    type: 'Размещение',
    amount: '-400 млн KGS',
    currency: 'KGS',
    impact: -400,
    status: 'Рекомендация',
    tone: 'neutral',
  },
];

const roadmap = [
  { title: 'Роли и доступы', body: 'RBAC: казначей, риск, руководитель, филиал, аудитор.', state: 'Critical' },
  { title: 'Сохранение заявок', body: 'База данных, история статусов, комментарии и вложения.', state: 'Critical' },
  { title: 'Маршруты согласования', body: 'Правила: сумма, валюта, тип операции, лимит, подразделение.', state: 'Critical' },
  { title: 'Интеграции с АБС', body: 'Остатки, проводки, корр. счета, депозиты, кредиты и FX.', state: 'Core' },
  { title: 'Расчетный движок', body: 'Свободный ресурс, кассовый разрыв, лимиты, валютная позиция.', state: 'Core' },
  { title: 'Стресс-тесты', body: 'Отток депозитов, задержка поступлений, спрос на валюту.', state: 'Risk' },
  { title: 'Уведомления', body: 'Email, SMS, push внутри системы, критические эскалации.', state: 'Ops' },
  { title: 'Отчетность', body: 'План-факт, лимиты, ликвидность, межбанк, Excel/PDF.', state: 'Reports' },
  { title: 'Аудит и безопасность', body: 'Журнал действий, immutable history, шифрование, approvals.', state: 'Bank' },
  { title: 'Администрирование лимитов', body: 'Настройка лимитов по валютам, филиалам, счетам и операциям.', state: 'Bank' },
];

const passportSections = [
  {
    title: 'Назначение системы',
    icon: BookOpenCheck,
    body: 'Автоматизированная система внутрибанковского операционного планирования и управления лимитами ликвидности для казначейства, риск-менеджмента и руководства банка.',
  },
  {
    title: 'Проблема',
    icon: AlertTriangle,
    body: 'Ручные расчеты в Excel, позднее согласование заявок, разрозненные данные по депозитам, кредитам, валюте и межбанку приводят к риску кассовых разрывов и неэффективному использованию свободных средств.',
  },
  {
    title: 'Решение',
    icon: LineChart,
    body: 'Единый дашборд собирает денежные потоки, рассчитывает прогноз ликвидности, контролирует лимиты, показывает алерты и поддерживает workflow заявок с аудитом действий.',
  },
  {
    title: 'Пользователи',
    icon: UsersRound,
    body: 'Казначей, риск-менеджер, руководитель, сотрудник подразделения, аудитор и администратор системы.',
  },
  {
    title: 'Архитектура',
    icon: ServerCog,
    body: 'Frontend на React/Vinext, Tailwind CSS и Shadcn UI; далее backend API, база данных, интеграционный слой с АБС и сервис уведомлений.',
  },
  {
    title: 'Безопасность',
    icon: ShieldCheck,
    body: 'Ролевая модель доступа, журнал аудита, контроль лимитов, разделение прав на создание, согласование и изменение лимитов.',
  },
];

const navItems = [
  { label: 'Позиция', icon: Gauge },
  { label: 'Потоки', icon: Activity },
  { label: 'Лимиты', icon: ShieldAlert },
  { label: 'Заявки', icon: FileCheck2 },
  { label: 'Доработки', icon: Layers3 },
];

const opsChecklist = [
  'Подтвердить крупные депозитные оттоки до 12:30',
  'Согласовать валютные заявки клиентов до 14:00',
  'Оставить резерв KGS выше минимального лимита',
  'Зафиксировать решение по overnight-размещению',
];

const presentationPlan = [
  'Кратко объяснить проблему ручного планирования ликвидности.',
  'Показать главный дашборд: прогноз, дефицит, лимиты, алерты.',
  'Создать заявку и показать, как она влияет на прогноз.',
  'Согласовать или отклонить заявку и открыть журнал аудита.',
  'Переключить роль пользователя и показать ограничение прав.',
  'Открыть вкладку доработок и объяснить путь до промышленной версии.',
];

export default function Home() {
  const [scenario, setScenario] = useState<Scenario>('base');
  const [currency, setCurrency] = useState<Currency>('KGS');
  const [role, setRole] = useState<UserRole>('Казначей');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Все');
  const [requestAmount, setRequestAmount] = useState('120');
  const [requestTitle, setRequestTitle] = useState('Крупный клиентский платеж');
  const [limitDraft, setLimitDraft] = useState('900');
  const [limitOverrides, setLimitOverrides] = useState<Record<Currency, number>>({
    KGS: currencyLimits.KGS.reserve,
    USD: currencyLimits.USD.reserve,
    EUR: currencyLimits.EUR.reserve,
    CNY: currencyLimits.CNY.reserve,
  });
  const [flows, setFlows] = useState(initialFlows);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([
    {
      id: 100,
      time: '09:12',
      action: 'Синхронизация',
      detail: 'Загружены остатки по KGS, USD, EUR, CNY.',
    },
    {
      id: 101,
      time: '09:30',
      action: 'Подтверждение',
      detail: 'Кредитный блок подтвердил поступление 245 млн KGS.',
    },
  ]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedFlows = window.localStorage.getItem('liquidity-planner-flows');
    const savedAudit = window.localStorage.getItem('liquidity-planner-audit');
    const savedLimits = window.localStorage.getItem('liquidity-planner-limits');
    const savedRole = window.localStorage.getItem('liquidity-planner-role') as UserRole | null;

    if (savedFlows) {
      setFlows(JSON.parse(savedFlows) as Flow[]);
    }
    if (savedAudit) {
      setAuditLog(JSON.parse(savedAudit) as AuditEvent[]);
    }
    if (savedLimits) {
      const parsedLimits = JSON.parse(savedLimits) as Record<Currency, number>;
      setLimitOverrides(parsedLimits);
      setLimitDraft(String(parsedLimits.KGS ?? currencyLimits.KGS.reserve));
    }
    if (savedRole && savedRole in roleAccess) {
      setRole(savedRole);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem('liquidity-planner-flows', JSON.stringify(flows));
    window.localStorage.setItem('liquidity-planner-audit', JSON.stringify(auditLog));
    window.localStorage.setItem('liquidity-planner-limits', JSON.stringify(limitOverrides));
    window.localStorage.setItem('liquidity-planner-role', role);
  }, [auditLog, flows, isHydrated, limitOverrides, role]);

  useEffect(() => {
    setLimitDraft(String(limitOverrides[currency]));
  }, [currency, limitOverrides]);

  const selectedFlows = flows.filter((flow) => {
    const currencyMatch = flow.currency === currency;
    const statusMatch =
      statusFilter === 'Все' ||
      flow.status === statusFilter ||
      (statusFilter === 'На согласовании' && flow.status === 'Согласование');
    const queryMatch = `${flow.source} ${flow.owner} ${flow.type} ${flow.amount} ${flow.status}`
      .toLowerCase()
      .includes(query.toLowerCase());

    return currencyMatch && statusMatch && queryMatch;
  });
  const pendingCount = flows.filter((flow) => flow.status === 'На согласовании' || flow.status === 'Согласование').length;
  const approvedCount = flows.filter((flow) => flow.status === 'Согласовано' || flow.status === 'Подтверждено').length;
  const rejectedCount = flows.filter((flow) => flow.status === 'Отклонено').length;
  const manualOutflow = flows
    .filter((flow) => flow.status !== 'Отклонено' && flow.impact < 0 && flow.time === 'Новая')
    .reduce((sum, flow) => sum + Math.abs(flow.impact), 0);

  const activeAccess = roleAccess[role];
  const reserve = limitOverrides[currency];
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
  const alertCount = Number(deficit > 0) + Number(pendingCount > 0) + Number(manualOutflow > 250);

  function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeAccess.canCreate) {
      addAudit('Доступ запрещен', `${role} не может создавать заявки.`);
      return;
    }
    const value = Number(requestAmount) || 0;
    if (!requestTitle.trim() || value <= 0) return;

    setFlows((current) => [
      {
        id: Date.now(),
        time: 'Новая',
        source: requestTitle.trim(),
        owner: 'Подразделение',
        type: 'Заявка',
        amount: `-${value} млн ${currency}`,
        currency,
        impact: -value,
        status: 'На согласовании',
        tone: value > 250 ? 'critical' : 'warning',
      },
      ...current,
    ]);
    addAudit('Создана заявка', `${requestTitle.trim()} на ${value} млн ${currency}.`);
    setRequestTitle('');
    setRequestAmount('120');
  }

  function updateFlowStatus(id: number, status: 'Согласовано' | 'Отклонено') {
    if (!activeAccess.canApprove) {
      addAudit('Доступ запрещен', `${role} не может согласовывать заявки.`);
      return;
    }
    const target = flows.find((flow) => flow.id === id);
    setFlows((current) =>
      current.map((flow) =>
        flow.id === id
          ? {
              ...flow,
              status,
              tone: status === 'Согласовано' ? 'good' : 'neutral',
            }
          : flow,
      ),
    );
    if (target) {
      addAudit(status, `${target.source}: ${target.amount}.`);
    }
  }

  function addAudit(action: string, detail: string) {
    const time = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
    setAuditLog((current) => [{ id: Date.now(), time, action, detail }, ...current].slice(0, 8));
  }

  function resetDemo() {
    setFlows(initialFlows);
    setAuditLog([
      {
        id: Date.now(),
        time: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
        action: 'Сброс демо',
        detail: 'Потоки и журнал возвращены к исходному состоянию.',
      },
    ]);
    setQuery('');
    setStatusFilter('Все');
    setLimitOverrides({
      KGS: currencyLimits.KGS.reserve,
      USD: currencyLimits.USD.reserve,
      EUR: currencyLimits.EUR.reserve,
      CNY: currencyLimits.CNY.reserve,
    });
    setRole('Казначей');
  }

  function updateLimit() {
    if (!activeAccess.canSetLimits) {
      addAudit('Доступ запрещен', `${role} не может менять лимиты.`);
      return;
    }
    const value = Number(limitDraft);
    if (!Number.isFinite(value) || value <= 0) return;
    setLimitOverrides((current) => ({ ...current, [currency]: value }));
    addAudit('Изменен лимит', `${currency}: новый минимальный остаток ${value} млн.`);
  }

  function exportCsv() {
    const header = ['time', 'source', 'owner', 'type', 'amount', 'status'];
    const rows = selectedFlows.map((flow) => [
      flow.time,
      flow.source,
      flow.owner,
      flow.type,
      flow.amount,
      flow.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'liquidity-flows.csv';
    link.click();
    URL.revokeObjectURL(url);
    addAudit('Экспорт CSV', `Выгружено ${selectedFlows.length} операций.`);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <AnimatedBackdrop />
      <Sidebar pendingCount={pendingCount} />

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
              <Button variant="outline" size="lg" onClick={resetDemo}>
                <RefreshCw aria-hidden="true" />
                Сбросить демо
              </Button>
              <Button size="lg" className="shadow-[0_14px_30px_rgba(15,118,110,0.25)]">
                <Bell aria-hidden="true" />
                {alertCount} алерта
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
                    Official practice project · Tailwind CSS · Shadcn UI
                  </Badge>
                  <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                    Liquidity & Cash Flow Planner для банка.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Официальный учебный прототип системы внутрибанковского планирования ликвидности:
                    прогноз, лимиты, заявки, роли, аудит и план промышленного внедрения.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <MiniSignal label="Мин. остаток" value={`${minBalance} млн`} trend={deficit > 0 ? 'дефицит' : 'OK'} />
                    <MiniSignal label="День риска" value={riskDay} trend={scenarioConfig[scenario].label} />
                    <MiniSignal label="Очередь" value={`${pendingCount} заявок`} trend={`${approvedCount} согласовано`} />
                  </div>
                </div>

                <PulseCard reserve={reserve} maxBalance={maxBalance} forecast={forecast} currency={currency} />
              </CardContent>
            </Card>

            <ControlPanel
              scenario={scenario}
              currency={currency}
              role={role}
              activeAccess={activeAccess}
              query={query}
              statusFilter={statusFilter}
              requestAmount={requestAmount}
              requestTitle={requestTitle}
              limitDraft={limitDraft}
              setScenario={setScenario}
              setCurrency={setCurrency}
              setRole={setRole}
              setQuery={setQuery}
              setStatusFilter={setStatusFilter}
              setRequestAmount={setRequestAmount}
              setRequestTitle={setRequestTitle}
              setLimitDraft={setLimitDraft}
              createRequest={createRequest}
              updateLimit={updateLimit}
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ключевые показатели">
            <MetricCard title="Свободная ликвидность" value={`${Math.max(0, minBalance - reserve)} млн`} detail={currency} state={deficit > 0 ? 'critical' : 'good'} icon={Banknote} />
            <MetricCard title="Прогнозный дефицит" value={`${deficit} млн`} detail={deficit > 0 ? `риск ${riskDay}` : 'лимит не нарушен'} state={deficit > 0 ? 'critical' : 'good'} icon={AlertTriangle} />
            <MetricCard title="На согласовании" value={`${pendingCount}`} detail={`${approvedCount} согласовано · ${rejectedCount} отклонено`} state={pendingCount > 0 ? 'warning' : 'good'} icon={FileCheck2} />
            <MetricCard title="Ручные заявки" value={`${manualOutflow} млн`} detail="влияют на прогноз сегодня" state={manualOutflow > 250 ? 'warning' : 'neutral'} icon={ArrowDownRight} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <AlertCenter deficit={deficit} pendingCount={pendingCount} manualOutflow={manualOutflow} riskDay={riskDay} />
            <Checklist />
          </section>

          <Tabs defaultValue="forecast" className="space-y-4">
            <TabsList className="h-10 flex-wrap">
              <TabsTrigger value="forecast" className="px-4">Прогноз</TabsTrigger>
              <TabsTrigger value="passport" className="px-4">Паспорт</TabsTrigger>
              <TabsTrigger value="flows" className="px-4">Потоки</TabsTrigger>
              <TabsTrigger value="limits" className="px-4">Лимиты</TabsTrigger>
              <TabsTrigger value="audit" className="px-4">Аудит</TabsTrigger>
              <TabsTrigger value="roadmap" className="px-4">Все доработки</TabsTrigger>
            </TabsList>

            <TabsContent value="forecast">
              <ForecastCard
                forecast={forecast}
                maxBalance={maxBalance}
                reserve={reserve}
                deficit={deficit}
                totalInflow={totalInflow}
                totalOutflow={totalOutflow}
              />
            </TabsContent>

            <TabsContent value="passport">
              <ProjectPassport />
            </TabsContent>

            <TabsContent value="flows">
              <FlowsCard
                flows={selectedFlows}
                canApprove={activeAccess.canApprove}
                updateFlowStatus={updateFlowStatus}
                exportCsv={exportCsv}
              />
            </TabsContent>

            <TabsContent value="limits">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <LimitCard name="Минимальный остаток" used={Math.min(100, Math.round((reserve / Math.max(minBalance, 1)) * 100))} value={`${minBalance} / ${reserve} млн`} state={deficit > 0 ? 'critical' : 'good'} />
                <LimitCard name="Межбанк overnight" used={72} value="1.8 / 2.5 млрд" state="warning" />
                <LimitCard name="Корреспондентский счет USD" used={61} value="12.4 / 20 млн" state="good" />
                <LimitCard name="Крупные платежи до 17:00" used={Math.min(100, flows.length * 9)} value={`${flows.length} операций`} state={flows.length > 8 ? 'warning' : 'good'} />
              </div>
            </TabsContent>

            <TabsContent value="audit">
              <AuditCard auditLog={auditLog} />
            </TabsContent>

            <TabsContent value="roadmap">
              <RoadmapCard />
            </TabsContent>
          </Tabs>

          <section className="grid gap-6 xl:grid-cols-3">
            <DecisionCard
              icon={Building2}
              title="Для презентации"
              value="Официальный прототип"
              text="Добавлены паспорт проекта, роли, лимиты, workflow, аудит и план доработок."
            />
            <DecisionCard
              icon={RefreshCw}
              title="Следующий этап"
              value="База + роли"
              text="Заявки должны сохраняться, а действия должны зависеть от роли пользователя."
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

function Sidebar({ pendingCount }: { pendingCount: number }) {
  return (
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
              {item.label === 'Заявки' ? (
                <span className="ml-auto rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-semibold text-slate-900">
                  {pendingCount}
                </span>
              ) : index === 0 ? (
                <ChevronRight className="ml-auto" size={16} aria-hidden="true" />
              ) : null}
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
            Прототип без базы. Следующий шаг: хранение заявок и роли.
          </CardDescription>
        </CardHeader>
      </Card>
    </aside>
  );
}

function ControlPanel({
  scenario,
  currency,
  role,
  activeAccess,
  query,
  statusFilter,
  requestAmount,
  requestTitle,
  limitDraft,
  setScenario,
  setCurrency,
  setRole,
  setQuery,
  setStatusFilter,
  setRequestAmount,
  setRequestTitle,
  setLimitDraft,
  createRequest,
  updateLimit,
}: {
  scenario: Scenario;
  currency: Currency;
  role: UserRole;
  activeAccess: (typeof roleAccess)[UserRole];
  query: string;
  statusFilter: StatusFilter;
  requestAmount: string;
  requestTitle: string;
  limitDraft: string;
  setScenario: (value: Scenario) => void;
  setCurrency: (value: Currency) => void;
  setRole: (value: UserRole) => void;
  setQuery: (value: string) => void;
  setStatusFilter: (value: StatusFilter) => void;
  setRequestAmount: (value: string) => void;
  setRequestTitle: (value: string) => void;
  setLimitDraft: (value: string) => void;
  createRequest: (event: FormEvent<HTMLFormElement>) => void;
  updateLimit: () => void;
}) {
  return (
    <Card className="shadow-[0_24px_70px_rgba(31,41,55,0.08)]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Панель управления</span>
          <SlidersHorizontal size={20} className="text-muted-foreground" aria-hidden="true" />
        </CardTitle>
        <CardDescription>Меняет расчет прогноза прямо на экране.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border bg-background/70 p-4">
          <p className="text-sm font-semibold">Роль пользователя</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(Object.keys(roleAccess) as UserRole[]).map((item) => (
              <Button
                key={item}
                type="button"
                variant={role === item ? 'secondary' : 'outline'}
                onClick={() => setRole(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{activeAccess.description}</p>
        </div>

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

        <div className="rounded-xl border bg-background/70 p-4">
          <p className="text-sm font-semibold">Фильтры операций</p>
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Поиск операций"
              className="pl-8"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по операции, отделу, статусу"
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(['Все', 'На согласовании', 'Согласовано', 'Отклонено'] as StatusFilter[]).map((status) => (
              <Button
                key={status}
                type="button"
                variant={statusFilter === status ? 'secondary' : 'outline'}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <form onSubmit={createRequest} className="rounded-xl border bg-background/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Новая заявка</p>
            {!activeAccess.canCreate ? <Badge variant="outline">нет доступа</Badge> : null}
          </div>
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
              <Button type="submit" disabled={!activeAccess.canCreate}>
                <Plus aria-hidden="true" />
                Добавить
              </Button>
            </div>
          </div>
        </form>

        <div className="rounded-xl border bg-background/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Настройка лимита</p>
            {!activeAccess.canSetLimits ? <Badge variant="outline">только риск</Badge> : null}
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <Input
              aria-label="Минимальный лимит ликвидности"
              type="number"
              min="1"
              value={limitDraft}
              onChange={(event) => setLimitDraft(event.target.value)}
              placeholder="Минимальный остаток"
            />
            <Button type="button" variant="secondary" onClick={updateLimit} disabled={!activeAccess.canSetLimits}>
              Сохранить
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertCenter({
  deficit,
  pendingCount,
  manualOutflow,
  riskDay,
}: {
  deficit: number;
  pendingCount: number;
  manualOutflow: number;
  riskDay: string;
}) {
  const alerts = [
    deficit > 0
      ? { title: 'Нарушение минимального остатка', body: `Дефицит ${deficit} млн ожидается ${riskDay}.`, tone: 'critical' as Tone }
      : { title: 'Лимит ликвидности в норме', body: 'Минимальный остаток не нарушен в выбранном сценарии.', tone: 'good' as Tone },
    pendingCount > 0
      ? { title: 'Есть заявки без решения', body: `${pendingCount} операции требуют согласования или отклонения.`, tone: 'warning' as Tone }
      : { title: 'Очередь согласования чистая', body: 'Нет заявок, ожидающих решения казначейства.', tone: 'good' as Tone },
    manualOutflow > 250
      ? { title: 'Ручные заявки давят на прогноз', body: `${manualOutflow} млн добавлено вручную в сегодняшний отток.`, tone: 'warning' as Tone }
      : { title: 'Ручная нагрузка умеренная', body: 'Новые заявки пока не создают заметного давления.', tone: 'neutral' as Tone },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert center</CardTitle>
        <CardDescription>Автоматические сигналы, которые должен видеть казначей.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {alerts.map((alert) => (
          <div key={alert.title} className="rounded-xl border bg-background/70 p-4">
            <Badge variant="outline" className={statusClass(alert.tone)}>
              {alert.tone === 'critical' ? 'Critical' : alert.tone === 'warning' ? 'Watch' : 'OK'}
            </Badge>
            <p className="mt-3 font-semibold">{alert.title}</p>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">{alert.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Checklist() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Операционный checklist</CardTitle>
        <CardDescription>Что должно быть закрыто до конца дня.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {opsChecklist.map((item, index) => (
          <div key={item} className="flex items-start gap-3 rounded-xl border bg-background/70 p-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <p className="text-sm leading-5">{item}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ForecastCard({
  forecast,
  maxBalance,
  reserve,
  deficit,
  totalInflow,
  totalOutflow,
}: {
  forecast: Array<{ day: string; label: string; balance: number }>;
  maxBalance: number;
  reserve: number;
  deficit: number;
  totalInflow: number;
  totalOutflow: number;
}) {
  return (
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
                    item.balance < reserve ? 'bg-red-500' : item.balance < reserve + 250 ? 'bg-amber-500' : 'bg-primary'
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
  );
}

function FlowsCard({
  flows,
  canApprove,
  updateFlowStatus,
  exportCsv,
}: {
  flows: Flow[];
  canApprove: boolean;
  updateFlowStatus: (id: number, status: 'Согласовано' | 'Отклонено') => void;
  exportCsv: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Операционный поток и согласование</CardTitle>
        <CardDescription>Заявки можно согласовать или отклонить. Отклоненные не давят на прогноз.</CardDescription>
        <CardAction>
          <Button variant="outline" onClick={exportCsv}>
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
              <TableHead>Решение</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                  Нет операций под выбранные фильтры.
                </TableCell>
              </TableRow>
            ) : (
              flows.map((flow) => {
              const needsDecision = flow.status === 'На согласовании' || flow.status === 'Согласование';
              return (
                <TableRow key={`${flow.id}-${flow.status}`}>
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
                  <TableCell>
                    {needsDecision ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!canApprove}
                          onClick={() => updateFlowStatus(flow.id, 'Согласовано')}
                        >
                          <Check aria-hidden="true" />
                          OK
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canApprove}
                          onClick={() => updateFlowStatus(flow.id, 'Отклонено')}
                        >
                          <X aria-hidden="true" />
                          Нет
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Решение не требуется</span>
                    )}
                  </TableCell>
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AuditCard({ auditLog }: { auditLog: AuditEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History size={20} aria-hidden="true" />
          Журнал аудита
        </CardTitle>
        <CardDescription>
          В настоящей банковской системе этот журнал должен быть неизменяемым и храниться на сервере.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {auditLog.map((event) => (
            <div key={event.id} className="grid gap-2 rounded-xl border bg-background/70 p-4 sm:grid-cols-[80px_180px_1fr]">
              <span className="text-sm font-semibold text-muted-foreground">{event.time}</span>
              <span className="text-sm font-semibold">{event.action}</span>
              <span className="text-sm leading-5 text-muted-foreground">{event.detail}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RoadmapCard() {
  const groups = ['Critical', 'Core', 'Risk', 'Ops', 'Reports', 'Bank'];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Что еще нужно улучшить до реальной банковской системы</CardTitle>
        <CardDescription>Полный backlog по приоритетам. Critical и Core закрываются первыми.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.map((group) => (
          <div key={group}>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={group === 'Critical' ? 'destructive' : 'secondary'}>{group}</Badge>
              <span className="text-sm text-muted-foreground">
                {roadmap.filter((item) => item.state === group).length} задач
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {roadmap
                .filter((item) => item.state === group)
                .map((item) => (
                  <div key={item.title} className="rounded-xl border bg-background/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-5 text-muted-foreground">{item.body}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProjectPassport() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Паспорт проекта</CardTitle>
          <CardDescription>
            Автоматизированная система внутрибанковского операционного планирования и управления
            лимитами ликвидности.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {passportSections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="rounded-xl border bg-background/70 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <p className="font-semibold">{section.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{section.body}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Функциональные модули</CardTitle>
            <CardDescription>Что должна включать полная банковская версия системы.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              'Сбор данных из АБС, кредитного, депозитного и FX-модулей',
              'Расчет текущей и прогнозной ликвидности по валютам',
              'Контроль лимитов, нормативов и минимальных остатков',
              'Заявки подразделений и маршруты согласования',
              'Сценарное моделирование и стресс-тесты',
              'Уведомления, эскалации и операционный checklist',
              'Отчеты для казначейства, рисков и руководства',
              'Журнал аудита и контроль действий пользователей',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border bg-background/70 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <p className="text-sm leading-5">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Сценарий защиты</CardTitle>
            <CardDescription>Короткий порядок демонстрации на практике.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {presentationPlan.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-xl border bg-background/70 p-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="text-sm leading-5">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Технологический стек</CardTitle>
          <CardDescription>Для презентации можно объяснять как современный web-based banking dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {['React / Vinext', 'Tailwind CSS', 'Shadcn UI', 'TypeScript'].map((item) => (
            <div key={item} className="rounded-xl border bg-background/70 p-4">
              <p className="font-semibold">{item}</p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">
                Используется в текущем интерактивном прототипе.
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
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
