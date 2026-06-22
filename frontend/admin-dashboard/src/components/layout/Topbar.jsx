import { Menu } from "lucide-react";

export default function Topbar({ title, onMenuClick, actions }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-white px-4 py-4 md:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden text-ink">
          <Menu size={22} />
        </button>
        <h1 className="font-display text-xl text-ink">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
