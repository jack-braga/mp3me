import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LibraryIcon, PlaylistIcon, SettingsIcon } from "@/components/icons";

const navItems = [
  { to: "/library", label: "Library", icon: LibraryIcon },
  { to: "/playlists", label: "Playlists", icon: PlaylistIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function BottomNav() {
  return (
    <nav className="flex items-center justify-around border-t border-border bg-background px-2 pb-1 pt-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
