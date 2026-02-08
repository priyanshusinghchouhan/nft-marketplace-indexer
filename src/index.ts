import "dotenv/config";
import { startIndexer } from "./indexer/index.js";


async function main () {
    await startIndexer();
}

main();