-- Deja el enum con efectivo, transferencia, nequi y tarjeta de crédito.
-- Postgres no permite quitar valores de un enum, así que se recrea el tipo.
UPDATE "Payment" SET "method" = 'TRANSFERENCIA' WHERE "method" IN ('DAVIPLATA', 'OTRO');

ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";

CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'TARJETA');

ALTER TABLE "Payment"
  ALTER COLUMN "method" TYPE "PaymentMethod" USING ("method"::text::"PaymentMethod");

DROP TYPE "PaymentMethod_old";
