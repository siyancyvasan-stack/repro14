import React from "react";
import { Link2, Loader2, Save, Trash2 } from "lucide-react";
import { ManagerLayout } from "../components/layout/ManagerLayout";
import { useToast } from "../context/ToastContext";
import {
  AssignmentType,
  ContactAdminUser,
  ContactAssignment,
  createContactAssignment,
  deleteContactAssignment,
  loadContactAdmin,
  updateContactUser,
  updateCountryCode,
} from "../services/contactApi";

const definitions: Array<{
  type: AssignmentType;
  first: ContactAdminUser["role"];
  second: ContactAdminUser["role"];
  label: string;
}> = [
  {
    type: "SALES_MANAGER",
    first: "AGENT",
    second: "MANAGER",
    label: "Sales Person → Manager",
  },
  {
    type: "SALES_FACTORY_MANAGER",
    first: "AGENT",
    second: "FACTORY_MANAGER",
    label: "Sales Person → Factory Manager",
  },
  {
    type: "MANAGER_FACTORY_MANAGER",
    first: "MANAGER",
    second: "FACTORY_MANAGER",
    label: "Manager → Factory Manager",
  },
];

export const AdminContactManagementPage = () => {
  const { showToast } = useToast();
  const [users, setUsers] = React.useState<ContactAdminUser[]>([]);
  const [assignments, setAssignments] = React.useState<ContactAssignment[]>([]);
  const [code, setCode] = React.useState("94");
  const [type, setType] = React.useState<AssignmentType>("SALES_MANAGER");
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(
    () =>
      loadContactAdmin()
        .then((data) => {
          setUsers(data.users);
          setAssignments(data.assignments);
          setCode(data.phoneCountryCode);
        })
        .finally(() => setLoading(false)),
    [],
  );

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const definition = definitions.find((item) => item.type === type)!;
  const name = (id: string) =>
    users.find((user) => user.id === id)?.name ?? "Unknown user";

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <ManagerLayout>
      <div className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            <Link2 className="text-indigo-600 h-6 w-6" />
            Contact Administration
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Maintain protected phone details and role communication assignments.
          </p>
        </div>

        {/* Default Calling Code */}
        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl text-slate-900">
          <h3 className="text-base font-bold text-slate-900">Default calling code</h3>
          <p className="mt-0.5 text-xs text-slate-500">Global international dialing prefix for WhatsApp & calls.</p>
          <div className="mt-3 flex max-w-sm gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              onClick={() =>
                void updateCountryCode(code).then(() =>
                  showToast("Saved", "Calling code updated.", "success"),
                )
              }
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 font-bold text-white shadow-md shadow-indigo-100 hover:from-indigo-700 hover:to-blue-700 transition-all cursor-pointer"
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* User Contact Details */}
        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl text-slate-900">
          <h3 className="text-base font-bold text-slate-900">User contact details</h3>
          <p className="mt-0.5 text-xs text-slate-500">Direct phone numbers and WhatsApp access.</p>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onSave={async (phone, wa) => {
                  await updateContactUser(user.id, phone, wa);
                  await refresh();
                  showToast(
                    "Saved",
                    `${user.name}'s contact details updated.`,
                    "success",
                  );
                }}
              />
            ))}
          </div>
        </section>

        {/* Assignments */}
        <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl text-slate-900">
          <h3 className="text-base font-bold text-slate-900">Role Assignments</h3>
          <p className="mt-0.5 text-xs text-slate-500">Configure who can reach whom on WhatsApp.</p>
          <div className="mt-4 grid gap-2 md:grid-cols-4">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as AssignmentType);
                setA("");
                setB("");
              }}
              className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-800 shadow-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {definitions.map((d) => (
                <option key={d.type} value={d.type}>
                  {d.label}
                </option>
              ))}
            </select>
            <select
              value={a}
              onChange={(e) => setA(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-800 shadow-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select {definition.first.toLowerCase()}</option>
              {users
                .filter((u) => u.role === definition.first)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
            <select
              value={b}
              onChange={(e) => setB(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-800 shadow-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select {definition.second.toLowerCase()}</option>
              {users
                .filter((u) => u.role === definition.second)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
            <button
              disabled={!a || !b}
              onClick={() =>
                void createContactAssignment({ userAId: a, userBId: b, type }).then(() => {
                  setA("");
                  setB("");
                  void refresh();
                  showToast("Linked", "Contact assignment created.", "success");
                })
              }
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 p-3 text-sm font-bold text-white shadow-md shadow-indigo-100 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              Link Users
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {assignments.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-sm"
              >
                <span className="font-semibold text-slate-800">
                  {name(item.userAId)} → {name(item.userBId)}{" "}
                  <small className="ml-2 font-bold text-indigo-600">
                    {item.type.replaceAll("_", " ")}
                  </small>
                </span>
                <button
                  aria-label="Delete assignment"
                  onClick={() =>
                    void deleteContactAssignment(item.id).then(refresh)
                  }
                  className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ManagerLayout>
  );
};

const UserRow = ({
  user,
  onSave,
}: {
  key?: React.Key;
  user: ContactAdminUser;
  onSave: (phone: string, wa: string) => Promise<void>;
}) => {
  const [phone, setPhone] = React.useState(user.phone ?? "");
  const [wa, setWa] = React.useState(user.whatsappNumber ?? "");
  return (
    <div className="grid items-center gap-3 rounded-xl bg-slate-50/90 border border-slate-200/80 p-3.5 md:grid-cols-[1.2fr_1fr_1fr_auto]">
      <div>
        <b className="text-sm font-bold text-slate-900">{user.name}</b>
        <p className="text-xs font-semibold text-indigo-600">{user.role.replace("_", " ")}</p>
      </div>
      <input
        aria-label={`${user.name} phone`}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone"
        className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 shadow-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
      />
      <input
        aria-label={`${user.name} WhatsApp`}
        value={wa}
        onChange={(e) => setWa(e.target.value)}
        placeholder="WhatsApp"
        className="rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900 shadow-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
      />
      <button
        onClick={() => void onSave(phone, wa)}
        className="rounded-lg bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
        title="Save Contact"
      >
        <Save className="h-4 w-4" />
      </button>
    </div>
  );
};
