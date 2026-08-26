import { useState, useCallback } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import AdminProducts from "../../pages/admin/AdminProducts";
import AdminInventory from "../../pages/admin/AdminInventory";
import AdminOrders from "../../pages/admin/AdminOrders";
import AdminCustomers from "../../pages/admin/AdminCustomers";
import AdminReturns from "../../pages/admin/AdminReturns";
import AdminMetrics from "../../pages/admin/AdminMetrics";
import AdminSettings from "../../pages/admin/AdminSettings";
import ToastContainer, { useToasts } from "./Toast";
import type { AdminTab } from "./AdminSidebar";

export interface AdminContextType {
  addToast: (message: string, type?: "success" | "warning" | "info") => void;
  setActiveTab: (tab: AdminTab) => void;
}

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const { toasts, removeToast } = useToasts();

  const handleTabChange = useCallback((tab: AdminTab) => {
    setActiveTab(tab);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "products":
        return <AdminProducts />;
      case "inventory":
        return <AdminInventory />;
      case "orders":
        return <AdminOrders />;
      case "customers":
        return <AdminCustomers />;
      case "returns":
        return <AdminReturns />;
      case "metrics":
        return <AdminMetrics />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f3f4f6] text-slate-800 antialiased">
      <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="flex-1 overflow-y-auto bg-[#f4f5f7] p-8 custom-scrollbar">
          {renderContent()}
        </main>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
