/*
  Warnings:

  - You are about to drop the `IndexerState` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "lastUpdatedBlock" INTEGER,
ADD COLUMN     "lastUpdatedLogIndex" INTEGER,
ADD COLUMN     "lastUpdatedTxHash" TEXT;

-- AlterTable
ALTER TABLE "NFT" ADD COLUMN     "lastUpdatedBlock" INTEGER,
ADD COLUMN     "lastUpdatedLogIndex" INTEGER,
ADD COLUMN     "lastUpdatedTxHash" TEXT;

-- DropTable
DROP TABLE "IndexerState";
