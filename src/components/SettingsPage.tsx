import { Check, Settings as SettingsIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { type Settings } from "@/entrypoints/sidepanel/App";
import React from "react";

export default function SettingsPage({ settings, setSettings }: { settings: Settings, setSettings: (settings: Settings) => void }) {

  const [apiKey, setApiKey] = React.useState(settings.apiKey)

  return(
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-7 w-7">
          <SettingsIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">OpenAI API key</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="OpenAI API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Button
                variant="outline"
                className="h-7 w-7"
                onClick={() => setSettings({ ...settings, apiKey: apiKey })}
              >
                <Check />
              </Button>
            </div>
          </div>
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
  )
}