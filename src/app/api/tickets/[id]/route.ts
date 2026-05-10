import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "db.json");

async function readTickets() {
  try {
    const data = await fs.readFile(dbPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeTickets(tickets: any[]) {
  await fs.writeFile(dbPath, JSON.stringify(tickets, null, 2));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const tickets = await readTickets();
    
    const index = tickets.findIndex((t: any) => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    tickets[index] = { ...tickets[index], ...body };
    await writeTickets(tickets);
    
    return NextResponse.json(tickets[index]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
