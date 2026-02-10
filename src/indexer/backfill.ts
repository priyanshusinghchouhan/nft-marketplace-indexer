import "dotenv/config";
import { nftMintingContract } from "../config/contracts";
import { provider } from "../config/alchemy";
import { upsertNFT } from "../services/nft.service";
import { EventLog } from "ethers";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const START_BLOCK = 10141793;

const CHUNK_SIZE = 10;

async function backFillERC721Transfers() {
  console.log("Starting ERC-721 Backfill.....");

  const latestBlock = await provider.getBlockNumber();
  console.log("Latest block: ", latestBlock);

  let fromBlock = START_BLOCK;

  while (fromBlock <= latestBlock) {
    const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, latestBlock);

    console.log(`Fetching Transfer events from ${fromBlock} - ${toBlock}`);

    const events = await nftMintingContract.queryFilter(
      nftMintingContract.filters.Transfer(),
      fromBlock,
      toBlock,
    );

    console.log(`Found ${events.length} Transfer events`);

    for (const event of events) {
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
        });

        console.log("BackFilled NFT", {
          tokenId: tokenIdStr,
          owner: to,
          txHash: event.transactionHash,
        });
      }
    }

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
