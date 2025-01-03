import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "./ui/button";
import { Menu, Settings as SettingsIcon } from "lucide-react";
import { deduplicate, sort, ungroup } from "@/lib/browserOperations";
import React from "react";
import { PasswordInput } from "./ui/password-input";
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings } from "@/entrypoints/sidepanel/App";

export default function TopBar({ settings, setSettings }: { settings: Settings, setSettings: (settings: Settings) => void }) {

  const [settingsOpen, setSettingsOpen] = React.useState(false)

  return (
    <div className="flex h-[--controls-height] px-1 py-2 items-center">
      <div className="flex-grow">
        ccc
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon" className="rounded-full h-7 w-7">
            <Menu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={ungroup}>Ungroup tabs</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={deduplicate}>Remove duplicate tabs</DropdownMenuItem>
          <DropdownMenuItem onClick={sort}>Sort tabs</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>Settings</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet>
        <SheetTrigger>
          <Button variant="ghost" size="icon" className="rounded-full h-7 w-7">
            <SettingsIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-center">
              <Label>Show incognito windows</Label>
              <Switch
                className="ml-auto"
                checked={settings.showIncognitoWindows}
                onCheckedChange={(checked) => setSettings({ ...settings, showIncognitoWindows: checked })}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )

}