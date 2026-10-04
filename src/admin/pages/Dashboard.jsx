import {
  BookOutlined,
  FireOutlined,
  ReadOutlined,
  TeamOutlined,
  UserAddOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { Card, Table } from "antd";
import StatCard from "./../components/StatCard";
import { requestApi } from "../../services/api";

const popularColumns = [
  {
    title: "Story",
    dataIndex: "title",
    key: "title",
    render: (title) => (
      <div className="dashboard-story">
        <div className="dashboard-story-icon">
          <ReadOutlined />
        </div>

        <div>
          <strong>{title}</strong>
        </div>
      </div>
    ),
  },
  {
    title: "Chủ đề",
    dataIndex: "topic",
    key: "topic",
    render: (topic) => (
      <span className="dashboard-topic">{topic?.name ?? topic ?? "—"}</span>
    ),
  },
  {
    title: "Lượt xem",
    dataIndex: "views",
    key: "views",
    align: "right",
    render: (views) => (
      <strong className="dashboard-views">
        {views.toLocaleString()}
      </strong>
    ),
  },
];

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    requestApi("/admin/dashboard")
      .then((result) => { if (active) setDashboard(result.data); })
      .catch((error) => { if (active) setLoadError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = dashboard?.stats ?? {};
  const chartData = dashboard?.registrationsByDay ?? [];
  const popularStories = dashboard?.popularStories ?? [];
  const activities = dashboard?.recentActivity ?? [];
  const registrationCount = chartData.reduce((sum, item) => sum + item.count, 0);
  const maxRegistrations = Math.max(1, ...chartData.map((item) => item.count));
  const weeklyActivity = dashboard?.weeklyActivity ?? { completions: 0, vocabularySaves: 0 };

  return (
    <div className="admin-page dashboard-page">
      {/* HEADER */}
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">EASYENGLISH ADMIN</span>

          <h1>Xin chào, Admin 👋</h1>

          <p>
            Theo dõi tình hình học tập và nội dung của EasyEnglish.
          </p>
        </div>
      </div>

      {loadError && <p className="admin-api-error" role="alert">{loadError}</p>}

      {/* STATS */}
      <div className="admin-stat-grid">
        <StatCard
          title="Người dùng"
          value={stats.totalUsers ?? 0}
          icon={<TeamOutlined />}
          tone="blue"
          note="Tổng học viên"
        />

        <StatCard
          title="Người dùng mới"
          value={stats.newUsers ?? 0}
          icon={<UserAddOutlined />}
          tone="orange"
          note="Đăng ký tháng này"
        />

        <StatCard
          title="Stories"
          value={stats.totalStories ?? 0}
          icon={<ReadOutlined />}
          tone="purple"
          note={`${stats.publishedStories ?? 0} đã xuất bản`}
        />

        <StatCard
          title="Chủ đề"
          value={stats.totalTopics ?? 0}
          icon={<BookOutlined />}
          tone="green"
          note={`${stats.activeTopics ?? 0} đang hoạt động`}
        />
      </div>

      {/* CHART + ACTIVITY */}
      <div className="admin-dashboard-grid admin-dashboard-primary">
        <Card
          className="admin-panel"
          title={
            <div className="panel-title">
              <div className="panel-title-icon blue">
                <UserAddOutlined />
              </div>

              <div>
                <strong>Người dùng mới</strong>
                <span>7 ngày gần đây</span>
              </div>
            </div>
          }
        >
          <div className="dashboard-chart-summary">
            <div>
              <strong>{registrationCount}</strong>
              <span>lượt đăng ký</span>
            </div>

            <div className="chart-growth">
              <span>{chartData.length}</span>
              <small>ngày theo dõi</small>
            </div>
          </div>

          <div className="admin-signup-chart">
            {chartData.map((item) => (
              <div
                className="admin-chart-column"
                key={item.label}
              >
                <div className="chart-value">
                  {item.count}
                </div>

                <div className="admin-chart-bar-track">
                  <div
                    className="admin-chart-bar"
                    style={{
                      height: `${(item.count / maxRegistrations) * 100}%`,
                    }}
                  />
                </div>

                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          className="admin-panel"
          title={
            <div className="panel-title">
              <div className="panel-title-icon orange">
                <FireOutlined />
              </div>

              <div>
                <strong>Hoạt động gần đây</strong>
                <span>Người học mới nhất</span>
              </div>
            </div>
          }
        >
          <div className="admin-activity-list">
            {activities.length ? activities.map((activity) => (
              <div
                className="admin-activity-item"
                key={activity.id}
              >
                <div
                  className={`admin-activity-marker ${activity.type}`}
                />

                <div className="activity-content">
                  <strong>{activity.title}</strong>

                  <span>{activity.detail}</span>

                  <small>{activity.time}</small>
                </div>
              </div>
            )) : <p className="admin-dashboard-empty">Chưa có hoạt động gần đây.</p>}
          </div>
        </Card>
      </div>

      {/* POPULAR STORIES + WEEKLY */}
      <div className="admin-dashboard-grid admin-dashboard-secondary">
        <Card
          className="admin-panel"
          title={
            <div className="panel-title">
              <div className="panel-title-icon purple">
                <ReadOutlined />
              </div>

              <div>
                <strong>Stories được yêu thích</strong>
                <span>Nội dung có nhiều lượt xem nhất</span>
              </div>
            </div>
          }
        >
          <div className="dashboard-table">
            <Table
              columns={popularColumns}
              dataSource={popularStories}
              rowKey="_id"
              pagination={false}
              loading={loading}
              size="middle"
            />
          </div>
        </Card>

        <Card
          className="admin-panel"
          title={
            <div className="panel-title">
              <div className="panel-title-icon green">
                <PlayCircleOutlined />
              </div>

              <div>
                <strong>Hoạt động tuần này</strong>
                <span>Tình hình học tập</span>
              </div>
            </div>
          }
        >
          <div className="weekly-summary">
            <div className="weekly-number">
              <strong>{weeklyActivity.completions + weeklyActivity.vocabularySaves}</strong>
              <span>hoạt động 7 ngày</span>
            </div>

            <div className="weekly-progress">
              <div>
                <span>Đăng ký mới trong 7 ngày</span>
                <strong>{registrationCount}</strong>
              </div>
            </div>

            <div className="weekly-breakdown">
              <div>
                <span className="weekly-dot blue" />
                <span>Stories hoàn thành</span>
                <strong>{weeklyActivity.completions}</strong>
              </div>

              <div>
                <span className="weekly-dot orange" />
                <span>Từ vựng đã lưu</span>
                <strong>{weeklyActivity.vocabularySaves}</strong>
              </div>

              <div>
                <span className="weekly-dot purple" />
                <span>Người đăng ký</span>
                <strong>{registrationCount}</strong>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;