import React, { useEffect, useState, useRef } from 'react';
import { 
  AlertCircle, ArrowRight, BriefcaseBusiness, Check, CheckCircle2, 
  ChevronDown, Clock3, FileCheck2, Filter, Plus, Search, ShieldCheck, 
  XCircle, MoreVertical, Eye, Trash2, Send, History, X, DollarSign, Calendar, FileText
} from 'lucide-react';
import { api } from '../services/api';

type RecordItem = Record<string, any>;
const statusStyles: Record<string, string> = { 
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200', 
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200', 
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200' 
};
const money = (value: any) => `$${Number.parseFloat(value || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Leases() {
  const [applications, setApplications] = useState<RecordItem[]>([]);
  const [customers, setCustomers] = useState<RecordItem[]>([]);
  const [assets, setAssets] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modals state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [decisionModal, setDecisionModal] = useState<{ id: string; action: 'APPROVE' | 'REJECT' | 'SUBMIT' } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [historyModalApp, setHistoryModalApp] = useState<RecordItem | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<any[]>([]);
  const [deletingApp, setDeletingApp] = useState<RecordItem | null>(null);

  const [draft, setDraft] = useState({ 
    customer_id: '', 
    asset_id: '', 
    requested_amount: '', 
    down_payment: '', 
    tenure_months: 12, 
    notes: '' 
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unwrap = (response: any) => response.data?.items || response.data?.data?.items || response.data || [];
  
  const load = async () => { 
    setLoading(true); 
    try { 
      const [apps, custs, collateral] = await Promise.all([
        api.get('/applications/'), 
        api.get('/customers/'), 
        api.get('/assets/')
      ]); 
      setApplications(Array.isArray(unwrap(apps)) ? unwrap(apps) : []); 
      setCustomers(Array.isArray(unwrap(custs)) ? unwrap(custs) : []); 
      setAssets(Array.isArray(unwrap(collateral)) ? unwrap(collateral) : []); 
    } catch (error) { 
      console.error('Failed to load lease workspace', error); 
    } finally { 
      setLoading(false); 
    } 
  };

  useEffect(() => { load(); }, []);

  const customerName = (id: string) => { 
    const customer = customers.find((item) => item.id === id); 
    return customer?.company_name || `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'Unassigned customer'; 
  };

  const assetName = (id: string) => { 
    const asset = assets.find((item) => item.id === id); 
    return asset ? `${asset.make || ''} ${asset.model_name || ''}`.trim() || asset.serial_number : 'Collateral not attached'; 
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModal) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (decisionModal.action === 'APPROVE') {
        await api.post(`/applications/${decisionModal.id}/approve`, { reason: decisionReason.trim() || 'Credit requirements satisfied and approved.' });
      } else if (decisionModal.action === 'REJECT') {
        await api.post(`/applications/${decisionModal.id}/reject`, { reason: decisionReason.trim() || 'Declined due to risk criteria.' });
      } else if (decisionModal.action === 'SUBMIT') {
        await api.post(`/applications/${decisionModal.id}/submit`, { reason: decisionReason.trim() || 'Submitted for credit committee review.' });
      }
      setDecisionModal(null);
      setDecisionReason('');
      await load();
    } catch (error: any) {
      console.error("Decision error", error);
      alert(error.response?.data?.detail || "Failed to record decision.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDecisionHistory = async (app: RecordItem) => {
    setHistoryModalApp(app);
    try {
      const res = await api.get(`/applications/${app.id}/decisions`);
      setDecisionHistory(res.data || []);
    } catch (error) {
      console.error("Failed to load decisions", error);
      setDecisionHistory([]);
    }
  };

  const handleDelete = async () => {
    if (!deletingApp) return;
    setSubmitting(true);
    try {
      await api.delete(`/applications/${deletingApp.id}`);
      setDeletingApp(null);
      await load();
    } catch (error: any) {
      console.error("Failed to delete application", error);
      alert(error.response?.data?.detail || "Failed to delete application.");
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (event: React.FormEvent) => { 
    event.preventDefault(); 
    setSubmitting(true); 
    setErrorMsg(''); 
    try { 
      await api.post('/applications/', { 
        customer_id: draft.customer_id, 
        asset_id: draft.asset_id || null, 
        requested_amount: Number(draft.requested_amount), 
        down_payment: Number(draft.down_payment || 0), 
        tenure_months: draft.tenure_months, 
        notes: draft.notes || null 
      }); 
      setShowForm(false); 
      setDraft({ customer_id: '', asset_id: '', requested_amount: '', down_payment: '', tenure_months: 12, notes: '' }); 
      await load(); 
    } catch (error: any) { 
      setErrorMsg(error.response?.data?.detail || 'Unable to create application.'); 
    } finally { 
      setSubmitting(false); 
    } 
  };

  const visible = applications.filter((item) => { 
    const term = search.toLowerCase(); 
    const matchesText = !term || customerName(item.customer_id).toLowerCase().includes(term) || String(item.id).toLowerCase().includes(term); 
    return (filter === 'ALL' || item.status === filter) && matchesText; 
  });

  const selected = applications.find((item) => item.id === selectedId) || visible[0];
  const totalValue = applications.reduce((sum, item) => sum + Number.parseFloat(item.requested_amount || '0'), 0);
  const approved = applications.filter((item) => item.status === 'APPROVED').length;
  const review = applications.filter((item) => item.status === 'UNDER_REVIEW').length;
  
  const statCards = [
    { label: 'Pipeline Value', value: money(totalValue), note: 'Requested Principal', icon: BriefcaseBusiness, color: 'text-[#17635e] bg-[#e5f1ef]' }, 
    { label: 'Under Review', value: String(review), note: 'Pending Decisions', icon: Clock3, color: 'text-[#956b24] bg-[#f8efdc]' }, 
    { label: 'Approved', value: String(approved), note: 'Ready for Contract', icon: CheckCircle2, color: 'text-[#2a527d] bg-[#e8eff7]' }, 
    { label: 'Approval Rate', value: applications.length ? `${Math.round(approved / applications.length * 100)}%` : '0%', note: 'Current Book', icon: ShieldCheck, color: 'text-[#8f5360] bg-[#f7e9ed]' }
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Lease Applications</h1>
          <p className="mt-1 text-sm text-slate-500">Underwriting queue, credit decisions, and collateral verification.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> New Application
        </button>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, note, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{note}</p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* New Application Drawer / Form */}
      {showForm && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-slate-900">Originate Lease Application</h2>
              <p className="text-xs text-slate-400">Capture financial terms required for underwriting review.</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={18} />
            </button>
          </div>
          {errorMsg && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{errorMsg}</div>}
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold text-slate-600">
              Customer
              <select required value={draft.customer_id} onChange={(e) => setDraft({ ...draft, customer_id: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal">
                <option value="">Select customer...</option>
                {customers.map((item) => <option key={item.id} value={item.id}>{customerName(item.id)}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Collateral / Asset
              <select value={draft.asset_id} onChange={(e) => setDraft({ ...draft, asset_id: e.target.value })} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal">
                <option value="">Select asset (optional)...</option>
                {assets.map((item) => <option key={item.id} value={item.id}>{assetName(item.id)} - {money(item.current_value)}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Requested Principal ($)
              <input required type="number" min="1" step="0.01" value={draft.requested_amount} onChange={(e) => setDraft({ ...draft, requested_amount: e.target.value })} placeholder="50000" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal" />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Term (Months)
              <select value={draft.tenure_months} onChange={(e) => setDraft({ ...draft, tenure_months: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal">
                <option value={12}>12 months</option>
                <option value={24}>24 months</option>
                <option value={36}>36 months</option>
                <option value={48}>48 months</option>
                <option value={60}>60 months</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Down Payment ($)
              <input type="number" min="0" step="0.01" value={draft.down_payment} onChange={(e) => setDraft({ ...draft, down_payment: e.target.value })} placeholder="5000" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal" />
            </label>
            <label className="text-xs font-semibold text-slate-600 md:col-span-2">
              Underwriting Notes
              <input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Add commercial context or credit observations" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal" />
            </label>
            <div className="flex items-end">
              <button disabled={submitting} type="submit" className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Main Workspace Layout */}
      <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        {/* Left: Underwriting Queue Table */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs overflow-visible">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Underwriting Queue</h2>
              <p className="text-xs text-slate-400">Prioritize credit decisions by risk status.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search queue..." className="w-40 rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                <option value="ALL">All Statuses</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-visible">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Collateral</th>
                  <th>Principal</th>
                  <th>Term</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">Loading queue...</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">No applications found.</td></tr>
                ) : (
                  visible.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedId(item.id)} 
                      className={`cursor-pointer hover:bg-slate-50 transition-colors ${selected?.id === item.id ? 'bg-blue-50/50' : ''}`}
                    >
                      <td>
                        <p className="text-xs font-semibold text-slate-900">{customerName(item.customer_id)}</p>
                        <p className="text-[10px] font-mono text-slate-400">#{(item.id || '').substring(0, 8)}</p>
                      </td>
                      <td className="text-xs text-slate-600">{assetName(item.asset_id)}</td>
                      <td className="text-xs font-bold text-slate-900">{money(item.requested_amount)}</td>
                      <td className="text-xs text-slate-500">{item.tenure_months || 0} mo</td>
                      <td>
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${statusStyles[item.status] || statusStyles.DRAFT}`}>
                          {String(item.status || 'DRAFT').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-right relative" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenuId === item.id && (
                          <div 
                            ref={menuRef}
                            className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1 text-left"
                          >
                            <button
                              onClick={() => {
                                setSelectedId(item.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={13} /> Inspect Application
                            </button>

                            <button
                              onClick={() => {
                                openDecisionHistory(item);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 cursor-pointer"
                            >
                              <History size={13} /> Decision History
                            </button>

                            {item.status === 'DRAFT' && (
                              <button
                                onClick={() => {
                                  setDecisionModal({ id: item.id, action: 'SUBMIT' });
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Send size={13} /> Submit for Review
                              </button>
                            )}

                            {item.status === 'UNDER_REVIEW' && (
                              <>
                                <button
                                  onClick={() => {
                                    setDecisionModal({ id: item.id, action: 'APPROVE' });
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Check size={13} /> Approve Deal
                                </button>
                                <button
                                  onClick={() => {
                                    setDecisionModal({ id: item.id, action: 'REJECT' });
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <XCircle size={13} /> Decline Deal
                                </button>
                              </>
                            )}

                            <div className="h-px bg-slate-100 my-1"></div>
                            <button
                              onClick={() => {
                                setDeletingApp(item);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={13} /> Delete Application
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Selected Application Detail Inspector */}
        <aside className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Application Inspector</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">{selected ? customerName(selected.customer_id) : 'Select an application'}</h2>
            <p className="text-xs text-slate-400">{selected ? `Ref: #${String(selected.id || '').substring(0, 8)}` : 'Choose a row to inspect'}</p>
          </div>

          {selected ? (
            <div className="space-y-4 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusStyles[selected.status] || statusStyles.DRAFT}`}>
                  {String(selected.status || 'DRAFT').replace('_', ' ')}
                </span>
                <button
                  onClick={() => openDecisionHistory(selected)}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <History size={13} /> History Log
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Requested Principal</p>
                  <p className="mt-1 text-base font-bold text-slate-900">{money(selected.requested_amount)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Amortization Term</p>
                  <p className="mt-1 text-base font-bold text-slate-900">{selected.tenure_months || 0} Months</p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Down Payment:</span>
                  <span className="font-semibold text-slate-800">{money(selected.down_payment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Monthly:</span>
                  <span className="font-semibold text-slate-800">
                    {money((Number.parseFloat(selected.requested_amount || '0') - Number.parseFloat(selected.down_payment || '0')) / (selected.tenure_months || 1))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collateral:</span>
                  <span className="font-semibold text-slate-800">{assetName(selected.asset_id)}</span>
                </div>
              </div>

              {selected.status === 'UNDER_REVIEW' && (
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setDecisionModal({ id: selected.id, action: 'REJECT' })} 
                    className="flex-1 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <XCircle size={14} /> Decline
                  </button>
                  <button 
                    onClick={() => setDecisionModal({ id: selected.id, action: 'APPROVE' })} 
                    className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check size={14} /> Approve
                  </button>
                </div>
              )}

              {selected.status === 'APPROVED' && (
                <a href="/contracts" className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-blue-600 hover:text-blue-800">
                  Generate Contract Agreement <ArrowRight size={14} />
                </a>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              <AlertCircle className="mx-auto mb-2 text-slate-300" size={20} />
              Select an application from the queue.
            </div>
          )}
        </aside>
      </section>

      {/* Decision Rationale Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-900">
                {decisionModal.action === 'APPROVE' ? 'Approve Application' : decisionModal.action === 'REJECT' ? 'Decline Application' : 'Submit for Review'}
              </h3>
              <button onClick={() => setDecisionModal(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Decision Rationale / Notes</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="State underwriting basis, KYC checks, or decline reasons..."
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setDecisionModal(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-xs cursor-pointer disabled:opacity-50 ${
                    decisionModal.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : decisionModal.action === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting ? 'Recording...' : `Confirm ${decisionModal.action}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision History Modal */}
      {historyModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-900">Decision Audit Trail</h3>
              <button onClick={() => setHistoryModalApp(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
              {decisionHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No underwriting decisions recorded yet.</p>
              ) : (
                decisionHistory.map((d: any, idx: number) => (
                  <div key={d.id || idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div className="flex justify-between items-center font-semibold text-slate-900">
                      <span>{d.previous_status || 'DRAFT'} &rarr; {d.new_status}</span>
                      <span className="text-[10px] text-slate-400">{d.created_at ? new Date(d.created_at).toLocaleString() : 'Recent'}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{d.reason}</p>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setHistoryModalApp(null)} className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">Delete Application</h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to delete application <span className="font-semibold text-slate-800">#{(deletingApp.id || '').substring(0, 8)}</span> for {customerName(deletingApp.customer_id)}?
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingApp(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
