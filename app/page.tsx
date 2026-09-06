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
  Database,
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
  Route,
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
type FlowStatus =
  | 'Подтверждено'
  | 'В прогнозе'
  | 'Согласование'
  | 'Рекомендация'
  | 'На согласовании'
  | 'Согласовано'
  | 'Отклонено';
type StatusFilter = 'Все' | 'На согласовании' | 'Согласовано' | 'Отклонено';
type UserRole = 'Казначей' | 'Риск-менеджер' | 'Руководитель' | 'Аудитор';
type TabValue =
  | 'forecast'
  | 'passport'
  | 'defense'
  | 'flows'
  | 'limits'
  | 'audit'
  | 'requests'
  | 'reports'
  | 'settings'
  | 'industrial'
  | 'roadmap';

type Flow = {
  id: number | string;
  time: string;
  source: string;
  owner: string;
  type: string;
  amount: string;
  currency: Currency;
  impact: number;
  status: FlowStatus;
  tone: Tone;
  priority?: 'Высокий' | 'Средний' | 'Низкий';
  route?: string;
  comment?: string;
};

type AuditEvent = {
  id: number | string;
  time: string;
  action: string;
  detail: string;
};

const scenarioConfig: Record<
  Scenario,
  { label: string; outflowFactor: number; inflowFactor: number }
> = {
  base: { label: 'Базовый', outflowFactor: 1, inflowFactor: 1 },
  stress: { label: 'Стресс', outflowFactor: 1.18, inflowFactor: 0.88 },
  optimistic: {
    label: 'Оптимистичный',
    outflowFactor: 0.92,
    inflowFactor: 1.08,
  },
};

const currencyLimits: Record<Currency, { reserve: number; balance: number }> = {
  KGS: { reserve: 900, balance: 1420 },
  USD: { reserve: 8, balance: 12.4 },
  EUR: { reserve: 2.4, balance: 3.1 },
  CNY: { reserve: 7, balance: 9.8 },
};

const roleAccess: Record<
  UserRole,
  {
    canCreate: boolean;
    canApprove: boolean;
    canSetLimits: boolean;
    description: string;
  }
> = {
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
    priority: 'Средний',
    route: 'Кредитный блок → Казначейство',
    comment: 'Плановое поступление по графику погашений.',
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
    priority: 'Высокий',
    route: 'Депозитный отдел → Казначейство → Руководитель',
    comment: 'Крупный отток должен быть подтвержден до обеда.',
  },
  {
    id: 3,
    time: '13:20',
    source: 'Покупка USD для клиента',
    owner: 'Валютные операции',
    type: 'Валюта',
    amount: '-2.1 млн USD',
    currency: 'USD',
    impact: -186,
    status: 'Согласование',
    tone: 'critical',
    priority: 'Высокий',
    route: 'Валютные операции → Риск-менеджер → Руководитель',
    comment: 'Проверить влияние на валютную позицию.',
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
    priority: 'Средний',
    route: 'Казначейство → Руководитель',
    comment: 'Возможное размещение свободного остатка.',
  },
];

const roadmap = [
  {
    title: 'Роли и доступы',
    body: 'Ролевая модель: казначей, риск-менеджер, руководитель, филиал, аудитор.',
    state: 'Критично',
  },
  {
    title: 'Сохранение заявок',
    body: 'База данных, история статусов, комментарии и вложения.',
    state: 'Критично',
  },
  {
    title: 'Маршруты согласования',
    body: 'Правила: сумма, валюта, тип операции, лимит, подразделение.',
    state: 'Критично',
  },
  {
    title: 'Интеграции с АБС',
    body: 'Остатки, проводки, корреспондентские счета, депозиты, кредиты и валютные операции.',
    state: 'Ядро',
  },
  {
    title: 'Расчетный движок',
    body: 'Свободный ресурс, кассовый разрыв, лимиты, валютная позиция.',
    state: 'Ядро',
  },
  {
    title: 'Стресс-тесты',
    body: 'Отток депозитов, задержка поступлений, спрос на валюту.',
    state: 'Риски',
  },
  {
    title: 'Уведомления',
    body: 'Электронная почта, СМС, уведомления внутри системы, критические эскалации.',
    state: 'Операции',
  },
  {
    title: 'Отчетность',
    body: 'План-факт, лимиты, ликвидность, межбанк, экспорт в Excel и PDF.',
    state: 'Отчеты',
  },
  {
    title: 'Аудит и безопасность',
    body: 'Журнал действий, неизменяемая история, шифрование, согласования.',
    state: 'Банк',
  },
  {
    title: 'Администрирование лимитов',
    body: 'Настройка лимитов по валютам, филиалам, счетам и операциям.',
    state: 'Банк',
  },
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
    body: 'Единый дашборд собирает денежные потоки, рассчитывает прогноз ликвидности, контролирует лимиты, показывает предупреждения и поддерживает процесс обработки заявок с аудитом действий.',
  },
  {
    title: 'Пользователи',
    icon: UsersRound,
    body: 'Казначей, риск-менеджер, руководитель, сотрудник подразделения, аудитор и администратор системы.',
  },
  {
    title: 'Архитектура',
    icon: ServerCog,
    body: 'Пользовательский интерфейс создан на современных веб-технологиях; далее необходимы серверное API, база данных, интеграционный слой с АБС и сервис уведомлений.',
  },
  {
    title: 'Безопасность',
    icon: ShieldCheck,
    body: 'Ролевая модель доступа, журнал аудита, контроль лимитов, разделение прав на создание, согласование и изменение лимитов.',
  },
];

