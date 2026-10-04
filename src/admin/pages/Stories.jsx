import { useEffect, useMemo, useState } from "react";
import {
    DeleteOutlined,
    EditOutlined,
    FileExcelOutlined,
    FileTextOutlined,
    PlusOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import {
    Button,
    Input,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    message,
    Popconfirm,
} from "antd";

import StoryForm from "./../components/StoryForm";
import { requestApi } from "../../services/api";
import ExcelImport from "../components/ExcelImport";

function mapStory(record) {
    return {
        ...record,
        id: record._id,
        topicId: record.topic?._id ?? record.topic,
        topic: record.topic?.name ?? "Chưa phân loại",
        status: record.status === "published" ? "Published" : "Draft",
        summary: record.description ?? "",
        date: record.createdAt ? new Date(record.createdAt).toLocaleDateString("vi-VN") : "",
        vocabulary: (record.vocabulary ?? []).map((item) => item.word),
    };
}

function Stories() {
    const [stories, setStories] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [search, setSearch] = useState("");
    const [topicFilter, setTopicFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const [formOpen, setFormOpen] = useState(false);
    const [editingStory, setEditingStory] = useState(null);

    const [messageApi, contextHolder] = message.useMessage();


    const [importOpen, setImportOpen] = useState(false);

    //
    const loadStories = async () => {
        const result = await requestApi("/stories?limit=100");
        setStories((result.data ?? []).map(mapStory));
    };//

    useEffect(() => {
        let active = true;
        Promise.all([requestApi("/stories?limit=100"), requestApi("/topics")])
            .then(([storyResult, topicResult]) => {
                if (!active) return;
                setStories((storyResult.data ?? []).map(mapStory));
                setTopics(topicResult.data ?? []);
            })
            .catch((error) => { if (active) setLoadError(error.message); })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, []);

    const filteredStories = useMemo(() => {
        return stories.filter((story) => {
            const keyword = search.toLowerCase();

            const matchesSearch =
                story.title.toLowerCase().includes(keyword) ||
                story.slug.toLowerCase().includes(keyword);

            const matchesTopic =
                topicFilter === "all" ||
                story.topic === topicFilter;

            const matchesStatus =
                statusFilter === "all" ||
                story.status === statusFilter;

            return matchesSearch && matchesTopic && matchesStatus;
        });
    }, [stories, search, topicFilter, statusFilter]);

    const openCreate = () => {
        setEditingStory(null);
        setFormOpen(true);
    };

    const openEdit = (story) => {
        setEditingStory({ ...story, topic: story.topicId });
        setFormOpen(true);
    };

    const handleImportStory = async (values) => {
    const topicName = String(values.topic ?? "").trim();

    const topic = topics.find(
        (item) =>
            String(item.name ?? "").trim().toLowerCase() ===
            topicName.toLowerCase()
    );

    if (!topic) {
        throw new Error(
            `Không tìm thấy Topic "${topicName}".`
        );
    }

    const payload = {
        title: values.title,
        slug: values.slug,
        description: values.description ?? "",
        topic: topic._id,
        level: values.level || "Beginner",
        status: (values.status || "draft").toLowerCase(),
        coverImage: values.coverImage ?? "",
        content: values.content,
        audioUrl: values.audioUrl ?? "",
    };

    return await requestApi("/stories", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};
    const handleSave = async (values) => {
        const payload = {
            title: values.title,
            slug: values.slug,
            description: values.summary ?? "",
            topic: values.topic,
            level: values.level,
            status: values.status.toLowerCase(),
            coverImage: values.coverImage ?? "",
            content: values.content,
            audioUrl: values.audioUrl ?? "",
            vocabulary: (values.vocabulary ?? []).map((word) => ({ word, meaning: "" })),
        };

        try {
            const result = editingStory
                ? await requestApi(`/stories/${editingStory.id}`, { method: "PATCH", body: JSON.stringify(payload) })
                : await requestApi("/stories", { method: "POST", body: JSON.stringify(payload) });
            const savedStory = mapStory(result.data);
            setStories((current) => editingStory
                ? current.map((story) => story.id === editingStory.id ? savedStory : story)
                : [savedStory, ...current]);
            messageApi.success(editingStory ? "Đã cập nhật Story" : "Đã thêm Story mới");
            setFormOpen(false);
            setEditingStory(null);
        } catch (error) {
            messageApi.error(error.message || "Không thể lưu Story.");
        }
    };

    const toggleStatus = async (story) => {
        const nextStatus =
            story.status === "Published"
                ? "Draft"
                : "Published";

        try {
            const result = await requestApi(`/stories/${story.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: nextStatus.toLowerCase() }),
            });
            const updatedStory = mapStory(result.data);
            setStories((current) => current.map((item) => item.id === story.id ? updatedStory : item));
            messageApi.success(nextStatus === "Published" ? "Story đã được xuất bản" : "Story đã chuyển về bản nháp");
        } catch (error) {
            messageApi.error(error.message || "Không thể cập nhật trạng thái Story.");
        }
    };

    const deleteStory = async (id) => {
        try {
            await requestApi(`/stories/${id}`, { method: "DELETE" });
            setStories((prev) => prev.filter((story) => story.id !== id));
            messageApi.success("Đã xóa Story");
        } catch (error) {
            messageApi.error(error.message || "Không thể xóa Story.");
        }
    };

    const columns = [
        {
            title: "STORY",
            key: "story",
            width: 330,
            render: (_, story) => (
                <div className="admin-story-cell">
                    <div className="story-list-icon">
                        <FileTextOutlined />
                    </div>

                    <div>
                        <strong>{story.title}</strong>
                        <span>{story.slug}</span>
                    </div>
                </div>
            ),
        },

        {
            title: "CHỦ ĐỀ",
            dataIndex: "topic",
            width: 150,
            render: (topic) => (
                <span className="soft-topic">
                    {topic}
                </span>
            ),
        },

        {
            title: "CẤP ĐỘ",
            dataIndex: "level",
            width: 130,
            render: (level) => {
                const color =
                    level === "Beginner"
                        ? "blue"
                        : level === "Intermediate"
                            ? "purple"
                            : "orange";

                return (
                    <Tag color={color}>
                        {level}
                    </Tag>
                );
            },
        },

        {
            title: "LƯỢT XEM",
            dataIndex: "views",
            width: 120,
            render: (views) => (
                <strong className="table-number">
                    {views.toLocaleString()}
                </strong>
            ),
        },

        {
            title: "TRẠNG THÁI",
            dataIndex: "status",
            width: 140,
            render: (status, story) => (
                <Switch
                    checked={status === "Published"}
                    checkedChildren="Đăng"
                    unCheckedChildren="Nháp"
                    onChange={() => toggleStatus(story)}
                />
            ),
        },

        {
            title: "NGÀY",
            dataIndex: "date",
            width: 120,
        },

        {
            title: "",
            key: "actions",
            width: 100,
            align: "right",
            render: (_, story) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openEdit(story)}
                    />

                    <Popconfirm
                        title="Xóa Story này?"
                        description="Hành động này không thể hoàn tác."
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => deleteStory(story.id)}
                    >
                        <Button
                            type="text"
                            danger
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

                        <h1>Stories</h1>

                        <p>
                            Quản lý những câu chuyện tiếng Anh
                            dành cho người học.
                        </p>
                    </div>

                    <Space>
                        <Button
                            icon={<FileExcelOutlined />}
                            onClick={() => setImportOpen(true)}
                        >
                            Import Excel
                        </Button>

                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={openCreate}
                        >
                            Thêm Story
                        </Button>
                    </Space>


                </div>

                {loadError && <p className="admin-api-error" role="alert">{loadError}</p>}

                <div className="admin-content-card">
                    <div className="content-card-header">
                        <div>
                            <h3>Danh sách Stories</h3>
                            <span>
                                {filteredStories.length} Stories
                            </span>
                        </div>

                        <div className="stories-summary">
                            <div>
                                <strong>
                                    {
                                        stories.filter(
                                            (item) =>
                                                item.status === "Published"
                                        ).length
                                    }
                                </strong>
                                <span>Đã xuất bản</span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        stories.filter(
                                            (item) =>
                                                item.status === "Draft"
                                        ).length
                                    }
                                </strong>
                                <span>Bản nháp</span>
                            </div>
                        </div>
                    </div>

                    <div className="admin-table-toolbar stories-toolbar">
                        <div className="admin-filter-controls">
                            <Input
                                allowClear
                                prefix={<SearchOutlined />}
                                placeholder="Tìm Story..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />

                            <Select
                                value={topicFilter}
                                onChange={setTopicFilter}
                                options={[
                                    {
                                        value: "all",
                                        label: "Tất cả chủ đề",
                                    },
                                    ...topics.map((topic) => ({ value: topic.name, label: topic.name })),
                                ]}
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
                                        value: "Published",
                                        label: "Đã xuất bản",
                                    },
                                    {
                                        value: "Draft",
                                        label: "Bản nháp",
                                    },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="admin-table-wrap">
                        <Table
                            columns={columns}
                            dataSource={filteredStories}
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

                <StoryForm
                    open={formOpen}
                    initialValues={editingStory}
                    topics={topics.filter((topic) => topic.status === "active")}
                    onCancel={() => {
                        setFormOpen(false);
                        setEditingStory(null);
                    }}
                    onSubmit={handleSave}
                />
            </div>
            <ExcelImport
                open={importOpen}
                onCancel={() => setImportOpen(false)}
                onSuccess={loadStories}
                importApi={handleImportStory}
            />        </>
    );
}

export default Stories;