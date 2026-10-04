import { useEffect, useState } from "react";
import {
  DeleteOutlined,
  LockOutlined,
  SearchOutlined,
  TeamOutlined,
  UnlockOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Input,
  Select,
  Space,
  Table,
  Tag,
  message,
  Popconfirm,
} from "antd";

import UserDetail from "./UserDetail";
import { requestApi } from "../../services/api";

function mapUser(user) {
  return {
    ...user,
    id: user.id ?? user._id,
    status: user.status === "active" ? "Active" : user.status === "blocked" ? "Blocked" : user.status,
  };
}

function Users() {
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({ totalUsers: 0, activeUsers: 0, newUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [messageApi, contextHolder] =
    message.useMessage();

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ limit: "100" });
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter.toLowerCase());

      setLoading(true);
      setLoadError("");
      requestApi(`/users?${params.toString()}`)
        .then((result) => {
          if (!active) return;
          setUsers((result.data ?? []).map(mapUser));
          setUserStats(result.stats ?? { totalUsers: 0, activeUsers: 0, newUsers: 0 });
        })
        .catch((error) => { if (active) setLoadError(error.message); })
        .finally(() => { if (active) setLoading(false); });
    }, 200);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, statusFilter]);

  const filteredUsers = users;

  const toggleStatus = async (user) => {
    const nextStatus = user.status === "Active" ? "blocked" : "active";
    try {
      const result = await requestApi(`/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      const updatedUser = mapUser(result.data);
      setUsers((current) => current.map((item) => item.id === user.id ? updatedUser : item));
      setSelectedUser((current) => current?.id === user.id ? { ...current, ...updatedUser } : current);
      messageApi.success(nextStatus === "active" ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
    } catch (error) {
      messageApi.error(error.message || "Không thể cập nhật tài khoản.");
    }
  };

  const openUser = async (user) => {
    try {
      const result = await requestApi(`/users/${user.id}`);
      setSelectedUser(mapUser(result.data));
    } catch (error) {
      messageApi.error(error.message || "Không thể tải thông tin người dùng.");
    }
  };

  const deleteUser = async (user) => {
    try {
      await requestApi(`/users/${user.id}`, { method: "DELETE" });
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setSelectedUser((current) => current?.id === user.id ? null : current);
      messageApi.success("Đã xóa tài khoản người dùng");
    } catch (error) {
      messageApi.error(error.message || "Không thể xóa người dùng.");
    }
  };

  const columns = [
    {
      title: "NGƯỜI HỌC",
      key: "user",
      width: 300,
      render: (_, user) => (
        <button
          className="admin-user-cell"
          onClick={() => openUser(user)}
        >
          <Avatar
            size={42}
            style={{
              background:
                "linear-gradient(135deg, #238FF2, #6BB7F8)",
              color: "#fff",
            }}
          >
            {user.name.charAt(0)}
          </Avatar>

          <span>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
        </button>
      ),
    },

    {
      title: "STORIES",
      dataIndex: "stories",
      width: 110,
      render: (stories) => (
        <strong className="table-number">
          {stories}
        </strong>
      ),
    },

    {
      title: "TỪ VỰNG",
      dataIndex: "vocabulary",
      width: 120,
      render: (vocabulary) => (
        <strong className="table-number">
          {vocabulary}
        </strong>
      ),
    },

    {
      title: "BÀI HỌC",
      dataIndex: "completed",
      width: 120,
      render: (completed) => (
        <strong className="table-number">
          {completed}
        </strong>
      ),
    },

    {
      title: "STREAK",
      dataIndex: "streak",
      width: 100,
      render: (streak) => (
        <div className="user-streak">
          🔥 {streak}
        </div>
      ),
    },

    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      width: 130,
      render: (status) => (
        <Tag
          className={
            status === "Active"
              ? "user-status active"
              : "user-status blocked"
          }
        >
          {status === "Active"
            ? "Đang hoạt động"
            : "Đã khóa"}
        </Tag>
      ),
    },

    {
      title: "",
      key: "action",
      width: 80,
      align: "right",
      render: (_, user) => (
        <Space>
          <Button
            aria-label={user.status === "Active" ? `Khóa ${user.name}` : `Mở khóa ${user.name}`}
            type="text"
            danger={user.status === "Active"}
            icon={user.status === "Active" ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => toggleStatus(user)}
          />
          <Popconfirm title={`Xóa tài khoản ${user.name}?`} okText="Xóa" cancelText="Hủy" onConfirm={() => deleteUser(user)}>
            <Button aria-label={`Xóa ${user.name}`} type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <div className="admin-page">
        <div className="admin-page-heading">
          <div>
            <span className="admin-eyebrow">
              COMMUNITY
            </span>

            <h1>Người học</h1>

            <p>
              Quản lý tài khoản và theo dõi
              hoạt động học tập.
            </p>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="user-summary-grid">
          <div className="user-summary-card blue">
            <div className="user-summary-icon">
              <TeamOutlined />
            </div>

            <div>
              <span>Tổng người dùng</span>
              <strong>{userStats.totalUsers}</strong>
            </div>
          </div>

          <div className="user-summary-card green">
            <div className="user-summary-icon">
              <UserAddOutlined />
            </div>

            <div>
              <span>Đang hoạt động</span>
              <strong>{userStats.activeUsers}</strong>
            </div>
          </div>

          <div className="user-summary-card orange">
            <div className="user-summary-icon">
              <TeamOutlined />
            </div>

            <div>
              <span>Mới tháng này</span>
              <strong>{userStats.newUsers}</strong>
            </div>
          </div>
        </div>

        {loadError && <p className="admin-api-error" role="alert">{loadError}</p>}

        {/* TABLE */}
        <div className="admin-content-card">
          <div className="content-card-header">
            <div>
              <h3>Danh sách người học</h3>

              <span>
                {filteredUsers.length} người dùng
              </span>
            </div>
          </div>

          <div className="admin-table-toolbar">
            <div className="admin-filter-controls">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Tìm theo tên hoặc email..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  {
                    value: "all",
                    label: "Tất cả trạng thái",
                  },
                  {
                    value: "Active",
                    label: "Đang hoạt động",
                  },
                  {
                    value: "Blocked",
                    label: "Đã khóa",
                  },
                ]}
              />
            </div>
          </div>

          <div className="admin-table-wrap">
            <Table
              columns={columns}
              dataSource={filteredUsers}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 8,
                showSizeChanger: false,
              }}
              scroll={{ x: 950 }}
            />
          </div>
        </div>
      </div>

      <UserDetail
        user={selectedUser}
        onClose={() =>
          setSelectedUser(null)
        }
        onToggleStatus={toggleStatus}
      />
    </>
  );
}

export default Users;