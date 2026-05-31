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

type TxType = "income" | "expense";

interface Transaction {
  id: number;
  amount: number;
  description: string;
  type: TxType;
  category: string | null;
  createdAt: string;
}

interface Category {
  id: string;
  label: string;
  color: string;
}

const CATS: Record<TxType, Category[]> = {
  income: [
    { id: "salary", label: "Salary", color: "#0f9d76" },
    { id: "business", label: "Business", color: "#0e8a8a" },
    { id: "gift", label: "Gift", color: "#7a5ae0" },
    { id: "other-in", label: "Other", color: "#7c8598" },
  ],
  expense: [
    { id: "food", label: "Food & Drink", color: "#e0791f" },
    { id: "transport", label: "Transport", color: "#3b82f6" },
    { id: "shopping", label: "Shopping", color: "#a855f7" },
    { id: "bills", label: "Bills", color: "#ef4444" },
    { id: "fun", label: "Entertainment", color: "#ec4899" },
    { id: "health", label: "Health", color: "#10b981" },
    { id: "other-out", label: "Other", color: "#7c8598" },
  ],
};
const ALL_CATS = [...CATS.income, ...CATS.expense];

function catOf(x: Transaction): Category {
  const found = ALL_CATS.find((c) => c.id === x.category);
  if (found) return found;
  return x.type === "income" ? CATS.income[3] : CATS.expense[6];
}

const groupInt = (n: number) =>
  Math.abs(Math.round(n)).toLocaleString("en-US");

function rupiah(n: number, withSign = false) {
  const sign = n < 0 ? "−" : withSign ? "+" : "";
  return `${sign}Rp ${groupInt(n)}`;
}

