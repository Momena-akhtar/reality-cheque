import Theme from "./theme";
import UserIcon from "./user-icon";
import SettingsIcon from "./settings";

export default function ChatHeader() {
  return (
    <div className="w-full backdrop-blur-sm bg-background border-border p-2 border-b">
      <div className="flex justify-end gap-2">
      <UserIcon />
      <SettingsIcon />
        <Theme />
       
      </div>
    </div>
  );
}