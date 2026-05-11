"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send, CheckCircle, Sparkles, LayoutDashboard,
  Search, Clock, CheckCircle2, Eye, ChevronRight, X,
  FileSpreadsheet, Printer, Filter
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import * as XLSX from "xlsx";

interface Ticket {
  id: string;
  title: string;
  category: string;
  description: string;
  urgency: string;
  status: string;
  createdAt: string;
  requester?: string;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterUrgency, setFilterUrgency] = useState("Todos");
  const [filterCategory, setFilterCategory] = useState("Todos");
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      category: formData.get("category"),
      description: formData.get("description"),
      urgency: formData.get("urgency"),
      requester: formData.get("requester"),
    };

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Error al enviar el ticket");

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      fetchTickets(); // Refresh the list
      setTimeout(() => {
        setSuccess(false);
        titleInputRef.current?.focus();
      }, 2500);
    } catch (err) {
      setError("Ocurrió un error. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (filteredTickets.length === 0) {
      alert("No hay tickets para exportar");
      return;
    }

    const data = filteredTickets.map((t) => ({
      "Titulo": t.title,
      "Solicitante": t.requester || "",
      "Categoria": t.category,
      "Descripcion": t.description,
      "Urgencia": t.urgency,
      "Estado": t.status,
      "Fecha": new Date(t.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    XLSX.writeFile(workbook, `tickets_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredTickets = tickets.filter((t) => {
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

  const totalPages = Math.ceil(filteredTickets.length / pageSize);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (filteredTickets.length > 0 && (currentPage - 1) * pageSize >= filteredTickets.length) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, pageSize, filteredTickets.length]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completado": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "En Revisión": return <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completado": return "text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20";
      case "En Revisión": return "text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-300 dark:bg-blue-500/10 dark:border-blue-500/20";
      default: return "text-slate-600 bg-slate-100 border-slate-200 dark:text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700";
    }
  };

  const getUrgencyDot = (urgency: string) => {
    switch (urgency) {
      case "Alta": return "bg-red-500";
      case "Media": return "bg-amber-500";
      case "Baja": return "bg-emerald-500";
      default: return "bg-slate-400";
    }
  };

  const getCardBg = (status: string) => {
    switch (status) {
      case "Completado": return "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-500/15";
      case "En Revisión": return "bg-blue-50/60 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 hover:bg-blue-100/70 dark:hover:bg-blue-500/15";
      case "Pendiente": return "bg-slate-50/60 border-slate-200 dark:bg-zinc-800/30 dark:border-zinc-800 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50";
      default: return "bg-slate-50/60 border-slate-200 dark:bg-zinc-800/30 dark:border-zinc-800 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50";
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Left - Company Image (narrower) */}
      <div className="hidden xl:flex xl:w-[22%] relative bg-zinc-900 flex-shrink-0">
        <Image
          src="/company-bg.png"
          alt="Oficina de la Empresa"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
        <div className="absolute bottom-10 left-8 right-8">
          <div className="inline-flex items-center justify-center p-2.5 bg-white/10 backdrop-blur-md rounded-xl mb-3 border border-white/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1.5">Transformando Ideas</h2>
          <p className="text-slate-300 text-sm leading-relaxed">Tu retroalimentación nos ayuda a construir un mejor entorno de trabajo.</p>
        </div>
      </div>

      {/* Center - Form */}
      <div className="w-full lg:w-1/2 xl:w-[40%] flex flex-col items-center justify-center p-5 sm:p-8 xl:p-12 relative selection:bg-blue-500/30 overflow-y-auto border-r border-slate-200 dark:border-zinc-800">
        <div className="absolute top-5 right-5">
          <Link href="/admin" className="flex items-center gap-2 px-3.5 py-2 rounded-full font-medium text-xs transition-all bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Panel Admin</span>
          </Link>
        </div>

        <div className="w-full max-w-lg mx-auto space-y-6 my-auto">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Nueva Solicitud
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 text-sm">
              Completa el formulario para enviar tu solicitud de mejora.
            </p>
          </div>

          <div className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg dark:shadow-xl border border-slate-200 dark:border-zinc-800 transition-colors duration-300">
            {success && (
              <div className="absolute inset-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10 rounded-2xl">
                <CheckCircle className="w-14 h-14 text-emerald-500 dark:text-emerald-400 mb-3 drop-shadow-md" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">¡Solicitud Enviada!</h3>
                <p className="text-slate-600 dark:text-zinc-300 text-sm max-w-xs">
                  Tu ticket ha sido registrado y será revisado pronto.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="title" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Título del Ticket
                </label>
                <input
                  id="title"
                  ref={titleInputRef}
                  name="title"
                  type="text"
                  required
                  placeholder="Ej. Nueva máquina de café..."
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="category" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    Categoría
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      name="category"
                      required
                      defaultValue=""
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="" disabled>Selecciona...</option>
                      <option value="Equipamiento">Equipamiento</option>
                      <option value="Infraestructura">Infraestructura</option>
                      <option value="Software/TI">Software/TI</option>
                      <option value="Bienestar">Bienestar</option>
                      <option value="Otros">Otros</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="urgency" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    Urgencia
                  </label>
                  <div className="relative">
                    <select
                      id="urgency"
                      name="urgency"
                      required
                      defaultValue=""
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="" disabled>Selecciona...</option>
                      <option value="Baja">🟢 Baja</option>
                      <option value="Media">🟡 Media</option>
                      <option value="Alta">🔴 Alta</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="requester" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Tu Nombre
                </label>
                <input
                  id="requester"
                  name="requester"
                  type="text"
                  required
                  placeholder="Tu nombre completo"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Descripción Detallada
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={3}
                  placeholder="Describe los detalles..."
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                ></textarea>
              </div>

              {error && (
                <p className="text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-400/10 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-400/20">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-3 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? "Enviando..." : (<><Send className="w-4 h-4" /> Enviar Ticket</>)}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right - Read-only ticket list */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[38%] flex-col bg-slate-100/50 dark:bg-zinc-950/50 overflow-hidden">
        <div className="p-4 pb-2 space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tickets Registrados</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                Consulta si tu problema ya fue reportado
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-zinc-800">
              {filteredTickets.length} ticket(s)
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-2">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg dark:shadow-xl border border-slate-200 dark:border-zinc-800 p-3 space-y-2">
            {/* Row 1: Search + Export + Print */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar por titulo, descripcion o ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl transition-all border border-emerald-200 dark:border-emerald-500/20 font-medium text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar Excel</span>
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

            {/* Row 2: Filters */}
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
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                >
                  <option value="Todos">Categoria: Todos</option>
                  <option value="Equipamiento">Equipamiento</option>
                  <option value="Infraestructura">Infraestructura</option>
                  <option value="Software/TI">Software/TI</option>
                  <option value="Bienestar">Bienestar</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
            </div>

            {/* Row 3: Results count + Pagination */}
            <div className="text-xs text-slate-500 dark:text-zinc-500 flex items-center justify-between">
              <span>
                Mostrando <strong className="text-slate-700 dark:text-zinc-300">{(currentPage - 1) * pageSize + 1}</strong> - <strong className="text-slate-700 dark:text-zinc-300">{Math.min(currentPage * pageSize, filteredTickets.length)}</strong> de <strong className="text-slate-700 dark:text-zinc-300">{filteredTickets.length}</strong> ticket(s)
              </span>
              <div className="flex items-center gap-2">
                <span>Ver:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={999999}>Todos</option>
                </select>
              </div>
            </div>
          </div>

          {ticketsLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 dark:text-zinc-600 text-sm">
              Cargando tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-zinc-600">
              <Search className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {tickets.length === 0 ? "No hay tickets registrados aún." : "Sin resultados para esta búsqueda."}
              </p>
            </div>
          ) : (
            paginatedTickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTicket(selectedTicket?.id === t.id ? null : t)}
                className={`w-full text-left rounded-xl border transition-all duration-200
                  ${selectedTicket?.id === t.id
                    ? `${getCardBg(t.status)} ring-1 ring-blue-200 dark:ring-blue-500/20 shadow-md !border-blue-300 dark:!border-blue-500/40`
                    : `${getCardBg(t.status)} shadow-sm hover:shadow-md`
                  }`}
              >
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getUrgencyDot(t.urgency)}`}></span>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">{t.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadge(t.status)}`}>
                          {getStatusIcon(t.status)}
                          {t.status}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-600">
                          {t.category}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-600">
                          • {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-400 dark:text-zinc-600 flex-shrink-0 mt-0.5 transition-transform duration-200 ${selectedTicket?.id === t.id ? "rotate-90" : ""}`} />
                  </div>

                  {/* Expanded detail */}
                  {selectedTicket?.id === t.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                      <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                        {t.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400 dark:text-zinc-600">
                        <span>Urgencia: <strong className="text-slate-600 dark:text-zinc-400">{t.urgency}</strong></span>
                        <span>ID: <span className="font-mono">{t.id.slice(0, 8)}</span></span>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))
          )}

          {/* Pagination */}
          {filteredTickets.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between py-3 border-t border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-sm text-slate-500 dark:text-zinc-400">
                  Página <strong className="text-slate-700 dark:text-zinc-200">{currentPage}</strong> de <strong className="text-slate-700 dark:text-zinc-200">{totalPages}</strong>
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
