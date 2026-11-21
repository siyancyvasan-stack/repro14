import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Pencil, Plus, Save, Users } from 'lucide-react';
import { ManagerLayout } from '../components/layout/ManagerLayout';
import { apiRequest } from '../services/apiClient';
import { useToast } from '../context/ToastContext';

type UserRole = 'AGENT' | 'FACTORY_MANAGER';
type AdminUser = {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  status: string;
};

const roleLabel = (role: UserRole) => (role === 'AGENT' ? 'Sales Agent' : 'Factory Manager');

const UserForm = ({
  role,
  user,
  onSaved,
}: {
  role: UserRole;
  user?: AdminUser;
  onSaved: (item: AdminUser) => void;
}) => {
  const { showToast } = useToast();
  const [form, setForm] = React.useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    employeeCode: user?.employeeCode ?? '',
    phone: user?.phone ?? '',
    avatarUrl: user?.avatarUrl ?? '',
    password: '',
  });
  const [saving, setSaving] = React.useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{1,7}$/.test(form.employeeCode)) {
      return showToast('Invalid ID', 'Use digits only, maximum 7 digits.', 'error');
    }
    if (!user && form.password.length < 8) {
      return showToast('Password required', 'Use at least 8 characters.', 'error');
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        role,
        ...(user && !form.password ? { password: undefined } : {}),
      };
      const result = user
        ? await apiRequest<{ user: AdminUser }>(`/api/v1/admin/users/${user.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await apiRequest<{ user: AdminUser }>('/api/v1/admin/users', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
      onSaved(result.user);
      showToast('Saved', `${roleLabel(role)} details saved.`, 'success');
    } catch (error) {
      showToast('Save failed', error instanceof Error ? error.message : 'Unable to save user.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl md:grid-cols-2"
    >
      <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
        Full name
        <input
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. John Doe"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
        Email address
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="name@company.com"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
        Employee / User ID (max 7 digits)
        <input
          required
          inputMode="numeric"
          pattern="[0-9]{1,7}"
          value={form.employeeCode}
          onChange={(e) => set('employeeCode', e.target.value.replace(/\D/g, '').slice(0, 7))}
          placeholder="1001"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
        Phone number
        <input
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+94 77 123 4567"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 md:col-span-2">
        Avatar image URL
        <input
          type="url"
          value={form.avatarUrl}
          onChange={(e) => set('avatarUrl', e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 md:col-span-2">
        {user ? 'New password (leave blank to keep current)' : 'Password'}
        <input
          required={!user}
          type="password"
          minLength={8}
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          placeholder={user ? '••••••••' : 'Minimum 8 characters'}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      {form.avatarUrl && (
        <div className="flex items-center gap-3 md:col-span-2">
          <img
            src={form.avatarUrl}
            alt="Avatar preview"
            className="h-14 w-14 rounded-2xl border border-slate-200 object-cover shadow-xs"
          />
          <span className="text-xs font-medium text-slate-500">Avatar Preview</span>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 md:col-span-2 transition-all cursor-pointer"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving…' : 'Save User Details'}
      </button>
    </form>
  );
};

export const AdminUsersPage = ({ role }: { role: UserRole }) => {
  const { id, mode } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [selected, setSelected] = React.useState<AdminUser>();
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(
    () =>
      apiRequest<{ users: AdminUser[] }>(`/api/v1/admin/users?role=${role}`)
        .then((data) => setUsers(data.users))
        .finally(() => setLoading(false)),
    [role],
  );

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (id) {
      void apiRequest<{ user: AdminUser }>(`/api/v1/admin/users/${id}`).then((data) =>
        setSelected(data.user),
      );
    }
  }, [id]);

  const title = roleLabel(role);
  const editing = mode === 'edit' || mode === 'new';
  const basePath = role === 'AGENT' ? '/admin/sales-users' : '/admin/factory-users';

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {title}s
              </h1>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Manage login access, credentials, and roles for {title.toLowerCase()}s.
              </p>
            </div>
          </div>

          <Link
            to={`${basePath}/new`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:from-indigo-700 hover:to-blue-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add {title}
          </Link>
        </div>

        {/* Content Section */}
        {editing ? (
          <div className="space-y-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {title} List
            </button>
            <UserForm
              role={role}
              user={mode === 'edit' ? selected : undefined}
              onSaved={() => {
                void refresh();
                navigate(basePath);
              }}
            />
          </div>
        ) : id && selected ? (
          <div className="space-y-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {title} List
            </button>
            <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-4">
                {selected.avatarUrl ? (
                  <img
                    src={selected.avatarUrl}
                    alt={selected.name}
                    className="h-20 w-20 rounded-2xl border border-slate-200 object-cover shadow-xs"
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-2xl font-black text-white shadow-sm">
                    {selected.name[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{selected.name}</h2>
                  <p className="text-sm font-semibold text-indigo-600">{selected.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    ID: <span className="font-semibold text-slate-700">{selected.employeeCode || '—'}</span> · Role: <span className="font-semibold text-slate-700">{title}</span> · Status:{' '}
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      {selected.status || 'ACTIVE'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4">
                <Link
                  to={`${basePath}/edit/${selected.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:from-indigo-700 hover:to-blue-700 transition-all"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile & Password
                </Link>
              </div>
            </section>
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
            <div className="divide-y divide-slate-100">
              {loading ? (
                <p className="p-6 text-center text-xs font-semibold text-slate-400">
                  Loading accounts…
                </p>
              ) : users.length ? (
                users.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50/70"
                  >
                    <div className="flex items-center gap-3">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.name}
                          className="h-11 w-11 rounded-xl border border-slate-200 object-cover shadow-xs"
                        />
                      ) : (
                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-black text-white shadow-xs">
                          {item.name[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.email} {item.employeeCode ? `· ID ${item.employeeCode}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        title="View Account Details"
                        to={`${basePath}/view/${item.id}`}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-xs transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        title="Edit Account"
                        to={`${basePath}/edit/${item.id}`}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-xs transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <p className="text-sm font-bold text-slate-700">No {title.toLowerCase()} accounts found</p>
                  <p className="mt-1 text-xs text-slate-400">Click &ldquo;Add {title}&rdquo; above to create one.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </ManagerLayout>
  );
};
