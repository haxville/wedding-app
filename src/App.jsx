import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { supabase } from "./supabase.js";

const APP_PASSWORD = "sposi2026";
const WEDDING_DATE = new Date("2026-08-28");

const ACCENT = "#007AFF";
const TODAY = new Date().toISOString().slice(0, 10);

const CATS = [
  { id: "catering", label: "Catering", color: "#ff9f0a" },
  { id: "allestimenti", label: "Allestimenti", color: "#34c759" },
  { id: "intrattenimento", label: "Intrattenimento", color: "#bf5af2" },
  { id: "inviti_ospiti", label: "Inviti e Ospiti", color: "#32ade6" },
  { id: "extra", label: "Extra", color: "#ff453a" },
];

const STATI = [
  { id: "pagato", label: "Pagato", color: "#34c759" },
  { id: "acconto", label: "Acconto", color: "#ff6b35" },
  { id: "da_pagare", label: "Da pagare", color: "#ff9f0a" },
  { id: "da_definire", label: "Da definire", color: "#ff453a" },
  { id: "incluso", label: "Incluso", color: "#8e8e93" },
];

const CAT_MAP = Object.fromEntries(CATS.map((cat) => [cat.id, cat]));
const STATO_MAP = Object.fromEntries(STATI.map((stato) => [stato.id, stato]));

const fmt = (value) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));

const fmtRound = (value) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const SAMPLE_EXPENSES = [
  {
    id: "e1",
    category: "catering",
    description: "Ristorante Adulti",
    unit_cost: 95,
    qty: 100,
    notes: "116 ivato a persona",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e2",
    category: "catering",
    description: "Ristorante Bambini 50%",
    unit_cost: 44.5,
    qty: 10,
    notes: "55 ivato a persona",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e3",
    category: "catering",
    description: "Ristorante Staff",
    unit_cost: 50,
    qty: 7,
    notes: "",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e4",
    category: "catering",
    description: "Open Bar",
    unit_cost: 10,
    qty: 100,
    notes: "10 ivato a persona",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e5",
    category: "catering",
    description: "Buffet Dolci",
    unit_cost: 10,
    qty: 100,
    notes: "12,20 ivato a persona",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e6",
    category: "catering",
    description: "Brunch Sabato",
    unit_cost: 29,
    qty: 70,
    notes: "35 ivato a persona",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e7",
    category: "allestimenti",
    description: "Fiori",
    unit_cost: 2150,
    qty: 1,
    notes: "",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e8",
    category: "allestimenti",
    description: "Allestimenti Brunch",
    unit_cost: 500,
    qty: 1,
    notes: "",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e9",
    category: "intrattenimento",
    description: "Band",
    unit_cost: 2600,
    qty: 1,
    notes: "",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e10",
    category: "intrattenimento",
    description: "Fotografo",
    unit_cost: 1600,
    qty: 1,
    notes: "",
    stato: "pagato",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e11",
    category: "inviti_ospiti",
    description: "Partecipazioni / Casa Ciao",
    unit_cost: 686.86,
    qty: 1,
    notes: "",
    stato: "pagato",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e12",
    category: "inviti_ospiti",
    description: "Bomboniere",
    unit_cost: 10,
    qty: 50,
    notes: "",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e13",
    category: "inviti_ospiti",
    description: "Regalo camere testimoni",
    unit_cost: 250,
    qty: 8,
    notes: "",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e14",
    category: "extra",
    description: "Confettata Miani",
    unit_cost: 197,
    qty: 1,
    notes: "",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e15",
    category: "catering",
    description: "Vino Extra",
    unit_cost: 1000,
    qty: 1,
    notes: "",
    stato: "da_pagare",
    acconto_amount: "",
    acconto_date: "",
  },
  {
    id: "e16",
    category: "extra",
    description: "Fedi",
    unit_cost: 750,
    qty: 1,
    notes: "",
    stato: "pagato",
    acconto_amount: "",
    acconto_date: "",
  },
];

