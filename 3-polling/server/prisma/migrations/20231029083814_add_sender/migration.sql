-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "senderSocketId" TEXT,
ALTER COLUMN "text" DROP NOT NULL;
