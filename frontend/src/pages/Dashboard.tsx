import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Box, CheckCircle2, Clock3, DollarSign, FileText, MoreHorizontal, Plus, Users, ArrowRight, PhoneCall } from 'lucide-react';
import { api } from '../services/api';

type Activity = { title: string; detail: string; time: string; tone: string; icon: React.ElementType };
type ChartPoint = { month: string; value: string; change: string; x: number; y: number };
type CollectionBar = { month: string; expected: string; collected: string; rate: string; height: number };
type CollectionCase = { id: string; contract_id: string; status: string; outstanding_amount: string | number; created_at?: string };
type Contract = { id: string; application_id: string };
type Application = { id: string; customer_id: string };
type Customer = { id: string; company_name?: string; first_name?: string; last_name?: string };

const chartPoints: ChartPoint[] = [
  { month: 'Apr', value: '$2.21m', change: '+2.4%', x: 0, y: 155 },
  { month: 'May', value: '$2.32m', change: '+4.9%', x: 140, y: 133 },
  { month: 'Jun', value: '$2.45m', change: '+5.6%', x: 280, y: 116 },
  { month: 'Jul', value: '$2.59m', change: '+5.7%', x: 420, y: 91 },
  { month: 'Aug', value: '$2.72m', change: '+5.0%', x: 555, y: 62 },
  { month: 'Sep', value: '$2.84m', change: '+4.4%', x: 700, y: 35 },
];

const collectionBars: CollectionBar[] = [
  { month: 'Oct', expected: '$142k', collected: '$138k', rate: '97.2%', height: 34 },
  { month: 'Nov', expected: '$151k', collected: '$146k', rate: '96.7%', height: 50 },
  { month: 'Dec', expected: '$148k', collected: '$141k', rate: '95.3%', height: 42 },
  { month: 'Jan', expected: '$160k', collected: '$153k', rate: '95.6%', height: 65 },
  { month: 'Feb', expected: '$158k', collected: '$150k', rate: '94.9%', height: 53 },
  { month: 'Mar', expected: '$172k', collected: '$165k', rate: '95.9%', height: 74 },
  { month: 'Apr', expected: '$168k', collected: '$160k', rate: '95.2%', height: 62 },
  { month: 'May', expected: '$178k', collected: '$169k', rate: '94.9%', height: 88 },
  { month: 'Jun', expected: '$181k', collected: '$172k', rate: '95.0%', height: 72 },
  { month: 'Jul', expected: '$188k', collected: '$179k', rate: '95.2%', height: 91 },
  { month: 'Aug', expected: '$191k', collected: '$181k', rate: '94.8%', height: 81 },
  { month: 'Sep', expected: '$195k', collected: '$184.6k', rate: '94.8%', height: 96 },
];

