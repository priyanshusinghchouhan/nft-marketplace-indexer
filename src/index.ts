import "dotenv/config";
import { startIndexer } from "./indexer/index.js";
import marketplaceRoutes from "../src/routes/marketplace.js";
import userRoutes from "../src/routes/users.js";
import activityRoutes from "../src/routes/activity.js";
import  express  from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5173;

app.use( cors ({
    origin: process.env.FRONTEND_URL || "*"
}))



app.use(express.json());

app.use("/marketplace", marketplaceRoutes);
app.use("/users", userRoutes);
app.use("/activity", activityRoutes);


async function main () {
    try{
        await startIndexer();
        app.listen(PORT, () => {
            console.log("Server listening on PORT", PORT);
        });
    }catch(error){
        console.error("Error starting indexer", error);
        process.exit(1);
    }
}

main();