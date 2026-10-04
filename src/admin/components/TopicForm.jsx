import { useEffect } from "react";
import { Form, Input, Modal } from "antd";

function TopicForm({ open, initialValues, onCancel, onSubmit }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.setFieldsValue(initialValues ?? {});
    else form.resetFields();
  }, [form, initialValues, open]);

  return (
    <Modal
      title={initialValues ? "Chỉnh sửa chủ đề" : "Thêm chủ đề mới"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="Lưu chủ đề"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item name="name" label="Tên chủ đề" rules={[{ required: true, message: "Nhập tên chủ đề" }]}>
          <Input placeholder="Ví dụ: Daily life" />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Mô tả chủ đề" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default TopicForm;