import { Router } from "express";
import { getNFTsByOwner } from "../services/nft.service";
import { ListingStatus } from "@prisma/client";
import { getUserListings } from "../services/listing.service";

const router = Router();

router.get("/:wallet/nfts", async(req, res) => {
    try{
        const { wallet } = req.params;
        console.log("Current User's wallet: ", wallet);
        const nfts = await getNFTsByOwner(wallet);

        return res.json({
            wallet: wallet.toLowerCase(),
            count: nfts.length,
            nfts
        })
    }catch(e){
        console.log("Failed to fetch nfts", e);
        return res.status(500).json({ e : "Internal server error" });
    }
});


router.get("/:wallet/listings", async(req, res)=> {
    try{

        const { wallet } = req.params;
        const { status } = req.query;

        let parsedStatus: ListingStatus| undefined;

        if(status) {
            const upper = String(status).toUpperCase();
            if(!Object.values(ListingStatus).includes(upper as ListingStatus)) {
                return res.status(400).json({ error: "Invalid status filter"});
            }

            parsedStatus = upper as ListingStatus;
        }

        const listings = await getUserListings(wallet, parsedStatus);

        console.log(`For status: ${status}, total ${listings.length} listings for ${wallet}`);

        return res.json({
            wallet: wallet.toLowerCase(),
            count: listings.length,
            listings,
        })

    }catch(e) {
        console.error("Failed to fetch listings", e);
        return res.status(500).json({ error: "Internal server error" });
    }
})

export default router;