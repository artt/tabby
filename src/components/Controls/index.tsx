import React from "react"
import OpenAI from "openai"
import { processTabsForOpenAi } from '../../utils'
import { IconButton, Input, InputGroup, InputRightElement, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react"
import { useDisclosure } from '@chakra-ui/react'

// import { HamburgerIcon } from "./icons"
import { GiHamburgerMenu } from "react-icons/gi";
import { ImMakeGroup } from "react-icons/im";
import { ImUngroup } from "react-icons/im";
import { MdOutlineDeleteSweep } from "react-icons/md";
import { FaSortAmountDownAlt } from "react-icons/fa";

import "./style.scss"

async function group(apiKey: string) {
  console.log("Grouping current window...")
  const window = await chrome.windows.getCurrent({populate: true})
  console.log(window)
  const allTabs = processTabsForOpenAi(window.tabs!)
  const tabIds = window.tabs!.map(tab => tab.id!)

  const openai = new OpenAI({
    apiKey: apiKey, // import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  })
  console.log("allTabs:", allTabs)
  console.log("tabIds:", tabIds)
  console.log("Making call to OpenAI...")
  const res = await openai.chat.completions.create({
    // model: "gpt-3.5-turbo-1106",
    // model: "gpt-4-0125-preview",
    model: "gpt-4o",
    response_format: { "type": "json_object" },
    messages: [
      {
        role: "system",
        content: [
          `You help people manage their tabs by grouping the tabs by their topics.`,
          `You will be provided with an array of object: {id, title, url} which contains the tab's ID, title, and domain/subdomain.`,
          `The URL field could be empty.`,
          `Please group them into logical groups based on titles and domain/subdomains.`,
          `The output should be a JSON object with a single key, "groups".`,
          `The value of that key is an array of objects with keys "title" which specifies the tab group's name, and "tabIds" which is an array of tab's IDs in each group.`,
          `Items that don't belong to any group should be in its own group named "Others".`,
          `Make sure each tab is assigned to exactly one group.`,
        ].join(' '),
      },
      {
        role: "user",
        content: JSON.stringify(allTabs),
      }
    ]
  })
  const newGroups = JSON.parse(res.choices[0].message.content || `{"groups": []}`)["groups"]
  console.log("Get new grouping", newGroups)
  // move the tabs accordingly
  // TODO: as of now, tabs that already have groups that are determined to not have any groups are not moved
  for (const group of newGroups) {
    console.log(`Moving tabs for group "${group.title}"`)
    const tabIdsInGroup = group.tabIds.map((tabId: number) => tabIds[tabId] || (-1 * tabId)).filter((tabId: number) => tabId > 0)
    console.log(tabIdsInGroup)
    const groupId = await chrome.tabs.group({ tabIds: tabIdsInGroup })
    chrome.tabGroups.update(groupId, { title: group.title })
  }
}

async function ungroup() {
  const window = await chrome.windows.getCurrent({populate: true})
  chrome.tabs.ungroup(window.tabs!.map(tab => tab.id!))
}

// https://github.com/Litee/prevent-duplicate-tabs-chrome-extension/blob/master/src/background.ts
async function deduplicate() {
  chrome.tabs.query({}, tabs => {
    const alreadyEncounteredTabUrls = new Set()
    tabs.forEach(tab => {
      if (alreadyEncounteredTabUrls.has(tab.url)) {
          chrome.tabs.remove(tab.id!);
      }
      alreadyEncounteredTabUrls.add(tab.url);
    })
  })
  // TODO: report how many tabs are closed in a toast
  // TODO: needo to check if the tabs really are the same?
}

function sortTabs(a: chrome.tabs.Tab, b: chrome.tabs.Tab) {
  if (!a.url) return 1
  if (!b.url) return -1
  if (a.url < b.url) return -1
  if (a.url > b.url) return 1
  return 0
}

async function sort() {
  
  const window = await chrome.windows.getCurrent({populate: true})
  const tabGroups = await chrome.tabGroups.query({windowId: window.id})

  // loop over tabGroups and sort by url of each tabgroup
  for (let i = 0; i < tabGroups.length; i++ ) {
    console.log(`Sorting tabs for group ${i}`)
    const tabs = await chrome.tabs.query({groupId: tabGroups[i].id})
    const firstIndex = tabs[0].index
    tabs.sort(sortTabs)
    // move the tabs to the sorted order
    chrome.tabs.move(tabs.map(tab => tab.id!), {index: firstIndex})
  }

  // now sort ungrouped tabs
  const tabs = await chrome.tabs.query({groupId: -1})
  tabs.sort(sortTabs)
  chrome.tabs.move(tabs.map(tab => tab.id!), {index: -1})

}

type ControlsProps = {
  searchString: string
  setSearchString: React.Dispatch<React.SetStateAction<string>>
  onSettingsOpen: () => void
  apiKey: string
}

export function Controls({ searchString, setSearchString, apiKey }: ControlsProps) {

  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure()

  function handleSearch(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchString(event.target.value)
  }

  // on blur, close the menu
  React.useEffect(() => {
    function handleBlur(e: FocusEvent) {
      if (e.target === window) {
        onMenuClose()
      }
    }
    window.addEventListener("blur", handleBlur)
    return () => {window.removeEventListener("blur", handleBlur)}
  }, [onMenuClose])

  return(
    <div className="controls-container">
      <InputGroup size='lg'>
        <Input
          id="search-bar"
          placeholder='Search'
          variant="flushed"
          value={searchString}
          onChange={handleSearch}
          onKeyDown={e => {
            e.stopPropagation()
            if (e.key === "Escape") setSearchString("")
          }}
          onFocus={e => {
            e.target.select()
          }}
          pl="var(--left-space)"
          pr='calc(2*var(--input-height))'
        />
        <InputRightElement>
          <Menu isOpen={isMenuOpen} onOpen={onMenuOpen} onClose={onMenuClose}>
            <MenuButton
              as={IconButton}
              aria-label='Commands'
              icon={<GiHamburgerMenu />}
              variant='ghost'
              isRound
            />
            <MenuList display={isMenuOpen ? "block" : "none"}>

              <MenuItem icon={<ImMakeGroup />} command='⌘G' onClick={() => group(apiKey)}>
                Group tabs
              </MenuItem>
              <MenuItem icon={<ImUngroup />} command='⌘U' onClick={ungroup}>
                Ungroup tabs
              </MenuItem>
              <MenuItem icon={<MdOutlineDeleteSweep />} command='⌘D' onClick={deduplicate}>
                Remove duplicate tabs
              </MenuItem>
              <MenuItem icon={<FaSortAmountDownAlt />} command='⌘S' onClick={sort}>
                Sort tabs by URL
              </MenuItem>

            </MenuList>
          </Menu>
        </InputRightElement>
      </InputGroup>
    </div>
  )
}

