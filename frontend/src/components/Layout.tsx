import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Box, FileText, LogOut, Briefcase, CreditCard, Calculator, PhoneCall, Bell, ChevronDown, ShieldCheck, Search, HelpCircle, Menu } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAppStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Assets', path: '/assets', icon: Box },
    { name: 'Leases', path: '/leases', icon: FileText },
    { name: 'Contracts', path: '/contracts', icon: Briefcase },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Accounting', path: '/accounting', icon: Calculator },
    { name: 'Collections', path: '/collections', icon: PhoneCall },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex-col bg-[#161616] text-slate-300 hidden lg:flex border-r border-slate-800 z-20 shadow-xl">
        {/* Brand */}
        <div className="flex h-14 items-center gap-3 px-5 border-b border-white/10 bg-[#000000]">
          <ShieldCheck size={20} className="text-blue-500" />
          <span className="text-[15px] font-semibold text-slate-100 tracking-wide">FinLease ERP</span>
        </div>
        
        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          <div className="px-5 mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Core Modules</p>
          </div>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  <Link 
                    to={item.path} 
                    className={`flex items-center gap-3 px-5 py-2 text-[13px] font-medium border-l-[3px] transition-all ${
                      isActive 
                        ? 'border-blue-500 bg-white/10 text-white' 
                        : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        
        {/* Top App Bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden text-slate-500 hover:text-slate-700">
              <Menu size={20} />
            </button>
            <div className="relative w-96 hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search resources, customers, leases..." 
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100 border-transparent rounded text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <HelpCircle size={18} />
            </button>
            <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-md transition-colors">
              <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                AD
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
};
