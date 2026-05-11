import sys

def patch_page(file_path, is_admin):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Add import
    if "import * as XLSX from 'xlsx';" not in content and 'import * as XLSX from "xlsx";' not in content:
        if 'import Image from "next/image";' in content:
            content = content.replace('import Image from "next/image";', 'import Image from "next/image";\nimport * as XLSX from "xlsx";')
        else:
            content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport * as XLSX from "xlsx";')

    # 2. Replace exportCSV function
    if is_admin:
        old_export = """  // ─── Export CSV ───
  const exportCSV = () => {
    if (filteredTickets.length === 0) {
      alert("No hay tickets para exportar");
      return;
    }

    const headers = ["ID", "Título", "Solicitante", "Categoría", "Descripción", "Urgencia", "Estado", "Fecha"];
    const rows = filteredTickets.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.requester || "",
      t.category,
      `"${t.description.replace(/"/g, '""')}"`,
      t.urgency,
      t.status,
      new Date(t.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\\n");
    const BOM = "\\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tickets_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };"""
        new_export = """  // ─── Export Excel ───
  const exportExcel = () => {
    if (filteredTickets.length === 0) {
      alert("No hay tickets para exportar");
      return;
    }

    const data = filteredTickets.map((t) => ({
      "ID": t.id,
      "Título": t.title,
      "Solicitante": t.requester || "",
      "Categoría": t.category,
      "Descripción": t.description,
      "Urgencia": t.urgency,
      "Estado": t.status,
      "Fecha": new Date(t.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    XLSX.writeFile(workbook, `tickets_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };"""
    else:
        old_export = """  const exportCSV = () => {
    if (filteredTickets.length === 0) {
      alert("No hay tickets para exportar");
      return;
    }

    const headers = ["ID", "Titulo", "Solicitante", "Categoria", "Descripcion", "Urgencia", "Estado", "Fecha"];
    const rows = filteredTickets.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.requester || "",
      t.category,
      `"${t.description.replace(/"/g, '""')}"`,
      t.urgency,
      t.status,
      new Date(t.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\\n");
    const BOM = "\\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tickets_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };"""
        new_export = """  const exportExcel = () => {
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
  };"""

    if old_export in content:
        content = content.replace(old_export, new_export)
    else:
        print(f"Warning: Could not find old_export in {file_path}")

    # 3. Replace JSX button
    content = content.replace("onClick={exportCSV}", "onClick={exportExcel}")
    content = content.replace(">Exportar CSV<", ">Exportar Excel<")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"Patched {file_path}")

patch_page("src/app/page.tsx", False)
patch_page("src/app/admin/page.tsx", True)
