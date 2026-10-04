import { useState } from "react";
import { LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetUserPassword } from "../services/api";
import "../styles/ForgotPassword.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Liên kết đặt lại mật khẩu không hợp lệ.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await resetUserPassword(token, password);
      setCompleted(true);
    } catch (requestError) {
      setError(requestError.message || "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-decoration forgot-decoration-1" />
      <div className="forgot-decoration forgot-decoration-2" />
      <div className="forgot-container">
        <div className="forgot-logo">
          <div className="forgot-logo-icon">📖</div>
          <div className="forgot-logo-text">
            <div><span className="forgot-logo-easy">Easy</span><span className="forgot-logo-english">English</span></div>
            <p>Học dễ dàng - Nói tự tin</p>
          </div>
        </div>

        <div className="forgot-card">
          {completed ? (
            <div className="forgot-success">
              <div className="success-icon">✓</div>
              <h1>Đổi mật khẩu thành công</h1>
              <p>Mật khẩu mới đã được lưu. Bạn có thể đăng nhập lại.</p>
              <button type="button" className="forgot-submit reset-back-button" onClick={() => navigate("/login")}>
                <span>Đến trang đăng nhập</span><ArrowLeftOutlined className="forgot-arrow" />
              </button>
            </div>
          ) : (
            <>
              <div className="forgot-icon"><LockOutlined /></div>
              <div className="forgot-heading">
                <h1>Tạo mật khẩu mới</h1>
                <p>Mật khẩu cần có ít nhất 8 ký tự.</p>
              </div>
              <form className="forgot-form" onSubmit={handleSubmit}>
                <div className="forgot-field">
                  <label htmlFor="reset-password">Mật khẩu mới</label>
                  <div className="forgot-input"><LockOutlined /><input id="reset-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></div>
                </div>
                <div className="forgot-field">
                  <label htmlFor="reset-confirm-password">Xác nhận mật khẩu</label>
                  <div className="forgot-input"><LockOutlined /><input id="reset-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} /></div>
                </div>
                {error && <p className="forgot-error" role="alert">{error}</p>}
                <button type="submit" className="forgot-submit" disabled={loading}>
                  <span>{loading ? "Đang cập nhật..." : "Đổi mật khẩu"}</span>
                  {!loading && <ArrowLeftOutlined className="forgot-arrow" />}
                </button>
              </form>
              <button type="button" className="back-login" onClick={() => navigate("/login")}>
                <ArrowLeftOutlined /><span>Quay lại đăng nhập</span>
              </button>
            </>
          )}
        </div>
        <div className="forgot-footer"><span>© 2026 EasyEnglish</span><span>•</span><span>Học tiếng Anh mỗi ngày</span></div>
      </div>
    </div>
  );
}

export default ResetPassword;