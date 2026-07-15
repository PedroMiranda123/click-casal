-- CreateTable ShoppingListItem, FlyerOffer, AiUsageLog

CREATE TABLE "FlyerOffer" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "dealerName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceOre" INTEGER NOT NULL,
    "prePriceOre" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlyerOffer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FlyerOffer_externalId_key" ON "FlyerOffer"("externalId");

CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "matchedOfferId" TEXT,
    "matchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "itemsProcessed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_matchedOfferId_fkey"
    FOREIGN KEY ("matchedOfferId") REFERENCES "FlyerOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
