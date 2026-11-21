import React from 'react';
import { Edit3, Loader2, Save, Users } from 'lucide-react';
import { FactoryLayout } from '../components/layout/FactoryLayout';
import { apiRequest } from '../services/apiClient';

type SalesPerson = { id: string; name: string; email: string; employeeCode: string; phone?: string; region?: string; avatarUrl?: string; status: string };

export const SalesPersonsPage = () => {
  const [users, setUsers] = React.useState<SalesPerson[]>([]);
  const [editing, setEditing] = React.useState<SalesPerson | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const load = React.useCallback(() => apiRequest<{ users: SalesPerson[] }>('/api/v1/admin/users?role=AGENT').then((data) => setUsers(data.users)).finally(() => setLoading(false)), []);
  React.useEffect(() => { void load(); }, [load]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!editing) return; setSaving(true);
    try { const result = await apiRequest<{ user: SalesPerson }>(`/api/v1/admin/users/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ name: editing.name, email: editing.email, employeeCode: editing.employeeCode, phone: editing.phone || '', avatarUrl: editing.avatarUrl || '' }) }); setUsers((items) => items.map((item) => item.id === result.user.id ? result.user : item)); setEditing(null); }
    finally { setSaving(false); }
  };
  return <FactoryLayout><div className="space-y-5"><div><h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-950"><Users className="text-indigo-600" />Sales Person Profiles</h1><p className="mt-1 text-sm text-slate-500">View and maintain complete sales-person account details.</p></div>{loading ? <Loader2 className="animate-spin text-indigo-600" /> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="divide-y divide-slate-100">{users.map((user) => <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="flex items-center gap-3">{user.avatarUrl ? <img src={user.avatarUrl} className="h-12 w-12 rounded-xl object-cover" /> : <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-100 font-bold text-indigo-700">{user.name[0]}</div>}<div><p className="font-extrabold text-slate-900">{user.name}</p><p className="text-sm text-slate-500">{user.email} · ID {user.employeeCode}</p><p className="text-xs text-slate-400">{user.phone || 'No phone'} · {user.region || 'No region'} · {user.status}</p></div></div><button onClick={() => setEditing({ ...user })} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Edit3 className="h-4 w-4" />Maintain</button></div>)}</div>{!users.length && <p className="p-5 text-sm text-slate-500">No sales persons found.</p>}</div>}{editing && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-extrabold">Maintain sales-person profile</h2>{(['name','email','employeeCode','phone','avatarUrl'] as const).map((key) => <label key={key} className="grid gap-1 text-sm font-bold capitalize">{key}<input required={key !== 'phone' && key !== 'avatarUrl'} type={key === 'email' ? 'email' : 'text'} value={editing[key] || ''} onChange={(e) => setEditing({ ...editing, [key]: e.target.value })} className="rounded-xl border border-slate-200 p-3" /></label>)}<div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-xl border px-4 py-2">Cancel</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save details'}</button></div></form></div>}</div></FactoryLayout>;
};