const emptyExpense = () => ({
  description: "",
  category: "catering",
  unit_cost: "",
  qty: "1",
  notes: "",
  stato: "da_pagare",
  acconto_amount: "",
  acconto_date: "",
});

const emptyGift = () => ({
  guest: "",
  description: "Busta",
  amount: "",
  date: TODAY,
  adults: "1",
  children: "0",
});

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f7f8fb 0%, #eef2f7 45%, #f9fafb 100%)",
    color: "#111827",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif",
    padding: "24px 14px 60px",
  },
  wrap: {
    width: "100%",
    maxWidth: "1040px",
    margin: "0 auto",
  },
  card: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(17,24,39,0.08)",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 12px 34px rgba(15, 23, 42, 0.06)",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(17,24,39,0.12)",
    borderRadius: "12px",
    padding: "11px 12px",
    fontSize: "15px",
    outline: "none",
    background: "#fff",
    color: "#111827",
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(17,24,39,0.12)",
    borderRadius: "12px",
    padding: "11px 12px",
    fontSize: "15px",
    outline: "none",
    background: "#fff",
    color: "#111827",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "6px",
  },
  button: {
    border: "none",
    borderRadius: "999px",
    padding: "11px 16px",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  },
};

function Button({ children, onClick, variant = "primary", disabled = false }) {
  const variants = {
    primary: {
      background: ACCENT,
      color: "#fff",
    },
    secondary: {
      background: "rgba(0,122,255,0.1)",
      color: ACCENT,
    },
    danger: {
      background: "rgba(255,69,58,0.12)",
      color: "#ff453a",
    },
    ghost: {
      background: "transparent",
      color: "#6b7280",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.button,
        ...variants[variant],
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function checkPassword() {
    if (password === APP_PASSWORD) {
      try {
        localStorage.setItem("wed_auth", APP_PASSWORD);
      } catch {
        // ignore localStorage errors
      }
      onUnlock();
      return;
    }

    setError(true);
    setPassword("");
    setTimeout(() => setError(false), 2000);
  }

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.wrap,
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            ...styles.card,
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "20px",
              background: ACCENT,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: "24px",
              fontWeight: 800,
              margin: "0 auto 16px",
            }}
          >
            S&G
          </div>

          <h1 style={{ margin: 0, fontSize: "28px", letterSpacing: "-0.04em" }}>
            Stefano & Giulia
          </h1>

          <p style={{ margin: "8px 0 22px", color: "#6b7280" }}>
            28 agosto 2026 — Mare, Cesenatico
          </p>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") checkPassword();
            }}
            placeholder="Password"
            autoFocus
            style={{
              ...styles.input,
              textAlign: "center",
              borderColor: error ? "#ff453a" : "rgba(17,24,39,0.12)",
              marginBottom: "12px",
            }}
          />

          {error && (
            <p style={{ color: "#ff453a", margin: "0 0 12px" }}>
              Password errata
            </p>
          )}

          <Button onClick={checkPassword}>Entra</Button>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, color = ACCENT }) {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.label, marginBottom: "10px" }}>{label}</div>
      <div
        style={{
          fontSize: "30px",
          fontWeight: 800,
          letterSpacing: "-0.05em",
          color,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ marginTop: "6px", color: "#6b7280" }}>{sub}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function StatusPill({ stato }) {
  const item = STATO_MAP[stato] || STATO_MAP.da_pagare;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 9px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        color: item.color,
        background: `${item.color}18`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: item.color,
        }}
      />
      {item.label}
    </span>
  );
}

