import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import { deduplicate, sort, ungroup } from "@/lib/browserOperations";

export default function TopBar() {
  return (
    <div className="flex h-[--controls-height] px-1 py-2 items-center">
      <div className="flex-grow">ccc</div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon" className="rounded-full h-7 w-7">
            <Menu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={deduplicate}>Remove duplicate tabs</DropdownMenuItem>
          <DropdownMenuItem onClick={sort}>Sort tabs</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}