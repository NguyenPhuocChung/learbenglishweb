import { useEffect } from "react";
import { Form, Input, Modal, Select } from "antd";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

function StoryForm({ open, initialValues, topics, onCancel, onSubmit }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.setFieldsValue(initialValues ?? { level: "Beginner", status: "Draft", vocabulary: [] });
    else form.resetFields();
  }, [form, initialValues, open]);

  return (
    <Modal
      title={initialValues ? "Chỉnh sửa truyện" : "Thêm truyện mới"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Lưu truyện"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <div className="admin-form-row">
          <Form.Item name="title" label="Tên Story" rules={[{ required: true, message: "Nhập tên Story" }]}>
            <Input placeholder="Ví dụ: A Day at the Beach" />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true, message: "Nhập slug" }]}>
            <Input placeholder="a-day-at-the-beach" />
          </Form.Item>
        </div>
        <Form.Item name="summary" label="Mô tả">
          <Input.TextArea rows={2} placeholder="Mô tả ngắn về Story" />
        </Form.Item>
        <Form.Item name="topic" label="Chủ đề" rules={[{ required: true, message: "Chọn chủ đề" }]}>
          <Select options={topics.map((topic) => ({ label: topic.name, value: topic._id }))} />
        </Form.Item>
        <div className="admin-form-row">
          <Form.Item name="level" label="Cấp độ" rules={[{ required: true }]}>
            <Select options={LEVELS.map((level) => ({ label: level, value: level }))} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select options={["Published", "Draft"].map((status) => ({ label: status, value: status }))} />
          </Form.Item>
        </div>
        <Form.Item name="coverImage" label="Ảnh đại diện (URL)">
          <Input placeholder="https://example.com/cover.jpg" />
        </Form.Item>
        <Form.Item name="content" label="Nội dung Story" rules={[{ required: true, message: "Nhập nội dung Story" }]}>
          <Input.TextArea rows={5} placeholder="Nhập nội dung Story..." />
        </Form.Item>
        <Form.Item name="vocabulary" label="Từ vựng liên quan">
          <Select mode="tags" tokenSeparators={[",", ";"]} placeholder="Nhập từ, sau đó nhấn Enter" />
        </Form.Item>
        <Form.Item name="audioUrl" label="Audio URL">
          <Input placeholder="https://example.com/story.mp3" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default StoryForm;