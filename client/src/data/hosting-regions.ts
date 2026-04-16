export interface RegionalDeal {
  country: string;
  countryCode: string;
  flag: string;
  population: string;
  cloudSpendRank: number | null; // null if not in top 10 cloud spend
  populationRank: number | null; // null if not in top 10 population
  recommendedProviders: {
    provider: string;
    hostTargetId: string;
    region: string;
    monthlyFrom: string;
    freeTier: boolean;
    latencyMs: string;
    signupUrl: string;
    notes: string;
  }[];
}

export const regionalDeals: RegionalDeal[] = [
  // TOP 10 CLOUD SPEND
  {
    country: "United States",
    countryCode: "US",
    flag: "🇺🇸",
    population: "349M",
    cloudSpendRank: 1,
    populationRank: 3,
    recommendedProviders: [
      { provider: "DigitalOcean", hostTargetId: "digitalocean", region: "NYC1/SFO3", monthlyFrom: "$12", freeTier: false, latencyMs: "<10ms", signupUrl: "https://m.do.co/c/openclaw", notes: "1-Click marketplace image" },
      { provider: "Railway", hostTargetId: "railway", region: "US West", monthlyFrom: "$5", freeTier: true, latencyMs: "<15ms", signupUrl: "https://railway.app", notes: "GitHub-connected PaaS" },
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "us-east-1/us-west-2", monthlyFrom: "$0", freeTier: true, latencyMs: "<5ms", signupUrl: "https://aws.amazon.com", notes: "12-month free tier (t3.micro)" },
      { provider: "Oracle Cloud", hostTargetId: "oracle-cloud", region: "us-ashburn-1", monthlyFrom: "$0", freeTier: true, latencyMs: "<10ms", signupUrl: "https://cloud.oracle.com", notes: "Always-free ARM (4 OCPU, 24GB)" },
    ],
  },
  {
    country: "China",
    countryCode: "CN",
    flag: "🇨🇳",
    population: "1.41B",
    cloudSpendRank: 2,
    populationRank: 2,
    recommendedProviders: [
      { provider: "Tencent Cloud", hostTargetId: "tencent", region: "Shanghai/Beijing/Guangzhou", monthlyFrom: "¥24", freeTier: false, latencyMs: "<10ms", signupUrl: "https://cloud.tencent.com", notes: "Lighthouse OpenClaw template" },
      { provider: "Alibaba Cloud", hostTargetId: "alibaba", region: "cn-hangzhou/cn-beijing", monthlyFrom: "¥19", freeTier: true, latencyMs: "<5ms", signupUrl: "https://www.alibabacloud.com", notes: "Largest cloud in Asia" },
    ],
  },
  {
    country: "Japan",
    countryCode: "JP",
    flag: "🇯🇵",
    population: "122M",
    cloudSpendRank: 3,
    populationRank: null,
    recommendedProviders: [
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "ap-northeast-1 (Tokyo)", monthlyFrom: "$0", freeTier: true, latencyMs: "<5ms", signupUrl: "https://aws.amazon.com", notes: "Largest cloud presence in Japan" },
      { provider: "Google Cloud", hostTargetId: "google-cloud", region: "asia-northeast1 (Tokyo)", monthlyFrom: "$0", freeTier: true, latencyMs: "<5ms", signupUrl: "https://cloud.google.com", notes: "Always-free e2-micro" },
      { provider: "Vultr", hostTargetId: "vultr", region: "Tokyo/Osaka", monthlyFrom: "$6", freeTier: false, latencyMs: "<10ms", signupUrl: "https://www.vultr.com", notes: "High-perf NVMe, 2 JP locations" },
    ],
  },
  {
    country: "United Kingdom",
    countryCode: "GB",
    flag: "🇬🇧",
    population: "70M",
    cloudSpendRank: 4,
    populationRank: null,
    recommendedProviders: [
      { provider: "Hetzner Cloud", hostTargetId: "hetzner", region: "fsn1/nbg1 (EU)", monthlyFrom: "€3.79", freeTier: false, latencyMs: "<20ms", signupUrl: "https://www.hetzner.com/cloud", notes: "Best EU price/performance" },
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "eu-west-2 (London)", monthlyFrom: "$0", freeTier: true, latencyMs: "<5ms", signupUrl: "https://aws.amazon.com", notes: "12-month free tier" },
      { provider: "OVHcloud", hostTargetId: "ovhcloud", region: "UK1 (London)", monthlyFrom: "€3.50", freeTier: false, latencyMs: "<10ms", signupUrl: "https://www.ovhcloud.com", notes: "GDPR compliant, EU data sovereignty" },
    ],
  },
  {
    country: "Germany",
    countryCode: "DE",
    flag: "🇩🇪",
    population: "84M",
    cloudSpendRank: 5,
    populationRank: null,
    recommendedProviders: [
      { provider: "Hetzner Cloud", hostTargetId: "hetzner", region: "fsn1/nbg1 (Falkenstein/Nuremberg)", monthlyFrom: "€3.79", freeTier: false, latencyMs: "<5ms", signupUrl: "https://www.hetzner.com/cloud", notes: "German-owned, GDPR native" },
      { provider: "OVHcloud", hostTargetId: "ovhcloud", region: "DE1 (Frankfurt)", monthlyFrom: "€3.50", freeTier: false, latencyMs: "<5ms", signupUrl: "https://www.ovhcloud.com", notes: "EU data sovereignty" },
      { provider: "Azure", hostTargetId: "azure-vm", region: "germanywestcentral", monthlyFrom: "$0", freeTier: true, latencyMs: "<5ms", signupUrl: "https://azure.microsoft.com", notes: "12-month free tier" },
    ],
  },
  {
    country: "Australia",
    countryCode: "AU",
    flag: "🇦🇺",
    population: "27M",
    cloudSpendRank: 6,
    populationRank: null,
    recommendedProviders: [
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "ap-southeast-2 (Sydney)", monthlyFrom: "$0", freeTier: true, latencyMs: "<5ms", signupUrl: "https://aws.amazon.com", notes: "12-month free tier" },
      { provider: "Vultr", hostTargetId: "vultr", region: "Sydney/Melbourne", monthlyFrom: "$6", freeTier: false, latencyMs: "<10ms", signupUrl: "https://www.vultr.com", notes: "2 AU locations, NVMe" },
      { provider: "Google Cloud", hostTargetId: "google-cloud", region: "australia-southeast1 (Sydney)", monthlyFrom: "$0", freeTier: true, latencyMs: "<5ms", signupUrl: "https://cloud.google.com", notes: "Always-free e2-micro" },
    ],
  },
  {
    country: "India",
    countryCode: "IN",
    flag: "🇮🇳",
    population: "1.48B",
    cloudSpendRank: 7,
    populationRank: 1,
    recommendedProviders: [
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "ap-south-1 (Mumbai)", monthlyFrom: "$0", freeTier: true, latencyMs: "<10ms", signupUrl: "https://aws.amazon.com", notes: "Largest cloud presence in India" },
      { provider: "Google Cloud", hostTargetId: "google-cloud", region: "asia-south1 (Mumbai)", monthlyFrom: "$0", freeTier: true, latencyMs: "<10ms", signupUrl: "https://cloud.google.com", notes: "Always-free e2-micro" },
      { provider: "DigitalOcean", hostTargetId: "digitalocean", region: "BLR1 (Bangalore)", monthlyFrom: "$12", freeTier: false, latencyMs: "<15ms", signupUrl: "https://m.do.co/c/openclaw", notes: "1-Click marketplace in India" },
      { provider: "Kamatera", hostTargetId: "kamatera", region: "Mumbai", monthlyFrom: "$4", freeTier: false, latencyMs: "<10ms", signupUrl: "https://www.kamatera.com", notes: "Custom configs, local DC" },
    ],
  },
  {
    country: "Singapore",
    countryCode: "SG",
    flag: "🇸🇬",
    population: "6M",
    cloudSpendRank: 8,
    populationRank: null,
    recommendedProviders: [
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "ap-southeast-1 (Singapore)", monthlyFrom: "$0", freeTier: true, latencyMs: "<5ms", signupUrl: "https://aws.amazon.com", notes: "Major APAC hub" },
      { provider: "DigitalOcean", hostTargetId: "digitalocean", region: "SGP1", monthlyFrom: "$12", freeTier: false, latencyMs: "<5ms", signupUrl: "https://m.do.co/c/openclaw", notes: "1-Click in Singapore" },
      { provider: "Vultr", hostTargetId: "vultr", region: "Singapore", monthlyFrom: "$6", freeTier: false, latencyMs: "<5ms", signupUrl: "https://www.vultr.com", notes: "Budget-friendly APAC" },
    ],
  },
  {
    country: "South Korea",
    countryCode: "KR",
    flag: "🇰🇷",
    population: "52M",
    cloudSpendRank: 9,
    populationRank: null,
    recommendedProviders: [
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "ap-northeast-2 (Seoul)", monthlyFrom: "$0", freeTier: true, latencyMs: "<5ms", signupUrl: "https://aws.amazon.com", notes: "Seoul region" },
      { provider: "Google Cloud", hostTargetId: "google-cloud", region: "asia-northeast3 (Seoul)", monthlyFrom: "$0", freeTier: true, latencyMs: "<5ms", signupUrl: "https://cloud.google.com", notes: "Seoul region" },
      { provider: "Vultr", hostTargetId: "vultr", region: "Seoul", monthlyFrom: "$6", freeTier: false, latencyMs: "<5ms", signupUrl: "https://www.vultr.com", notes: "Seoul NVMe" },
    ],
  },
  {
    country: "Canada",
    countryCode: "CA",
    flag: "🇨🇦",
    population: "40M",
    cloudSpendRank: 10,
    populationRank: null,
    recommendedProviders: [
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "ca-central-1 (Montreal)", monthlyFrom: "$0", freeTier: true, latencyMs: "<10ms", signupUrl: "https://aws.amazon.com", notes: "Canadian data residency" },
      { provider: "DigitalOcean", hostTargetId: "digitalocean", region: "TOR1 (Toronto)", monthlyFrom: "$12", freeTier: false, latencyMs: "<10ms", signupUrl: "https://m.do.co/c/openclaw", notes: "1-Click in Toronto" },
      { provider: "OVHcloud", hostTargetId: "ovhcloud", region: "CA-EAST-1 (Beauharnois)", monthlyFrom: "CA$4.50", freeTier: false, latencyMs: "<10ms", signupUrl: "https://www.ovhcloud.com", notes: "Canadian sovereignty" },
    ],
  },
  // TOP 10 POPULATION (not already in cloud spend list)
  {
    country: "Indonesia",
    countryCode: "ID",
    flag: "🇮🇩",
    population: "288M",
    cloudSpendRank: null,
    populationRank: 4,
    recommendedProviders: [
      { provider: "Alibaba Cloud", hostTargetId: "alibaba", region: "ap-southeast-5 (Jakarta)", monthlyFrom: "$4", freeTier: true, latencyMs: "<10ms", signupUrl: "https://www.alibabacloud.com", notes: "Jakarta region" },
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "ap-southeast-3 (Jakarta)", monthlyFrom: "$0", freeTier: true, latencyMs: "<10ms", signupUrl: "https://aws.amazon.com", notes: "Jakarta region" },
      { provider: "Google Cloud", hostTargetId: "google-cloud", region: "asia-southeast2 (Jakarta)", monthlyFrom: "$0", freeTier: true, latencyMs: "<10ms", signupUrl: "https://cloud.google.com", notes: "Jakarta region" },
    ],
  },
  {
    country: "Pakistan",
    countryCode: "PK",
    flag: "🇵🇰",
    population: "259M",
    cloudSpendRank: null,
    populationRank: 5,
    recommendedProviders: [
      { provider: "Kamatera", hostTargetId: "kamatera", region: "Mumbai (nearest)", monthlyFrom: "$4", freeTier: false, latencyMs: "<30ms", signupUrl: "https://www.kamatera.com", notes: "Nearest DC: Mumbai/Dubai" },
      { provider: "Vultr", hostTargetId: "vultr", region: "Mumbai (nearest)", monthlyFrom: "$6", freeTier: false, latencyMs: "<30ms", signupUrl: "https://www.vultr.com", notes: "Nearest DC: Mumbai" },
      { provider: "DigitalOcean", hostTargetId: "digitalocean", region: "BLR1 (nearest)", monthlyFrom: "$12", freeTier: false, latencyMs: "<35ms", signupUrl: "https://m.do.co/c/openclaw", notes: "Nearest DC: Bangalore" },
    ],
  },
  {
    country: "Nigeria",
    countryCode: "NG",
    flag: "🇳🇬",
    population: "242M",
    cloudSpendRank: null,
    populationRank: 6,
    recommendedProviders: [
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "af-south-1 (Cape Town)", monthlyFrom: "$0", freeTier: true, latencyMs: "<50ms", signupUrl: "https://aws.amazon.com", notes: "Nearest: Cape Town" },
      { provider: "Azure", hostTargetId: "azure-vm", region: "South Africa North (Johannesburg)", monthlyFrom: "$0", freeTier: true, latencyMs: "<50ms", signupUrl: "https://azure.microsoft.com", notes: "Nearest: Johannesburg" },
      { provider: "Vultr", hostTargetId: "vultr", region: "Johannesburg", monthlyFrom: "$6", freeTier: false, latencyMs: "<50ms", signupUrl: "https://www.vultr.com", notes: "Johannesburg DC" },
    ],
  },
  {
    country: "Brazil",
    countryCode: "BR",
    flag: "🇧🇷",
    population: "214M",
    cloudSpendRank: null,
    populationRank: 7,
    recommendedProviders: [
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "sa-east-1 (São Paulo)", monthlyFrom: "$0", freeTier: true, latencyMs: "<10ms", signupUrl: "https://aws.amazon.com", notes: "São Paulo region" },
      { provider: "Google Cloud", hostTargetId: "google-cloud", region: "southamerica-east1 (São Paulo)", monthlyFrom: "$0", freeTier: true, latencyMs: "<10ms", signupUrl: "https://cloud.google.com", notes: "São Paulo region" },
      { provider: "Azure", hostTargetId: "azure-vm", region: "brazilsouth (São Paulo)", monthlyFrom: "$0", freeTier: true, latencyMs: "<10ms", signupUrl: "https://azure.microsoft.com", notes: "São Paulo region" },
      { provider: "Vultr", hostTargetId: "vultr", region: "São Paulo", monthlyFrom: "$6", freeTier: false, latencyMs: "<10ms", signupUrl: "https://www.vultr.com", notes: "São Paulo NVMe" },
    ],
  },
  {
    country: "Bangladesh",
    countryCode: "BD",
    flag: "🇧🇩",
    population: "178M",
    cloudSpendRank: null,
    populationRank: 8,
    recommendedProviders: [
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "ap-south-1 (Mumbai)", monthlyFrom: "$0", freeTier: true, latencyMs: "<30ms", signupUrl: "https://aws.amazon.com", notes: "Nearest: Mumbai" },
      { provider: "DigitalOcean", hostTargetId: "digitalocean", region: "SGP1 (Singapore)", monthlyFrom: "$12", freeTier: false, latencyMs: "<50ms", signupUrl: "https://m.do.co/c/openclaw", notes: "Nearest: Singapore" },
      { provider: "Vultr", hostTargetId: "vultr", region: "Mumbai/Singapore", monthlyFrom: "$6", freeTier: false, latencyMs: "<30ms", signupUrl: "https://www.vultr.com", notes: "Budget-friendly" },
    ],
  },
  {
    country: "Ethiopia",
    countryCode: "ET",
    flag: "🇪🇹",
    population: "139M",
    cloudSpendRank: null,
    populationRank: 10,
    recommendedProviders: [
      { provider: "AWS EC2", hostTargetId: "aws-ec2", region: "af-south-1 (Cape Town)", monthlyFrom: "$0", freeTier: true, latencyMs: "<60ms", signupUrl: "https://aws.amazon.com", notes: "Nearest: Cape Town" },
      { provider: "Azure", hostTargetId: "azure-vm", region: "South Africa North", monthlyFrom: "$0", freeTier: true, latencyMs: "<60ms", signupUrl: "https://azure.microsoft.com", notes: "Nearest: Johannesburg" },
      { provider: "Kamatera", hostTargetId: "kamatera", region: "Israel (nearest)", monthlyFrom: "$4", freeTier: false, latencyMs: "<80ms", signupUrl: "https://www.kamatera.com", notes: "Nearest: Middle East DC" },
    ],
  },
];

// Summary stats for display
export const regionStats = {
  totalCountries: 16,
  cloudSpendCountries: 10,
  populationCountries: 10,
  uniqueProviders: 16,
  freeProviders: 4,
  lowestMonthly: "$0 (Oracle Cloud always-free)",
};
