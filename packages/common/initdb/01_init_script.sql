--drop table "transactions";
--drop table "requests";
--drop table "accountNonces";
--drop table "gasPrices";

CREATE EXTENSION IF NOT EXISTS CITEXT;

CREATE TABLE "requests"
(
    "id" UUID PRIMARY KEY,
    "type" CHARACTER VARYING(256) NOT NULL,
    "priority" CHARACTER VARYING(256),
    "data" json,
    "error" json,
    "result" json,
    "createdAt" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    "transactionPreparedAt" timestamp with time zone,
    "sentAt" timestamp with time zone,
    "completedAt" timestamp with time zone
);

CREATE INDEX requests_id ON "requests" USING btree ("id");
CREATE INDEX requests_type ON "requests" USING btree ("type");
CREATE INDEX requests_completed_at ON "requests" USING btree ("completedAt");
CREATE INDEX requests_sent_at ON "requests" USING btree ("sentAt");
CREATE INDEX requests_transaction_prepared_at ON "requests" USING btree ("transactionPreparedAt");

CREATE TABLE "transactions"
(
    "id" UUID PRIMARY KEY ,
    "requestId" UUID NOT NULL,
    "type" CHARACTER VARYING(256) NOT NULL,
    "subRequestIndex" INTEGER DEFAULT 0,
    "subRequestData" json,
    "subRequestType" CHARACTER VARYING(256),
    "transactionHash" CHARACTER VARYING(66),
    "originalTransactionId" CHARACTER VARYING(66),
    "transactionData" bytea,
    "network" CHARACTER VARYING(256) NOT NULL,
    "from" CITEXT,
    "to" CITEXT,
    "currentBlockTime" timestamp with time zone,
    "blockNumber" BIGINT,
    "nonce" BIGINT,
    "error" json,
    "gasPrice" BIGINT,
    "receipt" json,
    "createdAt" timestamp with time zone default CURRENT_DATE NOT NULL,
    "sentAt" timestamp with time zone,
    "resentAt" timestamp with time zone,
    "canceledAt" timestamp with time zone,
    "completedAt" timestamp with time zone,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT transactions_requestId_fk FOREIGN KEY ("requestId")
      REFERENCES "requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX transactions_id ON "transactions" USING btree ("id");
CREATE INDEX transactions_request_id ON "transactions" USING btree ("requestId");
CREATE INDEX transactions_type ON "transactions" USING btree ("type");
CREATE INDEX transactions_completed_at ON "transactions" USING btree ("completedAt");
CREATE INDEX transactions_sent_at ON "transactions" USING btree ("sentAt");
CREATE INDEX transactions_nonce ON "transactions" USING btree ("nonce");
CREATE INDEX transactions_from ON "transactions" USING btree ("from");
CREATE INDEX transactions_to ON "transactions" USING btree ("to");
CREATE INDEX transactions_network ON "transactions" USING btree ("network");
CREATE INDEX transactions_updated_at ON "transactions" USING btree ("updatedAt");
CREATE INDEX transactions_transaction_hash ON "transactions" USING btree ("transactionHash");

CREATE TABLE "accountNonces"
(
    "account" CITEXT,
    "network" CHARACTER VARYING(256),
    "nonce" BIGINT,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    "createdAt" timestamp with time zone default CURRENT_DATE NOT NULL,
        "errorAt" timestamp with time zone,
    CONSTRAINT tokensBalances_pk PRIMARY KEY ("account", "network")
);

CREATE TABLE "gasPercentiles"
(
    "percentile" INTEGER,
    "priority" CHARACTER VARYING(256) NOT NULL UNIQUE,
    "price" BIGINT,
    "network" CHARACTER VARYING(256),
    "updatedAt" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    "createdAt" timestamp with time zone default CURRENT_DATE NOT NULL
);
INSERT INTO "gasPercentiles" ("percentile", "priority", "price", "network") VALUES ('10', 'low', '0', 'MAIN');
INSERT INTO "gasPercentiles" ("percentile", "priority", "price", "network") VALUES ('20', 'medium', '0', 'MAIN');
INSERT INTO "gasPercentiles" ("percentile", "priority", "price", "network") VALUES ('50', 'high', '0', 'MAIN');
INSERT INTO "gasPercentiles" ("percentile", "priority", "price", "network") VALUES ('70', 'vip', '0', 'MAIN');
