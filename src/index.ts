import "dotenv/config";
import { marketplaceContract } from "./config/contracts.js";

async function main () {
    const owner = await marketplaceContract.getAddress();
    console.log("Marketplace Owner: ", owner);
}

main();