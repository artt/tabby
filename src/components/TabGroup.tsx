import { GroupItem } from "@/types"

type TabGroupProps = {
  tabGroup: GroupItem,
  className?: string,
  focusedTabs: number[]
}

export const TabGroup = ({tabGroup, className="", focusedTabs}: TabGroupProps) => {
  return (
    <div>
      {tabGroup.title}
    </div>
  )
}