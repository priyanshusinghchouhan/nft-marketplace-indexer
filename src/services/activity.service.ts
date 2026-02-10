import {prisma} from "../db/index";

export async function logActivity({type, wallet,txHash}: {
  type: "LISTED" | "SOLD" | "CANCELLED" | "PRICE_UPDATED" | "TRANSFER" | "MINTED";
  wallet: string;
  txHash?: string;
}) {
  if (!txHash) {
    console.warn("Skipping activity log: missing txHash", {
      type,
      wallet,
    });
    return;
  }

  return prisma.activity.create({
    data: {
      type,
      wallet,
      txHash,
    },
  });
}

export async function getRecentActivity(wallet?:string, limit?: number) {
  return prisma.activity.findMany({
    where: {
      ...(wallet ? { wallet: wallet.toLowerCase() } : {}),
    },
    orderBy: {
      createdAt: "desc"
    },
    take: limit
  });
}
