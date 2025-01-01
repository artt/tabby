import { TabItem } from "@/types"

type TabProps = {
  tab: TabItem,
  className?: string,
}

export const Tab = ({tab, className=""}: TabProps) => {
  return (
    <div>
      {tab.title}
    </div>
  )
}