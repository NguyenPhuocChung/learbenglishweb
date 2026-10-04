import { LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { Avatar, Button, Descriptions, Drawer, Progress, Tag } from "antd";

function UserDetail({ user, onClose, onToggleStatus }) {
  return (
    <Drawer title="Thông tin người dùng" open={Boolean(user)} onClose={onClose} width={420}>
      {user && (
        <div className="admin-user-detail">
          <Avatar size={64} style={{ backgroundColor: "#dcece5", color: "#285a48" }}>
            {user.name.slice(0, 1)}
          </Avatar>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Trạng thái">
              <Tag color={user.status === "Active" ? "green" : "red"}>{user.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tham gia">{user.joinedAt}</Descriptions.Item>
            <Descriptions.Item label="Stories đã học">{user.stories}</Descriptions.Item>
            <Descriptions.Item label="Từ vựng đã lưu">{user.vocabulary}</Descriptions.Item>
            <Descriptions.Item label="Bài học hoàn thành">{user.completed}</Descriptions.Item>
            <Descriptions.Item label="Chuỗi học tập">{user.streak} ngày</Descriptions.Item>
          </Descriptions>
          <div className="admin-user-progress">
            <div><span>Tiến độ học tập</span><strong>{Math.min(user.completed * 3, 100)}%</strong></div>
            <Progress percent={Math.min(user.completed * 3, 100)} showInfo={false} strokeColor="#4c8b6d" />
          </div>
          <Button
            block
            danger={user.status === "Active"}
            icon={user.status === "Active" ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => onToggleStatus(user)}
          >
            {user.status === "Active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
          </Button>
        </div>
      )}
    </Drawer>
  );
}

export default UserDetail;