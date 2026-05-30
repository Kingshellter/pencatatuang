"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Transaction {
  id: number;
  amount: number;
  description: string;
  type: "income" | "expense";
  createdAt: string;
}

const groupInt = (n: number) =>
  Math.abs(Math.round(n)).toLocaleString("en-US");

function rupiah(n: number, withSign = false) {
  const sign = n < 0 ? "−" : withSign ? "+" : "";
  return `${sign}Rp ${groupInt(n)}`;
}

function relTime(ts: string | number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const isYest = d.toDateString() === yest.toDateString();
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return `Today · ${time}`;
  if (isYest) return `Yesterday · ${time}`;
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " +
    time
  );
}

const Icon = {
  up: (p: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
  down: (p: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  ),
  trash: (p: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6" />
    </svg>
  ),
  wallet: (p: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M3 7a2 2 0 012-2h12a2 2 0 012 2M3 7v10a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2H5a2 2 0 01-2-2z" />
      <circle cx="17" cy="13" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  spark: (p: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M4 16l5-6 4 4 6-8" />
    </svg>
  ),
};

type TxType = "income" | "expense";

export default function Home() {
  const [tx, setTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TxType>("income");
  const [flash, setFlash] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const descRef = useRef<HTMLInputElement>(null);

  const fetchTx = async () => {
    try {
      const res = await fetch(`${API_BASE}/transactions`);
      const data: Transaction[] = await res.json();
      setTx(data);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTx();
  }, []);

  const income = useMemo(
    () =>
      tx
        .filter((x) => x.type === "income")
        .reduce((a, b) => a + b.amount, 0),
    [tx]
  );
  const expense = useMemo(
    () =>
      tx
        .filter((x) => x.type === "expense")
        .reduce((a, b) => a + b.amount, 0),
    [tx]
  );
  const balance = income - expense;

  const amountNum =
    parseInt(String(amount).replace(/\D/g, ""), 10) || 0;
  const canAdd = amountNum > 0 && !submitting;

  async function submit() {
    if (!canAdd) return;
    if (type === "expense" && amountNum > balance) {
      alert("Insufficient balance.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          description:
            desc.trim() || (type === "income" ? "Income" : "Expense"),
          type,
        }),
      });
      const entry: Transaction = await res.json();
      setTx((prev) => [entry, ...prev]);
      setFlash(entry.id);
      setTimeout(() => setFlash(null), 900);
      setDesc("");
      setAmount("");
      descRef.current?.focus();
    } catch (err) {
      console.error("Failed to add transaction", err);
      alert("Failed to add transaction.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: number) {
    const prev = tx;
    setTx((cur) => cur.filter((x) => x.id !== id));
    try {
      await fetch(`${API_BASE}/transactions/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete", err);
      setTx(prev);
    }
  }

  async function clearAll() {
    if (!confirm("Clear all transactions?")) return;
    const prev = tx;
    setTx([]);
    try {
      await Promise.all(
        prev.map((x) =>
          fetch(`${API_BASE}/transactions/${x.id}`, { method: "DELETE" })
        )
      );
    } catch (err) {
      console.error("Failed to clear", err);
      fetchTx();
    }
  }

  return (
    <div style={S.page}>
      <div style={S.shell}>
        <header style={S.header}>
          <div style={S.brand}>
            <div style={S.logo}>
              <Icon.wallet />
            </div>
            <div>
              <div style={S.brandName}>MoneyRecorder</div>
              <div style={S.brandSub}>Personal balance tracker</div>
            </div>
          </div>
          <div style={S.count} className="tnum">
            {tx.length} {tx.length === 1 ? "entry" : "entries"}
          </div>
        </header>

        <section style={S.hero}>
          <div style={S.heroGlow} />
          <div style={S.heroTop}>
            <span style={S.heroLabel}>Total Balance</span>
            <span style={S.heroBadge}>
              <Icon.spark style={{ color: "var(--accent)" }} /> Live
            </span>
          </div>
          <div style={S.heroAmount} className="tnum">
            {rupiah(balance)}
          </div>

          <div style={S.heroStats}>
            <Stat
              icon={<Icon.up />}
              tone="income"
              label="Income"
              value={income}
            />
            <div style={S.heroDivide} />
            <Stat
              icon={<Icon.down />}
              tone="expense"
              label="Expense"
              value={expense}
            />
          </div>
        </section>

        <div style={S.grid}>
          <section style={S.card}>
            <h2 style={S.cardTitle}>Record a transaction</h2>
            <p style={S.cardHint}>Log money coming in or going out.</p>

            <div style={S.seg}>
              <button
                onClick={() => setType("income")}
                style={{
                  ...S.segBtn,
                  ...(type === "income"
                    ? S.segOn("var(--income)")
                    : {}),
                }}
              >
                <Icon.up width="15" height="15" /> Income
              </button>
              <button
                onClick={() => setType("expense")}
                style={{
                  ...S.segBtn,
                  ...(type === "expense"
                    ? S.segOn("var(--expense)")
                    : {}),
                }}
              >
                <Icon.down width="15" height="15" /> Expense
              </button>
            </div>

            <label style={S.field}>
              <span style={S.fieldLab}>Description</span>
              <input
                ref={descRef}
                style={S.input}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="e.g. Lunch, Salary, Coffee"
              />
            </label>

            <label style={S.field}>
              <span style={S.fieldLab}>Amount</span>
              <div style={S.amountWrap}>
                <span style={S.rp}>Rp</span>
                <input
                  style={{ ...S.input, ...S.amountInput }}
                  inputMode="numeric"
                  className="tnum"
                  value={amount ? groupInt(amountNum) : ""}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/\D/g, ""))
                  }
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="0"
                />
              </div>
            </label>

            <button
              onClick={submit}
              disabled={!canAdd}
              style={{
                ...S.submit,
                background: canAdd ? `var(--${type})` : "var(--line)",
                color: canAdd ? "#fff" : "var(--faint)",
                cursor: canAdd ? "pointer" : "not-allowed",
                boxShadow: canAdd
                  ? `0 8px 20px color-mix(in oklch, var(--${type}) 32%, transparent)`
                  : "none",
              }}
            >
              {type === "income" ? "Add income" : "Add expense"}
              {canAdd ? `  ·  ${rupiah(amountNum, true)}` : ""}
            </button>
          </section>

          <section style={S.card}>
            <div style={S.histHead}>
              <h2 style={S.cardTitle}>History</h2>
              {tx.length > 0 && (
                <button style={S.clearBtn} onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>

            {loading ? (
              <div style={S.empty}>
                <div style={S.emptyText}>Loading…</div>
              </div>
            ) : tx.length === 0 ? (
              <div style={S.empty}>
                <div style={S.emptyIcon}>
                  <Icon.wallet width="26" height="26" />
                </div>
                <div style={S.emptyTitle}>No transactions yet</div>
                <div style={S.emptyText}>
                  Your recorded income and expenses will appear here.
                </div>
              </div>
            ) : (
              <div style={S.list}>
                {tx.map((x) => (
                  <Row
                    key={x.id}
                    x={x}
                    flash={flash === x.id}
                    onRemove={() => remove(x.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <footer style={S.footer}>Synced with your account.</footer>
      </div>
    </div>
  );
}

function Stat({
  icon,
  tone,
  label,
  value,
}: {
  icon: ReactNode;
  tone: TxType;
  label: string;
  value: number;
}) {
  return (
    <div style={S.stat}>
      <div
        style={{
          ...S.statIcon,
          color: `var(--${tone})`,
          background: `color-mix(in oklch, var(--${tone}) 16%, transparent)`,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={S.statLabel}>{label}</div>
        <div style={S.statValue} className="tnum">
          {rupiah(value)}
        </div>
      </div>
    </div>
  );
}

function Row({
  x,
  flash,
  onRemove,
}: {
  x: Transaction;
  flash: boolean;
  onRemove: () => void;
}) {
  const [hover, setHover] = useState(false);
  const inc = x.type === "income";
  return (
    <div
      style={{ ...S.row, ...(flash ? S.rowFlash : {}) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{
          ...S.rowIcon,
          color: `var(--${x.type})`,
          background: `color-mix(in oklch, var(--${x.type}) 14%, transparent)`,
        }}
      >
        {inc ? (
          <Icon.up width="16" height="16" />
        ) : (
          <Icon.down width="16" height="16" />
        )}
      </div>
      <div style={S.rowMid}>
        <div style={S.rowDesc}>{x.description}</div>
        <div style={S.rowTime} className="tnum">
          {relTime(x.createdAt)}
        </div>
      </div>
      <div
        style={{ ...S.rowAmt, color: `var(--${x.type})` }}
        className="tnum"
      >
        {inc ? "+" : "−"}Rp {groupInt(x.amount)}
      </div>
      <button
        onClick={onRemove}
        title="Delete"
        style={{ ...S.del, opacity: hover ? 1 : 0 }}
      >
        <Icon.trash />
      </button>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    padding: "44px 24px 64px",
    display: "flex",
    justifyContent: "center",
  },
  shell: { width: "100%", maxWidth: 1040 },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  brand: { display: "flex", alignItems: "center", gap: 13 },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 13,
    background: "var(--accent)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 6px 16px var(--accent-soft)",
  },
  brandName: { fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" },
  brandSub: { fontSize: 12.5, color: "var(--muted)", fontWeight: 500 },
  count: {
    fontSize: 13,
    color: "var(--muted)",
    fontWeight: 600,
    background: "var(--surface)",
    border: "1px solid var(--line)",
    padding: "7px 13px",
    borderRadius: 999,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    background: "var(--hero)",
    color: "#fff",
    borderRadius: "calc(var(--radius) + 6px)",
    padding: "30px 34px 26px",
    marginBottom: "var(--gap)",
    boxShadow: "0 24px 50px -28px rgba(16,18,40,0.6)",
  },
  heroGlow: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, var(--accent), transparent 68%)",
    opacity: 0.4,
    pointerEvents: "none",
  },
  heroTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  heroLabel: {
    fontSize: 13.5,
    fontWeight: 600,
    color: "rgba(255,255,255,0.62)",
    letterSpacing: "0.01em",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255,255,255,0.8)",
    background: "var(--hero-line)",
    padding: "5px 10px",
    borderRadius: 999,
  },
  heroAmount: {
    fontSize: 52,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.05,
    margin: "10px 0 22px",
    position: "relative",
  },
  heroStats: {
    display: "flex",
    alignItems: "stretch",
    gap: 0,
    position: "relative",
    borderTop: "1px solid var(--hero-line)",
    paddingTop: 18,
  },
  heroDivide: {
    width: 1,
    background: "var(--hero-line)",
    margin: "2px 0",
  },

  stat: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 16,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  statLabel: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.58)",
    fontWeight: 600,
  },
  statValue: {
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    marginTop: 1,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 0.82fr) minmax(0, 1fr)",
    gap: "var(--gap)",
    alignItems: "start",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "var(--radius)",
    padding: "24px 24px 26px",
    boxShadow: "0 1px 2px rgba(20,20,40,0.03)",
  },
  cardTitle: { fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" },
  cardHint: {
    fontSize: 13,
    color: "var(--muted)",
    marginTop: 4,
    marginBottom: 18,
    fontWeight: 500,
  },

  seg: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    background: "var(--bg)",
    border: "1px solid var(--line)",
    borderRadius: 14,
    padding: 5,
    marginBottom: 16,
  },
  segBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "10px 8px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    color: "var(--muted)",
    transition: "all .15s ease",
  },
  segOn: (c: string): CSSProperties => ({
    background: "var(--surface)",
    color: c,
    boxShadow: "0 1px 4px rgba(20,20,40,0.10)",
  }),

  field: { display: "block", marginBottom: 14 },
  fieldLab: {
    display: "block",
    fontSize: 12.5,
    fontWeight: 600,
    color: "var(--muted)",
    marginBottom: 7,
  },
  input: {
    width: "100%",
    padding: "13px 14px",
    fontSize: 15,
    fontWeight: 500,
    color: "var(--ink)",
    background: "var(--bg)",
    border: "1.5px solid var(--line)",
    borderRadius: 12,
    outline: "none",
    transition: "border-color .15s",
  },
  amountWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  rp: {
    position: "absolute",
    left: 14,
    fontSize: 15,
    fontWeight: 700,
    color: "var(--faint)",
    pointerEvents: "none",
  },
  amountInput: { paddingLeft: 42, fontWeight: 700, fontSize: 16 },

  submit: {
    width: "100%",
    marginTop: 8,
    padding: "14px 16px",
    borderRadius: 13,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    transition: "transform .12s ease, box-shadow .2s ease",
  },

  histHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  clearBtn: {
    fontSize: 12.5,
    fontWeight: 600,
    color: "var(--muted)",
    padding: "5px 10px",
    borderRadius: 8,
    border: "1px solid var(--line)",
  },

  list: { display: "flex", flexDirection: "column", gap: 4 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    padding: "11px 10px",
    borderRadius: 13,
    position: "relative",
    transition: "background .15s",
  },
  rowFlash: { background: "var(--accent-soft)" },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  rowMid: { flex: 1, minWidth: 0 },
  rowDesc: {
    fontSize: 14.5,
    fontWeight: 600,
    color: "var(--ink)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  rowTime: {
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 500,
    marginTop: 1,
  },
  rowAmt: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    flexShrink: 0,
  },
  del: {
    width: 30,
    height: 30,
    borderRadius: 8,
    display: "grid",
    placeItems: "center",
    color: "var(--faint)",
    flexShrink: 0,
    transition: "opacity .15s, color .15s, background .15s",
  },

  empty: { textAlign: "center", padding: "38px 20px 30px" },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    background: "var(--bg)",
    border: "1px solid var(--line)",
    color: "var(--faint)",
    display: "grid",
    placeItems: "center",
    margin: "0 auto 16px",
  },
  emptyTitle: { fontSize: 15, fontWeight: 700, color: "var(--ink)" },
  emptyText: {
    fontSize: 13,
    color: "var(--muted)",
    marginTop: 5,
    maxWidth: 240,
    marginInline: "auto",
    lineHeight: 1.5,
  },

  footer: {
    textAlign: "center",
    fontSize: 12.5,
    color: "var(--faint)",
    fontWeight: 500,
    marginTop: 26,
  },
} satisfies Record<string, CSSProperties | ((c: string) => CSSProperties)>;
