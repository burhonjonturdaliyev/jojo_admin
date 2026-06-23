import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { NewLoginAlert } from "../components/NewLoginAlert";

export function AdminLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      {/* Akkauntga yangi qurilmadan login bo'lsa — global bildirishnoma */}
      <NewLoginAlert />
    </div>
  );
}
