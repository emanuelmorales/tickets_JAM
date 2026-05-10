import sys

with open("src/app/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove extra </div> at line 443
content = content.replace("            </div>\n</div>\n        </div>\n\n        {ticketsLoading ? (", "            </div>\n          </div>\n\n          {ticketsLoading ? (")

# Update Ticket interface to include requester
old_ticket_interface = """  createdAt: string;
}"""

new_ticket_interface = """  createdAt: string;
  requester?: string;
}"""
content = content.replace(old_ticket_interface, new_ticket_interface, 1)

# 2. Update filteredTickets logic
old_filter = """  const filteredTickets = tickets.filter((t) =>
    searchQuery === "" ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );"""

new_filter = """  const filteredTickets = tickets.filter((t) => {
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
  }, [totalPages, currentPage, pageSize, filteredTickets.length]);"""

content = content.replace(old_filter, new_filter)

# 3. Update handlePrint logic
old_print = """  const handlePrint = () => {
    window.print();
  };"""

new_print = """  const handlePrint = () => {
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
  };"""

content = content.replace(old_print, new_print)

# 4. Update map to paginatedTickets
content = content.replace("filteredTickets.map((t) => (", "paginatedTickets.map((t) => (")

# 5. Add Pagination
old_pagination = """                  )}
                </div>
              </button>
            ))
          )}
        </div>"""

new_pagination = """                  )}
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
        </div>"""

content = content.replace(old_pagination, new_pagination)

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully.")
