drop table "transactions";
drop table "requests";
drop table "accountNounces";

CREATE TABLE "requests"
(
    "id" UUID PRIMARY KEY,
    "type" CHARACTER VARYING(256) NOT NULL,
    "data" json,
    "error" json,
    "result" json,
    "createdAt" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    "sentAt" timestamp with time zone,
    "completedAt" timestamp with time zone
);

CREATE INDEX requests_id ON "requests" USING btree ("id");
CREATE INDEX requests_type ON "requests" USING btree ("type");
CREATE INDEX requests_completed_at ON "requests" USING btree ("completedAt");
CREATE INDEX requests_sent_at ON "requests" USING btree ("sentAt");

CREATE TABLE "transactions"
(
    "id" UUID PRIMARY KEY ,
    "requestId" UUID NOT NULL,
    "type" CHARACTER VARYING(256) NOT NULL,
    "subRequestIndex" INTEGER DEFAULT 0,
    "subRequestData" json,
    "subRequestType" CHARACTER VARYING(256),
    "transactionHash" CHARACTER VARYING(66),
    "transactionData" bytea,
    "network" CHARACTER VARYING(256),
    "from" CHARACTER(42),
    "to" CHARACTER(42),
    "currentBlockTime" timestamp with time zone,
    "blockNumber" BIGINT,
    "nounce" BIGINT,
    "error" json,
    "gasPrice" INTEGER,
    "receipt" CHARACTER VARYING(256),
    "createdAt" timestamp with time zone default CURRENT_DATE NOT NULL,
    "sentAt" timestamp with time zone,
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
CREATE INDEX transactions_nounce ON "transactions" USING btree ("nounce");
CREATE INDEX transactions_from ON "transactions" USING btree ("from");
CREATE INDEX transactions_to ON "transactions" USING btree ("to");
CREATE INDEX transactions_network ON "transactions" USING btree ("network");
CREATE INDEX transactions_updated_at ON "transactions" USING btree ("updatedAt");

CREATE TABLE "accountNounces"
(
    "account" CHARACTER(42),
    "network" CHARACTER VARYING(256),
    "nounce" BIGINT,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    "createdAt" timestamp with time zone default CURRENT_DATE NOT NULL,
    CONSTRAINT tokensBalances_pk PRIMARY KEY ("account", "network")
);
