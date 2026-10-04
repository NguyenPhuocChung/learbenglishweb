import { useState } from "react";
import { Outlet } from "react-router-dom";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

import "../styles/Admin.css";

function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="admin-app">
      <AdminSidebar
        mobileMenuOpen={mobileMenuOpen}
        onNavigate={closeMobileMenu}
      />

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="admin-sidebar-backdrop"
          onClick={closeMobileMenu}
        />
      )}

      <div className="admin-main">
        <AdminHeader
          onMenuClick={() =>
            setMobileMenuOpen(true)
          }
        />

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;