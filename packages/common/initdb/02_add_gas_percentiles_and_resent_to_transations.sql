ALTER TABLE "requests" ADD COLUMN "priority" CHARACTER VARYING(256);
ALTER TABLE "transactions" ADD COLUMN "originalTransactionId" UUID;
ALTER TABLE "transactions" ADD COLUMN "resentAt" timestamp with time zone;
ALTER TABLE "transactions" ADD COLUMN "canceledAt" timestamp with time zone;


CREATE TABLE "gasPercentiles"
(
    "priority" CHARACTER VARYING(256) NOT NULL UNIQUE,
    "percentile" INTEGER NOT NULL,
    "price" BIGINT NOT NULL,
    "network" CHARACTER VARYING(256) NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    "createdAt" timestamp with time zone default CURRENT_DATE NOT NULL
);
INSERT INTO "gasPercentiles" ("priority", "percentile", "price", "network") VALUES ('low','10', '0', 'MAIN');
INSERT INTO "gasPercentiles" ("priority", "percentile", "price", "network") VALUES ('medium', '20', '0', 'MAIN');
INSERT INTO "gasPercentiles" ("priority", "percentile", "price", "network") VALUES ('high', '50', '0', 'MAIN');
INSERT INTO "gasPercentiles" ("priority", "percentile", "price", "network") VALUES ('vip', '70', '0', 'MAIN');
