import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFavIconUrl(url: string) {
  return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`;
}

function cleanUrl(url: string | undefined): string | undefined {
  if (!url) return url
  // separate URL into two parts using ^https?:\/\/[^/]+\/ regex
  // if there is no match, return the original URL
  url = decodeURI(url)
  return url.split("?")[0].replace(/^https?:\/\//, "").split("/")[0].replace("www.google.com", "")
  // const match = url.match(/(^https?:\/\/[^/]+\/)(.*)/)
  // if (!match) return url
  // return match[1] + match[2].replace(/([a-zA-Z0-9]{10,})/g, "")
}

export function processTabsForOpenAi(tabs: chrome.tabs.Tab[]): unknown {
  return tabs.map((tab, i) => ({
    id: i,
    title: tab.title?.replace(/ - Google Search$/, "") || "",
    url: cleanUrl(tab.url) || "",
  }))
}