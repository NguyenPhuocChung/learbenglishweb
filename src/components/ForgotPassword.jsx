import { useState } from "react";
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../services/api";

import "./../styles/ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setResetUrl(result.data?.resetUrl || "");
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message || "Không gửi được yêu cầu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">

      {/* Background decoration */}
      <div className="forgot-decoration forgot-decoration-1" />
      <div className="forgot-decoration forgot-decoration-2" />

      <div className="forgot-container">

        {/* LOGO */}
        <div className="forgot-logo">

          <div className="forgot-logo-icon">
            📖
          </div>

          <div className="forgot-logo-text">
            <div>
              <span className="forgot-logo-easy">
                Easy
              </span>

              <span className="forgot-logo-english">
                English
              </span>
            </div>

            <p>
              Học dễ dàng - Nói tự tin
            </p>
          </div>

        </div>


        {/* CARD */}
        <div className="forgot-card">

          {!submitted ? (

            <>
              {/* ICON */}
              <div className="forgot-icon">
                🔐
              </div>


              {/* TITLE */}
              <div className="forgot-heading">

                <h1>
                  Quên mật khẩu?
                </h1>

                <p>
                  Đừng lo! Nhập email của bạn và
                  chúng tôi sẽ gửi hướng dẫn để
                  đặt lại mật khẩu.
                </p>

              </div>


              {/* FORM */}
              <form
                className="forgot-form"
                onSubmit={handleSubmit}
              >

                <div className="forgot-field">

                  <label>
                    Email
                  </label>

                  <div className="forgot-input">

                    <MailOutlined />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="Nhập email của bạn"
                      required
                    />

                  </div>

                </div>


                <button
                  type="submit"
                  className="forgot-submit"
                  disabled={loading}
                >
                  <span>
                    {loading ? "Đang gửi..." : "Gửi yêu cầu"}
                  </span>

                  <ArrowLeftOutlined
                    className="forgot-arrow"
                  />
                </button>

                {error && <p className="forgot-error" role="alert">{error}</p>}

              </form>


              {/* BACK LOGIN */}
              <button
                type="button"
                className="back-login"
                onClick={() => navigate("/login")}
              >
                <ArrowLeftOutlined />

                <span>
                  Quay lại đăng nhập
                </span>
              </button>

            </>

          ) : (

            /* ================= SUCCESS ================= */

            <div className="forgot-success">

              <div className="success-icon">
                ✓
              </div>

              <h1>
                Kiểm tra email của bạn
              </h1>

              <p>
                Nếu email
                <strong> {email} </strong>
                đã được đăng ký, chúng tôi sẽ gửi
                hướng dẫn đặt lại mật khẩu.
              </p>

              <p className="success-note">
                Hãy kiểm tra cả thư mục Spam nếu
                bạn chưa nhận được email.
              </p>

              {resetUrl && (
                <a className="forgot-dev-reset" href={resetUrl}>
                  Mở liên kết đặt lại mật khẩu (dev)
                </a>
              )}

              <button
                type="button"
                className="forgot-submit"
                onClick={() => navigate("/login")}
              >
                <span>
                  Quay lại đăng nhập
                </span>

                <ArrowLeftOutlined
                  className="forgot-arrow"
                />
              </button>

            </div>

          )}

        </div>


        {/* FOOTER */}
        <div className="forgot-footer">
          <span>© 2026 EasyEnglish</span>
          <span>•</span>
          <span>Học tiếng Anh mỗi ngày</span>
        </div>

      </div>

    </div>
  );
}

export default ForgotPassword;