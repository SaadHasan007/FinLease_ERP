import React, { useState, useEffect, useRef } from 'react';
import { Plus, FileText, AlertTriangle, CheckCircle2, Search, MoreVertical, Eye, X, DollarSign, BookOpen, Layers, Hash, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function Accounting() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<Record<string, number>>({});
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'accounts' | 'journal'>('accounts');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals & Popups
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewingAccount, setViewingAccount] = useState<any | null>(null);
  const [viewingEntry, setViewingEntry] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [newAccount, setNewAccount] = useState({
    code: '',
    name: '',
    account_type: 'ASSET'
  });
  
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [
      { account_id: '', debit: '', credit: '0' },
      { account_id: '', debit: '0', credit: '' }
    ]
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
      const [accRes, tbRes, jeRes] = await Promise.all([
        api.get('/accounting/accounts'),
        api.get('/accounting/trial-balance'),
        api.get('/accounting/journal-entries')
      ]);
      const accs = accRes.data?.items || accRes.data?.data?.items || (Array.isArray(accRes.data) ? accRes.data : []);
      const jes = jeRes.data?.items || jeRes.data?.data?.items || (Array.isArray(jeRes.data) ? jeRes.data : []);
      setAccounts(Array.isArray(accs) ? accs : []);
      setTrialBalance(tbRes.data || {});
      setJournalEntries(Array.isArray(jes) ? jes : []);
    } catch (error) {
      console.error("Failed to fetch accounting data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.post('/accounting/accounts', newAccount);
      setShowAddAccount(false);
      setNewAccount({ code: '', name: '', account_type: 'ASSET' });
      await fetchData();
    } catch (error: any) {
      console.error("Failed to create account", error);
      setErrorMsg(error.response?.data?.detail || "Failed to create chart of account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddLine = () => {
    setNewEntry({
      ...newEntry,
      lines: [...newEntry.lines, { account_id: '', debit: '0', credit: '0' }]
    });
  };

  const handleRemoveLine = (index: number) => {
    if (newEntry.lines.length <= 2) return;
    const updated = newEntry.lines.filter((_, i) => i !== index);
    setNewEntry({ ...newEntry, lines: updated });
  };

  const handleLineChange = (index: number, field: string, value: string) => {
    const updatedLines = [...newEntry.lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    
    if (field === 'debit' && value !== '' && parseFloat(value) > 0) {
      updatedLines[index].credit = '0';
    } else if (field === 'credit' && value !== '' && parseFloat(value) > 0) {
      updatedLines[index].debit = '0';
    }
    
    setNewEntry({ ...newEntry, lines: updatedLines });
  };

  const handlePostEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        date: newEntry.date,
        reference: newEntry.reference || null,
        description: newEntry.description,
        status: 'POSTED',
        lines: newEntry.lines.map(line => ({
          account_id: line.account_id,
          debit: parseFloat(line.debit) || 0,
          credit: parseFloat(line.credit) || 0
        })).filter(line => line.account_id && (line.debit > 0 || line.credit > 0))
      };
      
      await api.post('/accounting/journal-entries', payload);
      setShowAddEntry(false);
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        lines: [
          { account_id: '', debit: '', credit: '0' },
          { account_id: '', debit: '0', credit: '' }
        ]
      });
      await fetchData();
    } catch (error: any) {
      console.error("Failed to post journal entry", error.response?.data || error);
      setErrorMsg(error.response?.data?.detail || error.response?.data?.message || "Failed to post entry. Ensure debits equal credits.");
    } finally {
      setSubmitting(false);
    }
  };

  const getAccountLabel = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    if (!acc) return accId;
    return `${acc.code} - ${acc.name}`;
  };

  // Calculate totals for new journal entry
  const totalDebits = newEntry.lines.reduce((acc, line) => acc + (parseFloat(line.debit) || 0), 0);
  const totalCredits = newEntry.lines.reduce((acc, line) => acc + (parseFloat(line.credit) || 0), 0);
  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference < 0.001 && totalDebits > 0;

  const filteredAccounts = accounts.filter(a => {
    const term = searchTerm.toLowerCase();
    return !term || (a.code || '').toLowerCase().includes(term) || (a.name || '').toLowerCase().includes(term) || (a.account_type || '').toLowerCase().includes(term);
  });

  const filteredJournalEntries = journalEntries.filter(j => {
    const term = searchTerm.toLowerCase();
    return !term || (j.description || '').toLowerCase().includes(term) || (j.reference || '').toLowerCase().includes(term) || (j.date || '').includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Accounting Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">Double-entry General Ledger, Chart of Accounts, and Trial Balance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => { setActiveTab('accounts'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'accounts' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Chart of Accounts ({accounts.length})
            </button>
            <button 
              onClick={() => { setActiveTab('journal'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === 'journal' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Journal Entries ({journalEntries.length})
            </button>
          </div>

          {activeTab === 'accounts' ? (
            <button
              onClick={() => setShowAddAccount(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-medium rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} /> New Account
            </button>
          ) : (
            <button
              onClick={() => setShowAddEntry(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-medium rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} /> Post Journal Entry
            </button>
          )}
        </div>
      </div>

      {/* Trial Balance Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map((type) => {
          const total = trialBalance[type] || 0;
          return (
            <div key={type} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{type}</div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                ${parseFloat(String(total)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 border border-slate-200 rounded-md shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'accounts' ? "Search accounts by code, name, or type..." : "Search journal by description, ref, or date..."}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Tab 1: Chart of Accounts Table */}
      {activeTab === 'accounts' && (
        <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-visible">
          <div className="overflow-x-visible">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th className="w-32">Account Code</th>
                  <th>Account Name</th>
                  <th>Classification</th>
                  <th className="text-right">Current Balance</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 text-sm">Loading accounts...</td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 text-sm">No accounts found matching your search.</td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="relative hover:bg-slate-50 transition-colors">
                      <td className="font-mono font-semibold text-slate-900 text-xs">{acc.code}</td>
                      <td className="font-medium text-slate-900">{acc.name}</td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          acc.account_type === 'ASSET' ? 'bg-blue-100 text-blue-800' :
                          acc.account_type === 'LIABILITY' ? 'bg-rose-100 text-rose-800' :
                          acc.account_type === 'REVENUE' ? 'bg-emerald-100 text-emerald-800' :
                          acc.account_type === 'EXPENSE' ? 'bg-amber-100 text-amber-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {acc.account_type}
                        </span>
                      </td>
                      <td className="text-right font-bold text-slate-900 font-mono">
                        ${parseFloat(acc.current_balance || '0').toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="text-right relative">
                        <button 
                          onClick={() => setViewingAccount(acc)}
                          className="px-2.5 py-1 rounded text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-slate-200"
                        >
                          <Eye size={13} /> View Ledger
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Journal Entries */}
      {activeTab === 'journal' && (
        <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading journal history...</div>
          ) : filteredJournalEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-medium text-slate-700">No Journal Entries Found</h4>
              <p className="text-slate-500 text-sm mt-1">Post a new journal entry above to update the ledger.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredJournalEntries.map((entry) => {
                const entryDebits = (entry.lines || []).reduce((s: number, l: any) => s + (parseFloat(l.debit) || 0), 0);
                return (
                  <div key={entry.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-slate-900 text-sm">{entry.description}</span>
                          {entry.reference && (
                            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-mono">
                              Ref: {entry.reference}
                            </span>
                          )}
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-medium">
                            {entry.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Date: {entry.date} &bull; Entry ID: <span className="font-mono">{entry.id.substring(0,8)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400 uppercase font-medium">Total Value</div>
                          <div className="text-base font-bold text-slate-900 font-mono">
                            ${entryDebits.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingEntry(entry)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} /> View Voucher
                        </button>
                      </div>
                    </div>

                    {/* Inline breakdown table */}
                    <div className="border border-slate-100 rounded-md overflow-hidden bg-slate-50/40">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2 font-medium">Account</th>
                            <th className="px-3 py-2 font-medium text-right w-28">Debit</th>
                            <th className="px-3 py-2 font-medium text-right w-28">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(entry.lines || []).map((line: any, lIdx: number) => (
                            <tr key={line.id || lIdx}>
                              <td className="px-3 py-1.5 text-slate-700 font-medium">
                                {getAccountLabel(line.account_id)}
                              </td>
                              <td className="px-3 py-1.5 text-right font-mono text-slate-900 font-medium">
                                {parseFloat(line.debit) > 0 ? `$${parseFloat(line.debit).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                              </td>
                              <td className="px-3 py-1.5 text-right font-mono text-slate-900 font-medium">
                                {parseFloat(line.credit) > 0 ? `$${parseFloat(line.credit).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: View Account Details & Ledger */}
      {viewingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{viewingAccount.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Account Code: {viewingAccount.code}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingAccount(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Account Category</span>
                  <span className="text-sm font-semibold text-slate-900 mt-1 block">
                    {viewingAccount.account_type}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Current Balance</span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                    ${parseFloat(viewingAccount.current_balance || '0').toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Associated Transactions</div>
                <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-md">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-500">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Description</th>
                        <th className="p-2 text-right">Debit</th>
                        <th className="p-2 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {journalEntries.flatMap(j => (j.lines || []).filter((l: any) => l.account_id === viewingAccount.id).map((l: any) => ({ ...l, date: j.date, desc: j.description }))).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">No transactions recorded for this account.</td>
                        </tr>
                      ) : (
                        journalEntries.flatMap(j => (j.lines || []).filter((l: any) => l.account_id === viewingAccount.id).map((l: any) => ({ ...l, date: j.date, desc: j.description }))).map((t: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-500">{t.date}</td>
                            <td className="p-2 font-medium text-slate-800">{t.desc}</td>
                            <td className="p-2 text-right font-mono">{parseFloat(t.debit) > 0 ? `$${parseFloat(t.debit).toFixed(2)}` : '-'}</td>
                            <td className="p-2 text-right font-mono">{parseFloat(t.credit) > 0 ? `$${parseFloat(t.credit).toFixed(2)}` : '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setViewingAccount(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Full Journal Entry Voucher */}
      {viewingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{viewingEntry.description}</h3>
                  <p className="text-xs text-slate-500">Journal Voucher #{viewingEntry.id.substring(0,8)}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Posting Date</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{viewingEntry.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Reference</span>
                  <span className="font-mono font-medium text-slate-800 mt-0.5 block">{viewingEntry.reference || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status</span>
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-[11px] mt-0.5">
                    {viewingEntry.status}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Account Code & Title</th>
                      <th className="px-4 py-2.5 text-right w-28">Debit ($)</th>
                      <th className="px-4 py-2.5 text-right w-28">Credit ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewingEntry.lines || []).map((line: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-800 font-medium">
                          {getAccountLabel(line.account_id)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-slate-900">
                          {parseFloat(line.debit) > 0 ? `$${parseFloat(line.debit).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-slate-900">
                          {parseFloat(line.credit) > 0 ? `$${parseFloat(line.credit).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                    <tr>
                      <td className="px-4 py-2.5">Total Balanced Amount</td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-700">
                        ${(viewingEntry.lines || []).reduce((s: number, l: any) => s + (parseFloat(l.debit) || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-700">
                        ${(viewingEntry.lines || []).reduce((s: number, l: any) => s + (parseFloat(l.credit) || 0), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setViewingEntry(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Account */}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-900">Create Chart of Account</h3>
              <button onClick={() => setShowAddAccount(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account Code</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. 1010, 2020, 4010"
                  value={newAccount.code}
                  onChange={(e) => setNewAccount({...newAccount, code: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account Name</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Operating Cash, Lease Receivables"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account Type</label>
                <select
                  required
                  value={newAccount.account_type}
                  onChange={(e) => setNewAccount({...newAccount, account_type: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                >
                  <option value="ASSET">Asset (Debit balance)</option>
                  <option value="LIABILITY">Liability (Credit balance)</option>
                  <option value="EQUITY">Equity (Credit balance)</option>
                  <option value="REVENUE">Revenue (Credit balance)</option>
                  <option value="EXPENSE">Expense (Debit balance)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddAccount(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Journal Entry Form */}
      {showAddEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" /> New Journal Voucher
              </h2>
              <button onClick={() => setShowAddEntry(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePostEntry} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Reference No.</label>
                  <input 
                    type="text" 
                    placeholder="e.g. INV-2026-001"
                    value={newEntry.reference}
                    onChange={(e) => setNewEntry({...newEntry, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description / Memo</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Lease Interest Booking"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Account Title</th>
                      <th className="px-3 py-2.5 font-medium text-right w-36">Debit ($)</th>
                      <th className="px-3 py-2.5 font-medium text-right w-36">Credit ($)</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {newEntry.lines.map((line, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">
                          <select 
                            required
                            value={line.account_id}
                            onChange={(e) => handleLineChange(idx, 'account_id', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs"
                          >
                            <option value="">Select Account...</option>
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name} ({acc.account_type})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input 
                            type="number" 
                            step="0.01"
                            value={line.debit}
                            onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-right text-xs font-mono"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input 
                            type="number" 
                            step="0.01"
                            value={line.credit}
                            onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-right text-xs font-mono"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          {newEntry.lines.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="text-slate-400 hover:text-rose-600 font-bold p-1 cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-medium">
                    <tr>
                      <td className="px-3 py-2.5">
                        <button 
                          type="button" 
                          onClick={handleAddLine}
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center font-medium cursor-pointer"
                        >
                          <Plus size={14} className="mr-1" /> Add Account Line
                        </button>
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono font-bold ${isBalanced ? 'text-slate-900' : 'text-rose-600'}`}>
                        ${totalDebits.toFixed(2)}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono font-bold ${isBalanced ? 'text-slate-900' : 'text-rose-600'}`}>
                        ${totalCredits.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-between items-center pt-3">
                <div className="text-xs">
                  {!isBalanced ? (
                    <span className="text-rose-600 flex items-center font-medium">
                      <AlertTriangle size={15} className="mr-1.5" />
                      Entry not balanced (Difference: ${difference.toFixed(2)})
                    </span>
                  ) : (
                    <span className="text-emerald-600 flex items-center font-medium">
                      <CheckCircle2 size={15} className="mr-1.5" />
                      Debits equal Credits (${totalDebits.toFixed(2)})
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddEntry(false)}
                    className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!isBalanced || submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-xs text-xs font-medium disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Posting...' : 'Post Voucher'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
