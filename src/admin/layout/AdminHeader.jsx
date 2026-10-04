import {
  BellOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Image } from "antd";
import logo from "../../assets/logo_english.png";
import {
  Avatar,
  Breadcrumb,
  Button,
} from "antd";

import {
  Link,
  useLocation,
} from "react-router-dom";

const PAGE_LABELS = {
  "/admin": "Tổng quan",
  "/admin/stories": "Stories",
  "/admin/topics": "Chủ đề",
  "/admin/users": "Người học",
};

function AdminHeader({ onMenuClick }) {
  const { pathname } = useLocation();

  const pageLabel =
    PAGE_LABELS[pathname] ?? "Quản trị";

  return (
    <header className="admin-header">
      {/* LEFT */}
      <div className="admin-header-left">
        <Button
          className="admin-mobile-menu"
          type="text"
          icon={<Image src={logo}/>}
          aria-label="Mở menu"
          onClick={onMenuClick}
        />

        <Breadcrumb
          items={[
            {
              title: (
                <Link to="/admin">
                  EasyEnglish
                </Link>
              ),
            },

            ...(pathname === "/admin"
              ? []
              : [
                  {
                    title: pageLabel,
                  },
                ]),
          ]}
        />
      </div>

      {/* RIGHT */}
      <div className="admin-header-user">
        <Button
          className="admin-notification"
          type="text"
          icon={<BellOutlined />}
          aria-label="Thông báo"
        >
          <span className="admin-notification-dot" />
        </Button>

        <div className="admin-header-divider" />

        <Avatar
          size={36}
          className="admin-header-avatar"
        >
          A
        </Avatar>

        <div className="admin-header-user-info">
          <strong>Admin</strong>
          <span>Quản trị viên</span>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;