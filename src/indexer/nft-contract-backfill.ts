import "dotenv/config";
import { nftMintingContract } from "../config/contracts";
import { provider } from "../config/alchemy";
import { upsertNFT } from "../services/nft.service";
import { EventLog } from "ethers";


const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const START_BLOCK = 10141793;

const CHUNK_SIZE = 10;

async function safeQueryFilter(filter: any, from: number, to: number, retries = 5) {
  try {
    return await nftMintingContract.queryFilter(filter, from, to);
  } catch (err) {
    if (retries === 0) throw err;

    console.log(`Retrying ${from}-${to}... (${retries} left)`);
    await new Promise(res => setTimeout(res, 1500));

    return safeQueryFilter(filter, from, to, retries - 1);
  }
}


async function backFillERC721Transfers() {
  console.log("Starting ERC-721 Backfill.....");

  const latestBlock = await provider.getBlockNumber();
  console.log("Latest block: ", latestBlock);

  let fromBlock = START_BLOCK;

  while (fromBlock <= latestBlock) {
    const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, latestBlock);

    console.log(`Fetching Transfer events from ${fromBlock} - ${toBlock}`);

    const events = await safeQueryFilter(
      nftMintingContract.filters.Transfer(),
      fromBlock,
      toBlock,
    );

    const sortedEvents = events.sort((a, b) => {
        if(a.blockNumber === b.blockNumber) {
            return a.index - b.index
        }
        return a.blockNumber - b.blockNumber;
    })

    console.log(`Found ${sortedEvents.length} Transfer events`);

    for (const event of sortedEvents) {
      if (event instanceof EventLog) {
        const { from, to, tokenId } = event.args!;
        const tokenIdStr = tokenId.toString();

        if (to === ZERO_ADDRESS) continue;

        let tokenURI: string | undefined;

        if (from === ZERO_ADDRESS) {
          try {
            tokenURI = await nftMintingContract.tokenURI(tokenId);
          } catch {
            tokenURI = undefined;
          }
        }

        await upsertNFT({
          contractAddress: nftMintingContract.target.toString().toLowerCase(),
          owner: to.toLowerCase(),
          tokenId: tokenIdStr,
          tokenURI,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          logIndex: event.index,
        });

        console.log("BackFilled NFT", {
          tokenId: tokenIdStr,
          owner: to,
          txHash: event.transactionHash,
        });
      }
    }

    await new Promise(res => setTimeout(res, 500));
    fromBlock = toBlock + 1;
  }

  console.log("ERC-721 Backfill complete");
}

backFillERC721Transfers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed", err);
    process.exit(1);
  });
