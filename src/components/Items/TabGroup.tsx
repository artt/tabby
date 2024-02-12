import { GroupItem, TabItem, TreeItem } from "../../types"
import React from "react"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import {CSS} from '@dnd-kit/utilities';
import { Tab } from ".";

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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: tabGroup.id});

  const style = {
    transform: CSS.Translate.toString(transform),
    // transform: CSS.Transform.toString(transform),
    transition: `${transition}, height .2s ease-in-out`,
  };

  const [numTabsDisplayed, setNumTabsDisplayed] = React.useState(0)

  React.useEffect(() => {
    setNumTabsDisplayed(focusedTabs.length > 0 ? tabGroup.children.filter(tab => focusedTabs.includes(tab.id!)).length : tabGroup.children.length)
  }, [focusedTabs, tabGroup.children])

  return (
    <div
      ref={setNodeRef}
      className={"first-level tab-group " + className}
      style={{
        ...style,
        "--color": `var(--${tabGroup.color})`,
        opacity: isDragging ? 0.5 : 1
      } as React.CSSProperties}
      {...attributes}
      {...listeners}
    >
      <div className="tab-group-header">
        <div className="tab-group-title">{tabGroup.title || "​"}</div>
        <div className="tab-close-icon" onClick={e => handleCloseGroup(e, tabGroup)}>✕</div>
      </div>
      
      {tabGroup.children.length > 0 &&
        <div
          className="tab-group-children"
          style={{
            height: isDragging ? 0 : `${numTabsDisplayed * 20}px`,
            transition: "height 0.2s",
          }}
        >
          <SortableContext 
            items={tabGroup.children.map((item: TreeItem) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {tabGroup.children.map((item: TabItem) => <Tab key={item.id} tab={item} className={focusedTabs.includes(item.id!) ? "focused" : ""} />)}
          </SortableContext>
        </div>
      }
    </div>
  )
}