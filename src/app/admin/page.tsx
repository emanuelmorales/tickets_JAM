"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  ShieldAlert, RefreshCw, Layers, Archive, ArrowLeft,
  Search, Filter, Download, Printer, X, FileSpreadsheet
} from "lucide-react";
import Link from "next/link";

interface Ticket {
  id: string;
  title: string;
  category: string;
  description: string;
  urgency: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterUrgency, setFilterUrgency] = useState("Todos");
  const [filterCategory, setFilterCategory] = useState("Todos");

  const tableRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
    } else {
      alert("Contraseña incorrecta. (Pista: admin123)");
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    try {
      await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error("Error updating ticket", error);
      fetchTickets();
    }
  };

  // ─── Filtered tickets ───
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === "Todos" || t.status === filterStatus;
      const matchesUrgency = filterUrgency === "Todos" || t.urgency === filterUrgency;
      const matchesCategory = filterCategory === "Todos" || t.category === filterCategory;

      return matchesSearch && matchesStatus && matchesUrgency && matchesCategory;
    });
  }, [tickets, searchQuery, filterStatus, filterUrgency, filterCategory]);

  const hasActiveFilters = filterStatus !== "Todos" || filterUrgency !== "Todos" || filterCategory !== "Todos" || searchQuery !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("Todos");
    setFilterUrgency("Todos");
    setFilterCategory("Todos");
  };

  // ─── Export CSV ───
  const exportCSV = () => {
    if (filteredTickets.length === 0) {
      alert("No hay tickets para exportar");
      return;
    }

    const headers = ["ID", "Título", "Categoría", "Descripción", "Urgencia", "Estado", "Fecha"];
    const rows = filteredTickets.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      `"${t.description.replace(/"/g, '""')}"`,
      t.urgency,
      t.status,
      new Date(t.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tickets_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ─── Print ───
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = filteredTickets
      .map(
        (t) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 12px;font-weight:600;">${t.title}<br/><span style="font-weight:400;color:#64748b;font-size:13px;">${t.description}</span></td>
          <td style="padding:10px 12px;">${t.category}</td>
          <td style="padding:10px 12px;">${t.urgency}</td>
          <td style="padding:10px 12px;">${new Date(t.createdAt).toLocaleDateString()}</td>
          <td style="padding:10px 12px;font-weight:600;">${t.status}</td>
        </tr>`
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tickets - Reporte</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #1e293b; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .meta { color: #64748b; font-size: 14px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th { text-align: left; padding: 10px 12px; background: #f1f5f9; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 2px solid #cbd5e1; }
          td { vertical-align: top; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Reporte de Tickets</h1>
        <p class="meta">Generado: ${new Date().toLocaleString()} — ${filteredTickets.length} ticket(s)</p>
        <table>
          <thead><tr><th>Ticket</th><th>Categoría</th><th>Urgencia</th><th>Fecha</th><th>Estado</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // ─── Colors ───
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Alta": return "text-red-700 bg-red-100 border-red-200 dark:text-red-300 dark:bg-red-400/10 dark:border-red-400/20";
      case "Media": return "text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-300 dark:bg-amber-400/10 dark:border-amber-400/20";
      case "Baja": return "text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-400/10 dark:border-emerald-400/20";
      default: return "text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-400/10 dark:border-slate-400/20";
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "Completado": return "bg-emerald-500 dark:bg-emerald-400";
      case "En Revisión": return "bg-blue-500 dark:bg-blue-400";
      case "Pendiente": return "bg-slate-400 dark:bg-zinc-500";
      default: return "bg-slate-400 dark:bg-zinc-500";
    }
  };

  const getRowBg = (status: string) => {
    switch (status) {
      case "Completado": return "bg-emerald-50/60 dark:bg-emerald-500/10 hover:bg-emerald-100/70 dark:hover:bg-emerald-500/15";
      case "En Revisión": return "bg-blue-50/60 dark:bg-blue-500/10 hover:bg-blue-100/70 dark:hover:bg-blue-500/15";
      case "Pendiente": return "bg-slate-50/60 dark:bg-zinc-800/30 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50";
      default: return "bg-slate-50/60 dark:bg-zinc-800/30 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50";
    }
  };

  // ─── Login Screen ───
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 selection:bg-blue-500/30">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl shadow-xl dark:shadow-2xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-50 dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 shadow-inner">
            <ShieldAlert className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acceso Protegido</h2>
            <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm">Ingresa la contraseña para ver el dashboard.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-center focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600 text-slate-900 dark:text-white shadow-sm"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Ingresar
            </button>
            <p className="text-xs text-slate-400 dark:text-zinc-500">(Password: admin123)</p>
          </form>
          <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Dashboard ───
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Layers className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Panel de Administración
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm sm:text-base">
              Gestiona y actualiza los estados de los tickets en tiempo real.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={fetchTickets}
              className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl transition-all border border-slate-200 dark:border-zinc-800 shadow-sm font-medium text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
            <Link href="/" className="flex-1 sm:flex-none flex justify-center items-center px-4 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl transition-all border border-blue-200 dark:border-blue-500/20 font-medium text-sm">
              Ver Formulario
            </Link>
          </div>
        </div>

        {/* Toolbar: Search + Filters + Export */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg dark:shadow-xl border border-slate-200 dark:border-zinc-800 p-4 space-y-4">
          {/* Row 1: Search + Export buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por título, descripción o ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl transition-all border border-emerald-200 dark:border-emerald-500/20 font-medium text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 rounded-xl transition-all border border-violet-200 dark:border-violet-500/20 font-medium text-sm"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
            </div>
          </div>

          {/* Row 2: Filter dropdowns */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-zinc-400 flex-shrink-0">
              <Filter className="w-4 h-4" />
              Filtrar:
            </div>
            <div className="flex flex-wrap gap-2 flex-1">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              >
                <option value="Todos">Estado: Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Completado">Completado</option>
              </select>
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              >
                <option value="Todos">Urgencia: Todos</option>
                <option value="Baja">🟢 Baja</option>
                <option value="Media">🟡 Media</option>
                <option value="Alta">🔴 Alta</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              >
                <option value="Todos">Categoría: Todos</option>
                <option value="Equipamiento">Equipamiento</option>
                <option value="Infraestructura">Infraestructura</option>
                <option value="Software/TI">Software/TI</option>
                <option value="Bienestar">Bienestar</option>
                <option value="Otros">Otros</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg border border-red-200 dark:border-red-500/20 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="text-xs text-slate-500 dark:text-zinc-500 flex items-center justify-between">
            <span>
              Mostrando <strong className="text-slate-700 dark:text-zinc-300">{filteredTickets.length}</strong> de <strong className="text-slate-700 dark:text-zinc-300">{tickets.length}</strong> ticket(s)
            </span>
          </div>
        </div>

        {/* Table */}
        <div ref={tableRef} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-950/50 border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="p-4 pl-6 w-[35%]">Ticket</th>
                  <th className="p-4 w-[15%]">Categoría</th>
                  <th className="p-4 w-[12%]">Urgencia</th>
                  <th className="p-4 w-[13%]">Fecha</th>
                  <th className="p-4 w-[25%] pr-6">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-slate-500 dark:text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <Archive className="w-12 h-12 mb-4 text-slate-300 dark:text-zinc-700" />
                        <p className="text-sm font-medium">
                          {tickets.length === 0
                            ? "No hay tickets registrados todavía."
                            : "No se encontraron tickets con los filtros aplicados."}
                        </p>
                        {hasActiveFilters && (
                          <button onClick={clearFilters} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            Limpiar filtros
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr key={t.id} className={`${getRowBg(t.status)} transition-colors group`}>
                      <td className="p-4 pl-6 align-top">
                        <div className="font-semibold text-slate-900 dark:text-zinc-100">{t.title}</div>
                        <div className="text-sm text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">{t.description}</div>
                      </td>
                      <td className="p-4 align-top">
                        <span className="inline-flex bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-zinc-700">
                          {t.category}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getUrgencyColor(t.urgency)}`}>
                          {t.urgency}
                        </span>
                      </td>
                      <td className="p-4 align-top text-sm font-medium text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 pr-6 align-top">
                        <div className="relative flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusIndicator(t.status)}`}></span>
                          <select
                            value={t.status}
                            onChange={(e) => updateStatus(t.id, e.target.value)}
                            className="bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-sm font-medium rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none w-full shadow-sm cursor-pointer transition-colors"
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Revisión">En Revisión</option>
                            <option value="Completado">Completado</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 dark:text-zinc-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
