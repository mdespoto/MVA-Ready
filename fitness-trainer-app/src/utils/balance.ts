import { db } from "../db";

export interface ClientBalance {
  totalPurchased: number;
  totalConsumed: number;
  remaining: number;
}

export async function getClientBalance(clientId: number): Promise<ClientBalance> {
  const [payments, sessions] = await Promise.all([
    db.payments.where("clientId").equals(clientId).toArray(),
    db.sessions.where("clientId").equals(clientId).toArray(),
  ]);

  const totalPurchased = payments.reduce((sum, p) => sum + p.sessionsIncluded, 0);
  const totalConsumed = sessions.filter((s) => s.countsAgainstPackage).length;

  return {
    totalPurchased,
    totalConsumed,
    remaining: totalPurchased - totalConsumed,
  };
}

export async function getAllBalances(): Promise<Record<number, ClientBalance>> {
  const clients = await db.clients.toArray();
  const entries = await Promise.all(
    clients.map(async (c) => [c.id as number, await getClientBalance(c.id as number)] as const)
  );
  return Object.fromEntries(entries);
}

export const LOW_BALANCE_THRESHOLD = 2;
