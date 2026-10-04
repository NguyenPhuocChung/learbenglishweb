
import {
  FireFilled,
  LogoutOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Dropdown,
  Image,
  message,
  Spin,
} from "antd";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { fetchLearnerProgress, clearAuthSession } from "../services/api";
import logo from "../assets/logo_english.png";
import "../styles/AppHeader.css";

const NAV_ITEMS = [
  { path: "/", label: "Trang chủ" },
  { path: "/stories", label: "Đọc truyện" },
  { path: "/vocabulary", label: "Từ vựng" },
  { path: "/listening", label: "Luyện nghe" },
  { path: "/speaking", label: "Luyện nói" },
  { path: "/review", label: "Ôn tập" },
];

function AppHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Lấy thông tin học viên hiện tại
   */
  useEffect(() => {
    let cancelled = false;

    const loadLearner = async () => {
      try {
        setLoading(true);

        const progress = await fetchLearnerProgress();

        if (cancelled) return;

        setUser({
          ...progress.user,

          // Thống kê học tập
          streakDays: progress.streakDays ?? 0,
          completedStories: progress.completedStories ?? 0,
          savedWords: progress.savedWords ?? 0,

          // Nếu sau này backend trả avatar
          avatar: progress.user?.avatar ?? null,
        });
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Không thể lấy thông tin học viên:",
          error
        );

        setUser(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLearner();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Kiểm tra menu đang active
   */
  const isActive = (path) =>
    path === "/stories"
      ? pathname.startsWith(path)
      : pathname === path;

  /**
   * Đăng xuất
   */
  const handleLogout = () => {
    clearAuthSession();

    setUser(null);

    message.success("Đã đăng xuất");

    navigate("/login");
  };

  /**
   * Menu tài khoản
   */
  const userMenu = {
    items: [
    
      {
        key: "logout",
        label: "Đăng xuất",
        icon: <LogoutOutlined />,
        danger: true,
      },
    ],

    onClick: ({ key }) => {
      if (key === "profile") {
        navigate("/profile");
      }

      if (key === "progress") {
        navigate("/review");
      }

      if (key === "logout") {
        handleLogout();
      }
    },
  };

  return (
    <header className="app-header">
      {/* =========================
          LOGO
      ========================= */}
      <button
        className="app-header__brand"
        onClick={() => navigate("/")}
        aria-label="Learn English - Trang chủ"
      >
        <Image
          className="app-header__logo"
          src={logo}
          width={48}
          height={48}
          alt=""
          preview={false}
        />

        <span className="app-header__brand-text">
          <strong>Learn</strong>
          <span>English</span>
        </span>
      </button>

      {/* =========================
          NAVIGATION
      ========================= */}
      <nav
        className="app-header__nav"
        aria-label="Điều hướng chính"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              className={`app-header__nav-item${
                active ? " is-active" : ""
              }`}
              onClick={() => navigate(item.path)}
              aria-current={
                active ? "page" : undefined
              }
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* =========================
          USER
      ========================= */}
      <div className="app-header__user-wrapper">
        {loading ? (
          <Spin size="small" />
        ) : user ? (
          <Dropdown
            menu={userMenu}
            placement="bottomRight"
            trigger={["click"]}
          >
            <div
              className="app-header__user"
              role="button"
              tabIndex={0}
            >
              {/* STREAK */}
              <span className="app-header__streak">
                <FireFilled />
                {user.streakDays}
              </span>

              {/* AVATAR */}
              <Avatar
                className="app-header__avatar"
                src={user.avatar || undefined}
              >
                {!user.avatar &&
                  (
                    user.name
                      ?.charAt(0)
                      ?.toUpperCase() || "A"
                  )}
              </Avatar>

              {/* NAME */}
              <span className="app-header__user-label">
                {user.name || "Học viên"}
              </span>
            </div>
          </Dropdown>
        ) : (
          <button
            className="app-header__login"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
