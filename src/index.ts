import "dotenv/config";
import { startIndexer } from "./indexer/index.js";
import marketplaceRoutes from "../src/routes/marketplace.js";
import userRoutes from "../src/routes/users.js";
import activityRoutes from "../src/routes/activity.js";
import  express  from "express";
import cors from "cors";

const app = express();
const PORT = 5173;

app.use( cors ({
    origin: "http://localhost:3000"
}))

app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});

app.use("/marketplace", marketplaceRoutes);
app.use("/users", userRoutes);
app.use("/activity", activityRoutes);


async function main () {
    try{
        await startIndexer();
    }catch(error){
        console.error("Error starting indexer", error);
        process.exit(1);
    }
}

main();