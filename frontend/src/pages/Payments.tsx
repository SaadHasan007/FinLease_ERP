import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Plus, CheckCircle2, Clock, AlertCircle, Check, Search, Filter, MoreVertical, Eye, Edit2, Trash2, X, DollarSign, Calendar, Hash, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawers state
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewingPayment, setViewingPayment] = useState<any | null>(null);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [newPayment, setNewPayment] = useState({
    contract_id: '',
    due_date: new Date().toISOString().split('T')[0],
    principal_amount: '',
    interest_amount: '',
    total_amount: '',
    status: 'PENDING'
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
      const [paymentsRes, contractsRes] = await Promise.all([
        api.get('/payments/'),
        api.get('/contracts/')
      ]);
      const pays = paymentsRes.data?.items || paymentsRes.data?.data?.items || (Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      const cts = contractsRes.data?.items || contractsRes.data?.data?.items || (Array.isArray(contractsRes.data) ? contractsRes.data : []);
      setPayments(Array.isArray(pays) ? pays : []);
      setContracts(Array.isArray(cts) ? cts : []);
    } catch (error) {
      console.error("Failed to fetch payments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-calculate total amount for new payment
  useEffect(() => {
    const principal = parseFloat(newPayment.principal_amount) || 0;
    const interest = parseFloat(newPayment.interest_amount) || 0;
    setNewPayment(prev => ({ ...prev, total_amount: (principal + interest).toFixed(2) }));
  }, [newPayment.principal_amount, newPayment.interest_amount]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        contract_id: newPayment.contract_id,
        due_date: newPayment.due_date,
        principal_amount: parseFloat(newPayment.principal_amount),
        interest_amount: parseFloat(newPayment.interest_amount || '0'),
        total_amount: parseFloat(newPayment.total_amount),
        status: newPayment.status
      };
      await api.post('/payments/', payload);
      setShowAddForm(false);
      setNewPayment({
        contract_id: '',
        due_date: new Date().toISOString().split('T')[0],
        principal_amount: '',
        interest_amount: '',
        total_amount: '',
        status: 'PENDING'
      });
      await fetchData();
    } catch (error: any) {
      console.error("Failed to schedule payment", error.response?.data || error);
      setErrorMsg(error.response?.data?.detail || error.response?.data?.message || "Failed to schedule payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setSubmitting(true);
    try {
      const prin = parseFloat(editingPayment.principal_amount) || 0;
      const int = parseFloat(editingPayment.interest_amount) || 0;
      await api.patch(`/payments/${editingPayment.id}`, {
        due_date: editingPayment.due_date,
        principal_amount: prin,
        interest_amount: int,
        total_amount: prin + int,
        status: editingPayment.status
      });
      setEditingPayment(null);
      await fetchData();
    } catch (error: any) {
      console.error("Failed to update payment", error);
      alert("Failed to update installment: " + (error.response?.data?.detail || "Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPayment) return;
    setSubmitting(true);
    try {
      await api.delete(`/payments/${deletingPayment.id}`);
      setDeletingPayment(null);
      await fetchData();
    } catch (error: any) {
      console.error("Failed to delete payment", error);
      alert("Failed to delete installment: " + (error.response?.data?.detail || "Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    setActiveMenuId(null);
    try {
      await api.patch(`/payments/${paymentId}`, { status: newStatus });
      await fetchData();
    } catch (error: any) {
      console.error("Failed to update payment status", error);
      alert("Failed to update status: " + (error.response?.data?.detail || "Error updating status"));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'PENDING': return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case 'OVERDUE': return <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'PARTIALLY_PAID': return <CreditCard className="w-3.5 h-3.5 text-blue-600" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'OVERDUE': return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-800 border border-blue-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredPayments = payments.filter((p) => {
    const term = searchTerm.toLowerCase();
    const contractId = (p.contract_id || '').toLowerCase();
    const matchesSearch = !term || contractId.includes(term) || (p.due_date || '').includes(term);
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Payment Schedules</h1>
          <p className="text-sm text-slate-500 mt-1">Track installments, record settlements, and manage overdues.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          Schedule Payment
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 border border-slate-200 rounded-md shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by contract ID or due date..." 
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-visible">
        <div className="overflow-x-visible">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Contract</th>
                <th>Due Date</th>
                <th>Total Amount</th>
                <th>Principal / Interest</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">Loading payments...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">No payment schedules found.</td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="relative hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="font-mono font-medium text-slate-800 text-xs">Contract #{(payment.contract_id || '').substring(0, 8)}</div>
                    </td>
                    <td>
                      <div className="text-slate-900 font-medium text-sm">{payment.due_date}</div>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900">
                        ${parseFloat(payment.total_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs text-slate-600 flex flex-col">
                        <span>Prin: ${parseFloat(payment.principal_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-slate-400">Int: ${parseFloat(payment.interest_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === payment.id ? null : payment.id);
                        }}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          activeMenuId === payment.id ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Open Actions Menu"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === payment.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            onClick={() => {
                              setViewingPayment(payment);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Eye size={14} className="text-slate-400" />
                            View Breakdown
                          </button>
                          
                          {payment.status !== 'PAID' && (
                            <button
                              onClick={() => handleStatusChange(payment.id, 'PAID')}
                              className="w-full px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Check size={14} className="text-emerald-500" />
                              Mark as Paid
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setEditingPayment({ ...payment });
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} className="text-slate-400" />
                            Edit Schedule
                          </button>

                          <div className="h-px bg-slate-100 my-1"></div>
                          <div className="px-4 py-1 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                            Quick Status
                          </div>
                          {['PENDING', 'OVERDUE', 'PARTIALLY_PAID'].map((st) => (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(payment.id, st)}
                              disabled={payment.status === st}
                              className={`w-full px-4 py-1.5 text-xs font-medium text-left flex items-center justify-between cursor-pointer ${
                                payment.status === st ? 'text-slate-300 cursor-default' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <span>Mark {st.replace('_', ' ').toLowerCase()}</span>
                              {payment.status === st && <CheckCircle2 size={12} className="text-emerald-500" />}
                            </button>
                          ))}
                          
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button
                            onClick={() => {
                              setDeletingPayment(payment);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} className="text-rose-500" />
                            Delete Installment
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

      {/* View Payment Breakdown Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Installment Breakdown</h3>
                  <p className="text-xs text-slate-500">Contract #{(viewingPayment.contract_id || '').substring(0, 8)}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingPayment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Status</span>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(viewingPayment.status)}`}>
                    {getStatusIcon(viewingPayment.status)}
                    {viewingPayment.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Due Date</span>
                  <span className="text-sm font-semibold text-slate-800 block mt-1">
                    {viewingPayment.due_date}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="text-xs text-blue-700 font-medium uppercase tracking-wider">Total Installment Due</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  ${parseFloat(viewingPayment.total_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-slate-700">
                  <span className="text-xs text-slate-500">Principal Portion</span>
                  <span className="font-semibold text-slate-900">
                    ${parseFloat(viewingPayment.principal_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-slate-700">
                  <span className="text-xs text-slate-500">Interest Portion</span>
                  <span className="font-semibold text-slate-900">
                    ${parseFloat(viewingPayment.interest_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-700 pt-1">
                  <Hash size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Payment Schedule ID</div>
                    <div className="font-mono text-xs text-slate-700">{viewingPayment.id}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              {viewingPayment.status !== 'PAID' && (
                <button 
                  onClick={async () => {
                    await handleStatusChange(viewingPayment.id, 'PAID');
                    setViewingPayment(null);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check size={13} /> Mark as Paid
                </button>
              )}
              <button 
                onClick={() => setViewingPayment(null)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Drawer for Add Payment */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setShowAddForm(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">Schedule Payment</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contract</label>
                <select 
                  required
                  value={newPayment.contract_id}
                  onChange={(e) => {
                    const c = contracts.find(item => item.id === e.target.value);
                    const defaultPrin = c ? (parseFloat(c.principal_amount) / (c.tenure_months || 12)).toFixed(2) : '';
                    const defaultInt = c ? ((parseFloat(c.principal_amount) * parseFloat(c.interest_rate || '0.05')) / (c.tenure_months || 12)).toFixed(2) : '';
                    setNewPayment({
                      ...newPayment, 
                      contract_id: e.target.value,
                      principal_amount: defaultPrin,
                      interest_amount: defaultInt
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                <input 
                  type="date" 
                  required
                  value={newPayment.due_date}
                  onChange={(e) => setNewPayment({...newPayment, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Principal Part ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newPayment.principal_amount}
                    onChange={(e) => setNewPayment({...newPayment, principal_amount: e.target.value})}
                    placeholder="3000.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Interest Part ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newPayment.interest_amount}
                    onChange={(e) => setNewPayment({...newPayment, interest_amount: e.target.value})}
                    placeholder="150.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Total Due ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  readOnly
                  value={newPayment.total_amount}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-800 font-bold text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Status</label>
                <select 
                  required
                  value={newPayment.status}
                  onChange={(e) => setNewPayment({...newPayment, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-out Drawer for Edit Payment */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setEditingPayment(null)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">Edit Installment</h2>
              <button onClick={() => setEditingPayment(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                <input 
                  type="date" 
                  required
                  value={editingPayment.due_date}
                  onChange={(e) => setEditingPayment({...editingPayment, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Principal ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={editingPayment.principal_amount}
                    onChange={(e) => {
                      const prin = parseFloat(e.target.value) || 0;
                      const int = parseFloat(editingPayment.interest_amount) || 0;
                      setEditingPayment({
                        ...editingPayment,
                        principal_amount: e.target.value,
                        total_amount: (prin + int).toFixed(2)
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Interest ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={editingPayment.interest_amount}
                    onChange={(e) => {
                      const int = parseFloat(e.target.value) || 0;
                      const prin = parseFloat(editingPayment.principal_amount) || 0;
                      setEditingPayment({
                        ...editingPayment,
                        interest_amount: e.target.value,
                        total_amount: (prin + int).toFixed(2)
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select 
                  required
                  value={editingPayment.status}
                  onChange={(e) => setEditingPayment({...editingPayment, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">Delete Payment Schedule</h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to delete this payment schedule for Contract <span className="font-semibold text-slate-800">#{(deletingPayment.contract_id || '').substring(0, 8)}</span> due on <span className="font-semibold text-slate-800">{deletingPayment.due_date}</span>?
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPayment(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
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
