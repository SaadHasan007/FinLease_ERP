import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, MoreVertical, Car, Monitor, Home, ChevronLeft, ChevronRight, X, Eye, Edit2, Trash2, CheckCircle2, AlertTriangle, Hash, Calendar, DollarSign, Tag } from 'lucide-react';
import { api } from '../services/api';

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawers state
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewingAsset, setViewingAsset] = useState<any | null>(null);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newAsset, setNewAsset] = useState({
    category: 'VEHICLE',
    make: '',
    model_name: '',
    year: new Date().getFullYear(),
    serial_number: '',
    current_value: '',
    status: 'AVAILABLE'
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

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/assets/');
      const items = response.data?.items || response.data?.data?.items || (Array.isArray(response.data) ? response.data : []);
      setAssets(items);
    } catch (error) {
      console.error("Failed to fetch assets", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/assets/', {
        ...newAsset,
        year: Number(newAsset.year),
        current_value: parseFloat(newAsset.current_value)
      });
      setShowAddForm(false);
      setNewAsset({
        category: 'VEHICLE',
        make: '',
        model_name: '',
        year: new Date().getFullYear(),
        serial_number: '',
        current_value: '',
        status: 'AVAILABLE'
      });
      await fetchAssets();
    } catch (error: any) {
      console.error("Failed to add asset", error);
      alert("Failed to add asset: " + (error.response?.data?.detail || error.response?.data?.error?.message || "Please check your input and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    setSubmitting(true);
    try {
      await api.patch(`/assets/${editingAsset.id}`, {
        category: editingAsset.category,
        make: editingAsset.make,
        model_name: editingAsset.model_name,
        year: Number(editingAsset.year),
        serial_number: editingAsset.serial_number,
        current_value: parseFloat(editingAsset.current_value),
        status: editingAsset.status
      });
      setEditingAsset(null);
      await fetchAssets();
    } catch (error: any) {
      console.error("Failed to update asset", error);
      alert("Failed to update asset: " + (error.response?.data?.detail || "Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAsset) return;
    setSubmitting(true);
    try {
      await api.delete(`/assets/${deletingAsset.id}`);
      setDeletingAsset(null);
      await fetchAssets();
    } catch (error: any) {
      console.error("Failed to delete asset", error);
      alert("Failed to delete asset: " + (error.response?.data?.detail || "Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (asset: any, newStatus: string) => {
    setActiveMenuId(null);
    try {
      await api.patch(`/assets/${asset.id}`, { status: newStatus });
      await fetchAssets();
    } catch (error: any) {
      console.error("Failed to change asset status", error);
      alert("Failed to change status: " + (error.response?.data?.detail || "Error updating status"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'ALLOCATED': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'MAINTENANCE': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'SOLD': return 'bg-slate-100 text-slate-800 border border-slate-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const formatCurrency = (val: string | number) => {
    if (!val && val !== 0) return '$0.00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const filteredAssets = assets.filter((a) => {
    const term = searchTerm.toLowerCase();
    const makeModel = `${a.make || ''} ${a.model_name || ''}`.toLowerCase();
    const serial = (a.serial_number || '').toLowerCase();
    const matchesSearch = !term || makeModel.includes(term) || serial.includes(term);
    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Asset Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage collateral, vehicles, equipment, and real estate assets.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          New Asset
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
            placeholder="Search by make, model, or serial number..." 
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="VEHICLE">Vehicles</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="REAL_ESTATE">Real Estate</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="SOLD">Sold</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-visible">
        <div className="overflow-x-visible">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Make & Model</th>
                <th>Serial / VIN</th>
                <th>Current Value</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">Loading assets...</td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">No assets found matching your criteria.</td>
                </tr>
              ) : (
                filteredAssets.map((a) => (
                  <tr key={a.id} className="relative hover:bg-slate-50 transition-colors">
                    <td>
                      <div className="flex items-center gap-2">
                        {a.category === 'VEHICLE' && <Car size={16} className="text-blue-500" />}
                        {a.category === 'EQUIPMENT' && <Monitor size={16} className="text-purple-500" />}
                        {a.category === 'REAL_ESTATE' && <Home size={16} className="text-emerald-500" />}
                        <span className="text-xs font-medium">{a.category}</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">{a.make} {a.model_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Year: {a.year}</div>
                    </td>
                    <td>
                      <div className="text-slate-700 font-mono text-xs">{a.serial_number}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900">{formatCurrency(a.current_value)}</div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(a.status)}`}>{a.status}</span>
                    </td>
                    <td className="text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === a.id ? null : a.id);
                        }}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          activeMenuId === a.id ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title="Open Actions Menu"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === a.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            onClick={() => {
                              setViewingAsset(a);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Eye size={14} className="text-slate-400" />
                            View Asset Specs
                          </button>
                          <button
                            onClick={() => {
                              setEditingAsset({ ...a });
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} className="text-slate-400" />
                            Edit Asset Details
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <div className="px-4 py-1 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                            Quick Status
                          </div>
                          {['AVAILABLE', 'ALLOCATED', 'MAINTENANCE', 'SOLD'].map((st) => (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(a, st)}
                              disabled={a.status === st}
                              className={`w-full px-4 py-1.5 text-xs font-medium text-left flex items-center justify-between cursor-pointer ${
                                a.status === st ? 'text-slate-300 cursor-default' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <span>Mark {st.toLowerCase()}</span>
                              {a.status === st && <CheckCircle2 size={12} className="text-emerald-500" />}
                            </button>
                          ))}
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button
                            onClick={() => {
                              setDeletingAsset(a);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} className="text-rose-500" />
                            Delete Asset
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
            Showing <span className="font-medium text-slate-700">1</span> to <span className="font-medium text-slate-700">{filteredAssets.length}</span> of <span className="font-medium text-slate-700">{filteredAssets.length}</span> results
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

      {/* View Asset Details Modal */}
      {viewingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {viewingAsset.category === 'VEHICLE' && <Car size={16} />}
                  {viewingAsset.category === 'EQUIPMENT' && <Monitor size={16} />}
                  {viewingAsset.category === 'REAL_ESTATE' && <Home size={16} />}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{viewingAsset.make} {viewingAsset.model_name}</h3>
                  <p className="text-xs text-slate-500">Asset Specifications & Valuation</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingAsset(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Category</span>
                  <span className="inline-block mt-1 text-sm font-semibold text-slate-800">
                    {viewingAsset.category}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Status</span>
                  <span className={`inline-block mt-1 badge ${getStatusColor(viewingAsset.status)}`}>
                    {viewingAsset.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-700">
                  <DollarSign size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Current Market Valuation</div>
                    <div className="text-base font-bold text-slate-900">{formatCurrency(viewingAsset.current_value)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Tag size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Serial Number / VIN</div>
                    <div className="font-mono text-sm text-slate-900">{viewingAsset.serial_number}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Manufacture Year</div>
                    <div className="font-medium text-slate-900">{viewingAsset.year}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Hash size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Asset Record ID</div>
                    <div className="font-mono text-xs text-slate-700">{viewingAsset.id}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button 
                onClick={() => {
                  setEditingAsset({ ...viewingAsset });
                  setViewingAsset(null);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 size={13} /> Edit Asset
              </button>
              <button 
                onClick={() => setViewingAsset(null)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Drawer for Add Asset */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setShowAddForm(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">New Asset</h2>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Asset Category</label>
                <select 
                  value={newAsset.category} 
                  onChange={(e) => setNewAsset({...newAsset, category: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="VEHICLE">Vehicle</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="REAL_ESTATE">Real Estate</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Make / Brand</label>
                  <input 
                    required 
                    type="text" 
                    value={newAsset.make} 
                    onChange={(e) => setNewAsset({...newAsset, make: e.target.value})}
                    placeholder="e.g. Toyota / CAT"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Model Name</label>
                  <input 
                    required 
                    type="text" 
                    value={newAsset.model_name} 
                    onChange={(e) => setNewAsset({...newAsset, model_name: e.target.value})}
                    placeholder="e.g. Hilux / Excavator 320"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Manufacture Year</label>
                  <input 
                    required 
                    type="number" 
                    value={newAsset.year} 
                    onChange={(e) => setNewAsset({...newAsset, year: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Current Value ($)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    value={newAsset.current_value} 
                    onChange={(e) => setNewAsset({...newAsset, current_value: e.target.value})}
                    placeholder="45000.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Serial Number / VIN</label>
                <input 
                  required 
                  type="text" 
                  value={newAsset.serial_number} 
                  onChange={(e) => setNewAsset({...newAsset, serial_number: e.target.value})}
                  placeholder="e.g. 1HGCR2F83HA001234"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" 
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Status</label>
                <select 
                  value={newAsset.status} 
                  onChange={(e) => setNewAsset({...newAsset, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="ALLOCATED">Allocated</option>
                  <option value="MAINTENANCE">Maintenance</option>
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
                  {submitting ? 'Saving...' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-out Drawer for Edit Asset */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setEditingAsset(null)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">Edit Asset</h2>
              <button onClick={() => setEditingAsset(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Asset Category</label>
                <select 
                  value={editingAsset.category} 
                  onChange={(e) => setEditingAsset({...editingAsset, category: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="VEHICLE">Vehicle</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="REAL_ESTATE">Real Estate</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Make / Brand</label>
                  <input 
                    required 
                    type="text" 
                    value={editingAsset.make} 
                    onChange={(e) => setEditingAsset({...editingAsset, make: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Model Name</label>
                  <input 
                    required 
                    type="text" 
                    value={editingAsset.model_name} 
                    onChange={(e) => setEditingAsset({...editingAsset, model_name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Manufacture Year</label>
                  <input 
                    required 
                    type="number" 
                    value={editingAsset.year} 
                    onChange={(e) => setEditingAsset({...editingAsset, year: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Current Value ($)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    value={editingAsset.current_value} 
                    onChange={(e) => setEditingAsset({...editingAsset, current_value: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Serial Number / VIN</label>
                <input 
                  required 
                  type="text" 
                  value={editingAsset.serial_number} 
                  onChange={(e) => setEditingAsset({...editingAsset, serial_number: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" 
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select 
                  value={editingAsset.status} 
                  onChange={(e) => setEditingAsset({...editingAsset, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="ALLOCATED">Allocated</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="SOLD">Sold</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">Delete Asset</h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-semibold text-slate-800">{deletingAsset.make} {deletingAsset.model_name} ({deletingAsset.serial_number})</span>?
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAsset(null)}
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
