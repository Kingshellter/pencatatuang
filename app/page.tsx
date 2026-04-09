"use client";

import { useState, useEffect } from "react";

interface Transaction {
  id: number;
  amount: number;
  description: string;
  type: "income" | "expense";
  createdAt: string;
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("http://localhost:3001/transactions");
      const data = await res.json();
      setTransactions(data);

      const summaryRes = await fetch("http://localhost:3001/transactions/summary");
      const summaryData = await summaryRes.json();
      setBalance(summaryData.balance);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleTransaction = async (type: "income" | "expense") => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Masukkan jumlah uang yang valid");
      return;
    }

    if (type === "expense" && numAmount > balance) {
      alert("Saldo tidak cukup!");
      return;
    }

    try {
      await fetch("http://localhost:3001/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: numAmount, 
          description: description || (type === "income" ? "Pemasukan" : "Pengeluaran"),
          type
        }),
      });

    setAmount("");
    setDescription("");
    await fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Gagal menambahkan transaksi. Coba lagi.");
    }
  };

if (loading) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-center text-gray-500 py-10">Memuat data...</p>
    </div>
  );
} 

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <main className="max-w-md mx-auto space-y-6">
        {/* Header / Wallet Card */}
        <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl">
          <p className="text-blue-100 text-sm font-medium mb-1">Total Saldo Saya</p>
          <h1 className="text-4xl font-bold">
            Rp {balance.toLocaleString("id-ID")}
          </h1>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl p-6 shadow-md space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Catat Transaksi</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Keterangan (misal: Jajan Bakso)"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              type="number"
              placeholder="Jumlah (Rp)"
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleTransaction("income")}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg active:scale-95"
              >
                + Tambah
              </button>
              <button
                onClick={() => handleTransaction("expense")}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg active:scale-95"
              >
                - Kurangi
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 px-2">Riwayat Transaksi</h2>
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-10">Belum ada transaksi</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border-l-4 border-l-transparent"
                  style={{ borderLeftColor: t.type === "income" ? "#22c55e" : "#ef4444" }}
                >
                  <div>
                    <p className="font-medium text-gray-800">{t.description}</p>
                    <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString("id-ID")}</p>
                  </div>
                  <p className={`font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "-"} Rp {t.amount.toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );

}