function ChartCard({ title, data, total }) {
  return (
    <div style={styles.card}>
      <h3 style={{ margin: "0 0 16px", fontSize: "18px" }}>{title}</h3>

      {data.length === 0 ? (
        <p style={{ color: "#6b7280", margin: 0 }}>Nessun dato</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            gap: "18px",
            alignItems: "center",
          }}
        >
          <div style={{ width: "100%", height: "180px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="value" innerRadius={52} outerRadius={82}>
                  {data.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => fmt(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {data.map((item) => {
              const percentage =
                total > 0 ? Math.round((item.value / total) * 100) : 0;

              return (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontWeight: 700,
                      }}
                    >
                      <span
                        style={{
                          width: "9px",
                          height: "9px",
                          borderRadius: "50%",
                          background: item.color,
                        }}
                      />
                      {item.label}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: "13px" }}>
                      {percentage}%
                    </div>
                  </div>

                  <strong>{fmt(item.value)}</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return localStorage.getItem("wed_auth") === APP_PASSWORD;
    } catch {
      return false;
    }
  });

  const [expenses, setExpenses] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState("connecting");

  const [view, setView] = useState("dashboard");
  const [tab, setTab] = useState("expenses");

  const [filterCat, setFilterCat] = useState("all");
  const [filterStato, setFilterStato] = useState("all");
  const [sortBy, setSortBy] = useState("category");
  const [sortDir, setSortDir] = useState("asc");

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState(emptyExpense());

  const [editingGiftId, setEditingGiftId] = useState(null);
  const [giftForm, setGiftForm] = useState(emptyGift());

  const daysLeft = useMemo(() => {
    const diff = WEDDING_DATE.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
  }, []);

  const loadData = useCallback(async () => {
    setError("");

    const [expensesResponse, giftsResponse] = await Promise.all([
      supabase.from("expenses").select("*"),
      supabase.from("gifts").select("*"),
    ]);

    if (expensesResponse.error) {
      throw expensesResponse.error;
    }

    if (giftsResponse.error) {
      throw giftsResponse.error;
    }

    setExpenses(expensesResponse.data || []);
    setGifts(giftsResponse.data || []);
  }, []);

  useEffect(() => {
    if (!unlocked) return;

    setLoading(true);

    loadData()
      .catch((err) => {
        console.error(err);
        setError(err.message || "Errore di connessione a Supabase");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [unlocked, loadData]);

  useEffect(() => {
    if (!unlocked) return;

    const channel = supabase
      .channel("wedding-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          loadData().catch((err) => {
            console.error(err);
            setError(err.message || "Errore aggiornamento spese");
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gifts" },
        () => {
          loadData().catch((err) => {
            console.error(err);
            setError(err.message || "Errore aggiornamento regali");
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setSyncStatus("synced");
        else if (status === "CHANNEL_ERROR") setSyncStatus("offline");
        else setSyncStatus("connecting");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unlocked, loadData]);

  const filteredExpenses = useMemo(() => {
    const list = [...expenses]
      .filter((item) => {
        if (filterCat !== "all" && item.category !== filterCat) return false;
        if (filterStato !== "all" && item.stato !== filterStato) return false;
        return true;
      })
      .sort((a, b) => {
        let valueA;
        let valueB;

        if (sortBy === "total") {
          valueA = Number(a.unit_cost || 0) * Number(a.qty || 0);
          valueB = Number(b.unit_cost || 0) * Number(b.qty || 0);
        } else if (sortBy === "description") {
          valueA = String(a.description || "").toLowerCase();
          valueB = String(b.description || "").toLowerCase();
        } else {
          valueA = String(a.category || "");
          valueB = String(b.category || "");
        }

        if (valueA > valueB) return sortDir === "asc" ? 1 : -1;
        if (valueA < valueB) return sortDir === "asc" ? -1 : 1;
        return 0;
      });

    return list;
  }, [expenses, filterCat, filterStato, sortBy, sortDir]);

  const stats = useMemo(() => {
    const totalBudget = expenses.reduce(
      (sum, item) =>
        sum + Number(item.unit_cost || 0) * Number(item.qty || 0),
      0
    );

    const totalPaid = expenses.reduce((sum, item) => {
      const total = Number(item.unit_cost || 0) * Number(item.qty || 0);

      if (item.stato === "pagato") return sum + total;
      if (item.stato === "acconto") {
        return sum + Number(item.acconto_amount || 0);
      }

      return sum;
    }, 0);

    const totalToPay = expenses.reduce((sum, item) => {
      const total = Number(item.unit_cost || 0) * Number(item.qty || 0);

      if (item.stato === "pagato" || item.stato === "incluso") return sum;

      if (item.stato === "acconto") {
        return sum + Math.max(0, total - Number(item.acconto_amount || 0));
      }

      return sum + total;
    }, 0);

    const totalGifts = gifts.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const totalPersons = gifts.reduce(
      (sum, item) =>
        sum + Number(item.adults || 0) + Number(item.children || 0),
      0
    );

    const mediaPerPerson =
      totalPersons > 0 ? totalGifts / totalPersons : 0;

    const byCat = CATS.map((cat) => ({
      ...cat,
      value: expenses
        .filter((item) => item.category === cat.id)
        .reduce(
          (sum, item) =>
            sum + Number(item.unit_cost || 0) * Number(item.qty || 0),
          0
        ),
    })).filter((cat) => cat.value > 0);

    const byStato = STATI.map((stato) => ({
      ...stato,
      value: expenses
        .filter((item) => item.stato === stato.id)
        .reduce((sum, item) => {
          if (item.stato === "acconto") {
            return sum + Number(item.acconto_amount || 0);
          }

          return (
            sum + Number(item.unit_cost || 0) * Number(item.qty || 0)
          );
        }, 0),
    })).filter((stato) => stato.value > 0);

    return {
      totalBudget,
      totalPaid,
      totalToPay,
      totalGifts,
      totalPersons,
      mediaPerPerson,
      byCat,
      byStato,
    };
  }, [expenses, gifts]);

  const net = stats.totalGifts - stats.totalBudget;

  async function seedData() {
    setSaving(true);
    setError("");

    try {
      const { error: insertError } = await supabase
        .from("expenses")
        .upsert(SAMPLE_EXPENSES);

      if (insertError) throw insertError;

      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Errore caricamento dati iniziali");
    } finally {
      setSaving(false);
    }
  }

  function openAddExpense() {
    setEditingExpenseId(null);
    setExpenseForm(emptyExpense());
    setView("expense-form");
  }

  function openEditExpense(item) {
    setEditingExpenseId(item.id);
    setExpenseForm({
      description: item.description || "",
      category: item.category || "catering",
      unit_cost: String(item.unit_cost ?? ""),
      qty: String(item.qty ?? "1"),
      notes: item.notes || "",
      stato: item.stato || "da_pagare",
      acconto_amount: String(item.acconto_amount || ""),
      acconto_date: item.acconto_date || "",
    });
    setView("expense-form");
  }

  async function saveExpense() {
    if (!expenseForm.description.trim()) return;
    if (expenseForm.unit_cost === "") return;

    setSaving(true);
    setError("");

    const item = {
      id: editingExpenseId || `e-${Date.now()}`,
      description: expenseForm.description.trim(),
      category: expenseForm.category,
      unit_cost: Number(expenseForm.unit_cost || 0),
      qty: Number(expenseForm.qty || 1),
      notes: expenseForm.notes || "",
      stato: expenseForm.stato,
      acconto_amount:
        expenseForm.stato === "acconto"
          ? expenseForm.acconto_amount || ""
          : "",
      acconto_date:
        expenseForm.stato === "acconto" ? expenseForm.acconto_date || "" : "",
    };

    try {
      const { error: upsertError } = await supabase
        .from("expenses")
        .upsert(item);

      if (upsertError) throw upsertError;

      await loadData();
      setView("dashboard");
      setEditingExpenseId(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Errore salvataggio spesa");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(id) {
    const confirmDelete = window.confirm("Eliminare questa voce di spesa?");
    if (!confirmDelete) return;

    setSaving(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Errore eliminazione spesa");
    } finally {
      setSaving(false);
    }
  }

  function openAddGift() {
    setEditingGiftId(null);
    setGiftForm(emptyGift());
    setView("gift-form");
  }

  function openEditGift(item) {
    setEditingGiftId(item.id);
    setGiftForm({
      guest: item.guest || "",
      description: item.description || "Busta",
      amount: String(item.amount ?? ""),
      date: item.date || TODAY,
      adults: String(item.adults ?? "1"),
      children: String(item.children ?? "0"),
    });
    setView("gift-form");
  }

  async function saveGift() {
    if (!giftForm.guest.trim()) return;
    if (!giftForm.amount) return;

    setSaving(true);
    setError("");

    const item = {
      id: editingGiftId || `g-${Date.now()}`,
      guest: giftForm.guest.trim(),
      description: giftForm.description || "Busta",
      amount: Number(giftForm.amount || 0),
      date: giftForm.date || TODAY,
      adults: Number(giftForm.adults || 0),
      children: Number(giftForm.children || 0),
    };

    try {
      const { error: upsertError } = await supabase
        .from("gifts")
        .upsert(item);

      if (upsertError) throw upsertError;

      await loadData();
      setView("dashboard");
      setEditingGiftId(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Errore salvataggio regalo");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGift(id) {
    const confirmDelete = window.confirm("Eliminare questo regalo?");
    if (!confirmDelete) return;

    setSaving(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("gifts")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || "Errore eliminazione regalo");
    } finally {
      setSaving(false);
    }
  }

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  if (view === "expense-form") {
    const total =
      Number(expenseForm.unit_cost || 0) * Number(expenseForm.qty || 0);

    return (
      <div style={styles.page}>
        <div style={styles.wrap}>
          <Button variant="ghost" onClick={() => setView("dashboard")}>
            ← Torna alla dashboard
          </Button>

          <div style={{ height: "14px" }} />

          <div style={styles.card}>
            <h1 style={{ marginTop: 0 }}>
              {editingExpenseId ? "Modifica voce" : "Nuova voce di spesa"}
            </h1>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
              }}
            >
              <Field label="Descrizione">
                <input
                  style={styles.input}
                  value={expenseForm.description}
                  onChange={(event) =>
                    setExpenseForm((form) => ({
                      ...form,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Es. Band musicale"
                />
              </Field>

              <Field label="Categoria">
                <select
                  style={styles.select}
                  value={expenseForm.category}
                  onChange={(event) =>
                    setExpenseForm((form) => ({
                      ...form,
                      category: event.target.value,
                    }))
                  }
                >
                  {CATS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Stato">
                <select
                  style={styles.select}
                  value={expenseForm.stato}
                  onChange={(event) =>
                    setExpenseForm((form) => ({
                      ...form,
                      stato: event.target.value,
                    }))
                  }
                >
                  {STATI.map((stato) => (
                    <option key={stato.id} value={stato.id}>
                      {stato.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Costo unitario">
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseForm.unit_cost}
                  onChange={(event) =>
                    setExpenseForm((form) => ({
                      ...form,
                      unit_cost: event.target.value,
                    }))
                  }
                  placeholder="0,00"
                />
              </Field>

              <Field label="Quantità">
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  step="0.5"
                  value={expenseForm.qty}
                  onChange={(event) =>
                    setExpenseForm((form) => ({
                      ...form,
                      qty: event.target.value,
                    }))
                  }
                />
              </Field>

              {expenseForm.stato === "acconto" && (
                <>
                  <Field label="Acconto versato">
                    <input
                      style={styles.input}
                      type="number"
                      min="0"
                      step="0.01"
                      value={expenseForm.acconto_amount}
                      onChange={(event) =>
                        setExpenseForm((form) => ({
                          ...form,
                          acconto_amount: event.target.value,
                        }))
                      }
                      placeholder="0,00"
                    />
                  </Field>

                  <Field label="Data acconto">
                    <input
                      style={styles.input}
                      type="date"
                      value={expenseForm.acconto_date}
                      onChange={(event) =>
                        setExpenseForm((form) => ({
                          ...form,
                          acconto_date: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </>
              )}

              <Field label="Note">
                <input
                  style={styles.input}
                  value={expenseForm.notes}
                  onChange={(event) =>
                    setExpenseForm((form) => ({
                      ...form,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Note opzionali"
                />
              </Field>
            </div>

            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "16px",
                background: "#f3f4f6",
              }}
            >
              <div style={{ color: "#6b7280" }}>Totale voce</div>
              <strong style={{ fontSize: "24px" }}>{fmt(total)}</strong>
            </div>

            {error && (
              <p style={{ color: "#ff453a", marginTop: "14px" }}>{error}</p>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "18px",
                flexWrap: "wrap",
              }}
            >
              <Button variant="ghost" onClick={() => setView("dashboard")}>
                Annulla
              </Button>
              <Button onClick={saveExpense} disabled={saving}>
                {saving ? "Salvataggio..." : "Salva voce"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "gift-form") {
    const people =
      Number(giftForm.adults || 0) + Number(giftForm.children || 0);

    return (
      <div style={styles.page}>
        <div style={styles.wrap}>
          <Button variant="ghost" onClick={() => setView("dashboard")}>
            ← Torna alla dashboard
          </Button>

          <div style={{ height: "14px" }} />

          <div style={styles.card}>
            <h1 style={{ marginTop: 0 }}>
              {editingGiftId ? "Modifica regalo" : "Registra regalo"}
            </h1>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
              }}
            >
              <Field label="Nome ospite / famiglia">
                <input
                  style={styles.input}
                  value={giftForm.guest}
                  onChange={(event) =>
                    setGiftForm((form) => ({
                      ...form,
                      guest: event.target.value,
                    }))
                  }
                  placeholder="Es. Famiglia Rossi"
                />
              </Field>

              <Field label="Tipo regalo">
                <input
                  style={styles.input}
                  value={giftForm.description}
                  onChange={(event) =>
                    setGiftForm((form) => ({
                      ...form,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Busta, assegno..."
                />
              </Field>

              <Field label="Adulti">
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  value={giftForm.adults}
                  onChange={(event) =>
                    setGiftForm((form) => ({
                      ...form,
                      adults: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Bambini">
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  value={giftForm.children}
                  onChange={(event) =>
                    setGiftForm((form) => ({
                      ...form,
                      children: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Importo">
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={giftForm.amount}
                  onChange={(event) =>
                    setGiftForm((form) => ({
                      ...form,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="0,00"
                />
              </Field>

              <Field label="Data">
                <input
                  style={styles.input}
                  type="date"
                  value={giftForm.date}
                  onChange={(event) =>
                    setGiftForm((form) => ({
                      ...form,
                      date: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "16px",
                background: "#f3f4f6",
              }}
            >
              <div style={{ color: "#6b7280" }}>Totale persone</div>
              <strong style={{ fontSize: "24px" }}>{people}</strong>
            </div>

            {error && (
              <p style={{ color: "#ff453a", marginTop: "14px" }}>{error}</p>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "18px",
                flexWrap: "wrap",
              }}
            >
              <Button variant="ghost" onClick={() => setView("dashboard")}>
                Annulla
              </Button>
              <Button onClick={saveGift} disabled={saving}>
                {saving ? "Salvataggio..." : "Salva regalo"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const syncInfo =
    {
      synced: { label: "Sincronizzato", color: "#34c759" },
      connecting: { label: "Connessione...", color: "#ff9f0a" },
      offline: { label: "Offline", color: "#ff453a" },
    }[syncStatus] || { label: "Connessione...", color: "#ff9f0a" };

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <header
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "16px",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "34px",
                letterSpacing: "-0.055em",
              }}
            >
              Stefano & Giulia
            </h1>

            <div
              style={{
                marginTop: "7px",
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  background: syncInfo.color,
                }}
              />
              <span>{syncInfo.label}</span>
              <span>·</span>
              <span>28 agosto 2026</span>
              <span>·</span>
              <strong>{daysLeft} giorni</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {expenses.length === 0 && (
              <Button variant="secondary" onClick={seedData} disabled={saving}>
                {saving ? "Caricamento..." : "Carica dati iniziali"}
              </Button>
            )}
            <Button onClick={openAddExpense}>+ Spesa</Button>
            <Button variant="secondary" onClick={openAddGift}>
              + Regalo
            </Button>
          </div>
        </header>

        {error && (
          <div
            style={{
              ...styles.card,
              borderColor: "rgba(255,69,58,0.25)",
              background: "rgba(255,69,58,0.07)",
              color: "#b42318",
              marginBottom: "18px",
            }}
          >
            <strong>Errore:</strong> {error}
          </div>
        )}

        {loading ? (
          <div style={styles.card}>Connessione al database...</div>
        ) : (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              <Kpi
                label="Budget totale"
                value={fmtRound(stats.totalBudget)}
                color="#111827"
              />
              <Kpi
                label="Pagato"
                value={fmtRound(stats.totalPaid)}
                color="#34c759"
              />
              <Kpi
                label="Da pagare"
                value={fmtRound(stats.totalToPay)}
                color="#ff9f0a"
              />
           <Kpi
  label="Regali ricevuti"
  value={fmtRound(stats.totalGifts)}
  color="#bf5af2"
  sub={`${stats.totalPersons} persone`}
/>

<Kpi
  label="Media regalo per persona"
  value={fmtRound(stats.mediaPerPerson)}
  color="#007AFF"
  sub="Calcolata su adulti + bambini"
/>

<Kpi
  label="Saldo regali / budget"
  value={fmtRound(net)}
  color={net >= 0 ? "#34c759" : "#ff453a"}
  sub={net >= 0 ? "Surplus" : "Da coprire"}
/>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              <ChartCard
                title="Spese per categoria"
                data={stats.byCat}
                total={stats.totalBudget}
              />
              <ChartCard
                title="Stato pagamenti"
                data={stats.byStato}
                total={stats.totalBudget}
              />
            </section>

            <section style={styles.card}>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  borderBottom: "1px solid rgba(17,24,39,0.08)",
                  marginBottom: "16px",
                  overflowX: "auto",
                }}
              >
                {[
                  { id: "expenses", label: `Spese (${expenses.length})` },
                  { id: "gifts", label: `Regali (${gifts.length})` },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: "0 12px 12px",
                      fontWeight: tab === item.id ? 800 : 600,
                      color: tab === item.id ? ACCENT : "#6b7280",
                      borderBottom:
                        tab === item.id
                          ? `2px solid ${ACCENT}`
                          : "2px solid transparent",
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {tab === "expenses" && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: "10px",
                      marginBottom: "14px",
                    }}
                  >
                    <Field label="Categoria">
                      <select
                        style={styles.select}
                        value={filterCat}
                        onChange={(event) => setFilterCat(event.target.value)}
                      >
                        <option value="all">Tutte</option>
                        {CATS.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Stato">
                      <select
                        style={styles.select}
                        value={filterStato}
                        onChange={(event) =>
                          setFilterStato(event.target.value)
                        }
                      >
                        <option value="all">Tutti</option>
                        {STATI.map((stato) => (
                          <option key={stato.id} value={stato.id}>
                            {stato.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Ordina per">
                      <select
                        style={styles.select}
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                      >
                        <option value="category">Categoria</option>
                        <option value="total">Totale</option>
                        <option value="description">Nome</option>
                      </select>
                    </Field>

                    <Field label="Direzione">
                      <select
                        style={styles.select}
                        value={sortDir}
                        onChange={(event) => setSortDir(event.target.value)}
                      >
                        <option value="asc">Crescente</option>
                        <option value="desc">Decrescente</option>
                      </select>
                    </Field>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: "760px",
                      }}
                    >
                      <thead>
                        <tr style={{ color: "#6b7280", textAlign: "left" }}>
                          <th style={{ padding: "10px" }}>Voce</th>
                          <th style={{ padding: "10px" }}>Categoria</th>
                          <th style={{ padding: "10px" }}>Stato</th>
                          <th style={{ padding: "10px" }}>Unitario</th>
                          <th style={{ padding: "10px" }}>Qtà</th>
                          <th style={{ padding: "10px" }}>Totale</th>
                          <th style={{ padding: "10px" }} />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.map((item) => {
                          const cat = CAT_MAP[item.category] || CATS[0];
                          const total =
                            Number(item.unit_cost || 0) * Number(item.qty || 0);

                          return (
                            <tr
                              key={item.id}
                              style={{
                                borderTop: "1px solid rgba(17,24,39,0.08)",
                              }}
                            >
                              <td style={{ padding: "12px 10px" }}>
                                <strong>{item.description}</strong>
                                {item.notes && (
                                  <div
                                    style={{
                                      color: "#6b7280",
                                      fontSize: "13px",
                                      marginTop: "3px",
                                    }}
                                  >
                                    {item.notes}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                <span
                                  style={{
                                    color: cat.color,
                                    fontWeight: 800,
                                  }}
                                >
                                  {cat.label}
                                </span>
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                <StatusPill stato={item.stato} />
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                {fmt(item.unit_cost)}
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                {item.qty}
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                <strong>{fmt(total)}</strong>
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                <div style={{ display: "flex", gap: "7px" }}>
                                  <Button
                                    variant="secondary"
                                    onClick={() => openEditExpense(item)}
                                  >
                                    Mod
                                  </Button>
                                  <Button
                                    variant="danger"
                                    onClick={() => deleteExpense(item.id)}
                                  >
                                    Del
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {filteredExpenses.length === 0 && (
                      <p style={{ color: "#6b7280" }}>Nessuna voce trovata.</p>
                    )}
                  </div>
                </>
              )}

              {tab === "gifts" && (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "720px",
                    }}
                  >
                    <thead>
                      <tr style={{ color: "#6b7280", textAlign: "left" }}>
                        <th style={{ padding: "10px" }}>Ospite</th>
                        <th style={{ padding: "10px" }}>Tipo</th>
                        <th style={{ padding: "10px" }}>Persone</th>
                        <th style={{ padding: "10px" }}>Data</th>
                        <th style={{ padding: "10px" }}>Importo</th>
                        <th style={{ padding: "10px" }}>Media</th>
                        <th style={{ padding: "10px" }} />
                      </tr>
                    </thead>
                    <tbody>
                      {[...gifts]
                        .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
                        .map((item) => {
                          const people =
                            Number(item.adults || 0) +
                            Number(item.children || 0);
                          const average =
                            people > 0 ? Number(item.amount || 0) / people : 0;

                          return (
                            <tr
                              key={item.id}
                              style={{
                                borderTop: "1px solid rgba(17,24,39,0.08)",
                              }}
                            >
                              <td style={{ padding: "12px 10px" }}>
                                <strong>{item.guest}</strong>
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                {item.description}
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                {people || "—"}
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                {item.date || "—"}
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                <strong>{fmt(item.amount)}</strong>
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                {people > 0 ? `${fmtRound(average)}/pers` : "—"}
                              </td>
                              <td style={{ padding: "12px 10px" }}>
                                <div style={{ display: "flex", gap: "7px" }}>
                                  <Button
                                    variant="secondary"
                                    onClick={() => openEditGift(item)}
                                  >
                                    Mod
                                  </Button>
                                  <Button
                                    variant="danger"
                                    onClick={() => deleteGift(item.id)}
                                  >
                                    Del
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>

                  {gifts.length === 0 && (
                    <p style={{ color: "#6b7280" }}>
                      Nessun regalo ancora registrato.
                    </p>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}