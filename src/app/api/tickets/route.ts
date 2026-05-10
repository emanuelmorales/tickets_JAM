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

export async function GET() {
  const tickets = await readTickets();
  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tickets = await readTickets();
    const newTicket = {
      id: crypto.randomUUID(),
      title: body.title,
      category: body.category,
      description: body.description,
      urgency: body.urgency,
      status: "Pendiente",
      createdAt: new Date().toISOString(),
    };
    tickets.push(newTicket);
    await writeTickets(tickets);
    return NextResponse.json(newTicket, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
