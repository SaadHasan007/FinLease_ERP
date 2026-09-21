import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, Plus, FileSignature, CheckCircle2, AlertTriangle, XCircle, Play, AlertOctagon, Search, Filter, MoreVertical, Eye, Edit2, Trash2, X, DollarSign, Calendar, Percent, Clock, Hash, User } from 'lucide-react';
import { api } from '../services/api';

export default function Contracts() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawers state
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewingContract, setViewingContract] = useState<any | null>(null);
  const [editingContract, setEditingContract] = useState<any | null>(null);
  const [deletingContract, setDeletingContract] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [newContract, setNewContract] = useState({
    application_id: '',
    principal_amount: '',
    interest_rate: '0.05',
    tenure_months: 12,
    status: 'ACTIVE',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
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
      const [contractsRes, appsRes, custsRes] = await Promise.all([
        api.get('/contracts/'),
        api.get('/applications/'),
        api.get('/customers/')
      ]);
      const cts = contractsRes.data?.items || contractsRes.data?.data?.items || (Array.isArray(contractsRes.data) ? contractsRes.data : []);
      const apps = appsRes.data?.items || appsRes.data?.data?.items || (Array.isArray(appsRes.data) ? appsRes.data : []);
      const custs = custsRes.data?.items || custsRes.data?.data?.items || (Array.isArray(custsRes.data) ? custsRes.data : []);

      setContracts(Array.isArray(cts) ? cts : []);
      setApplications(Array.isArray(apps) ? apps : []);
      setCustomers(Array.isArray(custs) ? custs : []);
    } catch (error) {
      console.error("Failed to fetch contracts data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        application_id: newContract.application_id,
        principal_amount: parseFloat(newContract.principal_amount),
        interest_rate: parseFloat(newContract.interest_rate),
        tenure_months: Number(newContract.tenure_months),
        status: newContract.status,
        start_date: newContract.start_date,
        end_date: newContract.end_date
      };
      await api.post('/contracts/', payload);
      setShowAddForm(false);
      setNewContract({
        application_id: '',
        principal_amount: '',
        interest_rate: '0.05',
        tenure_months: 12,
        status: 'ACTIVE',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      });
      await fetchData();
    } catch (error: any) {
      console.error("Failed to add contract", error.response?.data || error);
      setErrorMsg(error.response?.data?.detail || error.response?.data?.message || "Failed to create contract");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;
    setSubmitting(true);
    try {
      await api.put(`/contracts/${editingContract.id}`, {
        application_id: editingContract.application_id,
        principal_amount: parseFloat(editingContract.principal_amount),
        interest_rate: parseFloat(editingContract.interest_rate),
        tenure_months: Number(editingContract.tenure_months),
        status: editingContract.status,
        start_date: editingContract.start_date,
        end_date: editingContract.end_date
      });
      setEditingContract(null);
      await fetchData();
    } catch (error: any) {
      console.error("Failed to update contract", error);
      alert("Failed to update contract: " + (error.response?.data?.detail || "Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingContract) return;
    setSubmitting(true);
    try {
      await api.delete(`/contracts/${deletingContract.id}`);
      setDeletingContract(null);
      await fetchData();
    } catch (error: any) {
      console.error("Failed to delete contract", error);
      alert("Failed to delete contract: " + (error.response?.data?.detail || "Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (contractId: string, newStatus: string) => {
    setActiveMenuId(null);
    try {
      await api.patch(`/contracts/${contractId}`, { status: newStatus });
      await fetchData();
    } catch (error: any) {
      console.error("Failed to update contract status", error);
      alert("Failed to update status: " + (error.response?.data?.detail || "Error updating status"));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'DRAFT': return <FileSignature className="w-3.5 h-3.5 text-amber-600" />;
      case 'DEFAULTED': return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
      case 'TERMINATED': return <XCircle className="w-3.5 h-3.5 text-slate-600" />;
      case 'COMPLETED': return <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />;
      default: return <Briefcase className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'DRAFT': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'DEFAULTED': return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'TERMINATED': return 'bg-slate-100 text-slate-800 border border-slate-200';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border border-blue-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getCustomerForApp = (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return null;
    return customers.find(c => c.id === app.customer_id) || null;
  };

  const getAppLabel = (appId: string) => {
    const cust = getCustomerForApp(appId);
    const custName = cust ? (cust.company_name || `${cust.first_name || ''} ${cust.last_name || ''}`.trim()) : '';
    return custName ? `${custName} (App #${(appId || '').substring(0, 8)})` : `App #${(appId || '').substring(0, 8)}`;
  };

  const filteredContracts = contracts.filter((c) => {
    const term = searchTerm.toLowerCase();
    const appLabel = getAppLabel(c.application_id).toLowerCase();
    const contractId = (c.id || '').toLowerCase();
    const matchesSearch = !term || appLabel.includes(term) || contractId.includes(term);
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Active Contracts</h1>
          <p className="text-sm text-slate-500 mt-1">Manage executed lease agreements, amortization terms, and statuses.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          New Contract
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
            placeholder="Search by contract ID or customer name..." 
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
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="DEFAULTED">Defaulted</option>
            <option value="COMPLETED">Completed</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-visible">
        <div className="overflow-x-visible">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Contract ID</th>
                <th>Application / Client</th>
                <th>Principal Amount</th>
                <th>Terms & Rate</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">Loading contracts...</td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">No contracts found.</td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="relative hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="font-mono font-medium text-slate-800 text-xs">{(contract.id || '').substring(0, 8)}</div>
                    </td>
                    <td>
                      <div className="text-slate-900 font-medium text-sm">{getAppLabel(contract.application_id)}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">App: {(contract.application_id || '').substring(0, 8)}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900">
                        ${parseFloat(contract.principal_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td>
                      <div className="text-slate-700 text-xs font-medium">
                        {contract.tenure_months} months @ {(parseFloat(contract.interest_rate || '0') * 100).toFixed(1)}% APR
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {contract.start_date} to {contract.end_date}
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(contract.status)}`}>
                        {getStatusIcon(contract.status)}
                        {contract.status}
                      </span>
                    </td>
                    <td className="text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === contract.id ? null : contract.id);
                        }}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          activeMenuId === contract.id ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Open Actions Menu"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === contract.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            onClick={() => {
                              setViewingContract(contract);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Eye size={14} className="text-slate-400" />
                            View Contract Details
                          </button>
                          <button
                            onClick={() => {
                              setEditingContract({ ...contract });
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} className="text-slate-400" />
                            Edit Terms
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <div className="px-4 py-1 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                            Change Status
                          </div>
                          {['ACTIVE', 'DEFAULTED', 'COMPLETED', 'TERMINATED'].map((st) => (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(contract.id, st)}
                              disabled={contract.status === st}
                              className={`w-full px-4 py-1.5 text-xs font-medium text-left flex items-center justify-between cursor-pointer ${
                                contract.status === st ? 'text-slate-300 cursor-default' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <span>Mark {st.toLowerCase()}</span>
                              {contract.status === st && <CheckCircle2 size={12} className="text-emerald-500" />}
                            </button>
                          ))}
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button
                            onClick={() => {
                              setDeletingContract(contract);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} className="text-rose-500" />
                            Delete Contract
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

      {/* View Contract Details Modal */}
      {viewingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  <Briefcase size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Contract #{(viewingContract.id || '').substring(0, 8)}</h3>
                  <p className="text-xs text-slate-500">Lease Agreement & Amortization Summary</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingContract(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Status</span>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(viewingContract.status)}`}>
                    {getStatusIcon(viewingContract.status)}
                    {viewingContract.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Client</span>
                  <span className="text-sm font-semibold text-slate-800 block mt-1">
                    {getAppLabel(viewingContract.application_id)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-700">
                  <DollarSign size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Principal Amount</div>
                    <div className="text-base font-bold text-slate-900">
                      ${parseFloat(viewingContract.principal_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Percent size={16} className="text-slate-400 shrink-0" />
                    <div>
                      <div className="text-xs text-slate-400">Interest Rate</div>
                      <div className="font-semibold text-slate-900">{(parseFloat(viewingContract.interest_rate || '0') * 100).toFixed(2)}% APR</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Clock size={16} className="text-slate-400 shrink-0" />
                    <div>
                      <div className="text-xs text-slate-400">Tenure</div>
                      <div className="font-semibold text-slate-900">{viewingContract.tenure_months} Months</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Contract Schedule Window</div>
                    <div className="text-xs font-medium text-slate-800">
                      {viewingContract.start_date} to {viewingContract.end_date}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Hash size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Linked Application ID</div>
                    <div className="font-mono text-xs text-slate-700">{viewingContract.application_id}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button 
                onClick={() => {
                  setEditingContract({ ...viewingContract });
                  setViewingContract(null);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 size={13} /> Edit Terms
              </button>
              <button 
                onClick={() => setViewingContract(null)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Drawer for Add Contract */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setShowAddForm(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">New Contract</h2>
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Approved Application</label>
                <select 
                  required
                  value={newContract.application_id}
                  onChange={(e) => {
                    const app = applications.find(a => a.id === e.target.value);
                    setNewContract({
                      ...newContract, 
                      application_id: e.target.value,
                      principal_amount: app ? String(app.requested_amount) : newContract.principal_amount,
                      tenure_months: app ? app.tenure_months : newContract.tenure_months
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="" disabled>Select Application...</option>
                  {applications.map(a => (
                    <option key={a.id} value={a.id}>
                      {getAppLabel(a.id)} ({a.status}) - ${parseFloat(a.requested_amount || '0').toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Principal Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newContract.principal_amount}
                    onChange={(e) => setNewContract({...newContract, principal_amount: e.target.value})}
                    placeholder="40000.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Interest Rate (e.g. 0.05)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    required
                    value={newContract.interest_rate}
                    onChange={(e) => setNewContract({...newContract, interest_rate: e.target.value})}
                    placeholder="0.05"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tenure (Months)</label>
                  <input 
                    type="number" 
                    required
                    value={newContract.tenure_months}
                    onChange={(e) => setNewContract({...newContract, tenure_months: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Initial Status</label>
                  <select 
                    required
                    value={newContract.status}
                    onChange={(e) => setNewContract({...newContract, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="DEFAULTED">Defaulted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={newContract.start_date}
                    onChange={(e) => setNewContract({...newContract, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    required
                    value={newContract.end_date}
                    onChange={(e) => setNewContract({...newContract, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
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
                  {submitting ? 'Creating...' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-out Drawer for Edit Contract */}
      {editingContract && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setEditingContract(null)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">Edit Contract Terms</h2>
              <button onClick={() => setEditingContract(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Principal ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={editingContract.principal_amount}
                    onChange={(e) => setEditingContract({...editingContract, principal_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Interest Rate</label>
                  <input 
                    type="number" 
                    step="0.001"
                    required
                    value={editingContract.interest_rate}
                    onChange={(e) => setEditingContract({...editingContract, interest_rate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tenure (Months)</label>
                  <input 
                    type="number" 
                    required
                    value={editingContract.tenure_months}
                    onChange={(e) => setEditingContract({...editingContract, tenure_months: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    required
                    value={editingContract.status}
                    onChange={(e) => setEditingContract({...editingContract, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="DEFAULTED">Defaulted</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={editingContract.start_date}
                    onChange={(e) => setEditingContract({...editingContract, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    required
                    value={editingContract.end_date}
                    onChange={(e) => setEditingContract({...editingContract, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingContract(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">Delete Contract</h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to delete Contract <span className="font-semibold text-slate-800">#{(deletingContract.id || '').substring(0, 8)}</span>?
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingContract(null)}
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
