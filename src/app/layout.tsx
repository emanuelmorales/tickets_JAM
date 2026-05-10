import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistema de Tickets',
  description: 'Gestión de solicitudes de mejora',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 antialiased transition-colors duration-300">
        <main className="relative flex min-h-screen flex-col">
          {/* Subtle background light blob */}
          <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute -top-40 left-1/2 -ml-[300px] w-[600px] h-[600px] opacity-10 blur-[100px] bg-blue-500 rounded-full dark:opacity-20"></div>
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
