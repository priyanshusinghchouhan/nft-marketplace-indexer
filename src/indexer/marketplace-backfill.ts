import "dotenv/config";
import { marketplaceContract } from "../config/contracts";
import { provider } from "../config/alchemy";
import {
  createListing,
  markListingSold,
  cancelListing,
  updateListingPrice,
} from "../services/listing.service";
import { EventLog } from "ethers";

const START_BLOCK = 10160002;
const CHUNK_SIZE = 10;

async function safeQueryFilter(filter: any, from: number, to: number, retries = 5) {
  try {
    return await marketplaceContract.queryFilter(filter, from, to);
  } catch (err) {
    if (retries === 0) throw err;

    console.log(`Retrying ${from}-${to}... (${retries} left)`);
    await new Promise(res => setTimeout(res, 1500));

    return safeQueryFilter(filter, from, to, retries - 1);
  }
}

export async function backfillMarketplaceFromBlock(
  fromBlock: number,
  toBlock?: number,
): Promise<void> {
  const endBlock = toBlock ?? (await provider.getBlockNumber());

  if (fromBlock > endBlock) {
    console.log("Marketplace gap-fill: no blocks to process.");
    return;
  }

  console.log(`Marketplace backfill: ${fromBlock} -> ${endBlock}`);

  let current = fromBlock;

  while (current <= endBlock) {
    const chunkEnd = Math.min(current + CHUNK_SIZE - 1, endBlock);

    console.log(`Fetching events from ${current} - ${chunkEnd}`);

    const listedEvents = await safeQueryFilter(
      marketplaceContract.filters.NFTListed(),
      current,
      chunkEnd,
    );

    const soldEvents = await safeQueryFilter(
      marketplaceContract.filters.NFTSold(),
      current,
      chunkEnd,
    );

    const cancelledEvents = await safeQueryFilter(
      marketplaceContract.filters.ListingCancelled(),
      current,
      chunkEnd,
    );

    const priceUpdatedEvents = await safeQueryFilter(
      marketplaceContract.filters.ListingPriceUpdated(),
      current,
      chunkEnd,
    );

    const events = [
      ...listedEvents,
      ...soldEvents,
      ...cancelledEvents,
      ...priceUpdatedEvents,
    ];

    if (events.length === 0) {
      current = chunkEnd + 1;
      continue;
    }

    const sortedEvents = events.sort((a, b) => {
      if (a.blockNumber === b.blockNumber) {
        return a.index - b.index;
      }
      return a.blockNumber - b.blockNumber;
    });

    for (const event of sortedEvents) {
      if (event instanceof EventLog) {
        const { blockNumber, transactionHash, index } = event;

        if (!event.args) continue;

        switch (event.eventName) {
          case "NFTListed": {
            const { listingId, seller, nftContract, tokenId, price } =
              event.args;

            await createListing({
              listingId: listingId.toString(),
              seller,
              nftContract,
              tokenId: tokenId.toString(),
              price: price.toString(),
              blockNumber,
              logIndex: index,
              txHash: transactionHash,
            });

            break;
          }

          case "NFTSold": {
            const { listingId } = event.args;

            await markListingSold(
              listingId.toString(),
              blockNumber,
              index,
              transactionHash,
            );

            break;
          }

          case "ListingCancelled": {
            const { listingId } = event.args;

            await cancelListing(
              listingId.toString(),
              blockNumber,
              index,
              transactionHash,
            );

            break;
          }

          case "ListingPriceUpdated": {
            const { listingId, newPrice } = event.args;

            await updateListingPrice(
              listingId.toString(),
              newPrice.toString(),
              blockNumber,
              index,
              transactionHash,
            );

            break;
          }
        }
      }
    }

    await new Promise(res => setTimeout(res, 500));
    current = chunkEnd + 1;
  }

  console.log("Marketplace Backfill Complete.");
}

async function backfillMarketplace() {
  const latestBlock = await provider.getBlockNumber();
  await backfillMarketplaceFromBlock(START_BLOCK, latestBlock);
}

const isRunDirectly =
  typeof require !== "undefined" && require.main === module;

if (isRunDirectly) {
  backfillMarketplace()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Backfill failed:", err);
      process.exit(1);
    });
}
