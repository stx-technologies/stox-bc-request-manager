ALTER TABLE "gasPercentiles" ADD COLUMN "autoResendAfter" integer NOT NULL default 60;
ALTER TABLE "gasPercentiles" ADD COLUMN "maxGasPrice" BIGINT NOT NULL default 20;
update "gasPercentiles" set "autoResendAfter" =  1440, "maxGasPrice" = 5000000000 where "priority"='low'
update "gasPercentiles" set "autoResendAfter" =  60, "maxGasPrice" = 10000000000 where "priority"='medium'
update "gasPercentiles" set "autoResendAfter" =  30, "maxGasPrice" = 20000000000 where "priority"='high'
update "gasPercentiles" set "autoResendAfter" =  10, "maxGasPrice" = 200000000000 where "priority"='vip'
