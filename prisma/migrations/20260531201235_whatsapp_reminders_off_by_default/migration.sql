-- AlterTable: default to opt-in (off) for WhatsApp reminders
ALTER TABLE "Shop" ALTER COLUMN "whatsappRemindersEnabled" SET DEFAULT false;

-- Reset existing shops to off (feature not yet live; shops opt in explicitly)
UPDATE "Shop" SET "whatsappRemindersEnabled" = false;
