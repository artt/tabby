import OpenAI from "openai"
import { cleanUrl } from '../../utils'
import { IconButton, Input, InputGroup, InputRightElement, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react"

// import { HamburgerIcon } from "./icons"
import { GiHamburgerMenu } from "react-icons/gi";
import { ImMakeGroup } from "react-icons/im";
import { MdOutlineDeleteSweep } from "react-icons/md";

import "./style.scss"

async function group() {
  console.log("Grouping current window...")
  const window = await chrome.windows.getCurrent({populate: true})
  console.log(window)
  const allTabs = window.tabs!.map(tab => ({
    title: tab.title || "",
    url: cleanUrl(tab.url) || "",
  }))
  const tabIds = window.tabs!.map(tab => tab.id!)

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  })
  console.log("allTabs:", allTabs)
  console.log("tabIds:", tabIds)
  console.log("Making call to OpenAI...")
  const res = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    response_format: { "type": "json_object" },
    messages: [
      {
        role: "system",
        content: [
          `You help people manage their tabs by grouping the tabs by their topics.`,
          `You will be provided with an array of object: {title, url}.`,
          `Each item in the array is identified by its zero-based index.`,
          `Given this array, group them into logical groups based on the content inferred from titles and URLs, not just the domain name.`,
          `The output should be a JSON object with key "groups" whose value is an array of objects with keys "title" which specifies the tab group's name, and "tabIds" which is an array of tab IDs in respective groups.`,
          `Items that don't belong to any group should be left out.`,
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
  for (const group of newGroups) {
    console.log(`Moving tabs for group "${group.title}"`)
    const tabIdsInGroup = group.tabIds.map((tabId: number) => tabIds[tabId] || (-1 * tabId)).filter((tabId: number) => tabId > 0)
    console.log(tabIdsInGroup)
    const groupId = await chrome.tabs.group({ tabIds: tabIdsInGroup })
    chrome.tabGroups.update(groupId, { title: group.title })
  }
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

export function Controls({searchString, setSearchString}: {searchString: string, setSearchString: React.Dispatch<React.SetStateAction<string>>}) {

  function handleSearch(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchString(event.target.value)
  }

  return(
    <div className="controls-container">
      <InputGroup>
        <Input
          id="search-bar"
          placeholder='Search'
          variant="flushed"
          value={searchString}
          onChange={handleSearch}
          onKeyDown={e => {if (e.key === "Escape") setSearchString("")}}
          onFocus={e => e.target.select()}
          pl="var(--left-space)"
          pr='2rem'
        />
        <InputRightElement>
          <Menu>
            {({ isOpen }) => (
              // https://github.com/chakra-ui/chakra-ui/issues/4186#issuecomment-1762955580
              <>
              <MenuButton
                as={IconButton}
                aria-label='Commands'
                icon={<GiHamburgerMenu />}
                variant='ghost'
                size='sm'
                isRound
              />
              <MenuList display={isOpen ? "block" : "none"}>
                <MenuItem icon={<ImMakeGroup />} command='⌘G' onClick={group}>
                  Group tabs in current window
                </MenuItem>
                <MenuItem icon={<MdOutlineDeleteSweep />} command='⌘D' onClick={deduplicate}>
                  Remove duplicate tabs
                </MenuItem>
              </MenuList>
              </>
            )}
          </Menu>
        </InputRightElement>
      </InputGroup>
    </div>
  )
}