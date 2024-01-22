export function cleanUrl(url: string | undefined): string | undefined {
  if (!url) return url
  // separate URL into two parts using ^https?:\/\/[^/]+\/ regex
  // if there is no match, return the original URL
  const match = url.match(/(^https?:\/\/[^/]+\/)(.*)/)
  if (!match) return url
  return match[1] + match[2].replace(/([a-zA-Z0-9]{10,})/g, "")
}

export function getFaviconUrl(url: string) {
  return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`;
}