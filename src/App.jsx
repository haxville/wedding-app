import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase.js";

const APP_PASSWORD = "sposi2026";
const WEDDING_DATE = new Date("2026-08-28");
const TODAY = new Date().toISOString().slice(0, 10);

const CATS = [
  { id: "catering", label: "Catering", color: "#FF9F0A" },
  { id: "allestimenti", label: "Allestimenti", color: "#34C759" },
  { id: "intrattenimento", label: "Intrattenimento", color: "#AF52DE" },
  { id: "inviti_ospiti", label: "Inviti e Ospiti", color: "#32ADE6" },
  { id: "extra", label: "Extra", color: "#FF3B30" },
];

const STATI = [
  { id: "pagato", label: "Pagato", color: "#34C759" },
  { id: "acconto", label: "Acconto", color: "#FF9500" },
  { id: "da_pagare", label: "Da pagare", color: "#FF9F0A" },
  { id: "da_definire", label: "Da definire", color: "#FF3B30" },
  { id: "incluso", label: "Incluso", color: "#8E8E93" },
];

const CAT_MAP = Object.fromEntries(CATS.map((c) => [c.id, c]));
const STATO_MAP = Object.fromEntries(STATI.map((s) => [s.id, s]));

const SAMPLE_EXPENSES = [
  { id: "e1", category: "catering", description: "Ristorante Adulti", unit_cost: 95, qty: 100, notes: "116 ivato a persona", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e2", category: "catering", description: "Ristorante Bambini 50%", unit_cost: 44.5, qty: 10, notes: "55 ivato a persona", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e3", category: "catering", description: "Ristorante Staff", unit_cost: 50, qty: 7, notes: "", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e4", category: "catering", description: "Open Bar", unit_cost: 10, qty: 100, notes: "10 ivato a persona", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e5", category: "catering", description: "Buffet Dolci", unit_cost: 10, qty: 100, notes: "12,20 ivato a persona", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e6", category: "catering", description: "Brunch Sabato", unit_cost: 29, qty: 70, notes: "35 ivato a persona", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e7", category: "allestimenti", description: "Fiori", unit_cost: 2150, qty: 1, notes: "", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e8", category: "allestimenti", description: "Allestimenti Brunch", unit_cost: 500, qty: 1, notes: "", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e9", category: "intrattenimento", description: "Band", unit_cost: 2600, qty: 1, notes: "", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e10", category: "intrattenimento", description: "Fotografo", unit_cost: 1600, qty: 1, notes: "", stato: "pagato", acconto_amount: "", acconto_date: "" },
  { id: "e11", category: "inviti_ospiti", description: "Partecipazioni / Casa Ciao", unit_cost: 686.86, qty: 1, notes: "", stato: "pagato", acconto_amount: "", acconto_date: "" },
  { id: "e12", category: "inviti_ospiti", description: "Bomboniere", unit_cost: 10, qty: 50, notes: "", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e13", category: "inviti_ospiti", description: "Regalo camere testimoni", unit_cost: 250, qty: 8, notes: "", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e14", category: "extra", description: "Confettata Miani", unit_cost: 197, qty: 1, notes: "", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e15", category: "catering", description: "Vino Extra", unit_cost: 1000, qty: 1, notes: "", stato: "da_pagare", acconto_amount: "", acconto_date: "" },
  { id: "e16", category: "extra", description: "Fedi", unit_cost: 750, qty: 1, notes: "", stato: "pagato", acconto_amount: "", acconto_date: "" },
];

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

function AppStyles() {
  return (
    <style>{`
      :root {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
        color: #111827;
        background: #F5F5F7;
      }

      * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }

      body {
        margin: 0;
        background: #F5F5F7;
      }

      button, input, select, textarea {
        font-family: inherit;
      }

      .app {
        min-height: 100vh;
        padding: 18px 14px 96px;
        background:
          radial-gradient(circle at top left, rgba(0, 122, 255, 0.12), transparent 34%),
          linear-gradient(180deg, #FBFBFD 0%, #F5F5F7 42%, #EFEFF4 100%);
      }

      .wrap {
        width: 100%;
        max-width: 980px;
        margin: 0 auto;
      }

      .topbar {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 18px;
      }

      .eyebrow {
        color: #6B7280;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .title {
        margin: 0;
        font-size: 32px;
        line-height: 1.02;
        letter-spacing: -0.06em;
        font-weight: 850;
      }

      .subtitle {
        margin-top: 8px;
        display: flex;
        align-items: center;
        gap: 7px;
        flex-wrap: wrap;
        color: #6B7280;
        font-size: 14px;
      }

      .sync-dot {
        width: 8px;
        height: 8px;
        border-radius: 99px;
        display: inline-block;
      }

      .glass {
        background: rgba(255, 255, 255, 0.82);
        border: 1px solid rgba(0, 0, 0, 0.06);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
      }

      .hero {
        border-radius: 32px;
        padding: 22px;
        margin-bottom: 14px;
      }

      .hero-label {
        color: #6B7280;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .hero-value {
        font-size: 44px;
        line-height: 1;
        letter-spacing: -0.075em;
        font-weight: 900;
        margin: 8px 0 16px;
      }

      .hero-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .mini-box {
        background: #F5F5F7;
        border-radius: 20px;
        padding: 12px;
      }

      .mini-label {
        font-size: 12px;
        color: #6B7280;
        margin-bottom: 4px;
        font-weight: 650;
      }

      .mini-value {
        font-size: 17px;
        font-weight: 850;
        letter-spacing: -0.04em;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }

      .stat {
        border-radius: 24px;
        padding: 17px;
      }

      .stat-label {
        font-size: 12px;
        color: #6B7280;
        font-weight: 750;
        text-transform: uppercase;
        letter-spacing: 0.045em;
        margin-bottom: 9px;
      }

      .stat-value {
        font-size: 25px;
        font-weight: 900;
        letter-spacing: -0.055em;
      }

      .stat-sub {
        color: #6B7280;
        font-size: 13px;
        margin-top: 5px;
      }

      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 22px 0 10px;
      }

      .section-title {
        margin: 0;
        font-size: 22px;
        letter-spacing: -0.045em;
      }

      .list {
        display: grid;
        gap: 10px;
      }

      .item-card {
        border-radius: 24px;
        padding: 16px;
      }

      .item-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .item-title {
        font-size: 17px;
        font-weight: 850;
        letter-spacing: -0.025em;
        margin-bottom: 5px;
      }

      .item-meta {
        color: #6B7280;
        font-size: 13px;
        line-height: 1.35;
      }

      .item-amount {
        font-size: 21px;
        font-weight: 900;
        letter-spacing: -0.045em;
        text-align: right;
        white-space: nowrap;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 6px 9px;
        font-size: 12px;
        font-weight: 800;
        margin-top: 10px;
      }

      .pill-dot {
        width: 7px;
        height: 7px;
        border-radius: 99px;
      }

      .actions {
        display: flex;
        gap: 8px;
        margin-top: 13px;
      }

      .btn {
        border: 0;
        min-height: 44px;
        border-radius: 999px;
        padding: 0 16px;
        font-size: 15px;
        font-weight: 800;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
      }

      .btn-primary {
        background: #007AFF;
        color: white;
        box-shadow: 0 10px 24px rgba(0, 122, 255, 0.22);
      }

      .btn-soft {
        background: rgba(0, 122, 255, 0.11);
        color: #007AFF;
      }

      .btn-danger {
        background: rgba(255, 59, 48, 0.11);
        color: #FF3B30;
      }

      .btn-ghost {
        background: transparent;
        color: #6B7280;
      }

      .input, .select {
        width: 100%;
        min-height: 48px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.95);
        padding: 0 14px;
        font-size: 16px;
        outline: none;
        color: #111827;
      }

      textarea.input {
        min-height: 84px;
        padding-top: 13px;
        resize: vertical;
      }

      .field {
        display: grid;
        gap: 7px;
      }

      .field label {
        font-size: 12px;
        font-weight: 800;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: 0.055em;
      }

      .form-grid {
        display: grid;
        gap: 13px;
      }

      .filter-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }

      .bottom-nav {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: 12px;
        z-index: 20;
        max-width: 520px;
        margin: 0 auto;
        padding: 8px;
        border-radius: 28px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
      }

      .nav-btn {
        border: 0;
        border-radius: 21px;
        min-height: 50px;
        background: transparent;
        color: #6B7280;
        display: grid;
        place-items: center;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
      }

      .nav-btn span {
        font-size: 20px;
        line-height: 1;
        margin-bottom: 2px;
      }

      .nav-active {
        background: #111827;
        color: white;
      }

      .empty {
        border-radius: 24px;
        padding: 22px;
        text-align: center;
        color: #6B7280;
      }

      .error {
        border-radius: 22px;
        padding: 14px;
        background: rgba(255, 59, 48, 0.09);
        color: #B42318;
        margin-bottom: 12px;
        font-weight: 650;
      }

      .password-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 20px;
        background:
          radial-gradient(circle at top, rgba(0, 122, 255, 0.16), transparent 34%),
          linear-gradient(180deg, #FBFBFD 0%, #F5F5F7 100%);
      }

      .password-card {
        width: 100%;
        max-width: 410px;
        border-radius: 32px;
        padding: 26px;
        text-align: center;
      }

      .logo {
        width: 68px;
        height: 68px;
        border-radius: 22px;
        background: #007AFF;
        color: white;
        display: grid;
        place-items: center;
        font-size: 24px;
        font-weight: 900;
        margin: 0 auto 16px;
        box-shadow: 0 16px 28px rgba(0, 122, 255, 0.26);
      }

      @media (min-width: 760px) {
        .app {
          padding-top: 34px;
        }

        .hero-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .desktop-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .form-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .bottom-nav {
          max-width: 620px;
        }
      }
    `}</style>
  );
}

function Button({ children, onClick, variant = "primary", disabled = false, type = "button" }) {
  const cls =
    variant === "danger"
      ? "btn btn-danger"
      : variant === "soft"
      ? "btn btn-soft"
      : variant === "ghost"
      ? "btn btn-ghost"
      : "btn btn-primary";

  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function checkPassword() {
    if (password === APP_PASSWORD) {
      localStorage.setItem("wed_auth", APP_PASSWORD);
      onUnlock();
      return;
    }

    setError(true);
    setPassword("");
    setTimeout(() => setError(false), 1800);
  }

  return (
    <>
      <AppStyles />
      <main className="password-page">
        <section className="password-card glass">
          <div className="logo">S&G</div>
          <h1 className="title">Stefano & Giulia</h1>
          <p className="subtitle" style={{ justifyContent: "center" }}>
            28 agosto 2026 · Mare, Cesenatico
          </p>

          <div style={{ height: 22 }} />

          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") checkPassword();
            }}
            style={{
              textAlign: "center",
              borderColor: error ? "#FF3B30" : undefined,
            }}
          />

          {error && (
            <p style={{ color: "#FF3B30", fontWeight: 700 }}>
              Password errata
            </p>
          )}

          <div style={{ height: 12 }} />
          <Button onClick={checkPassword}>Entra</Button>
        </section>
      </main>
    </>
  );
}

