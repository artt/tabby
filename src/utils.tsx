export function getColor(colorName: string | undefined): string {
  return {
    grey: "#606367",
    blue: "#3871e0",
    red: "#c84031",
    yellow: "#eeae3c",
    green: "#3c7e40",
    pink: "#bf3082",
    purple: "#9648eb",
    cyan: "#357981",
    orange: "#ec9550",
  }[colorName || ""] || "#000000"
}

// dark mode colors... will deal with these later.
// #d5d7db
// #7fabf7
// #f08077
// #fdd058
// #76c28a
// #ff80c4
// #bd7ff8
// #6dd4e9
// #fca365

export function cleanUrl(url: string | undefined): string | undefined {
  if (!url) return url
  // separate URL into two parts using ^https?:\/\/[^/]+\/ regex
  // if there is no match, return the original URL
  const match = url.match(/(^https?:\/\/[^/]+\/)(.*)/)
  if (!match) return url
  return match[1] + match[2].replace(/([a-zA-Z0-9]{10,})/g, "")
}