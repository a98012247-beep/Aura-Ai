import React from 'react';
import { Shield, Crown, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Stat Card ───────────────────────────────────────────────
export const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}> = ({ label, value, icon, trend, trendUp, className }) => (
  <div className={cn(
    "bg-slate-50/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-4 hover:border-slate-200/80 transition-all group",
    className
  )}>
    <div className="p-3 rounded-xl bg-white/80 border border-slate-200/50 text-slate-700 dark:text-slate-700 group-hover:scale-105 transition-transform">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-slate-900 mt-0.5 tracking-tight">{value}</p>
      {trend && (
        <p className={cn("text-[10px] font-bold mt-0.5", trendUp ? "text-emerald-400" : "text-red-400")}>
          {trend}
        </p>
      )}
    </div>
  </div>
);

// ─── Role Badge ──────────────────────────────────────────────
export const RoleBadge: React.FC<{ role?: string }> = ({ role }) => {
  if (role === 'admin') {
    return (
      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-purple-500/15 text-purple-400 border border-purple-500/20 inline-flex items-center gap-1">
        <Shield className="w-3 h-3" />
        Admin
      </span>
    );
  }
  if (role === 'pro') {
    return (
      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
        <Crown className="w-3 h-3" />
        Pro
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-700/50 text-slate-600 dark:text-slate-500 border border-slate-600/30">
      Free
    </span>
  );
};

// ─── Status Badge ────────────────────────────────────────────
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    suspended: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    revoked: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border inline-flex items-center",
      styles[status] || styles.active
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mr-1.5",
        status === 'active' ? 'bg-emerald-400' : status === 'suspended' ? 'bg-amber-400' : 'bg-red-400'
      )} />
      {status}
    </span>
  );
};

// ─── Severity Badge ──────────────────────────────────────────
export const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const styles: Record<string, string> = {
    high: "bg-red-500/15 text-red-400 border-red-500/20",
    medium: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    low: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  };
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border inline-flex items-center",
      styles[severity] || styles.low
    )}>
      {severity}
    </span>
  );
};

// ─── Admin Card ──────────────────────────────────────────────
export const AdminCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}> = ({ children, className, noPadding }) => (
  <div className={cn(
    "bg-slate-50/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden",
    !noPadding && "p-6",
    className
  )}>
    {children}
  </div>
);

// ─── Admin Table ─────────────────────────────────────────────
export const AdminTable: React.FC<{
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}> = ({ headers, children, emptyMessage = "No data found.", isEmpty }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead className="border-b border-slate-200 dark:border-slate-200">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className={cn(
              "px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest",
              i === headers.length - 1 && "text-right"
            )}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200/60">
        {isEmpty ? (
          <tr>
            <td colSpan={headers.length} className="px-5 py-12 text-center text-slate-500 text-sm italic">
              {emptyMessage}
            </td>
          </tr>
        ) : children}
      </tbody>
    </table>
  </div>
);

// ─── Admin Modal ─────────────────────────────────────────────
export const AdminModal: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}> = ({ title, children, onClose, maxWidth = "max-w-md" }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
    <div
      className={cn("bg-slate-100 dark:bg-slate-50 border border-slate-200 dark:border-slate-200 rounded-2xl w-full shadow-2xl", maxWidth)}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-200">
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

// ─── Admin Drawer ────────────────────────────────────────────
export const AdminDrawer: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  subtitle?: string;
}> = ({ title, children, onClose, subtitle }) => (
  <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
    <div
      className="relative w-full max-w-2xl bg-slate-50 bg-white border-l border-slate-200 dark:border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-200 shrink-0">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  </div>
);

// ─── Section Header ──────────────────────────────────────────
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-slate-900 tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
  </div>
);

// ─── Input Field ─────────────────────────────────────────────
export const AdminInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div>
    {label && <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">{label}</label>}
    <input
      {...props}
      className={cn(
        "w-full px-4 py-2.5 bg-white dark:bg-white border border-slate-300 dark:border-slate-200 rounded-xl text-slate-900 dark:text-slate-900 text-sm font-medium placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 outline-none transition-all",
        className
      )}
    />
  </div>
);

// ─── Select Field ────────────────────────────────────────────
export const AdminSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, className, children, ...props }) => (
  <div>
    {label && <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">{label}</label>}
    <select
      {...props}
      className={cn(
        "w-full px-4 py-2.5 bg-white dark:bg-white border border-slate-300 dark:border-slate-200 rounded-xl text-slate-900 dark:text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 outline-none transition-all",
        className
      )}
    >
      {children}
    </select>
  </div>
);

// ─── Button ──────────────────────────────────────────────────
export const AdminButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ReactNode;
}> = ({ variant = 'primary', icon, children, className, ...props }) => {
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 text-slate-900 dark:text-slate-900 hover:opacity-90 shadow-lg shadow-indigo-500/20 border border-indigo-500/30",
    secondary: "bg-white dark:bg-white text-slate-700 dark:text-slate-700 hover:text-slate-900 hover:bg-slate-700 border border-slate-300 dark:border-slate-200",
    danger: "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/20",
    ghost: "text-slate-600 dark:text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent",
  };
  return (
    <button
      {...props}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
};

// ─── Toggle Switch ───────────────────────────────────────────
export const AdminToggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <label className="flex items-center justify-between p-4 bg-slate-100/50 dark:bg-white/50 border border-slate-200/50 rounded-xl cursor-pointer hover:bg-white transition-colors">
    <div>
      <p className="font-bold text-slate-900 dark:text-slate-900 text-sm">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <div className="relative inline-block w-11 h-6 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 ml-4">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className={cn(
        "absolute inset-y-1 left-1 w-4 h-4 rounded-full transition-all shadow-sm",
        checked ? "left-6 bg-indigo-500" : "bg-slate-500"
      )} />
    </div>
  </label>
);
