import { prisma } from "../db";

export async function upsertNFT(data: {
  contractAddress: string;
  tokenId: string;
  owner: string;
  tokenURI?: string;
  blockNumber: number;
  logIndex: number;
  txHash: string;
}) {
  const existing = await prisma.nFT.findUnique({
    where: {
      contractAddress_tokenId: {
        contractAddress: data.contractAddress,
        tokenId: data.tokenId,
      },
    },
  });

  if (existing) {
    if (
      existing.lastUpdatedBlock !== null &&
      (existing.lastUpdatedBlock > data.blockNumber ||
        (existing.lastUpdatedBlock === data.blockNumber &&
          (existing.lastUpdatedLogIndex ?? 0) >= data.logIndex))
    ) {
      return existing;
    }

    return prisma.nFT.update({
      where: {
        contractAddress_tokenId: {
          contractAddress: data.contractAddress,
          tokenId: data.tokenId,
        },
      },
      data: {
        owner: data.owner.toLowerCase(),
        tokenURI: data.tokenURI,
        lastUpdatedTxHash: data.txHash,
        lastUpdatedBlock: data.blockNumber,
        lastUpdatedLogIndex: data.logIndex,
      }
    });
  }

  return prisma.nFT.create({
    data: {
      contractAddress: data.contractAddress,
      tokenId: data.tokenId,
      owner: data.owner.toLowerCase(),
      tokenURI: data.tokenURI,
      lastUpdatedTxHash: data.txHash,
      lastUpdatedBlock: data.blockNumber,
      lastUpdatedLogIndex: data.logIndex,
    },
  });
}

export async function getNFTsByOwner(wallet: string) {
  const owner = wallet.toLowerCase();

  const nfts = await prisma.nFT.findMany({
    where: {
      owner,
    },
    select: {
      tokenId: true,
      contractAddress: true,
      tokenURI: true,
    },
  });

  const listings = await prisma.listing.findMany({
    where: {
      seller: owner,
      status: "ACTIVE",
    },
    select: {
      listingId: true,
      tokenId: true,
      price: true,
    },
  });

  const listingMaps = new Map(listings.map((l) => [l.tokenId, l]));

  return nfts.map((nft) => {
    const listing = listingMaps.get(nft.tokenId);

    return {
      ...nft,
      listed: Boolean(listing),
      listingId: listing?.listingId,
      price: listing?.price,
    };
  });
}
