import { useEffect, useMemo, useState } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
  Space,
  Switch,
  Table,
  message,
  Popconfirm,
} from "antd";

import TopicForm from "./../components/TopicForm";
import { requestApi } from "../../services/api";

function mapTopic(topic) {
  return {
    ...topic,
    id: topic._id,
    stories: topic.stories ?? 0,
    status: topic.status === "active" ? "Active" : "Inactive",
  };
}

function Topics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");

  const [editingTopic, setEditingTopic] =
    useState(null);

  const [formOpen, setFormOpen] =
    useState(false);

  const [messageApi, contextHolder] =
    message.useMessage();

  useEffect(() => {
    let active = true;
    requestApi("/topics")
      .then((result) => { if (active) setTopics((result.data ?? []).map(mapTopic)); })
      .catch((error) => { if (active) setLoadError(error.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, []);

  const filteredTopics = useMemo(() => {
    const keyword = search.toLowerCase();

    return topics.filter(
      (topic) =>
        topic.name
          .toLowerCase()
          .includes(keyword) ||
        topic.description
          .toLowerCase()
          .includes(keyword)
    );
  }, [topics, search]);

  const openCreate = () => {
    setEditingTopic(null);
    setFormOpen(true);
  };

  const openEdit = (topic) => {
    setEditingTopic(topic);
    setFormOpen(true);
  };

  const saveTopic = async (values) => {
    const payload = { ...values };
    try {
      const result = editingTopic
        ? await requestApi(`/topics/${editingTopic.id}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await requestApi("/topics", { method: "POST", body: JSON.stringify(payload) });
      const savedTopic = mapTopic({ ...result.data, stories: editingTopic?.stories ?? 0 });
      setTopics((current) => editingTopic
        ? current.map((topic) => topic.id === editingTopic.id ? savedTopic : topic)
        : [...current, savedTopic]);
      messageApi.success(editingTopic ? "Đã cập nhật chủ đề" : "Đã thêm chủ đề mới");
      setFormOpen(false);
      setEditingTopic(null);
    } catch (error) {
      messageApi.error(error.message || "Không thể lưu chủ đề.");
    }
  };

  const toggleStatus = async (topic) => {
    const nextStatus = topic.status === "Active" ? "inactive" : "active";
    try {
      const result = await requestApi(`/topics/${topic.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      const updatedTopic = mapTopic({ ...result.data, stories: topic.stories });
      setTopics((current) => current.map((item) => item.id === topic.id ? updatedTopic : item));
    } catch (error) {
      messageApi.error(error.message || "Không thể cập nhật trạng thái chủ đề.");
    }
  };

  const deleteTopic = async (id) => {
    try {
      await requestApi(`/topics/${id}`, { method: "DELETE" });
      setTopics((prev) => prev.filter((topic) => topic.id !== id));
      messageApi.success("Đã xóa chủ đề");
    } catch (error) {
      messageApi.error(error.message || "Không thể xóa chủ đề; hãy kiểm tra Story đang sử dụng chủ đề này.");
    }
  };

  const columns = [
    {
      title: "CHỦ ĐỀ",
      key: "name",
      width: 280,
      render: (_, topic) => (
        <div className="topic-table-cell">
          <div className="topic-icon">
            <FolderOpenOutlined />
          </div>

          <div>
            <strong>{topic.name}</strong>
            <span>{topic.description}</span>
          </div>
        </div>
      ),
    },

    {
      title: "STORIES",
      dataIndex: "stories",
      width: 130,
      render: (stories) => (
        <div className="topic-story-count">
          <strong>{stories}</strong>
          <span>stories</span>
        </div>
      ),
    },

    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      width: 150,
      render: (status, topic) => (
        <Switch
          checked={status === "Active"}
          checkedChildren="Hoạt động"
          unCheckedChildren="Tắt"
          onChange={() =>
            toggleStatus(topic)
          }
        />
      ),
    },

    {
      title: "",
      key: "actions",
      width: 100,
      align: "right",
      render: (_, topic) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() =>
              openEdit(topic)
            }
          />

          <Popconfirm
            title="Xóa chủ đề?"
            description="Các Story thuộc chủ đề này sẽ cần được xử lý lại."
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() =>
              deleteTopic(topic.id)
            }
          >
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
            />
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
              CONTENT
            </span>

            <h1>Chủ đề</h1>

            <p>
              Phân loại Stories giúp người học
              dễ dàng tìm nội dung phù hợp.
            </p>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            Thêm chủ đề
          </Button>
        </div>

        {loadError && <p className="admin-api-error" role="alert">{loadError}</p>}

        {/* TOPIC SUMMARY */}
        <div className="topic-summary-grid">
          <div className="topic-summary-card blue">
            <div className="topic-summary-icon">
              <FolderOpenOutlined />
            </div>

            <div>
              <span>Tổng chủ đề</span>
              <strong>{topics.length}</strong>
            </div>
          </div>

          <div className="topic-summary-card green">
            <div className="topic-summary-icon">
              <FolderOpenOutlined />
            </div>

            <div>
              <span>Đang hoạt động</span>
              <strong>
                {
                  topics.filter(
                    (item) =>
                      item.status ===
                      "Active"
                  ).length
                }
              </strong>
            </div>
          </div>

          <div className="topic-summary-card orange">
            <div className="topic-summary-icon">
              <FolderOpenOutlined />
            </div>

            <div>
              <span>Tổng Stories</span>
              <strong>
                {topics.reduce(
                  (sum, topic) =>
                    sum + topic.stories,
                  0
                )}
              </strong>
            </div>
          </div>
        </div>

        <div className="admin-content-card">
          <div className="content-card-header">
            <div>
              <h3>Danh sách chủ đề</h3>

              <span>
                {filteredTopics.length} chủ đề
              </span>
            </div>
          </div>

          <div className="admin-table-toolbar">
            <div className="admin-filter-controls">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Tìm chủ đề..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="admin-table-wrap">
            <Table
              columns={columns}
              dataSource={filteredTopics}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 8,
                showSizeChanger: false,
              }}
              scroll={{ x: 700 }}
            />
          </div>
        </div>

        <TopicForm
          open={formOpen}
          initialValues={editingTopic}
          onCancel={() => {
            setFormOpen(false);
            setEditingTopic(null);
          }}
          onSubmit={saveTopic}
        />
      </div>
    </>
  );
}

export default Topics;