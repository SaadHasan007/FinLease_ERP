import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, MoreVertical, Building2, User, ChevronLeft, ChevronRight, X, Eye, Edit2, Trash2, Shield, CheckCircle2, AlertTriangle, Mail, Phone, Calendar, Hash } from 'lucide-react';
import { api } from '../services/api';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modals & Drawers state
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    email: '',
    phone: '',
    customer_type: 'INDIVIDUAL',
    risk_category: 'LOW',
    status: 'ACTIVE',
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

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers/');
      const items = response.data?.items || response.data?.data?.items || (Array.isArray(response.data) ? response.data : []);
      setCustomers(items);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/customers/', newCustomer);
      setShowAddForm(false);
      setNewCustomer({
        first_name: '',
        last_name: '',
        company_name: '',
        email: '',
        phone: '',
        customer_type: 'INDIVIDUAL',
        risk_category: 'LOW',
        status: 'ACTIVE',
      });
      await fetchCustomers();
    } catch (error: any) {
      console.error("Failed to add customer", error);
      alert("Failed to add customer: " + (error.response?.data?.error?.message || error.response?.data?.detail || "Please check your input and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setSubmitting(true);
    try {
      await api.put(`/customers/${editingCustomer.id}`, editingCustomer);
      setEditingCustomer(null);
      await fetchCustomers();
    } catch (error: any) {
      console.error("Failed to update customer", error);
      alert("Failed to update customer: " + (error.response?.data?.error?.message || error.response?.data?.detail || "Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    setSubmitting(true);
    try {
      await api.delete(`/customers/${deletingCustomer.id}`);
      setDeletingCustomer(null);
      await fetchCustomers();
    } catch (error: any) {
      console.error("Failed to delete customer", error);
      alert("Failed to delete customer: " + (error.response?.data?.error?.message || error.response?.data?.detail || "Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (customer: any, newStatus: string) => {
    setActiveMenuId(null);
    try {
      await api.put(`/customers/${customer.id}`, { ...customer, status: newStatus });
      await fetchCustomers();
    } catch (error: any) {
      console.error("Failed to change status", error);
      alert("Failed to change status: " + (error.response?.data?.detail || "Error updating status"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'INACTIVE': return 'bg-slate-100 text-slate-800 border border-slate-200';
      case 'SUSPENDED': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'BLACKLISTED': return 'bg-rose-100 text-rose-800 border border-rose-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'MEDIUM': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'VERY_HIGH': return 'bg-rose-100 text-rose-800 border border-rose-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getDisplayName = (c: any) => {
    if (c.customer_type === 'CORPORATE') {
      return c.company_name || 'Unnamed Corporate';
    }
    const name = `${c.first_name || ''} ${c.last_name || ''}`.trim();
    return name || 'Unnamed Individual';
  };

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    const name = getDisplayName(c).toLowerCase();
    const email = (c.email || '').toLowerCase();
    const matchesSearch = !term || name.includes(term) || email.includes(term);
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage individuals and corporate entities.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          New Customer
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
            placeholder="Search by name, email, or company..." 
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-visible">
        <div className="overflow-x-visible">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name / Company</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Risk Level</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">Loading customers...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">No customers found matching your criteria.</td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="relative hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="flex items-center gap-2">
                        {c.customer_type === 'CORPORATE' ? (
                          <Building2 size={16} className="text-slate-400" />
                        ) : (
                          <User size={16} className="text-slate-400" />
                        )}
                        <span className="text-xs font-medium">{c.customer_type}</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">
                        {getDisplayName(c)}
                      </div>
                      {c.customer_type === 'CORPORATE' && (c.first_name || c.last_name) && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          Contact: {`${c.first_name || ''} ${c.last_name || ''}`.trim()}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="text-slate-900 font-medium">{c.email}</div>
                      <div className="text-xs text-slate-500">{c.phone || '-'}</div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(c.status)}`}>{c.status}</span>
                    </td>
                    <td>
                      <span className={`badge ${getRiskColor(c.risk_category)}`}>{(c.risk_category || 'LOW').replace('_', ' ')}</span>
                    </td>
                    <td className="text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === c.id ? null : c.id);
                        }}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          activeMenuId === c.id ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Open Actions Menu"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === c.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            onClick={() => {
                              setViewingCustomer(c);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Eye size={14} className="text-slate-400" />
                            View Full Profile
                          </button>
                          <button
                            onClick={() => {
                              setEditingCustomer({ ...c });
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} className="text-slate-400" />
                            Edit Details
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <div className="px-4 py-1 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                            Quick Status
                          </div>
                          {['ACTIVE', 'INACTIVE', 'SUSPENDED'].map((st) => (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(c, st)}
                              disabled={c.status === st}
                              className={`w-full px-4 py-1.5 text-xs font-medium text-left flex items-center justify-between cursor-pointer ${
                                c.status === st ? 'text-slate-300 cursor-default' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <span>Mark {st.toLowerCase()}</span>
                              {c.status === st && <CheckCircle2 size={12} className="text-emerald-500" />}
                            </button>
                          ))}
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button
                            onClick={() => {
                              setDeletingCustomer(c);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} className="text-rose-500" />
                            Delete Customer
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
        
        {/* Pagination */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Showing <span className="font-medium text-slate-700">1</span> to <span className="font-medium text-slate-700">{filteredCustomers.length}</span> of <span className="font-medium text-slate-700">{filteredCustomers.length}</span> results
          </div>
          <div className="flex gap-1">
            <button className="p-1 border border-slate-300 rounded bg-white text-slate-400 disabled:opacity-50" disabled>
              <ChevronLeft size={16} />
            </button>
            <button className="p-1 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* View Customer Details Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {viewingCustomer.customer_type === 'CORPORATE' ? <Building2 size={16} /> : <User size={16} />}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{getDisplayName(viewingCustomer)}</h3>
                  <p className="text-xs text-slate-500">Customer Profile & KYC</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Status</span>
                  <span className={`inline-block mt-1 badge ${getStatusColor(viewingCustomer.status)}`}>
                    {viewingCustomer.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">KYC Risk Category</span>
                  <span className={`inline-block mt-1 badge ${getRiskColor(viewingCustomer.risk_category)}`}>
                    {(viewingCustomer.risk_category || 'LOW').replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-700">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Email Address</div>
                    <div className="font-medium text-slate-900">{viewingCustomer.email || 'N/A'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Phone Number</div>
                    <div className="font-medium text-slate-900">{viewingCustomer.phone || 'N/A'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Hash size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Customer ID</div>
                    <div className="font-mono text-xs text-slate-800">{viewingCustomer.id}</div>
                  </div>
                </div>

                {viewingCustomer.created_at && (
                  <div className="flex items-center gap-3 text-slate-700">
                    <Calendar size={16} className="text-slate-400 shrink-0" />
                    <div>
                      <div className="text-xs text-slate-400">Created At</div>
                      <div className="text-xs text-slate-800">{new Date(viewingCustomer.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button 
                onClick={() => {
                  setEditingCustomer({ ...viewingCustomer });
                  setViewingCustomer(null);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 size={13} /> Edit Customer
              </button>
              <button 
                onClick={() => setViewingCustomer(null)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Drawer for Add Customer */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setShowAddForm(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">New Customer</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Customer Type</label>
                <select 
                  value={newCustomer.customer_type} 
                  onChange={(e) => setNewCustomer({...newCustomer, customer_type: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="CORPORATE">Corporate</option>
                </select>
              </div>
              
              {newCustomer.customer_type === 'INDIVIDUAL' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                    <input 
                      required 
                      type="text" 
                      value={newCustomer.first_name} 
                      onChange={(e) => setNewCustomer({...newCustomer, first_name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                    <input 
                      required 
                      type="text" 
                      value={newCustomer.last_name} 
                      onChange={(e) => setNewCustomer({...newCustomer, last_name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company Name</label>
                  <input 
                    required 
                    type="text" 
                    value={newCustomer.company_name} 
                    onChange={(e) => setNewCustomer({...newCustomer, company_name: e.target.value})}
                    placeholder="e.g. Apex Global Corp"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  required 
                  type="email" 
                  value={newCustomer.email} 
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={newCustomer.phone} 
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="+1-555-0100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Risk Profile</label>
                  <select 
                    value={newCustomer.risk_category} 
                    onChange={(e) => setNewCustomer({...newCustomer, risk_category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="LOW">Low Risk</option>
                    <option value="MEDIUM">Medium Risk</option>
                    <option value="HIGH">High Risk</option>
                    <option value="VERY_HIGH">Very High Risk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Initial Status</label>
                  <select 
                    value={newCustomer.status} 
                    onChange={(e) => setNewCustomer({...newCustomer, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="px-4 py-2 border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-out Drawer for Edit Customer */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setEditingCustomer(null)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">Edit Customer</h2>
              <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Customer Type</label>
                <select 
                  value={editingCustomer.customer_type} 
                  onChange={(e) => setEditingCustomer({...editingCustomer, customer_type: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="CORPORATE">Corporate</option>
                </select>
              </div>
              
              {editingCustomer.customer_type === 'INDIVIDUAL' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={editingCustomer.first_name || ''} 
                      onChange={(e) => setEditingCustomer({...editingCustomer, first_name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={editingCustomer.last_name || ''} 
                      onChange={(e) => setEditingCustomer({...editingCustomer, last_name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company Name</label>
                  <input 
                    type="text" 
                    value={editingCustomer.company_name || ''} 
                    onChange={(e) => setEditingCustomer({...editingCustomer, company_name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  required 
                  type="email" 
                  value={editingCustomer.email} 
                  onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={editingCustomer.phone || ''} 
                  onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Risk Profile</label>
                  <select 
                    value={editingCustomer.risk_category} 
                    onChange={(e) => setEditingCustomer({...editingCustomer, risk_category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="LOW">Low Risk</option>
                    <option value="MEDIUM">Medium Risk</option>
                    <option value="HIGH">High Risk</option>
                    <option value="VERY_HIGH">Very High Risk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    value={editingCustomer.status} 
                    onChange={(e) => setEditingCustomer({...editingCustomer, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="BLACKLISTED">Blacklisted</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">Delete Customer</h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to remove <span className="font-semibold text-slate-800">{getDisplayName(deletingCustomer)}</span>? This record will be deactivated.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
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
