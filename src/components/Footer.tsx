import { IconButton } from "@chakra-ui/react"
import { FaCog } from "react-icons/fa"

type FooterProps = {
  numTabs: number
  rawWindows: chrome.windows.Window[]
  onSettingsOpen: () => void
}

export default function Footer({ numTabs, rawWindows, onSettingsOpen }: FooterProps) {
  return (
    <div className="footer-container">
      <div className="status">{`Managing ${numTabs} tab${numTabs === 1 ? "" : "s"} in ${rawWindows.length} window${rawWindows.length === 1 ? "" : "s"}`}</div>
      <IconButton
        icon={<FaCog />}
        aria-label='Settings'
        variant='ghost'
        isRound
        onClick={onSettingsOpen}
      />
    </div>
  )
}