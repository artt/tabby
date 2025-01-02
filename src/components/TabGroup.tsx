import { cn } from "@/lib/utils"
import { GroupItem, TabItem } from "@/types"

function handleCloseGroup(event: React.MouseEvent, tabGroup: GroupItem) {
  event.stopPropagation()
  tabGroup.children.forEach(tab => chrome.tabs.remove(tab.id!))
}

type TabGroupProps = {
  tabGroup: GroupItem,
  className?: string,
  focusedTabs: number[]
}

export const TabGroup = ({tabGroup, className="", focusedTabs}: TabGroupProps) => {
  return (
    <div
      className="tab-group my-2"
      style={{
        "--color": `var(--${tabGroup.color})`,
      } as React.CSSProperties}
    >
      <div className="tab-group-title flex items-center px-[--left-space] bg-[--color] font-bold text-background">
        <div>{tabGroup.title || "​"}</div>
        <div
          className="close-button ml-auto cursor-pointer font-bold hidden opacity-30"
          onClick={e => handleCloseGroup(e, tabGroup)}
        >
          ✕
        </div>
      </div>
      {tabGroup.children.map((item: TabItem) => (
        <Tab
          key={item.id}
          tab={item}
          className={cn(
            focusedTabs.includes(item.id!) ? "focused" : ""
          )}
        />
      ))}
    </div>
  )
}