function compact(n: number) {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(a % 1e9 === 0 ? 0 : 1) + "B";
  if (a >= 1e6) return (n / 1e6).toFixed(a % 1e6 === 0 ? 0 : 1) + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(a % 1e3 === 0 ? 0 : 1) + "k";
  return String(Math.round(n));
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
  chevron: (p: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  pie: (p: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M12 3a9 9 0 109 9h-9V3z" />
      <path d="M12 3v9h9" opacity="0.45" />
    </svg>
  ),
};

function hexA(hex: string, a: number) {
  if (/^#([0-9a-f]{6})$/i.test(hex)) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  return `color-mix(in oklch, ${hex} ${a * 100}%, transparent)`;
}

interface Period {
  y: number;
  m: number;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export default function Home() {
  const [tx, setTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TxType>("income");
  const [cat, setCat] = useState<string>(CATS.income[0].id);
  const [flash, setFlash] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const now = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState<Period | null>({
    y: now.getFullYear(),
    m: now.getMonth(),
  });
  const descRef = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  useEffect(() => {
    const list = CATS[type];
    if (!list.find((c) => c.id === cat)) setCat(list[0].id);
  }, [type, cat]);

  const fetchTx = async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`${API_BASE}/transactions`, { signal });
      if (!res.ok) throw new Error(`GET /transactions ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Unexpected response shape");
      setTx(data as Transaction[]);
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    fetchTx(ctrl.signal);
    return () => ctrl.abort();
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

  const filtered = useMemo(() => {
    if (!period) return tx;
    return tx.filter((x) => {
      const d = new Date(x.createdAt);
      return d.getFullYear() === period.y && d.getMonth() === period.m;
    });
  }, [tx, period]);

  const pIncome = useMemo(
    () =>
      filtered
        .filter((x) => x.type === "income")
        .reduce((a, b) => a + b.amount, 0),
    [filtered]
  );
  const pExpense = useMemo(
    () =>
      filtered
        .filter((x) => x.type === "expense")
        .reduce((a, b) => a + b.amount, 0),
    [filtered]
  );

  const breakdown = useMemo(() => {
    const map: Record<
      string,
      { label: string; color: string; value: number }
    > = {};
    filtered
      .filter((x) => x.type === "expense")
      .forEach((x) => {
        const c = catOf(x);
        map[c.id] = map[c.id] || {
          label: c.label,
          color: c.color,
          value: 0,
        };
        map[c.id].value += x.amount;
      });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const amountNum =
    parseInt(String(amount).replace(/\D/g, ""), 10) || 0;
  const canAdd = amountNum > 0 && !submitting;

  async function submit() {
    if (!canAdd) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          description:
            desc.trim() ||
            CATS[type].find((c) => c.id === cat)?.label ||
            (type === "income" ? "Income" : "Expense"),
          type,
          category: cat,
        }),
      });
      if (!res.ok) throw new Error(`POST /transactions ${res.status}`);
      const entry = (await res.json()) as Transaction;
      if (typeof entry?.id !== "number") {
        throw new Error("Unexpected response shape");
      }
      setTx((prev) => [entry, ...prev]);
      const d = new Date(entry.createdAt);
      if (
        period &&
        (period.y !== d.getFullYear() || period.m !== d.getMonth())
      ) {
        setPeriod({ y: d.getFullYear(), m: d.getMonth() });
      }
      setFlash(entry.id);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(null), 900);
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
      const res = await fetch(`${API_BASE}/transactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`DELETE /transactions/${id} ${res.status}`);
    } catch (err) {
      console.error("Failed to delete", err);
      setTx(prev);
    }
  }

  async function clearAll() {
    if (!confirm("Clear ALL transactions (all months)?")) return;
    const prev = tx;
    setTx([]);
    const results = await Promise.allSettled(
      prev.map((x) =>
        fetch(`${API_BASE}/transactions/${x.id}`, { method: "DELETE" }).then(
          (r) => {
            if (!r.ok) throw new Error(`DELETE ${x.id} ${r.status}`);
          }
        )
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      console.error(`Failed to delete ${failed} transactions`);
      fetchTx();
    }
  }

  const curMonthStart = startOfMonth(now);
  const atCurrent =
    !!period &&
    startOfMonth(new Date(period.y, period.m, 1)) >= curMonthStart;

  function shiftMonth(delta: number) {
    const base = period
      ? new Date(period.y, period.m, 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const next = new Date(base.getFullYear(), base.getMonth() + delta, 1);
    if (next.getTime() > curMonthStart) return;
    setPeriod({ y: next.getFullYear(), m: next.getMonth() });
  }

  const periodLabel = !period
    ? "All time"
    : period.y === now.getFullYear() && period.m === now.getMonth()
      ? "This month"
      : new Date(period.y, period.m, 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

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
              <Icon.spark style={{ color: "var(--accent)" }} /> All time
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

        <div style={S.filterBar}>
          <div style={S.monthNav}>
            <button
              style={S.navBtn}
              onClick={() => shiftMonth(-1)}
              title="Previous month"
            >
              <Icon.chevron style={{ transform: "rotate(180deg)" }} />
            </button>
            <div style={S.periodLabel}>{periodLabel}</div>
            <button
              style={{
                ...S.navBtn,
                opacity: atCurrent || !period ? 0.35 : 1,
                pointerEvents:
                  atCurrent || !period ? "none" : "auto",
              }}
              onClick={() => shiftMonth(1)}
              title="Next month"
            >
              <Icon.chevron />
            </button>
          </div>
          <button
            style={{
              ...S.allTimeBtn,
              ...(!period ? S.allTimeOn : {}),
            }}
            onClick={() =>
              setPeriod(
                period ? null : { y: now.getFullYear(), m: now.getMonth() }
              )
            }
          >
            {period ? "View all time" : "Back to monthly"}
          </button>
        </div>

        <div style={S.grid}>
          <div style={S.col}>
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

              <div style={S.field}>
                <span style={S.fieldLab}>Category</span>
                <div style={S.catWrap}>
                  {CATS[type].map((c) => {
                    const on = c.id === cat;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCat(c.id)}
                        style={{
                          ...S.catChip,
                          ...(on
                            ? {
                                borderColor: c.color,
                                background: hexA(c.color, 0.1),
                                color: "var(--ink)",
                              }
                            : {}),
                        }}
                      >
                        <span style={{ ...S.dot, background: c.color }} />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label style={S.field}>
                <span style={S.fieldLab}>
                  Description <span style={S.opt}>(optional)</span>
                </span>
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
                <h2 style={S.cardTitle}>Spending breakdown</h2>
                <span style={S.periodTag}>{periodLabel}</span>
              </div>

              {breakdown.length === 0 ? (
                <div style={S.emptySm}>
                  <div
                    style={{
                      ...S.emptyIcon,
                      width: 50,
                      height: 50,
                      borderRadius: 15,
                      marginBottom: 12,
                    }}
                  >
                    <Icon.pie />
                  </div>
                  <div style={S.emptyTitle}>
                    No spending {period ? "this period" : "yet"}
                  </div>
                  <div style={S.emptyText}>
                    Add an expense to see where your money goes.
                  </div>
                </div>
              ) : (
                <div style={S.breakWrap}>
                  <Donut data={breakdown} total={pExpense} />
                  <div style={S.legend}>
                    {breakdown.map((d) => (
                      <div key={d.label} style={S.legendRow}>
                        <span
                          style={{ ...S.dot, background: d.color }}
                        />
                        <span style={S.legendLabel}>{d.label}</span>
                        <span style={S.legendPct} className="tnum">
                          {Math.round((d.value / pExpense) * 100)}%
                        </span>
                        <span style={S.legendVal} className="tnum">
                          Rp {groupInt(d.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <section style={S.card}>
            <div style={S.histHead}>
              <div>
                <h2 style={S.cardTitle}>History</h2>
                <div style={S.histSub} className="tnum">
                  <span style={{ color: "var(--income)" }}>
                    +Rp {groupInt(pIncome)}
                  </span>
                  <span style={S.histDot}>·</span>
                  <span style={{ color: "var(--expense)" }}>
                    −Rp {groupInt(pExpense)}
                  </span>
                  <span style={S.histDot}>·</span>
                  <span style={{ color: "var(--muted)" }}>{periodLabel}</span>
                </div>
              </div>
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
            ) : filtered.length === 0 ? (
              <div style={S.empty}>
                <div style={S.emptyIcon}>
                  <Icon.wallet width="26" height="26" />
                </div>
                <div style={S.emptyTitle}>
                  {tx.length === 0
                    ? "No transactions yet"
                    : "Nothing in " + periodLabel.toLowerCase()}
                </div>
                <div style={S.emptyText}>
                  {tx.length === 0
                    ? "Your recorded income and expenses will appear here."
                    : "Try another month or view all time."}
                </div>
              </div>
            ) : (
              <div style={S.list}>
                {filtered.map((x) => (
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

function Donut({
  data,
  total,
}: {
  data: { label: string; color: string; value: number }[];
  total: number;
}) {
  const size = 150;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        {total > 0 &&
          data.map((d, i) => {
            const frac = d.value / total;
            const len = frac * c;
            const gap = c - len;
            const off = -acc * c;
            acc += frac;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={stroke}
                strokeDasharray={`${Math.max(len - 2, 0)} ${gap + 2}`}
                strokeDashoffset={off}
                strokeLinecap="butt"
              />
            );
          })}
      </svg>
      <div style={S.donutCenter}>
        <div style={S.donutLab}>Spent</div>
        <div style={S.donutVal} className="tnum">
          Rp {compact(total)}
        </div>
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
  const c = catOf(x);
  return (
    <div
      style={{ ...S.row, ...(flash ? S.rowFlash : {}) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{
          ...S.rowIcon,
          color: c.color,
          background: hexA(c.color, 0.14),
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
        <div style={S.rowMeta}>
          <span style={{ ...S.miniDot, background: c.color }} />
          <span style={S.rowCat}>{c.label}</span>
          <span style={S.histDot}>·</span>
          <span className="tnum">{relTime(x.createdAt)}</span>
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
    marginBottom: 14,
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

  filterBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "var(--gap)",
  },
  monthNav: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 12,
    padding: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "grid",
    placeItems: "center",
    color: "var(--muted)",
    transition: "background .15s, color .15s",
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--ink)",
    minWidth: 116,
    textAlign: "center",
    letterSpacing: "-0.01em",
  },
  allTimeBtn: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--muted)",
    background: "var(--surface)",
    border: "1px solid var(--line)",
    padding: "9px 14px",
    borderRadius: 11,
    transition: "all .15s",
  },
  allTimeOn: {
    background: "var(--accent)",
    color: "#fff",
    borderColor: "transparent",
    boxShadow: "0 6px 16px var(--accent-soft)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 0.82fr) minmax(0, 1fr)",
    gap: "var(--gap)",
    alignItems: "start",
  },
  col: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap)",
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
  opt: { fontWeight: 500, color: "var(--faint)" },
  catWrap: { display: "flex", flexWrap: "wrap", gap: 7 },
  catChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--muted)",
    background: "var(--surface)",
    border: "1.5px solid var(--line)",
    transition: "all .15s",
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    flexShrink: 0,
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  histSub: {
    fontSize: 12.5,
    fontWeight: 600,
    marginTop: 5,
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  histDot: { color: "var(--faint)" },
  periodTag: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--muted)",
    background: "var(--bg)",
    border: "1px solid var(--line)",
    padding: "5px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },
  clearBtn: {
    fontSize: 12.5,
    fontWeight: 600,
    color: "var(--muted)",
    padding: "5px 10px",
    borderRadius: 8,
    border: "1px solid var(--line)",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  breakWrap: {
    display: "flex",
    alignItems: "center",
    gap: 22,
  },
  donutCenter: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  donutLab: {
    fontSize: 11.5,
    fontWeight: 600,
    color: "var(--muted)",
  },
  donutVal: {
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "var(--ink)",
    marginTop: 2,
  },
  legend: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 9,
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontSize: 13,
  },
  legendLabel: {
    fontWeight: 600,
    color: "var(--ink)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
    minWidth: 0,
  },
  legendPct: {
    fontWeight: 700,
    color: "var(--muted)",
    fontSize: 12.5,
    width: 36,
    textAlign: "right",
  },
  legendVal: {
    fontWeight: 600,
    color: "var(--ink)",
    fontSize: 12.5,
    width: 92,
    textAlign: "right",
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
  rowMeta: {
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 500,
    marginTop: 2,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  miniDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
  rowCat: { fontWeight: 600 },
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
  emptySm: { textAlign: "center", padding: "20px 16px 14px" },
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
