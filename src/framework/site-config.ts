export const siteConfig = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3600",
  /** Shown on login; set in env for production (e.g. Zendesk / contact form). */
  supportFormUrl:
    process.env.NEXT_PUBLIC_SUPPORT_FORM_URL || "mailto:support@joee.com.ng",
  // siteUrl:"https://xbx26pbt-3600.uks1.devtunnels.ms",
  siteName: process.env.SITE_NAME || "LociCare",
  host:process.env.API_URL || "https://joee-internal-backend-ljoov.ondigitalocean.app",
  orgId:process.env.ORG_ID || "1",
  domainAsOrg:process.env.DOMAIN_AS_ORG || false,
};
