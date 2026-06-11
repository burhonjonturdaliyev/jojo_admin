import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./layouts/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UsersPage } from "./pages/UsersPage";
import { ChildrenPage } from "./pages/ChildrenPage";
import { PremiumPage } from "./pages/PremiumPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { RequestsPage } from "./pages/RequestsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SmsPage } from "./pages/SmsPage";
import { SmsLogPage } from "./pages/SmsLogPage";
import { BulkSmsPage } from "./pages/BulkSmsPage";
import { AdsPage } from "./pages/AdsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { OperatorsPage } from "./pages/OperatorsPage";
import { BlockedPage } from "./pages/BlockedPage";
import { ProductsPage } from "./pages/ProductsPage";
import { PromoBannersPage } from "./pages/PromoBannersPage";
import { OrdersPage } from "./pages/OrdersPage";
import { AdvicePage } from "./pages/AdvicePage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { RolesPage } from "./pages/RolesPage";
import { LeadsPage } from "./pages/LeadsPage";
import { KidsContentPage } from "./pages/KidsContentPage";
import { NotificationRulesPage } from "./pages/NotificationRulesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/users" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/children" element={<ChildrenPage />} />
          <Route path="/premium" element={<PremiumPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/sms" element={<SmsPage />} />
          <Route path="/sms-log" element={<SmsLogPage />} />
          <Route path="/bulk-sms" element={<BulkSmsPage />} />
          <Route path="/ads" element={<AdsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/operators" element={<OperatorsPage />} />
          <Route path="/blocked" element={<BlockedPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/banners" element={<PromoBannersPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/advice" element={<AdvicePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/kids-content" element={<KidsContentPage />} />
          <Route path="/notification-rules" element={<NotificationRulesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