const Tooltip = ({ children }: { children: React.ReactNode }) => <div className="pointer-events-none absolute z-20 hidden min-w-32 -translate-x-1/2 -translate-y-full rounded-lg bg-[#10263f] px-3 py-2 text-left text-[11px] text-white shadow-xl group-hover:block group-focus-within:block">{children}<span className="absolute left-1/2 top-full -ml-1 border-4 border-transparent border-t-[#10263f]" /></div>;

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ customers: 0, applications: 0, assets: 0 });
  const [loading, setLoading] = useState(true);
  const [collectionCases, setCollectionCases] = useState<CollectionCase[]>([]);
  const [collectionContext, setCollectionContext] = useState({ contracts: [] as Contract[], applications: [] as Application[], customers: [] as Customer[] });
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [collectionsError, setCollectionsError] = useState(false);

  const unwrap = (response: any) => response.data?.items || response.data?.data?.items || response.data || [];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [customers, applications, assets] = await Promise.all([api.get('/customers/'), api.get('/applications/'), api.get('/assets/')]);
        const items = (response: any) => response.data?.items || response.data?.data?.items || (Array.isArray(response.data) ? response.data : []);
        setStats({ customers: items(customers).length, applications: items(applications).length, assets: items(assets).length });
      } catch (error) { console.error('Error fetching dashboard stats:', error); } finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchCollections = async () => {
      setCollectionsLoading(true);
      setCollectionsError(false);
      try {
        const [casesResponse, contractsResponse, applicationsResponse, customersResponse] = await Promise.all([
          api.get('/collections/cases'),
          api.get('/contracts/'),
          api.get('/applications/'),
          api.get('/customers/'),
        ]);
        setCollectionCases(unwrap(casesResponse).filter((item: CollectionCase) => item.status !== 'CLOSED'));
        setCollectionContext({
          contracts: unwrap(contractsResponse),
          applications: unwrap(applicationsResponse),
          customers: unwrap(customersResponse),
        });
      } catch (error) {
        console.error('Error fetching collections queue:', error);
        setCollectionsError(true);
      } finally {
        setCollectionsLoading(false);
      }
    };
    fetchCollections();
  }, []);

  const getCustomerName = (collectionCase: CollectionCase) => {
    const contract = collectionContext.contracts.find((item) => item.id === collectionCase.contract_id);
    const application = collectionContext.applications.find((item) => item.id === contract?.application_id);
    const customer = collectionContext.customers.find((item) => item.id === application?.customer_id);
    return customer?.company_name || `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'Customer unavailable';
  };

  const queueCases = [...collectionCases].sort((left, right) => {
    const priority = { LEGAL: 0, ESCALATED: 1, OPEN: 2, IN_PROGRESS: 3, PROMISE_TO_PAY: 4 } as Record<string, number>;
    return (priority[left.status] ?? 5) - (priority[right.status] ?? 5) || Number(right.outstanding_amount) - Number(left.outstanding_amount);
  }).slice(0, 5);

  const openBalance = collectionCases.reduce((total, item) => total + Number(item.outstanding_amount || 0), 0);
  const statusLabel = (status: string) => status.replace(/_/g, ' ');
  const statusTone = (status: string) => status === 'LEGAL' || status === 'ESCALATED'
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : status === 'PROMISE_TO_PAY'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';

  const kpis = [
    { label: 'Portfolio value', value: '$2.84m', change: '+8.2%', icon: DollarSign, tone: 'text-[#17635e] bg-[#e5f1ef]' },
    { label: 'Active contracts', value: loading ? '-' : stats.applications.toLocaleString(), change: '+12.4%', icon: FileText, tone: 'text-[#2a527d] bg-[#e8eff7]' },
    { label: 'Customers', value: loading ? '-' : stats.customers.toLocaleString(), change: '+4.6%', icon: Users, tone: 'text-[#956b24] bg-[#f8efdc]' },
    { label: 'Assets financed', value: loading ? '-' : stats.assets.toLocaleString(), change: '-1.8%', icon: Box, tone: 'text-[#8f5360] bg-[#f7e9ed]' },
  ];
  const activities: Activity[] = [
    { title: 'New application received', detail: 'Northstar Logistics - Equipment finance', time: '12 min ago', tone: 'bg-[#e8eff7]', icon: Users },
    { title: 'Payment received', detail: 'Contract FL-2048 - $12,480.00', time: '48 min ago', tone: 'bg-[#e5f1ef]', icon: CheckCircle2 },
    { title: 'Review required', detail: '2 documents missing - FL-2039', time: '2 hours ago', tone: 'bg-[#f8efdc]', icon: AlertTriangle },
  ];

  return <div className="min-h-full bg-[#f5f7fa] px-5 py-7 text-slate-900 sm:px-8 lg:px-10"><div className="mx-auto max-w-[1500px] space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#17635e]">Portfolio overview</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#10263f] sm:text-3xl">Good morning, Alex</h1><p className="mt-1 text-sm text-slate-500">Here is what is happening across your finance book today.</p></div><div className="flex gap-3"><button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50">Last 30 days</button><button className="inline-flex items-center gap-2 rounded-lg bg-[#17635e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#12534f]"><Plus size={17} /> New application</button></div></div>
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(({ label, value, change, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold tracking-tight text-[#10263f]">{value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={19} /></div></div><div className="mt-4 flex items-center gap-1.5 text-xs"><span className={change.startsWith('+') ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>{change}</span><span className="text-slate-400">vs last month</span>{change.startsWith('+') ? <ArrowUpRight size={14} className="text-emerald-600" /> : <ArrowDownRight size={14} className="text-rose-600" />}</div></div>)}</section>
    <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-[#10263f]">Portfolio performance</h2><p className="mt-1 text-xs text-slate-400">Outstanding principal balance</p></div><button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50" aria-label="More portfolio options"><MoreHorizontal size={19} /></button></div><div className="mt-7 flex items-end gap-3"><p className="text-3xl font-semibold tracking-tight text-[#10263f]">$2.84m</p><span className="mb-1 text-xs font-bold text-emerald-600">+8.2%</span></div><div className="mt-5 h-44"><div className="relative h-full overflow-visible rounded-xl bg-gradient-to-b from-[#edf7f5] to-white"><svg viewBox="0 0 700 180" className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" aria-label="Portfolio balance from April to September"><path d="M0 155 C70 142 85 126 145 134 S220 106 280 116 S355 74 420 91 S500 45 555 62 S640 25 700 35 V180 H0Z" fill="#dcefeb" /><path d="M0 155 C70 142 85 126 145 134 S220 106 280 116 S355 74 420 91 S500 45 555 62 S640 25 700 35" fill="none" stroke="#17635e" strokeWidth="3" />{chartPoints.map((point) => <g key={point.month} className="group"><a href={`/accounting?period=${point.month.toLowerCase()}`} aria-label={`${point.month}: ${point.value}, ${point.change}`}><circle cx={point.x} cy={point.y} r="9" fill="transparent" tabIndex={0} /><circle cx={point.x} cy={point.y} r="4" fill="#17635e" className="transition-all group-hover:r-6 group-focus:r-6" /><foreignObject x={point.x - 58} y={point.y - 70} width="116" height="54"><Tooltip><p className="font-semibold">{point.month} portfolio</p><p className="mt-1 text-slate-300">{point.value} <span className="text-emerald-300">{point.change}</span></p></Tooltip></foreignObject></a></g>)}</svg><div className="absolute bottom-3 left-4 right-4 flex justify-between text-[10px] font-medium text-slate-400">{chartPoints.map((point) => <span key={point.month}>{point.month}</span>)}</div></div></div><p className="mt-3 text-[11px] text-slate-400">Hover or focus a point to inspect the monthly balance.</p></div>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-[#10263f]">Application pipeline</h2><p className="mt-1 text-xs text-slate-400">Current underwriting queue</p></div><a href="/leases" className="text-xs font-semibold text-[#17635e] hover:underline">View all</a></div><div className="mt-6 space-y-5">{[{ label: 'Approved', count: 48, percent: '68%', color: 'bg-[#17635e]' }, { label: 'Under review', count: 17, percent: '24%', color: 'bg-[#d6a85b]' }, { label: 'Needs attention', count: 6, percent: '8%', color: 'bg-[#b65c62]' }].map((item) => <div key={item.label}><div className="mb-2 flex justify-between text-xs"><span className="font-medium text-slate-600">{item.label}</span><span className="font-bold text-[#10263f]">{item.count} <span className="font-normal text-slate-400">({item.percent})</span></span></div><div className="h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.color}`} style={{ width: item.percent }} /></div></div>)}</div><div className="mt-7 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500"><Clock3 size={14} className="text-[#d6a85b]" /> Average decision time <span className="font-semibold text-slate-700">1.8 days</span></div></div>
    </section>
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="collections-queue-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b65c62]">Collections work queue</p><h2 id="collections-queue-heading" className="mt-2 font-semibold text-[#10263f]">Cases needing attention</h2><p className="mt-1 text-xs text-slate-400">Open cases ordered by escalation and outstanding balance.</p></div>
        <a href="/collections" className="inline-flex items-center gap-1 self-start text-xs font-semibold text-[#17635e] hover:underline">Open collections workspace <ArrowRight size={14} /></a>
      </div>
      {collectionsLoading ? <div className="mt-5 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400" role="status">Loading collections queue...</div> : collectionsError ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700" role="alert">Collections queue is unavailable right now. Open the Collections workspace to retry.</div> : collectionCases.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={24} /><p className="mt-2 text-sm font-semibold text-slate-700">No open collection cases</p><p className="mt-1 text-xs text-slate-400">Your current portfolio has no collection work waiting.</p></div> : <>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#f7faf9] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Open cases</p><p className="mt-1 text-lg font-semibold text-[#10263f]">{collectionCases.length}</p></div><div className="rounded-xl bg-[#f7faf9] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Outstanding balance</p><p className="mt-1 text-lg font-semibold text-[#10263f]">${openBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div></div>
        <div className="mt-4 divide-y divide-slate-100">{queueCases.map((collectionCase) => <div key={collectionCase.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-start gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7e9ed]"><PhoneCall size={16} className="text-[#b65c62]" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-700">{getCustomerName(collectionCase)}</p><p className="mt-1 text-xs text-slate-400">Contract #{collectionCase.contract_id.slice(0, 8).toUpperCase()}</p></div></div><div className="flex items-center justify-between gap-4 sm:justify-end"><div className="text-left sm:text-right"><p className="text-sm font-semibold text-[#10263f]">${Number(collectionCase.outstanding_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p><p className="mt-1 text-[11px] text-slate-400">Outstanding</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusTone(collectionCase.status)}`}>{statusLabel(collectionCase.status)}</span><a href="/collections" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-[#17635e]" aria-label={`Open collections for ${getCustomerName(collectionCase)}`}><ArrowRight size={17} /></a></div></div>)}</div>
        {collectionCases.length > queueCases.length && <p className="border-t border-slate-100 pt-3 text-center text-xs text-slate-400">Showing the 5 highest-priority cases.</p>}
      </>}
    </section>
    <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]"><div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-[#10263f]">Recent activity</h2><p className="mt-1 text-xs text-slate-400">Latest movements across your book</p></div><button className="text-xs font-semibold text-[#17635e]">View activity</button></div><div className="mt-4 divide-y divide-slate-100">{activities.map(({ title, detail, time, tone, icon: ActivityIcon }) => <div className="flex items-center gap-3 py-4" key={title}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}><ActivityIcon size={16} className="text-[#17635e]" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-700">{title}</p><p className="mt-0.5 truncate text-xs text-slate-400">{detail}</p></div><span className="shrink-0 text-[11px] text-slate-400">{time}</span></div>)}</div></div>
      <div className="rounded-2xl bg-[#10263f] p-6 text-white shadow-[0_8px_24px_rgba(16,38,63,0.16)]"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d6a85b]">Collections outlook</p><h2 className="mt-3 text-2xl font-semibold">$184,620</h2><p className="mt-1 text-sm text-slate-400">Expected this month</p><div className="mt-6 flex h-20 items-end gap-1.5">{collectionBars.map((bar) => <div key={bar.month} className="group relative flex h-full flex-1 items-end" tabIndex={0} aria-label={`${bar.month}: expected ${bar.expected}, collected ${bar.collected}, rate ${bar.rate}`}><Tooltip><p className="font-semibold">{bar.month} collections</p><p className="mt-1 text-slate-300">Expected {bar.expected}</p><p className="text-slate-300">Collected {bar.collected}</p><p className="mt-1 font-semibold text-emerald-300">Rate {bar.rate}</p></Tooltip><div className={`w-full rounded-t-sm transition-all group-hover:brightness-125 group-focus:brightness-125 ${bar.month === 'Sep' ? 'bg-[#d6a85b]' : 'bg-white/20'}`} style={{ height: `${bar.height}%` }} /></div>)}</div><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs"><span className="text-slate-400">Collection rate</span><span className="font-bold text-emerald-300">94.8% <ArrowUpRight size={13} className="inline" /></span></div><p className="mt-3 text-[11px] text-slate-500">Hover or focus a bar for monthly collection details.</p></div></section>
  </div></div>;
};
