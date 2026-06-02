-- CreateTable
CREATE TABLE "t_conversations" (
    "id" TEXT NOT NULL,
    "pairKey" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "r_conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "r_conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "t_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_conversations_pairKey_key" ON "t_conversations"("pairKey");

-- CreateIndex
CREATE INDEX "t_conversations_lastMessageAt_idx" ON "t_conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "r_conversation_participants_userId_idx" ON "r_conversation_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "r_conversation_participants_conversationId_userId_key" ON "r_conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "t_messages_conversationId_createdAt_idx" ON "t_messages"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "r_conversation_participants" ADD CONSTRAINT "r_conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "t_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_conversation_participants" ADD CONSTRAINT "r_conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "m_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_messages" ADD CONSTRAINT "t_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "t_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_messages" ADD CONSTRAINT "t_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "m_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
