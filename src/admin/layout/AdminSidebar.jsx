import {
  AppstoreOutlined,
  BookOutlined,
  ReadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { NavLink } from "react-router-dom";
import { Image } from "antd";
import logo from "../../assets/logo_english.png";
const MENU_ITEMS = [
  {
    to: "/admin",
    label: "Tổng quan",
    icon: <AppstoreOutlined />,
    end: true,
  },
  {
    to: "/admin/stories",
    label: "Stories",
    icon: <ReadOutlined />,
  },
  {
    to: "/admin/topics",
    label: "Chủ đề",
    icon: <BookOutlined />,
  },
  {
    to: "/admin/users",
    label: "Người học",
    icon: <TeamOutlined />,
  },
];

function AdminSidebar({
  mobileMenuOpen,
  onNavigate,
}) {
  return (
    <aside
      className={`admin-sidebar${
        mobileMenuOpen ? " is-open" : ""
      }`}
    >
      {/* LOGO */}
      <NavLink
        className="admin-brand"
        to="/admin"
        onClick={onNavigate}
      >
        <span >
          <Image src={logo} style={{ width: 48, height: 48 }} />
        </span>

        <span className="admin-brand-text">
          <strong>EasyEnglish</strong>
          <small>ADMIN</small>
        </span>
      </NavLink>

      {/* MENU LABEL */}
      <div className="admin-sidebar-label">
        QUẢN LÝ
      </div>

      {/* MENU */}
      <nav
        className="admin-menu"
        aria-label="Điều hướng quản trị"
      >
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `admin-menu-link${
                isActive ? " is-active" : ""
              }`
            }
          >
            <span className="admin-menu-icon">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* BOTTOM */}
      <div className="admin-sidebar-bottom">
        <div className="admin-sidebar-help">
          <div className="admin-sidebar-help-icon">
            ?
          </div>

          <div>
            <strong>EasyEnglish</strong>
            <span>Quản lý nội dung học tập</span>
          </div>
        </div>

        <div className="admin-system-status">
          <span className="admin-status-dot" />

          <span>
            Hệ thống đang hoạt động
          </span>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;