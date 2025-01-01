import { TabItem } from "@/types"

type TabProps = {
  tab: TabItem,
  className?: string,
}

// .tab-title {
//   text-overflow: ellipsis;
//   overflow: hidden;
//   white-space: nowrap;
//   cursor: default;
// }

// .tab-close-icon {
//   margin-left: auto;
//   cursor: pointer;
//   display: none;
//   opacity: 0.3;
//   font-weight: bold;
// }


export const Tab = ({tab, className=""}: TabProps) => {
  return (
    <div className="flex items-center h-[--tab-height] px-[--left-space] transition-height">
      <img className="w-4 h-4" src={tab.favIconUrl || undefined} alt="" />
      <div className="mx-2 overflow-hidden text-ellipsis whitespace-nowrap cursor-default">{tab.title}</div>
      <div className="ml-auto cursor-pointer" onClick={() => {}}>✕</div>
    </div>
  )
}