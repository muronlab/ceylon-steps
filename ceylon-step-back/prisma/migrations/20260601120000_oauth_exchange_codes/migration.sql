-- CreateTable
CREATE TABLE "t_oauth_exchange_codes" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "t_oauth_exchange_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_oauth_exchange_codes_codeHash_key" ON "t_oauth_exchange_codes"("codeHash");

-- CreateIndex
CREATE INDEX "t_oauth_exchange_codes_userId_idx" ON "t_oauth_exchange_codes"("userId");

-- CreateIndex
CREATE INDEX "t_oauth_exchange_codes_expiresAt_idx" ON "t_oauth_exchange_codes"("expiresAt");

-- AddForeignKey
ALTER TABLE "t_oauth_exchange_codes" ADD CONSTRAINT "t_oauth_exchange_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "m_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
