/**
 * aws-pricing.ts
 * Static AWS pricing snapshot + estimateMonthlyCost utility.
 * No API key or network request needed — safe for hackathon demos.
 */

export interface InstanceSpec {
  label: string;
  vcpu: number;
  ram: string;
  monthlyUsd: number;
}

export const AWS_EC2: Record<string, InstanceSpec> = {
  "t3.micro":   { label: "EC2 t3.micro",   vcpu: 2,  ram: "1 GiB",   monthlyUsd: 7.59   },
  "t3.small":   { label: "EC2 t3.small",   vcpu: 2,  ram: "2 GiB",   monthlyUsd: 15.18  },
  "t3.medium":  { label: "EC2 t3.medium",  vcpu: 2,  ram: "4 GiB",   monthlyUsd: 30.37  },
  "t3.large":   { label: "EC2 t3.large",   vcpu: 2,  ram: "8 GiB",   monthlyUsd: 60.74  },
  "t3.xlarge":  { label: "EC2 t3.xlarge",  vcpu: 4,  ram: "16 GiB",  monthlyUsd: 121.47 },
  "m6i.large":  { label: "EC2 m6i.large",  vcpu: 2,  ram: "8 GiB",   monthlyUsd: 70.08  },
  "m6i.xlarge": { label: "EC2 m6i.xlarge", vcpu: 4,  ram: "16 GiB",  monthlyUsd: 140.16 },
  "c6i.large":  { label: "EC2 c6i.large",  vcpu: 2,  ram: "4 GiB",   monthlyUsd: 61.20  },
};

export const AWS_RDS: Record<string, InstanceSpec> = {
  "db.t3.micro":   { label: "RDS db.t3.micro",   vcpu: 2, ram: "1 GiB",  monthlyUsd: 15.33  },
  "db.t3.small":   { label: "RDS db.t3.small",   vcpu: 2, ram: "2 GiB",  monthlyUsd: 30.66  },
  "db.t3.medium":  { label: "RDS db.t3.medium",  vcpu: 2, ram: "4 GiB",  monthlyUsd: 58.40  },
  "db.t3.large":   { label: "RDS db.t3.large",   vcpu: 2, ram: "8 GiB",  monthlyUsd: 116.80 },
  "db.m6g.large":  { label: "RDS db.m6g.large",  vcpu: 2, ram: "8 GiB",  monthlyUsd: 130.54 },
};

export interface InfraEstimate {
  tier: "low" | "moderate" | "high";
  tierLabel: string;
  badgeColor: string;
  appInstance: InstanceSpec;
  appCount: number;
  dbInstance: InstanceSpec | null;
  extras: string[];
  totalMonthlyUsd: number;
  breakdown: { label: string; cost: number }[];
}

/**
 * Maps concurrent user count to an infrastructure estimate.
 * Tiers: 0–10k = low, 10k–100k = moderate, 100k+ = high
 */
export function estimateMonthlyCost(concurrentUsers: number): InfraEstimate {
  let appKey: string;
  let appCount: number;
  let dbKey: string;
  let tier: "low" | "moderate" | "high";
  let tierLabel: string;
  let badgeColor: string;
  let extras: string[] = [];
  let extraCost = 0;

  if (concurrentUsers <= 1_000) {
    appKey = "t3.small"; appCount = 1; dbKey = "db.t3.micro";
    tier = "low"; tierLabel = "Low"; badgeColor = "emerald";
    extras = ["S3 (~$5/mo)"];
    extraCost = 5;
  } else if (concurrentUsers <= 10_000) {
    appKey = "t3.medium"; appCount = 2; dbKey = "db.t3.medium";
    tier = "low"; tierLabel = "Low-Moderate"; badgeColor = "emerald";
    extras = ["S3 (~$10/mo)", "CloudFront (~$8/mo)", "ALB (~$16/mo)"];
    extraCost = 34;
  } else if (concurrentUsers <= 50_000) {
    appKey = "t3.large"; appCount = 3; dbKey = "db.t3.large";
    tier = "moderate"; tierLabel = "Moderate"; badgeColor = "amber";
    extras = ["S3 (~$20/mo)", "CloudFront (~$20/mo)", "ALB (~$25/mo)", "ElastiCache t3.micro (~$15/mo)"];
    extraCost = 80;
  } else if (concurrentUsers <= 250_000) {
    appKey = "m6i.large"; appCount = 4; dbKey = "db.m6g.large";
    tier = "moderate"; tierLabel = "Moderate-High"; badgeColor = "amber";
    extras = ["S3 (~$40/mo)", "CloudFront (~$60/mo)", "ALB (~$35/mo)", "ElastiCache r6g.large (~$100/mo)"];
    extraCost = 235;
  } else {
    appKey = "m6i.xlarge"; appCount = 8; dbKey = "db.m6g.large";
    tier = "high"; tierLabel = "High"; badgeColor = "red";
    extras = ["S3 (~$80/mo)", "CloudFront (~$150/mo)", "ALB (~$60/mo)", "ElastiCache r6g.xlarge (~$200/mo)", "WAF (~$30/mo)"];
    extraCost = 520;
  }

  const appInstance = AWS_EC2[appKey];
  const dbInstance = AWS_RDS[dbKey];
  const appTotal = appInstance.monthlyUsd * appCount;
  const dbTotal = dbInstance.monthlyUsd;
  const total = appTotal + dbTotal + extraCost;

  return {
    tier,
    tierLabel,
    badgeColor,
    appInstance,
    appCount,
    dbInstance,
    extras,
    totalMonthlyUsd: Math.round(total),
    breakdown: [
      { label: `${appInstance.label} × ${appCount}`, cost: Math.round(appTotal) },
      { label: dbInstance.label, cost: Math.round(dbTotal) },
      { label: "Storage & CDN & misc", cost: extraCost },
    ],
  };
}
