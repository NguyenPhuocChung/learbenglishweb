import { useState } from "react";
import {
    Button,
    Modal,
    Upload,
    Table,
    Alert,
    message,
    Space,
    Typography,
} from "antd";
import {
    UploadOutlined,
    FileExcelOutlined,
    InboxOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

const { Text } = Typography;
const { Dragger } = Upload;

function ExcelImport({
    open,
    onCancel,
    onSuccess,
    importApi,
}) {
    const [file, setFile] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const reset = () => {
        setFile(null);
        setRows([]);
        setError("");
    };

    const handleCancel = () => {
        if (loading) return;

        reset();
        onCancel?.();
    };

    const handleFile = async (selectedFile) => {
        setError("");

        try {
            const buffer = await selectedFile.arrayBuffer();

            const workbook = XLSX.read(buffer, {
                type: "array",
            });

            const sheetName = workbook.SheetNames[0];

            if (!sheetName) {
                throw new Error("File Excel không có Sheet.");
            }

            const worksheet = workbook.Sheets[sheetName];

            const data = XLSX.utils.sheet_to_json(worksheet, {
                defval: "",
                raw: false,
            });

            if (!data.length) {
                throw new Error("File Excel không có dữ liệu.");
            }

            const normalizedRows = data.map((row) => ({
                title: String(row.title ?? "").trim(),
                slug: String(row.slug ?? "").trim(),
                description: String(
                    row.description ?? row.summary ?? ""
                ).trim(),
                topic: String(row.topic ?? "").trim(),
                level: String(row.level ?? "Beginner").trim(),
                status: String(row.status ?? "draft").trim().toLowerCase(),
                coverImage: String(row.coverImage ?? "").trim(),
                content: String(row.content ?? "").trim(),
                audioUrl: String(row.audioUrl ?? "").trim(),


            }));

            setFile(selectedFile);
            setRows(normalizedRows);
        } catch (err) {
            setError(err.message || "Không thể đọc file Excel.");
            setFile(null);
            setRows([]);
        }

        return false;
    };

    const handleImport = async () => {
        if (!rows.length) {
            message.warning("Chưa có dữ liệu để import.");
            return;
        }

        if (!importApi) {
            message.error("Chưa cấu hình API lưu Story.");
            return;
        }

        setLoading(true);
        setError("");

        let successCount = 0;
        const errors = [];

        try {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];

                const payload = {
                    title: row.title,
                    slug: row.slug,
                    description: row.description || "",
                    topic: row.topic,
                    level: row.level || "Beginner",
                    status: row.status || "draft",
                    coverImage: row.coverImage || "",
                    content: row.content,
                    audioUrl: row.audioUrl || "",

                    // Nếu backend tự tạo vocabulary thì KHÔNG gửi field này
                    // vocabulary: ...
                };

                try {
                    const result = await importApi(payload);

                    if (!result?.data) {
                        throw new Error("API không trả về dữ liệu Story.");
                    }

                    successCount++;
                } catch (err) {
                    errors.push(
                        `Dòng Excel ${i + 2}: ${err?.message || "Import thất bại"
                        }`
                    );
                }
            }

            if (successCount > 0) {
                message.success(
                    `Thêm thành công ${successCount}/${rows.length} Stories.`
                );

                await onSuccess?.();
            }

            if (errors.length > 0) {
                setError(
                    `Có ${errors.length} dòng thất bại:\n${errors.join("\n")}`
                );
            } else {
                reset();
                onCancel?.();
            }
        } catch (err) {
            setError(err?.message || "Import thất bại.");
        } finally {
            setLoading(false);
        }
    };
    const previewColumns = [
        {
            title: "#",
            key: "index",
            width: 60,
            render: (_, __, index) => index + 1,
        },
        {
            title: "Tiêu đề",
            dataIndex: "title",
            width: 240,
        },
        {
            title: "Chủ đề",
            dataIndex: "topic",
            width: 150,
        },
        {
            title: "Cấp độ",
            dataIndex: "level",
            width: 120,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 120,
        },
         {
            title: "Nội dung",
            dataIndex: "content",
            width: 220,
        },

    ];

    return (
        <Modal
            open={open}
            title={
                <Space>
                    <FileExcelOutlined />
                    Import Stories từ Excel
                </Space>
            }
            width={1000}
            onCancel={handleCancel}
            footer={[
                <Button
                    key="cancel"
                    onClick={handleCancel}
                    disabled={loading}
                >
                    Hủy
                </Button>,

                <Button
                    key="import"
                    type="primary"
                    icon={<UploadOutlined />}
                    loading={loading}
                    disabled={!rows.length}
                    onClick={handleImport}
                >
                    Import {rows.length ? `${rows.length} Story` : ""}
                </Button>,
            ]}
        >
            <div style={{ marginBottom: 20 }}>
                <Alert
                    type="info"
                    showIcon
                    message="Định dạng Excel"
                    description={
                        <div>
                            <Text>
                                File Excel nên có các cột:
                            </Text>

                            <br />

                            <Text code>
                                title, slug, description, topic, level,
                                status, coverImage, content, audioUrl,
                                vocabulary
                            </Text>

                            <br />

                            <Text type="secondary">
                                vocabulary có thể nhập nhiều từ, cách nhau
                                bằng dấu phẩy, dấu chấm phẩy hoặc xuống dòng.
                            </Text>
                        </div>
                    }
                />
            </div>

            <Dragger
                accept=".xlsx,.xls,.csv"
                maxCount={1}
                showUploadList={false}
                beforeUpload={handleFile}
                disabled={loading}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>

                <p className="ant-upload-text">
                    Kéo file Excel vào đây hoặc click để chọn
                </p>

                <p className="ant-upload-hint">
                    Hỗ trợ .xlsx, .xls, .csv
                </p>
            </Dragger>

            {file && (
                <div style={{ marginTop: 16 }}>
                    <Text strong>
                        File: {file.name}
                    </Text>
                </div>
            )}

            {error && (
                <Alert
                    style={{ marginTop: 16 }}
                    type="error"
                    showIcon
                    message={error}
                />
            )}

            {rows.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 10,
                        }}
                    >
                        <Text strong>
                            Xem trước dữ liệu
                        </Text>

                        <Text type="secondary">
                            {rows.length} dòng
                        </Text>
                    </div>

                    <Table
                        size="small"
                        bordered
                        columns={previewColumns}
                        dataSource={rows}
                        rowKey={(_, index) => index}
                        pagination={{
                            pageSize: 5,
                            showSizeChanger: false,
                        }}
                        scroll={{
                            x: 900,
                        }}
                    />
                </div>
            )}
        </Modal>
    );
}

export default ExcelImport;