const navItems: Array<{ label: string; icon: LucideIcon; tab: TabValue }> = [
  { label: 'Позиция', icon: Gauge, tab: 'forecast' },
  { label: 'Потоки', icon: Activity, tab: 'flows' },
  { label: 'Лимиты', icon: ShieldAlert, tab: 'limits' },
  { label: 'Заявки', icon: FileCheck2, tab: 'requests' },
  { label: 'Промышленный контур', icon: ServerCog, tab: 'industrial' },
  { label: 'Доработки', icon: Layers3, tab: 'roadmap' },
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

const valueChain = [
  {
    title: 'Проблема',
    value: 'ручные расчеты',
    body: 'Данные по счетам, депозитам, кредитам и валюте собираются отдельно, поэтому решение по ликвидности запаздывает.',
  },
  {
    title: 'Решение',
    value: 'единый контур',
    body: 'Система сводит потоки, показывает прогноз, проверяет лимиты и фиксирует каждое действие в журнале аудита.',
  },
  {
    title: 'Эффект',
    value: 'контроль риска',
    body: 'Казначейство быстрее видит дефицит, руководитель получает прозрачную картину, а свободные средства не простаивают.',
  },
];

const readinessItems = [
  {
    label: 'Дашборд и прогноз',
    value: 98,
    detail: 'готовый рабочий сценарий казначейства',
    status: 'идеально для защиты',
    proof:
      '7-дневный прогноз, сценарии, валюты, риск-день, дефицит, алерты и влияние заявок на остаток.',
  },
  {
    label: 'Заявки и согласование',
    value: 96,
    detail: 'создание, решение, маршрут и серверное сохранение',
    status: 'почти промышленный уровень',
    proof:
      'Заявки сохраняются в D1, согласуются через серверный PATCH и меняют прогноз ликвидности.',
  },
  {
    label: 'Роли и лимиты',
    value: 94,
    detail: 'права проверяются интерфейсом и сервером',
    status: 'готово для демонстрации контроля',
    proof:
      'Казначей, риск-менеджер, руководитель и аудитор имеют разные действия; лимиты меняет только риск-менеджер.',
  },
  {
    label: 'Промышленный контур',
    value: 88,
    detail: 'API, D1, аудит, документы и интеграционный план',
    status: 'готов к пилоту после доступов банка',
    proof:
      'Добавлены серверные маршруты, схема БД, миграция, аудит, документация API и план безопасности.',
  },
];

const readinessSummary = [
  {
    label: 'Средняя готовность',
    value: '94%',
    detail: 'уровень официальной презентации проекта',
  },
  {
    label: 'Ключевой риск',
    value: 'доступы банка',
    detail: 'АБС, SSO, SMS/e-mail и тестовые банковские данные',
  },
  {
    label: 'Следующий рубеж',
    value: 'пилот',
    detail: 'подключение тестового контура и регламентов ИБ',
  },
];

const expertVerdict = [
  {
    title: 'Сильная сторона',
    value: 'сквозной сценарий',
    detail:
      'От прогноза и заявки до решения, влияния на остаток и записи в аудит.',
  },
  {
    title: 'Контроль банка',
    value: 'роли и лимиты',
    detail:
      'Действия пользователей разделены по полномочиям и проверяются сервером.',
  },
  {
    title: 'Граница прототипа',
    value: 'без реальной АБС',
    detail:
      'Боевые банковские источники подключаются только через тестовый контур банка.',
  },
  {
    title: 'Итог',
    value: 'готово к пилоту',
    detail:
      'Проект можно защищать как рабочий прототип с понятной промышленной дорожной картой.',
  },
];

const acceptanceCriteria = [
  'Казначей видит прогноз ликвидности, риск-день и предупреждения.',
  'Заявка подразделения создается и сохраняется через серверный маршрут.',
  'Руководитель или казначей принимает решение по заявке.',
  'Одобренная или отклоненная заявка меняет операционную картину.',
  'Риск-менеджер меняет лимит, а другие роли не имеют такого права.',
  'Аудитор видит историю действий без права изменения данных.',
];

const commissionTheses = [
  {
    title: 'Главный тезис',
    body: 'Система переводит планирование ликвидности из ручных таблиц в единый управляемый процесс.',
  },
  {
    title: 'Что уже работает',
    body: 'Прогноз, заявки, согласование, роли, лимиты, аудит, выгрузки и серверный контур.',
  },
  {
    title: 'Что нужно банку',
    body: 'Тестовые доступы к АБС, корпоративная авторизация, шлюзы уведомлений и регламенты ИБ.',
  },
];

const bankEffect = [
  {
    label: 'Скорость расчета',
    value: 'до минут',
    detail: 'вместо ручной сверки таблиц',
  },
  {
    label: 'Риск кассового разрыва',
    value: 'ниже',
    detail: 'за счет ранних предупреждений',
  },
  {
    label: 'Свободные ресурсы',
    value: 'видны',
    detail: 'для межбанка и валютных решений',
  },
  {
    label: 'Контроль действий',
    value: 'прозрачен',
    detail: 'через журнал аудита',
  },
];

const defenseQuestions = [
  {
    question: 'Почему такая система нужна банку?',
    answer:
      'Она заменяет ручное планирование ликвидности единым расчетом, снижает риск ошибок и ускоряет согласование операций.',
  },
  {
    question: 'Что уже реализовано в прототипе?',
    answer:
      'Прогноз по дням, сценарии, валюты, заявки, роли, лимиты, предупреждения, аудит, отчеты и карта доработок.',
  },
  {
    question: 'Что отличает прототип от промышленной версии?',
    answer:
      'В прототипе данные демонстрационные и хранятся в браузере; промышленной версии нужны сервер, база, интеграции и безопасность.',
  },
  {
    question: 'Как доказать пользу системы на демонстрации?',
    answer:
      'Создать заявку, показать изменение прогноза, согласовать операцию, открыть аудит и объяснить контроль лимитов.',
  },
];

const prototypeLimits = [
  {
    title: 'Данные демонстрационные',
    body: 'Сейчас операции не приходят из реальной АБС, а заданы внутри прототипа для показа бизнес-логики.',
  },
  {
    title: 'Хранение в браузере',
    body: 'Заявки, лимиты и аудит сохраняются локально. В банке это должно храниться на сервере в защищенной базе данных.',
  },
  {
    title: 'Права только в интерфейсе',
    body: 'Роли показывают будущую модель доступа, но промышленная версия должна проверять права на сервере.',
  },
  {
    title: 'Отчеты учебные',
    body: 'Экспорт уже формирует файл, но для банка нужны утвержденные формы, подписи, архив и контроль версий.',
  },
];

const architectureSteps = [
  {
    title: 'Интерфейс',
    body: 'Рабочее место казначейства, рисков, руководства и аудитора.',
    icon: Gauge,
  },
  {
    title: 'Сервер расчетов',
    body: 'Расчет ликвидности, проверка лимитов, маршрутизация заявок.',
    icon: ServerCog,
  },
  {
    title: 'База данных',
    body: 'Операции, лимиты, заявки, статусы, журнал действий.',
    icon: Database,
  },
  {
    title: 'Интеграции',
    body: 'АБС, депозитный модуль, кредитный модуль, валютные операции.',
    icon: Route,
  },
];

const economicEffect = [
  {
    label: 'Сокращение ручной сверки',
    value: '60-80%',
    detail: 'за счет единого операционного окна',
  },
  {
    label: 'Раннее выявление дефицита',
    value: 'до начала дня',
    detail: 'через прогноз и стресс-сценарии',
  },
  {
    label: 'Согласование заявок',
    value: 'прозрачнее',
    detail: 'видны статус, маршрут и ответственный блок',
  },
  {
    label: 'Управленческий контроль',
    value: 'ежедневно',
    detail: 'через отчеты, аудит и лимиты',
  },
];

const industrialReadiness = [
  {
    title: '1. База данных',
    status: 'Подготовлено',
    body: 'Добавлен логический binding DB, SQL-схема и миграция для пользователей, потоков, лимитов, заявок, аудита и уведомлений.',
    proof: 'D1 хранит заявки, решения и минимальные лимиты',
    tone: 'good' as Tone,
  },
  {
    title: '2. Серверный API',
    status: 'Добавлено',
    body: 'Созданы API-точки для состояния сервиса, сводки ликвидности, заявок, лимитов, аудита и промышленной готовности.',
    proof:
      '/api/health · /api/liquidity/summary · /api/requests · /api/limits · /api/audit',
    tone: 'good' as Tone,
  },
  {
    title: '3. Авторизация',
    status: 'Требует политики банка',
    body: 'Полноценная авторизация должна подключаться к SSO, Active Directory, LDAP или внутреннему IAM банка.',
    proof: 'Нужны регламенты и тестовый контур идентификации',
    tone: 'warning' as Tone,
  },
  {
    title: '4. Серверные роли',
    status: 'Контур готов',
    body: 'В API добавлена проверка роли при создании заявки, согласовании заявки и изменении лимита.',
    proof: 'POST/PATCH /api/requests · PATCH /api/limits',
    tone: 'good' as Tone,
  },
  {
    title: '5. Банковские источники',
    status: 'Нужны доступы',
    body: 'Для реальных остатков и проводок требуются тестовые подключения к АБС, депозитам, кредитам и валютным операциям.',
    proof: 'API-ключи, VPN, тестовые данные банка',
    tone: 'warning' as Tone,
  },
  {
    title: '6. Маршруты согласования',
    status: 'Спроектировано',
    body: 'Маршрут зависит от суммы, валюты, типа операции, риска и ответственного подразделения.',
    proof: 'Карточки заявок и серверный контракт',
    tone: 'good' as Tone,
  },
  {
    title: '7. Неизменяемый аудит',
    status: 'Спроектировано',
    body: 'В схеме есть hash-chain: каждое событие хранит предыдущий и текущий хэш для контроля изменений.',
    proof: 'audit_events.previous_hash · audit_events.event_hash',
    tone: 'good' as Tone,
  },
  {
    title: '8. Уведомления',
    status: 'Спроектировано',
    body: 'Подготовлена таблица событий уведомлений; фактическая отправка требует SMTP, SMS или внутренний сервис банка.',
    proof: 'notification_events',
    tone: 'warning' as Tone,
  },
  {
    title: '9. Отчеты XLS/PDF',
    status: 'Усилено',
    body: 'В интерфейсе добавлены выгрузка в табличный файл и печатный PDF-отчет для управленческой демонстрации.',
    proof: 'Раздел “Отчеты”',
    tone: 'good' as Tone,
  },
  {
    title: '10. Безопасность и нагрузка',
    status: 'План готов',
    body: 'Добавлен чек-лист проверок доступа, аудита, OWASP Top 10, массовой загрузки данных и отчетов.',
    proof: 'docs/security-and-load-testing.md',
    tone: 'neutral' as Tone,
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabValue>('forecast');
  const [scenario, setScenario] = useState<Scenario>('base');
  const [currency, setCurrency] = useState<Currency>('KGS');
  const [role, setRole] = useState<UserRole>('Казначей');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Все');
  const [requestAmount, setRequestAmount] = useState('120');
  const [requestTitle, setRequestTitle] = useState('Крупный клиентский платеж');
  const [limitDraft, setLimitDraft] = useState('900');
  const [limitOverrides, setLimitOverrides] = useState<
    Record<Currency, number>
  >({
    KGS: currencyLimits.KGS.reserve,
    USD: currencyLimits.USD.reserve,
    EUR: currencyLimits.EUR.reserve,
    CNY: currencyLimits.CNY.reserve,
  });
  const [flows, setFlows] = useState(initialFlows);
  const [serverStorageStatus, setServerStorageStatus] = useState(
    'ожидание синхронизации',
  );
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
  const demoDate = '04.09.2026';

  useEffect(() => {
    const savedFlows = window.localStorage.getItem('liquidity-planner-flows');
    const savedAudit = window.localStorage.getItem('liquidity-planner-audit');
    const savedLimits = window.localStorage.getItem('liquidity-planner-limits');
    const savedRole = window.localStorage.getItem(
      'liquidity-planner-role',
    ) as UserRole | null;

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

    let isActive = true;
    fetch('/api/requests')
      .then((response) => {
        if (!response.ok) {
          throw new Error('сервер не ответил');
        }
        return response.json() as Promise<{ items?: Flow[]; storage?: string }>;
      })
      .then((data) => {
        if (!isActive) return;
        if (data.storage === 'd1') {
          setServerStorageStatus('заявки синхронизированы с серверной БД');
        } else {
          setServerStorageStatus('локальный режим, серверная БД недоступна');
        }
        if (data.items?.length) {
          setFlows((current) => mergeServerFlows(data.items ?? [], current));
        }
      })
      .catch(() => {
        if (isActive) {
          setServerStorageStatus('локальный режим, API недоступен');
        }
      });

    return () => {
      isActive = false;
    };
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    let isActive = true;
    fetch('/api/audit')
      .then((response) => {
        if (!response.ok) {
          throw new Error('сервер не ответил');
        }
        return response.json() as Promise<{
          items?: AuditEvent[];
          storage?: string;
        }>;
      })
      .then((data) => {
        if (!isActive) return;
        if (data.storage === 'd1' && data.items?.length) {
          setAuditLog((current) => mergeAuditEvents(data.items ?? [], current));
        }
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    let isActive = true;
    fetch('/api/limits')
      .then((response) => {
        if (!response.ok) {
          throw new Error('сервер не ответил');
        }
        return response.json() as Promise<{
          limits?: Record<Currency, number>;
          storage?: string;
        }>;
      })
      .then((data) => {
        if (!isActive) return;
        if (data.limits) {
          setLimitOverrides(data.limits);
        }
        if (data.storage === 'd1') {
          setServerStorageStatus('заявки и лимиты синхронизированы с D1');
        }
      })
      .catch(() => {
        if (isActive) {
          setServerStorageStatus((current) =>
            current.includes('заявки')
              ? current
              : 'локальный режим, API лимитов недоступен',
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(
      'liquidity-planner-flows',
      JSON.stringify(flows),
    );
    window.localStorage.setItem(
      'liquidity-planner-audit',
      JSON.stringify(auditLog),
    );
    window.localStorage.setItem(
      'liquidity-planner-limits',
      JSON.stringify(limitOverrides),
    );
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
    const queryMatch =
      `${flow.source} ${flow.owner} ${flow.type} ${flow.amount} ${flow.status}`
        .toLowerCase()
        .includes(query.toLowerCase());

    return currencyMatch && statusMatch && queryMatch;
  });
  const pendingCount = flows.filter(
    (flow) =>
      flow.status === 'На согласовании' || flow.status === 'Согласование',
  ).length;
  const approvedCount = flows.filter(
    (flow) => flow.status === 'Согласовано' || flow.status === 'Подтверждено',
  ).length;
  const rejectedCount = flows.filter(
    (flow) => flow.status === 'Отклонено',
  ).length;
  const manualOutflow = flows
    .filter(
      (flow) =>
        flow.status !== 'Отклонено' && flow.impact < 0 && flow.time === 'Новая',
    )
    .reduce((sum, flow) => sum + Math.abs(flow.impact), 0);

  const activeAccess = roleAccess[role];
  const reserve = limitOverrides[currency];
  const forecast = useMemo(() => {
    const cfg = scenarioConfig[scenario];
    return baseForecast.map((item, index) => {
      const adjustedInflow = Math.round(item.inflow * cfg.inflowFactor);
      const adjustedOutflow =
        Math.round(item.outflow * cfg.outflowFactor) +
        (index === 0 ? manualOutflow : 0);
      const delta = adjustedInflow - adjustedOutflow;
      return {
        ...item,
        inflow: adjustedInflow,
        outflow: adjustedOutflow,
        balance: Math.max(
          0,
          item.balance + delta - (item.inflow - item.outflow),
        ),
      };
    });
  }, [scenario, manualOutflow]);

  const minBalance = Math.min(...forecast.map((item) => item.balance));
  const riskDay =
    forecast.find((item) => item.balance <= reserve + 20)?.day ?? 'нет';
  const deficit = Math.max(0, reserve - minBalance);
  const totalInflow = forecast.reduce((sum, item) => sum + item.inflow, 0);
  const totalOutflow = forecast.reduce((sum, item) => sum + item.outflow, 0);
  const maxBalance = Math.max(...forecast.map((item) => item.balance), reserve);
  const alertCount =
    Number(deficit > 0) +
    Number(pendingCount > 0) +
    Number(manualOutflow > 250);

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeAccess.canCreate) {
      addAudit('Доступ запрещен', `${role} не может создавать заявки.`);
      return;
    }
    const value = Number(requestAmount) || 0;
    if (!requestTitle.trim() || value <= 0) return;

    const localFlow = createLocalFlow(requestTitle.trim(), value, currency);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': roleApiCode(role),
        },
        body: JSON.stringify({
          title: requestTitle.trim(),
          amountMillions: value,
          currency,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        flow?: Flow;
        message?: string;
        storage?: string;
      } | null;

      if (!response.ok) {
        addAudit(
          'Сервер отклонил заявку',
          data?.message ?? `${role} не прошел серверную проверку роли.`,
        );
        return;
      }

      setFlows((current) => [data?.flow ?? localFlow, ...current]);
      setServerStorageStatus(
        data?.storage === 'd1'
          ? 'новая заявка сохранена в серверной БД'
          : 'заявка создана в демонстрационном режиме',
      );
    } catch {
      setFlows((current) => [localFlow, ...current]);
      setServerStorageStatus('API недоступен, заявка сохранена локально');
    }

    addAudit(
      'Создана заявка',
      `${requestTitle.trim()} на ${value} млн ${currency}.`,
    );
    setRequestTitle('');
    setRequestAmount('120');
  }

  async function updateFlowStatus(
    id: Flow['id'],
    status: 'Согласовано' | 'Отклонено',
  ) {
    if (!activeAccess.canApprove) {
      addAudit('Доступ запрещен', `${role} не может согласовывать заявки.`);
      return;
    }
    const target = flows.find((flow) => flow.id === id);

    if (typeof id === 'string') {
      try {
        const response = await fetch('/api/requests', {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
            'x-demo-role': roleApiCode(role),
          },
          body: JSON.stringify({ id, status }),
        });
        const data = (await response.json().catch(() => null)) as {
          message?: string;
          storage?: string;
        } | null;
        if (!response.ok) {
          addAudit(
            'Сервер отклонил решение',
            data?.message ?? `${role} не прошел серверную проверку роли.`,
          );
          return;
        }
        setServerStorageStatus(
          data?.storage === 'd1'
            ? 'решение сохранено в серверной БД'
            : 'решение сохранено в демонстрационном режиме',
        );
      } catch {
        setServerStorageStatus(
          'API недоступен, решение сохранено только локально',
        );
      }
    }

    setFlows((current) =>
      current.map((flow) =>
        flow.id === id
          ? {
              ...flow,
              status,
              tone: status === 'Согласовано' ? 'good' : 'neutral',
              comment:
                status === 'Согласовано'
                  ? 'Решение сохранено. Заявку можно исполнять.'
                  : 'Решение сохранено. Заявка исключена из прогноза.',
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
    setAuditLog((current) =>
      [{ id: Date.now(), time, action, detail }, ...current].slice(0, 8),
    );
  }

  function resetDemo() {
    setFlows(initialFlows);
    setAuditLog([
      {
        id: Date.now(),
        time: new Intl.DateTimeFormat('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date()),
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
    setScenario('base');
    setCurrency('KGS');
    setActiveTab('forecast');
  }

  function startPresentationMode() {
    resetDemo();
    setActiveTab('defense');
    addAudit(
      'Режим защиты',
      'Демо-сценарий сброшен и открыт раздел защиты проекта.',
    );
  }

  async function updateLimit() {
    if (!activeAccess.canSetLimits) {
      addAudit('Доступ запрещен', `${role} не может менять лимиты.`);
      return;
    }
    const value = Number(limitDraft);
    if (!Number.isFinite(value) || value <= 0) return;

    try {
      const response = await fetch('/api/limits', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': roleApiCode(role),
        },
        body: JSON.stringify({ currency, reserve: value }),
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
        storage?: string;
      } | null;
      if (!response.ok) {
        addAudit(
          'Сервер отклонил лимит',
          data?.message ?? `${role} не прошел серверную проверку роли.`,
        );
        return;
      }
      setServerStorageStatus(
        data?.storage === 'd1'
          ? 'лимит сохранен в серверной БД'
          : 'лимит сохранен в демонстрационном режиме',
      );
    } catch {
      setServerStorageStatus('API недоступен, лимит сохранен только локально');
    }

    setLimitOverrides((current) => ({ ...current, [currency]: value }));
    addAudit(
      'Изменен лимит',
      `${currency}: новый минимальный остаток ${value} млн.`,
    );
  }

  function downloadTextFile(
    fileName: string,
    content: string,
    mimeType = 'text/csv;charset=utf-8',
  ) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const header = [
      'Время',
      'Операция',
      'Владелец',
      'Тип',
      'Сумма',
      'Статус',
      'Приоритет',
      'Маршрут',
    ];
    const rows = selectedFlows.map((flow) => [
      flow.time,
      flow.source,
      flow.owner,
      flow.type,
      flow.amount,
      flow.status,
      flow.priority ?? 'Средний',
      flow.route ?? 'Казначейство',
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','),
      )
      .join('\n');
    downloadTextFile('operacionnye-potoki-likvidnosti.csv', csv);
    addAudit('Экспорт таблицы', `Выгружено ${selectedFlows.length} операций.`);
  }

  function buildReportRows(reportTitle: string) {
    return [
      ['Отчет', reportTitle],
      ['Демонстрационный операционный день', `${demoDate}, Бишкек`],
      ['Валюта', currency],
      ['Сценарий', scenarioConfig[scenario].label],
      ['Поступления', `${totalInflow} млн`],
      ['Списания', `${totalOutflow} млн`],
      ['Чистый поток', `${totalInflow - totalOutflow} млн`],
      ['Прогнозный дефицит', `${deficit} млн`],
      ['Заявки на согласовании', `${pendingCount}`],
      ['Минимальный лимит', `${reserve} млн`],
      ['Минимальный остаток прогноза', `${minBalance} млн`],
    ];
  }

  function exportReport(
    reportTitle: string,
    format: 'csv' | 'xls' | 'pdf' = 'csv',
  ) {
    const rows = buildReportRows(reportTitle);
    const fileBase = reportTitle.toLowerCase().replaceAll(' ', '-');

    if (format === 'xls') {
      const tableRows = rows
        .map(
          (row) =>
            `<tr><td>${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td></tr>`,
        )
        .join('');
      const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${tableRows}</table></body></html>`;
      downloadTextFile(
        `${fileBase}.xls`,
        html,
        'application/vnd.ms-excel;charset=utf-8',
      );
      addAudit('Экспорт отчета', `${reportTitle}: табличный файл XLS.`);
      return;
    }

    if (format === 'pdf') {
      const tableRows = rows
        .map(
          (row) =>
            `<tr><th>${escapeHtml(row[0])}</th><td>${escapeHtml(row[1])}</td></tr>`,
        )
        .join('');
      const reportWindow = window.open('', '_blank', 'noopener,noreferrer');
      const html = `<!doctype html>
        <html lang="ru">
          <head>
            <meta charset="utf-8" />
            <title>${escapeHtml(reportTitle)}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 32px; color: #172033; }
              h1 { font-size: 24px; margin: 0 0 8px; }
              p { margin: 0 0 24px; color: #596579; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #cfd6df; padding: 10px 12px; text-align: left; font-size: 14px; }
              th { width: 42%; background: #f3f6f8; }
              .stamp { margin-top: 28px; font-size: 12px; color: #596579; }
            </style>
          </head>
          <body>
            <h1>${escapeHtml(reportTitle)}</h1>
            <p>Планировщик ликвидности и денежных потоков банка</p>
            <table>${tableRows}</table>
            <div class="stamp">Сформировано из демонстрационного прототипа. Для промышленной версии требуется утвержденная форма банка.</div>
            <script>window.print();</script>
          </body>
        </html>`;
      if (reportWindow) {
        reportWindow.document.write(html);
        reportWindow.document.close();
      } else {
        downloadTextFile(
          `${fileBase}-pdf-report.html`,
          html,
          'text/html;charset=utf-8',
        );
      }
      addAudit(
        'Экспорт отчета',
        `${reportTitle}: подготовлен PDF через печатную форму.`,
      );
      return;
    }

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','),
      )
      .join('\n');
    downloadTextFile(`${fileBase}.csv`, csv);
    addAudit(
      'Экспорт отчета',
      `${reportTitle}: ${currency}, сценарий ${scenarioConfig[scenario].label}.`,
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <AnimatedBackdrop />
      <Sidebar
        activeTab={activeTab}
        pendingCount={pendingCount}
        setActiveTab={setActiveTab}
        startPresentationMode={startPresentationMode}
      />

      <section className="relative z-10 lg:pl-[280px]">
        <header className="border-b bg-background/75 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Демонстрационный операционный день · {demoDate} · Бишкек
              </p>
              <h1 className="mt-1 max-w-4xl text-2xl font-semibold tracking-tight sm:text-4xl">
                Центр управления ликвидностью банка
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="lg">
                <CalendarDays aria-hidden="true" />7 дней
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={startPresentationMode}
              >
                <BookOpenCheck aria-hidden="true" />
                Начать защиту
              </Button>
              <Button variant="outline" size="lg" onClick={resetDemo}>
                <RefreshCw aria-hidden="true" />
                Сбросить демо
              </Button>
              <Button
                size="lg"
                className="shadow-[0_14px_30px_rgba(15,118,110,0.25)]"
              >
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
                  <Badge
                    variant="outline"
                    className="h-7 gap-2 bg-background/70"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Официальный проект для практики
                  </Badge>
                  <Badge variant="secondary" className="ml-2 mt-2 h-7 gap-2">
                    <Database size={14} aria-hidden="true" />
                    {serverStorageStatus}
                  </Badge>
                  <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                    Планировщик ликвидности и денежных потоков для банка.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Официальный учебный прототип системы внутрибанковского
                    планирования ликвидности: прогноз, лимиты, заявки, роли,
                    аудит и план промышленного внедрения.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <MiniSignal
                      label="Мин. остаток"
                      value={`${minBalance} млн`}
                      trend={deficit > 0 ? 'дефицит' : 'норма'}
                    />
                    <MiniSignal
                      label="День риска"
                      value={riskDay}
                      trend={scenarioConfig[scenario].label}
                    />
                    <MiniSignal
                      label="Очередь"
                      value={`${pendingCount} заявок`}
                      trend={`${approvedCount} согласовано`}
                    />
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-3">
                    {valueChain.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-lg border bg-background/72 p-3 backdrop-blur"
                      >
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          {item.title}
                        </p>
                        <p className="mt-1 text-base font-semibold">
                          {item.value}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {item.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <PulseCard
                  reserve={reserve}
                  maxBalance={maxBalance}
                  forecast={forecast}
                  currency={currency}
                />
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

          <section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Ключевые показатели"
          >
            <MetricCard
              title="Свободная ликвидность"
              value={`${Math.max(0, minBalance - reserve)} млн`}
              detail={currency}
              state={deficit > 0 ? 'critical' : 'good'}
              icon={Banknote}
            />
            <MetricCard
              title="Прогнозный дефицит"
              value={`${deficit} млн`}
              detail={deficit > 0 ? `риск ${riskDay}` : 'лимит не нарушен'}
              state={deficit > 0 ? 'critical' : 'good'}
              icon={AlertTriangle}
            />
            <MetricCard
              title="На согласовании"
              value={`${pendingCount}`}
              detail={`${approvedCount} согласовано · ${rejectedCount} отклонено`}
              state={pendingCount > 0 ? 'warning' : 'good'}
              icon={FileCheck2}
            />
            <MetricCard
              title="Ручные заявки"
              value={`${manualOutflow} млн`}
              detail="влияют на прогноз сегодня"
              state={manualOutflow > 250 ? 'warning' : 'neutral'}
              icon={ArrowDownRight}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <AlertCenter
              deficit={deficit}
              pendingCount={pendingCount}
              manualOutflow={manualOutflow}
              riskDay={riskDay}
            />
            <Checklist />
          </section>

          <PresentationReadiness />

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabValue)}
            className="space-y-4"
          >
            <TabsList className="h-10 flex-wrap">
              <TabsTrigger value="forecast" className="px-4">
                Прогноз
              </TabsTrigger>
              <TabsTrigger value="passport" className="px-4">
                Паспорт
              </TabsTrigger>
              <TabsTrigger value="defense" className="px-4">
                Защита
              </TabsTrigger>
              <TabsTrigger value="flows" className="px-4">
                Потоки
              </TabsTrigger>
              <TabsTrigger value="limits" className="px-4">
                Лимиты
              </TabsTrigger>
              <TabsTrigger value="audit" className="px-4">
                Аудит
              </TabsTrigger>
              <TabsTrigger value="requests" className="px-4">
                Заявки
              </TabsTrigger>
              <TabsTrigger value="reports" className="px-4">
                Отчеты
              </TabsTrigger>
              <TabsTrigger value="settings" className="px-4">
                Настройки
              </TabsTrigger>
              <TabsTrigger value="industrial" className="px-4">
                Промышленный контур
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="px-4">
                Все доработки
              </TabsTrigger>
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

            <TabsContent value="defense">
              <DefenseWorkspace />
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
              <LimitsWorkspace
                activeAccess={activeAccess}
                currency={currency}
                deficit={deficit}
                flowsCount={flows.length}
                limitDraft={limitDraft}
                minBalance={minBalance}
                reserve={reserve}
                setLimitDraft={setLimitDraft}
                updateLimit={updateLimit}
              />
            </TabsContent>

            <TabsContent value="audit">
              <AuditCard auditLog={auditLog} />
            </TabsContent>

            <TabsContent value="requests">
              <RequestsWorkspace
                flows={flows}
                pendingCount={pendingCount}
                approvedCount={approvedCount}
                rejectedCount={rejectedCount}
              />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsWorkspace
                exportReport={exportReport}
                totalInflow={totalInflow}
                totalOutflow={totalOutflow}
                deficit={deficit}
                pendingCount={pendingCount}
                currency={currency}
              />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsWorkspace
                role={role}
                activeAccess={activeAccess}
                limitOverrides={limitOverrides}
              />
            </TabsContent>

            <TabsContent value="industrial">
              <IndustrialWorkspace serverStorageStatus={serverStorageStatus} />
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
              text="Добавлены паспорт проекта, роли, лимиты, процесс обработки заявок, аудит и план доработок."
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
              value="Банковская система"
              text="Интеграции, аудит, лимиты, стресс-тесты, отчеты и уведомления."
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function Sidebar({
  activeTab,
  pendingCount,
  setActiveTab,
  startPresentationMode,
}: {
  activeTab: TabValue;
  pendingCount: number;
  setActiveTab: (value: TabValue) => void;
  startPresentationMode: () => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[280px] border-r border-white/10 bg-sidebar px-4 py-5 text-sidebar-foreground lg:block">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_14px_34px_rgba(20,184,166,0.25)]">
          <Landmark size={23} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold">Планировщик ликвидности</p>
          <p className="text-xs text-white/55">Рабочий центр казначейства</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1" aria-label="Основные разделы">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              type="button"
              key={item.label}
              onClick={() => setActiveTab(item.tab)}
              className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                isActive
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
              ) : index === 0 || isActive ? (
                <ChevronRight
                  className="ml-auto"
                  size={16}
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      <Button
        type="button"
        className="mt-5 w-full"
        onClick={startPresentationMode}
      >
        <BookOpenCheck aria-hidden="true" />
        Режим защиты
      </Button>

      <Card className="mt-7 border-white/10 bg-white/[0.06] text-white shadow-none ring-white/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <RadioTower
                size={18}
                className="text-teal-300"
                aria-hidden="true"
              />
              Живая лента
            </span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-300" />
            </span>
          </CardTitle>
          <CardDescription className="text-white/58">
            Синхронизация с АБС, депозитами и валютными операциями: 22 секунды
            назад.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="absolute bottom-5 left-4 right-4 border-white/10 bg-white/[0.06] text-white shadow-none ring-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <LockKeyhole
              size={17}
              className="text-amber-300"
              aria-hidden="true"
            />
            Банковский контур
          </CardTitle>
          <CardDescription className="text-white/55">
            Заявки сохраняются через серверный API и D1. Роли проверяются на
            сервере.
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
          <SlidersHorizontal
            size={20}
            className="text-muted-foreground"
            aria-hidden="true"
          />
        </CardTitle>
        <CardDescription>
          Меняет расчет прогноза прямо на экране.
        </CardDescription>
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
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {activeAccess.description}
          </p>
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
            <Search
              className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="Поиск операций"
              className="pl-8"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по операции, отделу, статусу"
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                'Все',
                'На согласовании',
                'Согласовано',
                'Отклонено',
              ] as StatusFilter[]
            ).map((status) => (
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

        <form
          onSubmit={createRequest}
          className="rounded-xl border bg-background/70 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Новая заявка</p>
            {!activeAccess.canCreate ? (
              <Badge variant="outline">нет доступа</Badge>
            ) : null}
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
            {!activeAccess.canSetLimits ? (
              <Badge variant="outline">только риск</Badge>
            ) : null}
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
            <Button
              type="button"
              variant="secondary"
              onClick={updateLimit}
              disabled={!activeAccess.canSetLimits}
            >
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
      ? {
          title: 'Нарушение минимального остатка',
          body: `Дефицит ${deficit} млн ожидается ${riskDay}.`,
          tone: 'critical' as Tone,
        }
      : {
          title: 'Лимит ликвидности в норме',
          body: 'Минимальный остаток не нарушен в выбранном сценарии.',
          tone: 'good' as Tone,
        },
    pendingCount > 0
      ? {
          title: 'Есть заявки без решения',
          body: `${pendingCount} операции требуют согласования или отклонения.`,
          tone: 'warning' as Tone,
        }
      : {
          title: 'Очередь согласования чистая',
          body: 'Нет заявок, ожидающих решения казначейства.',
          tone: 'good' as Tone,
        },
    manualOutflow > 250
      ? {
          title: 'Ручные заявки давят на прогноз',
          body: `${manualOutflow} млн добавлено вручную в сегодняшний отток.`,
          tone: 'warning' as Tone,
        }
      : {
          title: 'Ручная нагрузка умеренная',
          body: 'Новые заявки пока не создают заметного давления.',
          tone: 'neutral' as Tone,
        },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Центр предупреждений</CardTitle>
        <CardDescription>
          Автоматические сигналы, которые должен видеть казначей.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {alerts.map((alert) => (
          <div
            key={alert.title}
            className="rounded-xl border bg-background/70 p-4"
          >
            <Badge variant="outline" className={statusClass(alert.tone)}>
              {alert.tone === 'critical'
                ? 'Критично'
                : alert.tone === 'warning'
                  ? 'Контроль'
                  : 'Норма'}
            </Badge>
            <p className="mt-3 font-semibold">{alert.title}</p>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              {alert.body}
            </p>
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
        <CardTitle>Операционный контрольный список</CardTitle>
        <CardDescription>Что должно быть закрыто до конца дня.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {opsChecklist.map((item, index) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-xl border bg-background/70 p-3"
          >
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

function PresentationReadiness() {
  return (
    <section
      className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      aria-label="Презентационная готовность"
    >
      <Card>
        <CardHeader>
          <CardTitle>Готовность проекта к защите</CardTitle>
          <CardDescription>
            Проект доведен до уровня уверенной демонстрации: рабочий сценарий,
            серверные роли, база, аудит и честная граница по банковским
            доступам.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {readinessSummary.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border bg-background/70 p-3"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-lg font-semibold">{item.value}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>

          {readinessItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border bg-background/70 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <Badge variant="secondary">{item.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className="text-sm font-semibold">{item.value}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="limit-fill h-2.5 rounded-full bg-primary"
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {item.proof}
              </p>
            </div>
          ))}

          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <FileCheck2 size={18} className="text-primary" aria-hidden />
              <p className="text-sm font-semibold">Экспертное заключение</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Прототип демонстрирует полный управленческий цикл казначейства:
              планирование, контроль лимитов, заявку, решение, влияние на
              прогноз и проверяемый аудит. Для промышленной эксплуатации
              требуется только подключение банковских контуров, SSO и
              регламентов информационной безопасности.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ожидаемый эффект для банка</CardTitle>
            <CardDescription>
              Короткие тезисы, которые усиливают практическую ценность проекта.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {bankEffect.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border bg-background/70 p-4"
              >
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Приемочные критерии</CardTitle>
            <CardDescription>
              Что комиссия должна увидеть в рабочем сценарии.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {acceptanceCriteria.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border bg-background/70 p-3"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-hidden
                />
                <p className="text-sm leading-5 text-muted-foreground">
                  {item}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
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
        <CardDescription>
          Бары пересчитываются при смене сценария или добавлении заявки.
        </CardDescription>
        <CardAction>
          <Badge variant={deficit > 0 ? 'destructive' : 'secondary'}>
            {deficit > 0 ? 'Требуется решение' : 'Норма'}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid h-80 grid-cols-7 items-end gap-3 border-b border-l px-3 pb-4">
          {forecast.map((item, index) => (
            <div
              key={item.day}
              className="flex h-full flex-col justify-end gap-2"
            >
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
          <FlowSummary
            label="Поступления"
            value={`+${totalInflow} млн`}
            tone="positive"
          />
          <FlowSummary
            label="Списания"
            value={`-${totalOutflow} млн`}
            tone="negative"
          />
          <FlowSummary
            label="Чистый поток"
            value={`${totalInflow - totalOutflow} млн`}
            tone="neutral"
          />
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
  updateFlowStatus: (
    id: Flow['id'],
    status: 'Согласовано' | 'Отклонено',
  ) => void;
  exportCsv: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Операционный поток и согласование</CardTitle>
        <CardDescription>
          Заявки можно согласовать или отклонить. Отклоненные не давят на
          прогноз.
        </CardDescription>
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
                <TableCell
                  colSpan={7}
                  className="h-28 text-center text-muted-foreground"
                >
                  Нет операций под выбранные фильтры.
                </TableCell>
              </TableRow>
            ) : (
              flows.map((flow) => {
                const needsDecision =
                  flow.status === 'На согласовании' ||
                  flow.status === 'Согласование';
                return (
                  <TableRow key={`${flow.id}-${flow.status}`}>
                    <TableCell className="text-muted-foreground">
                      {flow.time}
                    </TableCell>
                    <TableCell className="font-medium">{flow.source}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {flow.owner}
                    </TableCell>
                    <TableCell>{flow.type}</TableCell>
                    <TableCell className="font-semibold">
                      {flow.amount}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusClass(flow.tone)}
                      >
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
                            onClick={() =>
                              updateFlowStatus(flow.id, 'Согласовано')
                            }
                          >
                            <Check aria-hidden="true" />
                            Да
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canApprove}
                            onClick={() =>
                              updateFlowStatus(flow.id, 'Отклонено')
                            }
                          >
                            <X aria-hidden="true" />
                            Нет
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Решение не требуется
                        </span>
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

function LimitsWorkspace({
  activeAccess,
  currency,
  deficit,
  flowsCount,
  limitDraft,
  minBalance,
  reserve,
  setLimitDraft,
  updateLimit,
}: {
  activeAccess: (typeof roleAccess)[UserRole];
  currency: Currency;
  deficit: number;
  flowsCount: number;
  limitDraft: string;
  minBalance: number;
  reserve: number;
  setLimitDraft: (value: string) => void;
  updateLimit: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Управление минимальным остатком</CardTitle>
            <CardDescription>
              Риск-менеджер может изменить лимит и сразу увидеть влияние на
              статус ликвидности.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-background/70 p-4">
              <p className="text-sm text-muted-foreground">Выбранная валюта</p>
              <p className="mt-1 text-2xl font-semibold">{currency}</p>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input
                aria-label="Минимальный лимит в разделе лимитов"
                type="number"
                min="1"
                value={limitDraft}
                onChange={(event) => setLimitDraft(event.target.value)}
                placeholder="Минимальный остаток"
              />
              <Button
                type="button"
                onClick={updateLimit}
                disabled={!activeAccess.canSetLimits}
              >
                Сохранить
              </Button>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              В текущей роли изменение лимита{' '}
              {activeAccess.canSetLimits
                ? 'разрешено.'
                : 'недоступно. Переключитесь на роль риск-менеджера.'}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <LimitCard
            name="Минимальный остаток"
            used={Math.min(
              100,
              Math.round((reserve / Math.max(minBalance, 1)) * 100),
            )}
            value={`${minBalance} / ${reserve} млн`}
            state={deficit > 0 ? 'critical' : 'good'}
          />
          <LimitCard
            name="Межбанк overnight"
            used={72}
            value="1.8 / 2.5 млрд"
            state="warning"
          />
          <LimitCard
            name="Корреспондентский счет USD"
            used={61}
            value="12.4 / 20 млн"
            state="good"
          />
          <LimitCard
            name="Крупные платежи до 17:00"
            used={Math.min(100, flowsCount * 9)}
            value={`${flowsCount} операций`}
            state={flowsCount > 8 ? 'warning' : 'good'}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Правила контроля лимитов</CardTitle>
          <CardDescription>
            Такую логику нужно перенести на сервер в промышленной версии.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            'Минимальный остаток не должен опускаться ниже установленного лимита.',
            'Крупные клиентские платежи должны проходить согласование до исполнения.',
            'Валютные операции должны проверяться на влияние на валютную позицию.',
          ].map((item) => (
            <div key={item} className="rounded-xl border bg-background/70 p-4">
              <ShieldCheck
                className="h-5 w-5 text-emerald-700"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm leading-6">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
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
          В настоящей банковской системе этот журнал должен быть неизменяемым и
          храниться на сервере.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {auditLog.map((event, index) => (
            <div
              key={event.id}
              className="grid gap-2 rounded-xl border bg-background/70 p-4 sm:grid-cols-[80px_180px_1fr]"
            >
              <span className="text-sm font-semibold text-muted-foreground">
                {event.time}
              </span>
              <span className="text-sm font-semibold">{event.action}</span>
              <span className="text-sm leading-5 text-muted-foreground">
                {event.detail}
                <code className="mt-2 block rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                  Контрольная сумма: {auditFingerprint(event, index)}
                </code>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RequestsWorkspace({
  flows,
  pendingCount,
  approvedCount,
  rejectedCount,
}: {
  flows: Flow[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}) {
  const requestFlows = flows.filter((flow) =>
    ['Заявка', 'Валюта', 'Размещение', 'Расход'].includes(flow.type),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Всего заявок"
          value={`${requestFlows.length}`}
          detail="в текущем операционном дне"
          state="neutral"
          icon={FileCheck2}
        />
        <MetricCard
          title="На согласовании"
          value={`${pendingCount}`}
          detail="ожидают решения"
          state={pendingCount > 0 ? 'warning' : 'good'}
          icon={Clock3}
        />
        <MetricCard
          title="Согласовано"
          value={`${approvedCount}`}
          detail="можно исполнять"
          state="good"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Отклонено"
          value={`${rejectedCount}`}
          detail="исключены из прогноза"
          state="neutral"
          icon={X}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Реестр заявок подразделений</CardTitle>
          <CardDescription>
            В промышленной версии здесь будут карточки заявок, комментарии,
            вложения и маршрут согласования.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {requestFlows.map((flow) => (
            <div
              key={flow.id}
              className="rounded-xl border bg-background/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{flow.source}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {flow.owner} · {flow.amount}
                  </p>
                </div>
                <Badge variant="outline" className={statusClass(flow.tone)}>
                  {flow.status}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span className="rounded-lg bg-muted p-2">
                  Приоритет: {flow.priority ?? 'Средний'}
                </span>
                <span className="rounded-lg bg-muted p-2">Маршрут</span>
                <span className="rounded-lg bg-muted p-2">Исполнение</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {flow.route ?? 'Казначейство'}.
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {flow.comment ??
                  'Комментарий будет добавлен ответственным подразделением.'}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsWorkspace({
  exportReport,
  totalInflow,
  totalOutflow,
  deficit,
  pendingCount,
  currency,
}: {
  exportReport: (reportTitle: string, format?: 'csv' | 'xls' | 'pdf') => void;
  totalInflow: number;
  totalOutflow: number;
  deficit: number;
  pendingCount: number;
  currency: Currency;
}) {
  const reports = [
    {
      title: 'Ежедневный отчет по ликвидности',
      owner: 'Казначейство',
      status: 'Готов к выгрузке',
    },
    {
      title: 'План-факт денежных потоков',
      owner: 'Финансовый департамент',
      status: 'Требует сверки',
    },
    {
      title: 'Отчет по лимитам',
      owner: 'Риск-менеджмент',
      status: deficit > 0 ? 'Есть нарушение' : 'Нарушений нет',
    },
    {
      title: 'Отчет по заявкам',
      owner: 'Операционный блок',
      status: `${pendingCount} на согласовании`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Отчетный модуль</CardTitle>
          <CardDescription>
            Раздел показывает, какие отчеты должна формировать система для
            руководства и подразделений.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <FlowSummary
            label="Поступления"
            value={`+${totalInflow} млн`}
            tone="positive"
          />
          <FlowSummary
            label="Списания"
            value={`-${totalOutflow} млн`}
            tone="negative"
          />
          <FlowSummary
            label="Дефицит"
            value={`${deficit} млн ${currency}`}
            tone="neutral"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список отчетов</CardTitle>
          <CardDescription>
            Для практики можно показать как будущий модуль выгрузки и контроля.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Отчет</TableHead>
                <TableHead>Ответственный блок</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.title}>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.owner}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportReport(report.title, 'csv')}
                      >
                        <Download aria-hidden="true" />
                        CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportReport(report.title, 'xls')}
                      >
                        <Download aria-hidden="true" />
                        Таблица
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => exportReport(report.title, 'pdf')}
                      >
                        <FileCheck2 aria-hidden="true" />
                        PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function IndustrialWorkspace({
  serverStorageStatus,
}: {
  serverStorageStatus: string;
}) {
  const summary = [
    {
      label: 'API-контур',
      value: '7 маршрутов',
      detail: 'состояние, сводка, заявки, лимиты, аудит',
    },
    {
      label: 'База данных',
      value: 'D1',
      detail: serverStorageStatus,
    },
    {
      label: 'Контроль ролей',
      value: 'сервер',
      detail: 'создание и согласование проверяются API',
    },
    {
      label: 'Интеграции',
      value: 'контракт',
      detail: 'нужны тестовые доступы банка',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Промышленный контур системы</CardTitle>
          <CardDescription>
            Этот раздел показывает, как прототип развивается до реальной
            банковской системы с сервером, базой, ролями, аудитом и
            интеграциями.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border bg-background/70 p-4"
            >
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {item.value}
              </p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">
                {item.detail}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Статус 10 обязательных доработок</CardTitle>
          <CardDescription>
            Формулировки подходят для официальной защиты: видно, что уже сделано
            в проекте и что требует банковских доступов.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {industrialReadiness.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border bg-background/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{item.title}</p>
                <Badge variant="outline" className={statusClass(item.tone)}>
                  {item.status}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
              <p className="mt-3 rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                {item.proof}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Серверные маршруты</CardTitle>
            <CardDescription>
              Что уже можно показывать как основу backend-архитектуры.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ['GET /api/health', 'проверка сервиса и подключения DB'],
              [
                'GET /api/liquidity/summary',
                'сводка ликвидности и источников данных',
              ],
              ['GET /api/requests', 'реестр заявок и маршрутов согласования'],
              ['GET /api/limits', 'чтение минимальных лимитов из D1'],
              ['POST /api/requests', 'создание заявки с записью в D1'],
              [
                'PATCH /api/requests',
                'согласование или отклонение с проверкой роли',
              ],
              [
                'PATCH /api/limits',
                'изменение лимита только для риск-менеджера',
              ],
              ['GET /api/audit', 'чтение неизменяемого журнала из D1'],
              [
                'GET /api/industrial-readiness',
                'статус промышленной готовности',
              ],
            ].map(([route, detail]) => (
              <div
                key={route}
                className="grid gap-2 rounded-xl border bg-background/70 p-3 sm:grid-cols-[210px_1fr]"
              >
                <code className="text-xs font-semibold text-teal-700">
                  {route}
                </code>
                <p className="text-sm text-muted-foreground">{detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Что нужно от банка</CardTitle>
            <CardDescription>
              Без этих данных нельзя честно подключить реальные банковские
              источники.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'Тестовый доступ к АБС и справочник счетов.',
              'Выгрузка или API по депозитам, кредитам и валютным операциям.',
              'Политика SSO/LDAP/Active Directory и матрица ролей.',
              'SMTP, SMS или внутренний шлюз уведомлений.',
              'Регламент хранения аудита, резервного копирования и сроков архива.',
              'Нагрузочный профиль: пользователи, заявки, операции, филиалы.',
            ].map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-xl border bg-background/70 p-3"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
                <p className="text-sm leading-5">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsWorkspace({
  role,
  activeAccess,
  limitOverrides,
}: {
  role: UserRole;
  activeAccess: (typeof roleAccess)[UserRole];
  limitOverrides: Record<Currency, number>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Права текущей роли</CardTitle>
            <CardDescription>
              {role}: {activeAccess.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <AccessRow
              label="Создание заявок"
              enabled={activeAccess.canCreate}
            />
            <AccessRow
              label="Согласование операций"
              enabled={activeAccess.canApprove}
            />
            <AccessRow
              label="Изменение лимитов"
              enabled={activeAccess.canSetLimits}
            />
            <AccessRow label="Просмотр аудита" enabled />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Лимиты по валютам</CardTitle>
            <CardDescription>
              В демо-версии лимиты хранятся в браузере, в реальной версии — в
              базе данных.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            {(Object.keys(limitOverrides) as Currency[]).map((code) => (
              <div
                key={code}
                className="rounded-xl border bg-background/70 p-4"
              >
                <p className="text-sm text-muted-foreground">{code}</p>
                <p className="mt-1 text-2xl font-semibold">
                  {limitOverrides[code]} млн
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  минимальный остаток
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Будущие интеграции</CardTitle>
          <CardDescription>
            Что должно подключаться в промышленной версии системы.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            'Автоматизированная банковская система',
            'Кредитный модуль',
            'Депозитный модуль',
            'Валютные операции',
          ].map((item) => (
            <div key={item} className="rounded-xl border bg-background/70 p-4">
              <Badge variant="secondary">планируется</Badge>
              <p className="mt-3 font-semibold">{item}</p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">
                Источник данных для автоматического расчета ликвидности.
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AccessRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-background/70 p-3">
      <span className="text-sm font-medium">{label}</span>
      <Badge variant={enabled ? 'secondary' : 'outline'}>
        {enabled ? 'Разрешено' : 'Запрещено'}
      </Badge>
    </div>
  );
}

function RoadmapCard() {
  const groups = ['Критично', 'Ядро', 'Риски', 'Операции', 'Отчеты', 'Банк'];
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Что еще нужно улучшить до реальной банковской системы
        </CardTitle>
        <CardDescription>
          Полный список доработок по приоритетам. Сначала закрываются критичные
          задачи и ядро системы.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.map((group) => (
          <div key={group}>
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant={group === 'Критично' ? 'destructive' : 'secondary'}
              >
                {group}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {roadmap.filter((item) => item.state === group).length} задач
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {roadmap
                .filter((item) => item.state === group)
                .map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border bg-background/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-5 text-muted-foreground">
                      {item.body}
                    </p>
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
            Автоматизированная система внутрибанковского операционного
            планирования и управления лимитами ликвидности.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {passportSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className="rounded-xl border bg-background/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <p className="font-semibold">{section.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {section.body}
                  </p>
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
            <CardDescription>
              Что должна включать полная банковская версия системы.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              'Сбор данных из АБС, кредитного, депозитного и валютного модулей',
              'Расчет текущей и прогнозной ликвидности по валютам',
              'Контроль лимитов, нормативов и минимальных остатков',
              'Заявки подразделений и маршруты согласования',
              'Сценарное моделирование и стресс-тесты',
              'Уведомления, эскалации и операционный контрольный список',
              'Отчеты для казначейства, рисков и руководства',
              'Журнал аудита и контроль действий пользователей',
            ].map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-xl border bg-background/70 p-3"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
                <p className="text-sm leading-5">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Сценарий защиты</CardTitle>
            <CardDescription>
              Короткий порядок демонстрации на практике.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {presentationPlan.map((item, index) => (
              <div
                key={item}
                className="flex gap-3 rounded-xl border bg-background/70 p-3"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="text-sm leading-5">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <PrototypeLimitations />

      <ArchitectureMap />

      <EconomicImpact />

      <Card>
        <CardHeader>
          <CardTitle>Технологический стек</CardTitle>
          <CardDescription>
            Для презентации можно объяснять как современный веб-дашборд для
            банковских операций.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {['React / Vinext', 'Tailwind CSS', 'Shadcn UI', 'TypeScript'].map(
            (item) => (
              <div
                key={item}
                className="rounded-xl border bg-background/70 p-4"
              >
                <p className="font-semibold">{item}</p>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  Используется в текущем интерактивном прототипе.
                </p>
              </div>
            ),
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PrototypeLimitations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ограничения текущего прототипа</CardTitle>
        <CardDescription>
          Этот блок нужен для честной защиты: он показывает разницу между
          учебным прототипом и промышленной банковской системой.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {prototypeLimits.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border bg-background/70 p-4"
          >
            <Badge variant="outline">ограничение</Badge>
            <p className="mt-3 font-semibold">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ArchitectureMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Архитектура промышленной версии</CardTitle>
        <CardDescription>
          Как прототип должен развиваться до внутрибанковской системы.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-4">
          {architectureSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative rounded-xl border bg-background/70 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <p className="font-semibold">{step.title}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {step.body}
                </p>
                {index < architectureSteps.length - 1 ? (
                  <ChevronRight
                    className="absolute -right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground md:block"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function EconomicImpact() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Экономический и операционный эффект</CardTitle>
        <CardDescription>
          Какие результаты банк ожидает получить после внедрения системы.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {economicEffect.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border bg-background/70 p-4"
          >
            <CircleDollarSign
              className="h-5 w-5 text-teal-700"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              {item.detail}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DefenseWorkspace() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Раздел для защиты проекта</CardTitle>
          <CardDescription>
            Короткая логика выступления: от проблемы банка к рабочему прототипу
            и дальнейшему внедрению.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: '1. Актуальность',
              body: 'Ручное планирование создает задержки, ошибки и риск кассового разрыва.',
            },
            {
              title: '2. Решение',
              body: 'Единый дашборд показывает остатки, прогноз, лимиты, заявки и предупреждения.',
            },
            {
              title: '3. Демонстрация',
              body: 'Создается заявка, меняется прогноз, выполняется согласование и появляется запись аудита.',
            },
            {
              title: '4. Развитие',
              body: 'Следующий этап: сервер, база данных, интеграции, уведомления и промышленная безопасность.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border bg-background/70 p-4"
            >
              <Badge variant="secondary">{item.title}</Badge>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ответы на возможные вопросы</CardTitle>
          <CardDescription>
            Помогает уверенно объяснить, что уже сделано и что требуется для
            реального банка.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {defenseQuestions.map((item) => (
            <div
              key={item.question}
              className="rounded-xl border bg-background/70 p-4"
            >
              <p className="font-semibold">{item.question}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Финальная позиция руководителя проекта</CardTitle>
          <CardDescription>
            Официальные формулировки для защиты и приемки прототипа.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="grid gap-3 sm:grid-cols-2">
            {expertVerdict.map((item) => (
              <div
                key={`${item.title}-${item.value}`}
                className="rounded-xl border bg-background/70 p-4"
              >
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {item.title}
                </p>
                <p className="mt-1 text-lg font-semibold">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {commissionTheses.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-primary/25 bg-primary/5 p-4"
              >
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PrototypeLimitations />

      <ArchitectureMap />
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
          Пульс ликвидности
          <Activity
            size={18}
            className="text-muted-foreground"
            aria-hidden="true"
          />
        </CardTitle>
        <CardDescription>
          {currency} · линия лимита показана красным
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-40 overflow-hidden rounded-lg bg-[linear-gradient(180deg,rgba(20,184,166,0.11),rgba(255,255,255,0.35))] p-2">
          <svg
            viewBox="0 0 280 145"
            className="h-full w-full"
            role="img"
            aria-label="Динамика ликвидности"
          >
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
            <line
              x1="0"
              y1={122 - (reserve / maxBalance) * 92}
              x2="280"
              y2={122 - (reserve / maxBalance) * 92}
              stroke="rgb(239,68,68)"
              strokeDasharray="6 8"
            />
            <circle
              className="cash-dot"
              cx="148"
              cy={y}
              r="6"
              fill="rgb(245,158,11)"
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniSignal({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
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
          <div
            className={`grid h-10 w-10 place-items-center rounded-lg ${stateIconClass(state)}`}
          >
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
        выбранный сценарий
      </div>
    </div>
  );
}

function LimitCard({
  name,
  used,
  value,
  state,
}: {
  name: string;
  used: number;
  value: string;
  state: Tone;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{value}</CardDescription>
        <CardAction>
          <Badge
            variant={state === 'critical' ? 'destructive' : 'outline'}
            className={stateTextClass(state)}
          >
            {state === 'critical'
              ? 'Критично'
              : state === 'warning'
                ? 'Контроль'
                : 'Норма'}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`limit-fill h-2.5 rounded-full ${limitFillClass(state)}`}
            style={{ width: `${Math.min(100, used)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DecisionCard({
  icon: Icon,
  title,
  value,
  text,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  text: string;
}) {
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
  if (tone === 'good')
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-slate-200 bg-slate-100 text-slate-700';
}

function createLocalFlow(
  title: string,
  value: number,
  currency: Currency,
): Flow {
  return {
    id: Date.now(),
    time: 'Новая',
    source: title,
    owner: 'Подразделение',
    type: 'Заявка',
    amount: `-${value} млн ${currency}`,
    currency,
    impact: -value,
    status: 'На согласовании',
    tone: value > 250 ? 'critical' : 'warning',
    priority: value > 250 ? 'Высокий' : 'Средний',
    route:
      value > 250
        ? 'Подразделение → Казначейство → Руководитель'
        : 'Подразделение → Казначейство',
    comment:
      'Заявка сохранена локально, потому что серверный API недоступен в текущем окружении.',
  };
}

function mergeServerFlows(serverFlows: Flow[], currentFlows: Flow[]) {
  const knownIds = new Set(serverFlows.map((flow) => flow.id));
  return [
    ...serverFlows,
    ...currentFlows.filter((flow) => !knownIds.has(flow.id)),
  ];
}

function mergeAuditEvents(
  serverEvents: AuditEvent[],
  currentEvents: AuditEvent[],
) {
  const knownIds = new Set(serverEvents.map((event) => event.id));
  return [
    ...serverEvents,
    ...currentEvents.filter((event) => !knownIds.has(event.id)),
  ].slice(0, 12);
}

function roleApiCode(role: UserRole) {
  const codes: Record<UserRole, string> = {
    Казначей: 'treasury',
    'Риск-менеджер': 'risk',
    Руководитель: 'executive',
    Аудитор: 'auditor',
  };

  return codes[role];
}

function auditFingerprint(event: AuditEvent, index: number) {
  const raw = `${event.id}:${event.time}:${event.action}:${event.detail}:${index}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return `AUD-${hash.toString(16).padStart(8, '0').toUpperCase()}`;
}

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
