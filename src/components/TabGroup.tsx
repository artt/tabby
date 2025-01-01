import { GroupItem, TabItem } from "@/types"

type TabGroupProps = {
  tabGroup: GroupItem,
  className?: string,
  focusedTabs: number[]
}

export const TabGroup = ({tabGroup, className="", focusedTabs}: TabGroupProps) => {
  return (
    <div className="pl-[--left-space]">
      {tabGroup.title}
      {tabGroup.children.map((item: TabItem) => (
        <Tab
          key={item.id}
          tab={item}
          className={focusedTabs.includes(item.id!) ? "focused" : ""}
        />
      ))}
    </div>
  )
}