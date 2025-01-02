import { cn, getFavIconUrl } from "@/lib/utils"
import { TabItem } from "@/types"

type TabProps = {
  tab: TabItem,
  className?: string,
}

export const Tab = ({tab, className=""}: TabProps) => {

  function handleClick(event: React.MouseEvent) {
    event.stopPropagation()
    chrome.windows.update(tab.windowId!, {focused: true})
    chrome.sidePanel.open({windowId: tab.windowId!})
    chrome.tabs.update(tab.id!, {active: true})
  }

  function handleClose(event: React.MouseEvent) {
    event.stopPropagation()
    chrome.tabs.remove(tab.id!)
  }

  return (
    <div
      className={cn(
        "tab flex items-center h-[--tab-height] px-[--left-space] transition-height",
        className,
        tab.active ? "active": "",
      )}
      onClick={handleClick}
    >
      <img className="w-4 h-4" src={tab.favIconUrl || getFavIconUrl(tab.url || "") || undefined} alt="" />
      <div className="mx-2 overflow-hidden text-ellipsis whitespace-nowrap cursor-default">{tab.title}</div>
      <div
        className="tab-close-button ml-auto cursor-pointer font-bold hidden opacity-30"
        onClick={handleClose}
      >
        ✕
      </div>
    </div>
  )
}