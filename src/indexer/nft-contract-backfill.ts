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

export async function backFillERC721TransfersFromBlock(
  fromBlock: number,
  toBlock?: number,
): Promise<void> {
  const endBlock = toBlock ?? (await provider.getBlockNumber());

  if (fromBlock > endBlock) {
    console.log("NFT gap-fill: no blocks to process.");
    return;
  }

  console.log(`ERC-721 backfill: ${fromBlock} -> ${endBlock}`);

  let current = fromBlock;

  while (current <= endBlock) {
    const chunkEnd = Math.min(current + CHUNK_SIZE - 1, endBlock);

    console.log(`Fetching Transfer events from ${current} - ${chunkEnd}`);

    const events = await safeQueryFilter(
      nftMintingContract.filters.Transfer(),
      current,
      chunkEnd,
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
    current = chunkEnd + 1;
  }

  console.log("ERC-721 Backfill complete");
}

async function backFillERC721Transfers() {
  const latestBlock = await provider.getBlockNumber();
  await backFillERC721TransfersFromBlock(START_BLOCK, latestBlock);
}

const isRunDirectly =
  typeof require !== "undefined" && require.main === module;

if (isRunDirectly) {
  backFillERC721Transfers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Backfill failed", err);
      process.exit(1);
    });
}
