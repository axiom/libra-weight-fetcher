import { A, useLocation } from "@solidjs/router";
import SettingsModal from "./SettingsModal";

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { href: "/", label: "🏠 Home" },
    { href: "/chart", label: "📈 Chart" },
    { href: "/calendar", label: "📅 Calendar" },
  ];

  const isActive = (path: string) => {
    const loc = location.pathname;
    return loc === path || loc === path + "/";
  };

  return (
    <nav class="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-sm">
      <div class="flex gap-6 px-8 py-4 max-w-5xl mx-auto items-center">
        <div class="flex gap-6">
          {navItems.map((item) => (
            <A
              href={item.href}
              class="no-underline text-gray-900 dark:text-gray-100 font-medium py-2 border-b-2 border-transparent hover:border-orange-500 dark:hover:border-orange-500 transition-colors duration-200"
              style={{
                "border-color": isActive(item.href) ? "orange" : "transparent",
              }}
            >
              {item.label}
            </A>
          ))}
        </div>
        <div class="ml-auto" style={{ "margin-left": "auto" }}>
          <SettingsModal />
        </div>
      </div>
    </nav>
  );
}
