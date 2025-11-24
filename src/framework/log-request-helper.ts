import { siteConfig } from "./site-config";
import * as jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";

interface ClientInfo {
  siteName: string;
  realIp: string;
  socketIp: string;
  forwardIp: string;
  clientIp: string;
  referrer: string;
  host: string;
  protocol: string;
  domain: string;
  url: string;
  userAgentString: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string | undefined;
  deviceVendor: string | undefined;
  deviceModel: string | undefined;
  sharedHost: string;
  configSite: string;
  configOrg: string;
  multipart?: boolean;
  customer?: {
    phone: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export const getRequestInfo = async (req: any) => {
  if (!req) return {};

  // Next.js Request uses headers.get() method, but also supports direct access
  const getHeader = (name: string) => {
    if (req.headers?.get) {
      return req.headers.get(name) || req.headers.get(name.toLowerCase());
    }
    return req.headers?.[name] || req.headers?.[name.toLowerCase()];
  };

  const forwardIp = getHeader("X-Forwarded-For") || getHeader("x-forwarded-for");
  const protocol = getHeader("X-Forwarded-Proto") || getHeader("x-forwarded-proto") || "http";
  const host = getHeader("X-Forwarded-Host") || getHeader("x-forwarded-host") || getHeader("host");
  const connectionIp = getHeader("DO-Connecting-IP");
  const socketIp = ""; // Not available in Next.js Request
  const clientIp = getHeader("X-Real-IP") || getHeader("x-real-ip");
  const realIp = connectionIp || forwardIp || clientIp || "";
  const url = req.url || "";

  const userAgentString = getHeader("user-agent") || getHeader("User-Agent") || "";
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();
  const browser = result.browser.name || "";
  const browserVersion = result.browser.version || "";
  const os = result.os.name || "";
  const osVersion = result.os.version || "";
  const deviceType = result.device.type;
  const deviceVendor = result.device.vendor;
  const deviceModel = result.device.model;

  const referrer = getHeader("referer") || getHeader("Referer") || "";
  const domain = getHeader("host") || "";
  const siteName = siteConfig.siteName;
  return {
    siteName,
    realIp,
    socketIp,
    forwardIp,
    clientIp,
    referrer,
    host,
    protocol,
    domain,
    url,
    userAgentString,
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    deviceVendor,
    deviceModel,
    sharedHost: siteConfig?.domainAsOrg ? siteConfig.orgId : "",
    configSite: siteConfig.siteName,
    configOrg: siteConfig.orgId,
  };
};

const validIPAddressCheck = (v4OrV6Ip: string) => {
  if (v4OrV6Ip) {
    const v4IpPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const v6IpPattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return v4IpPattern.test(v4OrV6Ip) || v6IpPattern.test(v4OrV6Ip);
  }
  return false;
};
