import { prisma } from "../db/index.js";
import { ListingStatus } from "@prisma/client";
import { isStaleEvent } from "../utils/event-order.js";

export async function createListing(data: {
  listingId: string;
  seller: string;
  nftContract: string;
  tokenId: string;
  price: string;
  blockNumber: number;
  logIndex: number;
  txHash: string;
}) {
  const existing = await prisma.listing.findUnique({
    where: { listingId: data.listingId },
  });

  if (existing) {
    if (
      isStaleEvent(
        existing.lastUpdatedBlock,
        existing.lastUpdatedLogIndex,
        data.blockNumber,
        data.logIndex,
      )
    ) {
      return existing;
    }

    return prisma.listing.update({
      where: { listingId: data.listingId },
      data: {
        price: data.price,
        status: "ACTIVE",
        lastUpdatedBlock: data.blockNumber,
        lastUpdatedLogIndex: data.logIndex,
        lastUpdatedTxHash: data.txHash,
      },
    });
  }

  return prisma.listing.create({
    data: {
      listingId: data.listingId,
      seller: data.seller.toLowerCase(),
      nftContract: data.nftContract.toLowerCase(),
      tokenId: data.tokenId,
      price: data.price,
      status: "ACTIVE",
      lastUpdatedBlock: data.blockNumber,
      lastUpdatedLogIndex: data.logIndex,
      lastUpdatedTxHash: data.txHash,
    },
  });
}

export async function markListingSold(
  listingId: string,
  blockNumber: number,
  logIndex: number,
  txHash: string,
) {
  const existing = await prisma.listing.findUnique({
    where: { listingId },
  });

  if (!existing) return;

  if (
    isStaleEvent(
      existing.lastUpdatedBlock,
      existing.lastUpdatedLogIndex,
      blockNumber,
      logIndex,
    )
  ) {
    return existing;
  }

  return prisma.listing.update({
    where: { listingId },
    data: {
      status: "SOLD",
      lastUpdatedBlock: blockNumber,
      lastUpdatedLogIndex: logIndex,
      lastUpdatedTxHash: txHash,
    },
  });
}

export async function cancelListing(
  listingId: string,
  blockNumber: number,
  logIndex: number,
  txHash: string,
) {
  const existing = await prisma.listing.findUnique({
    where: { listingId },
  });

  if (!existing) return;

  if (
    isStaleEvent(
      existing.lastUpdatedBlock,
      existing.lastUpdatedLogIndex,
      blockNumber,
      logIndex,
    )
  ) {
    return existing;
  }

  return prisma.listing.update({
    where: { listingId },
    data: {
      status: "CANCELLED",
      lastUpdatedBlock: blockNumber,
      lastUpdatedLogIndex: logIndex,
      lastUpdatedTxHash: txHash,
    },
  });
}

export async function updateListingPrice(
  listingId: string,
  newPrice: string,
  blockNumber: number,
  logIndex: number,
  txHash: string,
) {
  const existing = await prisma.listing.findUnique({
    where: { listingId },
  });

  if (!existing) return;

  if (
    isStaleEvent(
      existing.lastUpdatedBlock,
      existing.lastUpdatedLogIndex,
      blockNumber,
      logIndex,
    )
  ) {
    return existing;
  }

  return prisma.listing.update({
    where: { listingId },
    data: {
      price: newPrice,
      lastUpdatedBlock: blockNumber,
      lastUpdatedLogIndex: logIndex,
      lastUpdatedTxHash: txHash,
    },
  });
}

export async function getActiveListing() {
  return prisma.listing.findMany({
    where: {
      status: "ACTIVE",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      listingId: true,
      seller: true,
      nftContract: true,
      tokenId: true,
      price: true,
      createdAt: true,
    },
  });
}

export async function getUserListings(wallet: string, status?: ListingStatus) {
  return prisma.listing.findMany({
    where: {
      seller: wallet.toLowerCase(),
      ...(status ? { status } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
