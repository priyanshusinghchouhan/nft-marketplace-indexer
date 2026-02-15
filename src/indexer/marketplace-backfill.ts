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

async function backfillMarketplace() {
  console.log("Starting Marketplace Backfill...");

  const latestBlock = await provider.getBlockNumber();
  console.log("Latest block:", latestBlock);

  let fromBlock = START_BLOCK;

  while (fromBlock <= latestBlock) {
    const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, latestBlock);

    console.log(`Fetching events from ${fromBlock} - ${toBlock}`);

    const listedEvents = await safeQueryFilter(
      marketplaceContract.filters.NFTListed(),
      fromBlock,
      toBlock,
    );

    const soldEvents = await safeQueryFilter(
      marketplaceContract.filters.NFTSold(),
      fromBlock,
      toBlock,
    );

    const cancelledEvents = await safeQueryFilter(
      marketplaceContract.filters.ListingCancelled(),
      fromBlock,
      toBlock,
    );

    const priceUpdatedEvents = await safeQueryFilter(
      marketplaceContract.filters.ListingPriceUpdated(),
      fromBlock,
      toBlock,
    );

    const events = [
      ...listedEvents,
      ...soldEvents,
      ...cancelledEvents,
      ...priceUpdatedEvents,
    ];

    if (events.length === 0) {
      fromBlock = toBlock + 1;
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
    fromBlock = toBlock + 1;
  }

  console.log("Marketplace Backfill Complete.");
}

backfillMarketplace()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