function StatCard({ label, value, sub, color = "#111827" }) {
  return (
    <div className="stat glass">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>
        {value}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function Pill({ stato }) {
  const item = STATO_MAP[stato] || STATO_MAP.da_pagare;

  return (
    <span
      className="pill"
      style={{
        color: item.color,
        background: `${item.color}17`,
      }}
    >
      <span className="pill-dot" style={{ background: item.color }} />
      {item.label}
    </span>
  );
}

function BottomNav({ screen, setScreen, onAdd }) {
  return (
    <nav className="bottom-nav glass">
      <button
        className={`nav-btn ${screen === "dashboard" ? "nav-active" : ""}`}
        onClick={() => setScreen("dashboard")}
      >
        <span>⌂</span>
        Home
      </button>

      <button
        className={`nav-btn ${screen === "expenses" ? "nav-active" : ""}`}
        onClick={() => setScreen("expenses")}
      >
        <span>☷</span>
        Spese
      </button>

      <button
        className={`nav-btn ${screen === "gifts" ? "nav-active" : ""}`}
        onClick={() => setScreen("gifts")}
      >
        <span>♡</span>
        Regali
      </button>

      <button className="nav-btn nav-active" onClick={onAdd}>
        <span>＋</span>
        Nuovo
      </button>
    </nav>
  );
}

function ExpenseCard({ item, onEdit, onDelete }) {
  const cat = CAT_MAP[item.category] || CATS[0];
  const total = Number(item.unit_cost || 0) * Number(item.qty || 0);

  return (
    <article className="item-card glass">
      <div className="item-top">
        <div>
          <div className="item-title">{item.description}</div>
          <div className="item-meta">
            <span style={{ color: cat.color, fontWeight: 800 }}>
              {cat.label}
            </span>{" "}
            · {item.qty} × {fmt(item.unit_cost)}
          </div>
          {item.notes && <div className="item-meta">{item.notes}</div>}
          <Pill stato={item.stato} />
        </div>

        <div className="item-amount">{fmtRound(total)}</div>
      </div>

      <div className="actions">
        <Button variant="soft" onClick={() => onEdit(item)}>
          Modifica
        </Button>
        <Button variant="danger" onClick={() => onDelete(item.id)}>
          Elimina
        </Button>
      </div>
    </article>
  );
}

function GiftCard({ item, onEdit, onDelete }) {
  const people = Number(item.adults || 0) + Number(item.children || 0);
  const average = people > 0 ? Number(item.amount || 0) / people : 0;

  return (
    <article className="item-card glass">
      <div className="item-top">
        <div>
          <div className="item-title">{item.guest}</div>
          <div className="item-meta">
            {item.description || "Busta"} · {people || 0} persone
          </div>
          <div className="item-meta">
            Media: {people > 0 ? `${fmtRound(average)} / persona` : "—"}
          </div>
          {item.date && <div className="item-meta">{item.date}</div>}
        </div>

        <div className="item-amount">{fmtRound(item.amount)}</div>
      </div>

      <div className="actions">
        <Button variant="soft" onClick={() => onEdit(item)}>
          Modifica
        </Button>
        <Button variant="danger" onClick={() => onDelete(item.id)}>
          Elimina
        </Button>
      </div>
    </article>
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

  const [screen, setScreen] = useState("dashboard");
  const [expenses, setExpenses] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState("connecting");

  const [filterCat, setFilterCat] = useState("all");
  const [filterStato, setFilterStato] = useState("all");

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

    if (expensesResponse.error) throw expensesResponse.error;
    if (giftsResponse.error) throw giftsResponse.error;

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
      .finally(() => setLoading(false));
  }, [unlocked, loadData]);

  useEffect(() => {
    if (!unlocked) return;

    const channel = supabase
      .channel("wedding-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => loadData().catch(console.error)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gifts" },
        () => loadData().catch(console.error)
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

  const stats = useMemo(() => {
    const totalBudget = expenses.reduce(
      (sum, item) => sum + Number(item.unit_cost || 0) * Number(item.qty || 0),
      0
    );

    const totalPaid = expenses.reduce((sum, item) => {
      const total = Number(item.unit_cost || 0) * Number(item.qty || 0);
      if (item.stato === "pagato") return sum + total;
      if (item.stato === "acconto") return sum + Number(item.acconto_amount || 0);
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
      (sum, item) => sum + Number(item.adults || 0) + Number(item.children || 0),
      0
    );

    const mediaPerPerson = totalPersons > 0 ? totalGifts / totalPersons : 0;
    const net = totalGifts - totalBudget;
    const paidPercent = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;

    return {
      totalBudget,
      totalPaid,
      totalToPay,
      totalGifts,
      totalPersons,
      mediaPerPerson,
      net,
      paidPercent,
    };
  }, [expenses, gifts]);

  const filteredExpenses = useMemo(() => {
    return [...expenses]
      .filter((item) => {
        if (filterCat !== "all" && item.category !== filterCat) return false;
        if (filterStato !== "all" && item.stato !== filterStato) return false;
        return true;
      })
      .sort((a, b) => {
        const totalA = Number(a.unit_cost || 0) * Number(a.qty || 0);
        const totalB = Number(b.unit_cost || 0) * Number(b.qty || 0);
        return totalB - totalA;
      });
  }, [expenses, filterCat, filterStato]);

  const recentExpenses = useMemo(() => filteredExpenses.slice(0, 5), [filteredExpenses]);
  const recentGifts = useMemo(
    () => [...gifts].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0)).slice(0, 5),
    [gifts]
  );

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
    setScreen("expense-form");
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
    setScreen("expense-form");
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
        expenseForm.stato === "acconto" ? expenseForm.acconto_amount || "" : "",
      acconto_date:
        expenseForm.stato === "acconto" ? expenseForm.acconto_date || "" : "",
    };

    try {
      const { error: upsertError } = await supabase.from("expenses").upsert(item);
      if (upsertError) throw upsertError;

      await loadData();
      setScreen("expenses");
      setEditingExpenseId(null);
      setExpenseForm(emptyExpense());
    } catch (err) {
      console.error(err);
      setError(err.message || "Errore salvataggio spesa");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(id) {
    if (!window.confirm("Eliminare questa voce di spesa?")) return;

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
    setScreen("gift-form");
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
    setScreen("gift-form");
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
      const { error: upsertError } = await supabase.from("gifts").upsert(item);
      if (upsertError) throw upsertError;

      await loadData();
      setScreen("gifts");
      setEditingGiftId(null);
      setGiftForm(emptyGift());
    } catch (err) {
      console.error(err);
      setError(err.message || "Errore salvataggio regalo");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGift(id) {
    if (!window.confirm("Eliminare questo regalo?")) return;

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

  const syncInfo =
    {
      synced: { label: "Sincronizzato", color: "#34C759" },
      connecting: { label: "Connessione...", color: "#FF9500" },
      offline: { label: "Offline", color: "#FF3B30" },
    }[syncStatus] || { label: "Connessione...", color: "#FF9500" };

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  const showNav = !["expense-form", "gift-form"].includes(screen);

  return (
    <>
      <AppStyles />

      <main className="app">
        <div className="wrap">
          <header className="topbar">
            <div>
              <div className="eyebrow">Wedding budget</div>
              <h1 className="title">Stefano & Giulia</h1>
              <div className="subtitle">
                <span
                  className="sync-dot"
                  style={{ background: syncInfo.color }}
                />
                <span>{syncInfo.label}</span>
                <span>·</span>
                <span>{daysLeft} giorni</span>
              </div>
            </div>

            {expenses.length === 0 && screen === "dashboard" && (
              <Button variant="soft" onClick={seedData} disabled={saving}>
                Dati iniziali
              </Button>
            )}
          </header>

          {error && <div className="error">{error}</div>}

          {loading ? (
            <div className="hero glass">Connessione al database...</div>
          ) : (
            <>
              {screen === "dashboard" && (
                <>
                  <section className="hero glass">
                    <div className="hero-label">Budget totale</div>
                    <div className="hero-value">{fmtRound(stats.totalBudget)}</div>

                    <div className="hero-grid">
                      <div className="mini-box">
                        <div className="mini-label">Pagato</div>
                        <div className="mini-value" style={{ color: "#34C759" }}>
                          {fmtRound(stats.totalPaid)}
                        </div>
                      </div>

                      <div className="mini-box">
                        <div className="mini-label">Da pagare</div>
                        <div className="mini-value" style={{ color: "#FF9500" }}>
                          {fmtRound(stats.totalToPay)}
                        </div>
                      </div>

                      <div className="mini-box">
                        <div className="mini-label">Avanzamento</div>
                        <div className="mini-value">{stats.paidPercent}%</div>
                      </div>
                    </div>
                  </section>

                  <section className="grid">
                    <StatCard
                      label="Regali ricevuti"
                      value={fmtRound(stats.totalGifts)}
                      sub={`${stats.totalPersons} persone`}
                      color="#AF52DE"
                    />

                    <StatCard
                      label="Media persona"
                      value={fmtRound(stats.mediaPerPerson)}
                      sub="Adulti + bambini"
                      color="#007AFF"
                    />

                    <StatCard
                      label="Saldo finale"
                      value={fmtRound(stats.net)}
                      sub={stats.net >= 0 ? "Surplus" : "Da coprire"}
                      color={stats.net >= 0 ? "#34C759" : "#FF3B30"}
                    />

                    <StatCard
                      label="Giorni mancanti"
                      value={daysLeft}
                      sub="al matrimonio"
                      color="#111827"
                    />
                  </section>

                  <div className="desktop-2">
                    <section>
                      <div className="section-head">
                        <h2 className="section-title">Ultime spese</h2>
                        <Button variant="ghost" onClick={() => setScreen("expenses")}>
                          Vedi tutto
                        </Button>
                      </div>

                      <div className="list">
                        {recentExpenses.length === 0 ? (
                          <div className="empty glass">Nessuna spesa inserita.</div>
                        ) : (
                          recentExpenses.map((item) => (
                            <ExpenseCard
                              key={item.id}
                              item={item}
                              onEdit={openEditExpense}
                              onDelete={deleteExpense}
                            />
                          ))
                        )}
                      </div>
                    </section>

                    <section>
                      <div className="section-head">
                        <h2 className="section-title">Ultimi regali</h2>
                        <Button variant="ghost" onClick={() => setScreen("gifts")}>
                          Vedi tutto
                        </Button>
                      </div>

                      <div className="list">
                        {recentGifts.length === 0 ? (
                          <div className="empty glass">Nessun regalo registrato.</div>
                        ) : (
                          recentGifts.map((item) => (
                            <GiftCard
                              key={item.id}
                              item={item}
                              onEdit={openEditGift}
                              onDelete={deleteGift}
                            />
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                </>
              )}

              {screen === "expenses" && (
                <>
                  <div className="section-head">
                    <h2 className="section-title">Spese</h2>
                    <Button onClick={openAddExpense}>+ Spesa</Button>
                  </div>

                  <div className="filter-row">
                    <select
                      className="select"
                      value={filterCat}
                      onChange={(e) => setFilterCat(e.target.value)}
                    >
                      <option value="all">Tutte</option>
                      {CATS.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>

                    <select
                      className="select"
                      value={filterStato}
                      onChange={(e) => setFilterStato(e.target.value)}
                    >
                      <option value="all">Tutti</option>
                      {STATI.map((stato) => (
                        <option key={stato.id} value={stato.id}>
                          {stato.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="list">
                    {filteredExpenses.length === 0 ? (
                      <div className="empty glass">Nessuna voce trovata.</div>
                    ) : (
                      filteredExpenses.map((item) => (
                        <ExpenseCard
                          key={item.id}
                          item={item}
                          onEdit={openEditExpense}
                          onDelete={deleteExpense}
                        />
                      ))
                    )}
                  </div>
                </>
              )}

              {screen === "gifts" && (
                <>
                  <div className="section-head">
                    <h2 className="section-title">Regali</h2>
                    <Button onClick={openAddGift}>+ Regalo</Button>
                  </div>

                  <section className="grid">
                    <StatCard
                      label="Totale regali"
                      value={fmtRound(stats.totalGifts)}
                      sub={`${stats.totalPersons} persone`}
                      color="#AF52DE"
                    />
                    <StatCard
                      label="Media persona"
                      value={fmtRound(stats.mediaPerPerson)}
                      sub="Calcolo automatico"
                      color="#007AFF"
                    />
                  </section>

                  <div className="list">
                    {gifts.length === 0 ? (
                      <div className="empty glass">Nessun regalo registrato.</div>
                    ) : (
                      [...gifts]
                        .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
                        .map((item) => (
                          <GiftCard
                            key={item.id}
                            item={item}
                            onEdit={openEditGift}
                            onDelete={deleteGift}
                          />
                        ))
                    )}
                  </div>
                </>
              )}

              {screen === "expense-form" && (
                <>
                  <Button variant="ghost" onClick={() => setScreen("expenses")}>
                    ← Torna alle spese
                  </Button>

                  <div style={{ height: 12 }} />

                  <section className="hero glass">
                    <h2 className="section-title">
                      {editingExpenseId ? "Modifica spesa" : "Nuova spesa"}
                    </h2>

                    <div style={{ height: 18 }} />

                    <div className="form-grid">
                      <Field label="Descrizione">
                        <input
                          className="input"
                          value={expenseForm.description}
                          onChange={(e) =>
                            setExpenseForm((f) => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Es. Band, fiori, open bar"
                        />
                      </Field>

                      <Field label="Categoria">
                        <select
                          className="select"
                          value={expenseForm.category}
                          onChange={(e) =>
                            setExpenseForm((f) => ({
                              ...f,
                              category: e.target.value,
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
                          className="select"
                          value={expenseForm.stato}
                          onChange={(e) =>
                            setExpenseForm((f) => ({
                              ...f,
                              stato: e.target.value,
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
                          className="input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={expenseForm.unit_cost}
                          onChange={(e) =>
                            setExpenseForm((f) => ({
                              ...f,
                              unit_cost: e.target.value,
                            }))
                          }
                        />
                      </Field>

                      <Field label="Quantità">
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="0.5"
                          value={expenseForm.qty}
                          onChange={(e) =>
                            setExpenseForm((f) => ({
                              ...f,
                              qty: e.target.value,
                            }))
                          }
                        />
                      </Field>

                      {expenseForm.stato === "acconto" && (
                        <>
                          <Field label="Acconto versato">
                            <input
                              className="input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={expenseForm.acconto_amount}
                              onChange={(e) =>
                                setExpenseForm((f) => ({
                                  ...f,
                                  acconto_amount: e.target.value,
                                }))
                              }
                            />
                          </Field>

                          <Field label="Data acconto">
                            <input
                              className="input"
                              type="date"
                              value={expenseForm.acconto_date}
                              onChange={(e) =>
                                setExpenseForm((f) => ({
                                  ...f,
                                  acconto_date: e.target.value,
                                }))
                              }
                            />
                          </Field>
                        </>
                      )}

                      <Field label="Note">
                        <textarea
                          className="input"
                          value={expenseForm.notes}
                          onChange={(e) =>
                            setExpenseForm((f) => ({
                              ...f,
                              notes: e.target.value,
                            }))
                          }
                          placeholder="Note opzionali"
                        />
                      </Field>
                    </div>

                    <div style={{ height: 18 }} />

                    <StatCard
                      label="Totale voce"
                      value={fmt(
                        Number(expenseForm.unit_cost || 0) *
                          Number(expenseForm.qty || 0)
                      )}
                      color="#111827"
                    />

                    <div style={{ height: 16 }} />

                    <Button onClick={saveExpense} disabled={saving}>
                      {saving ? "Salvataggio..." : "Salva spesa"}
                    </Button>
                  </section>
                </>
              )}

              {screen === "gift-form" && (
                <>
                  <Button variant="ghost" onClick={() => setScreen("gifts")}>
                    ← Torna ai regali
                  </Button>

                  <div style={{ height: 12 }} />

                  <section className="hero glass">
                    <h2 className="section-title">
                      {editingGiftId ? "Modifica regalo" : "Nuovo regalo"}
                    </h2>

                    <div style={{ height: 18 }} />

                    <div className="form-grid">
                      <Field label="Ospite / Famiglia">
                        <input
                          className="input"
                          value={giftForm.guest}
                          onChange={(e) =>
                            setGiftForm((f) => ({
                              ...f,
                              guest: e.target.value,
                            }))
                          }
                          placeholder="Es. Famiglia Rossi"
                        />
                      </Field>

                      <Field label="Tipo regalo">
                        <input
                          className="input"
                          value={giftForm.description}
                          onChange={(e) =>
                            setGiftForm((f) => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Busta, assegno..."
                        />
                      </Field>

                      <Field label="Importo">
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={giftForm.amount}
                          onChange={(e) =>
                            setGiftForm((f) => ({
                              ...f,
                              amount: e.target.value,
                            }))
                          }
                        />
                      </Field>

                      <Field label="Data">
                        <input
                          className="input"
                          type="date"
                          value={giftForm.date}
                          onChange={(e) =>
                            setGiftForm((f) => ({
                              ...f,
                              date: e.target.value,
                            }))
                          }
                        />
                      </Field>

                      <Field label="Adulti">
                        <input
                          className="input"
                          type="number"
                          min="0"
                          value={giftForm.adults}
                          onChange={(e) =>
                            setGiftForm((f) => ({
                              ...f,
                              adults: e.target.value,
                            }))
                          }
                        />
                      </Field>

                      <Field label="Bambini">
                        <input
                          className="input"
                          type="number"
                          min="0"
                          value={giftForm.children}
                          onChange={(e) =>
                            setGiftForm((f) => ({
                              ...f,
                              children: e.target.value,
                            }))
                          }
                        />
                      </Field>
                    </div>

                    <div style={{ height: 18 }} />

                    <StatCard
                      label="Media per persona"
                      value={fmtRound(
                        Number(giftForm.amount || 0) /
                          Math.max(
                            1,
                            Number(giftForm.adults || 0) +
                              Number(giftForm.children || 0)
                          )
                      )}
                      color="#007AFF"
                    />

                    <div style={{ height: 16 }} />

                    <Button onClick={saveGift} disabled={saving}>
                      {saving ? "Salvataggio..." : "Salva regalo"}
                    </Button>
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </main>

      {showNav && (
        <BottomNav
          screen={screen}
          setScreen={setScreen}
          onAdd={() => {
            if (screen === "gifts") openAddGift();
            else openAddExpense();
          }}
        />
      )}
    </>
  );
}