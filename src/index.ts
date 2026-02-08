import "dotenv/config";
import { startIndexer } from "./indexer/index.js";
import marketplaceRoutes from "../src/routes/marketplace.js";
import  express  from "express";

const app = express();
const PORT = 5173;

app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});

app.use("/marketplace", marketplaceRoutes);


async function main () {
    await startIndexer();
}

main();