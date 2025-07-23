"use client"
import Theme from "./theme";
import UserIcon from "./user-icon";
import SettingsIcon from "./settings";
import Logo from "./logo";

export default function ChatHeader() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-2 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <Logo />
      <div className="flex justify-end gap-2">
        <UserIcon />
        <SettingsIcon />
        <Theme />
      </div>
    </div>
  );
}