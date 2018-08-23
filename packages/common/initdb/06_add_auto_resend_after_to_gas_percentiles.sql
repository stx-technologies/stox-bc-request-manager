ALTER TABLE "gasPercentiles" ADD COLUMN "autoResendAfterMinutes" integer NOT NULL default 60;
ALTER TABLE "gasPercentiles" ADD COLUMN "maxGasPrice" BIGINT NOT NULL default 20;
update "gasPercentiles" set "autoResendAfterMinutes" =  1440, "maxGasPrice" = 5000000000 where "priority"='low'
update "gasPercentiles" set "autoResendAfterMinutes" =  60, "maxGasPrice" = 10000000000 where "priority"='medium'
update "gasPercentiles" set "autoResendAfterMinutes" =  30, "maxGasPrice" = 20000000000 where "priority"='high'
update "gasPercentiles" set "autoResendAfterMinutes" =  10, "maxGasPrice" = 200000000000 where "priority"='vip'
