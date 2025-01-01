// import {SortableContext, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable';
// import {CSS} from '@dnd-kit/utilities';
// import { Tab, TabGroup } from '.';
import { GroupItem, TabItem, TreeItem, WindowItem } from '@/types';
import { Tab } from './Tab';
import { TabGroup } from './TabGroup';

export function Window({window, focusedTabs, className}: {window: WindowItem, focusedTabs: number[], className?: string}) {
  
  if (window.children.length === 0) {
    return null
  }

  return (
    <div>
      <div>
        {window.id}
      </div>
      {window.children.map((item: TabItem | GroupItem) => {
        if (item.kind === "tab") {
          return (
            <Tab
              key={item.id}
              tab={(item as TabItem)}
              className={focusedTabs.includes(item.id!) ? "focused" : ""}
            />
          )
        }
        else {
          return (
            <TabGroup
              key={item.id}
              tabGroup={(item as GroupItem)}
              className={item.kind}
              focusedTabs={focusedTabs}
            />
          )
        }
      })}
    </div>
  )
  
}