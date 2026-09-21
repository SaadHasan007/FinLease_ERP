import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, AlertOctagon, MessageSquare, Mail, Activity, CalendarClock, Plus, Search, Filter, MoreVertical, Eye, X, DollarSign, Calendar, Hash, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function Collections() {
  const [cases, setCases] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showAddForm, setShowAddForm] = useState(false);
  const [actionCaseId, setActionCaseId] = useState<string | null>(null);
  const [viewingCase, setViewingCase] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [newCase, setNewCase] = useState({
    contract_id: '',
    status: 'OPEN',
    outstanding_amount: ''
  });

  const [newAction, setNewAction] = useState({
    action_type: 'PHONE',
    notes: '',
    promise_amount: '',
    promise_date: ''
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [casesRes, contractsRes, actionsRes] = await Promise.all([
        api.get('/collections/cases'),
        api.get('/contracts/'),
        api.get('/collections/actions')
      ]);
      const cs = casesRes.data?.items || casesRes.data?.data?.items || (Array.isArray(casesRes.data) ? casesRes.data : []);
      const cts = contractsRes.data?.items || contractsRes.data?.data?.items || (Array.isArray(contractsRes.data) ? contractsRes.data : []);
      const acts = actionsRes.data?.items || actionsRes.data?.data?.items || (Array.isArray(actionsRes.data) ? actionsRes.data : []);

      setCases(Array.isArray(cs) ? cs : []);
      setContracts(Array.isArray(cts) ? cts : []);
      setActions(Array.isArray(acts) ? acts : []);
    } catch (error) {
      console.error("Failed to fetch collections data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        contract_id: newCase.contract_id,
        status: newCase.status,
        outstanding_amount: parseFloat(newCase.outstanding_amount || '0')
      };
      await api.post('/collections/cases', payload);
      setShowAddForm(false);
      setNewCase({
        contract_id: '',
        status: 'OPEN',
        outstanding_amount: ''
      });
      await fetchData();
    } catch (error: any) {
      console.error("Failed to open collection case", error.response?.data || error);
      setErrorMsg(error.response?.data?.detail || error.response?.data?.message || "Failed to open case");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionCaseId) return;
    setSubmitting(true);
    try {
      const payload: any = {
        case_id: actionCaseId,
        action_type: newAction.action_type,
        notes: newAction.notes,
        promise_amount: newAction.promise_amount ? parseFloat(newAction.promise_amount) : null,
        promise_date: newAction.promise_date || null
      };
      await api.post('/collections/actions', payload);
      setActionCaseId(null);
      setNewAction({
        action_type: 'PHONE',
        notes: '',
        promise_amount: '',
        promise_date: ''
      });
      await fetchData();
    } catch (error: any) {
      console.error("Failed to record action", error.response?.data || error);
      alert("Failed to log activity: " + (error.response?.data?.detail || "Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const updateCaseStatus = async (id: string, status: string) => {
    setActiveMenuId(null);
    try {
      await api.patch(`/collections/cases/${id}`, { status });
      await fetchData();
    } catch (error: any) {
      console.error("Failed to update status", error);
      alert("Failed to update status: " + (error.response?.data?.detail || "Error updating status"));
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'PROMISE_TO_PAY': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'ESCALATED': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'LEGAL': return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'CLOSED': return 'bg-slate-100 text-slate-800 border border-slate-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'PHONE': return <PhoneCall className="w-4 h-4 text-blue-500" />;
      case 'EMAIL': return <Mail className="w-4 h-4 text-emerald-500" />;
      case 'SMS': return <MessageSquare className="w-4 h-4 text-amber-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredCases = cases.filter(c => {
    const term = searchTerm.toLowerCase();
    const caseId = (c.id || '').toLowerCase();
    const contractId = (c.contract_id || '').toLowerCase();
    const matchesSearch = !term || caseId.includes(term) || contractId.includes(term);
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Delinquency & Collections</h1>
          <p className="text-sm text-slate-500 mt-1">Manage defaulted contracts, follow-up contact logs, and legal escalations.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-sm font-medium rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <AlertOctagon size={16} />
          Open Collection Case
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 border border-slate-200 rounded-md shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by case ID or contract ID..." 
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Stages</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PROMISE_TO_PAY">Promise to Pay</option>
            <option value="ESCALATED">Escalated</option>
            <option value="LEGAL">Legal Action</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Cases List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-xl">Loading collection cases...</div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-xl">
            <AlertOctagon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Collection Cases Found</h3>
            <p className="text-xs text-slate-400 mt-1">Portfolio delinquency is in good standing.</p>
          </div>
        ) : (
          filteredCases.map((c) => {
            const caseActions = actions.filter(a => a.case_id === c.id);
            const targetContract = contracts.find(ct => ct.id === c.contract_id);
            
            return (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col md:flex-row">
                {/* Left Card Pane */}
                <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200 md:w-1/3 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${getStatusBadgeClass(c.status)}`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === c.id ? null : c.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeMenuId === c.id && (
                          <div 
                            ref={menuRef}
                            className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1 text-left"
                          >
                            <button
                              onClick={() => {
                                setViewingCase(c);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={13} /> View Full Dossier
                            </button>
                            <button
                              onClick={() => {
                                setActionCaseId(c.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 cursor-pointer"
                            >
                              <Plus size={13} /> Log Contact Action
                            </button>
                            <div className="h-px bg-slate-100 my-1"></div>
                            <div className="px-4 py-1 text-[10px] uppercase font-semibold text-slate-400">Update Stage</div>
                            {['OPEN', 'IN_PROGRESS', 'PROMISE_TO_PAY', 'ESCALATED', 'LEGAL', 'CLOSED'].map((st) => (
                              <button
                                key={st}
                                onClick={() => updateCaseStatus(c.id, st)}
                                disabled={c.status === st}
                                className={`w-full px-4 py-1.5 text-xs text-left cursor-pointer ${c.status === st ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-50'}`}
                              >
                                {st.replace(/_/g, ' ')}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-900 mb-0.5">
                      ${parseFloat(c.outstanding_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mb-4">Total Delinquent Balance</p>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Case ID:</span>
                        <span className="font-mono text-slate-800 font-semibold">{c.id.substring(0,8)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Contract:</span>
                        <span className="font-mono text-blue-600 font-semibold">#{targetContract?.id.substring(0,8) || (c.contract_id || '').substring(0,8)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Opened:</span>
                        <span className="text-slate-700">{c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Active'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => setViewingCase(c)}
                      className="flex-1 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye size={13} /> Dossier
                    </button>
                    <button
                      onClick={() => setActionCaseId(c.id)}
                      className="flex-1 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md hover:bg-rose-100 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Log Action
                    </button>
                  </div>
                </div>
                
                {/* Right Timeline Pane */}
                <div className="p-6 md:w-2/3">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Follow-up Activity History ({caseActions.length})
                    </h4>
                    <span className="text-xs text-slate-400">Latest actions on top</span>
                  </div>
                  
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {caseActions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4">No activity logged yet. Click 'Log Action' to record communication.</p>
                    ) : (
                      caseActions.sort((a,b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()).map(action => (
                        <div key={action.id} className="flex gap-3 text-xs">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 mt-0.5">
                            {getActionIcon(action.action_type)}
                          </div>
                          <div className="flex-1 bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                            <div className="flex justify-between items-start mb-0.5">
                              <span className="font-semibold text-slate-800">{action.action_type}</span>
                              <span className="text-[10px] text-slate-400">
                                {action.created_at ? new Date(action.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Logged'}
                              </span>
                            </div>
                            <p className="text-slate-600">{action.notes}</p>
                            {action.promise_amount && (
                              <div className="mt-1.5 inline-flex items-center bg-emerald-50 text-emerald-700 text-[11px] px-2 py-0.5 rounded border border-emerald-100 font-medium">
                                <CalendarClock className="w-3 h-3 mr-1" />
                                Promised: ${parseFloat(action.promise_amount).toLocaleString()} {action.promise_date ? `by ${action.promise_date}` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: View Full Dossier */}
      {viewingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                  <AlertOctagon size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Case Dossier #{viewingCase.id.substring(0,8)}</h3>
                  <p className="text-xs text-slate-500">Delinquency Portfolio Analysis</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingCase(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Stage</span>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full font-semibold ${getStatusBadgeClass(viewingCase.status)}`}>
                    {viewingCase.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Delinquent Amount</span>
                  <span className="text-base font-bold text-rose-700 mt-0.5 block">
                    ${parseFloat(viewingCase.outstanding_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Case Details</div>
                <div className="space-y-1.5 bg-white border border-slate-200 rounded-md p-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contract Reference:</span>
                    <span className="font-mono text-slate-800 font-semibold">{viewingCase.contract_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Opened Date:</span>
                    <span className="text-slate-800">{viewingCase.created_at ? new Date(viewingCase.created_at).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">All Action Logs</div>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-100 rounded-md p-2">
                  {actions.filter(a => a.case_id === viewingCase.id).length === 0 ? (
                    <div className="text-center py-4 text-slate-400">No logs recorded.</div>
                  ) : (
                    actions.filter(a => a.case_id === viewingCase.id).map(a => (
                      <div key={a.id} className="p-2.5 bg-slate-50 rounded border border-slate-100">
                        <div className="flex justify-between font-medium text-slate-800">
                          <span>{a.action_type}</span>
                          <span className="text-[10px] text-slate-400">{new Date(a.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-slate-600 mt-0.5">{a.notes}</div>
                        {a.promise_amount && (
                          <div className="text-emerald-700 font-medium text-[11px] mt-1">
                            Promised: ${parseFloat(a.promise_amount).toLocaleString()} by {a.promise_date}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button 
                onClick={() => {
                  setActionCaseId(viewingCase.id);
                  setViewingCase(null);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} /> Log New Action
              </button>
              <button 
                onClick={() => setViewingCase(null)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Log Action Form */}
      {actionCaseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-900">Record Follow-up Action</h3>
              <button onClick={() => setActionCaseId(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Action Type</label>
                <select 
                  required
                  value={newAction.action_type}
                  onChange={(e) => setNewAction({...newAction, action_type: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="PHONE">Phone Call</option>
                  <option value="EMAIL">Email Follow-up</option>
                  <option value="SMS">SMS Reminder</option>
                  <option value="LETTER">Formal Demand Letter</option>
                  <option value="VISIT">Field Inspection / In-Person Visit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Interaction Notes</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Record summary of customer response, agreements, or next action date..."
                  value={newAction.notes}
                  onChange={(e) => setNewAction({...newAction, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Promise to Pay ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="Optional amount"
                    value={newAction.promise_amount}
                    onChange={(e) => setNewAction({...newAction, promise_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Date</label>
                  <input 
                    type="date"
                    value={newAction.promise_date}
                    onChange={(e) => setNewAction({...newAction, promise_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setActionCaseId(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Open Collection Case Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-900">Initiate Collection Case</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCase} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Defaulted Contract</label>
                <select 
                  required
                  value={newCase.contract_id}
                  onChange={(e) => {
                    const c = contracts.find(item => item.id === e.target.value);
                    setNewCase({
                      ...newCase, 
                      contract_id: e.target.value,
                      outstanding_amount: c ? String(c.principal_amount) : ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="" disabled>Select Contract...</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>
                      Contract #{c.id.substring(0,8)} ({c.status}) - ${parseFloat(c.principal_amount || '0').toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Delinquent Outstanding Balance ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="25000.00"
                  value={newCase.outstanding_amount}
                  onChange={(e) => setNewCase({...newCase, outstanding_amount: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Case Status</label>
                <select 
                  required
                  value={newCase.status}
                  onChange={(e) => setNewCase({...newCase, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ESCALATED">Escalated</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Initiating...' : 'Open Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
