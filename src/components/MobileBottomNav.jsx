import {
  BookOutlined,
  HomeOutlined,
  SoundOutlined,
  ReadOutlined,
  AudioOutlined,
} from "@ant-design/icons";

import { useLocation, useNavigate } from "react-router-dom";
import "./../styles/MobileBottomNav.css";
const NAV_ITEMS = [
  {
    path: "/",
    label: "Trang chủ",
    icon: <HomeOutlined />,
  },
  {
    path: "/stories",
    label: "Truyện",
    icon: <ReadOutlined />,
  },
  {
    path: "/vocabulary",
    label: "Từ vựng",
    icon: <BookOutlined />,
  },
  {
    path: "/listening",
    label: "Nghe",
    icon: <SoundOutlined />,
  },
  {
    path: "/speaking",
    label: "Nói",
    icon: <AudioOutlined />,
  },
];

function MobileBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path) =>
    path === "/stories"
      ? pathname.startsWith("/stories")
      : pathname === path;

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Điều hướng mobile"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.path);

        return (
          <button
            key={item.path}
            type="button"
            className={`mobile-bottom-nav__item${
              active ? " is-active" : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            <span className="mobile-bottom-nav__icon">
              {item.icon}
            </span>

            <span style={{fontSize:8}} className="mobile-bottom-nav__label">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
//   thêm style


}

export default MobileBottomNav;