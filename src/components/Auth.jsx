import { useState } from "react";
import {
    MailOutlined,
    LockOutlined,
    UserOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    ArrowRightOutlined,
} from "@ant-design/icons";

import { Image } from "antd";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, saveAuthSession } from "../services/api";

import logo from "./../assets/logo_english.png";
import "../styles/Auth.css";

function Auth() {
    const navigate = useNavigate();

    const [mode, setMode] = useState("login");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [name, setName] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isLogin = mode === "login";


    // ================================
    // CHANGE MODE
    // ================================

    const changeMode = (newMode) => {
        setMode(newMode);

        setError("");

        setShowPassword(false);
        setShowConfirmPassword(false);

        // Không xóa email để người dùng
        // không phải nhập lại khi chuyển tab
        setPassword("");
        setConfirmPassword("");
    };


    // ================================
    // LOGIN
    // ================================

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");

        if (!email.trim()) {
            setError("Vui lòng nhập email.");
            return;
        }

        if (!password.trim()) {
            setError("Vui lòng nhập mật khẩu.");
            return;
        }

        try {
            setLoading(true);

            /*
             * ================================
             * SAU NÀY GỌI API:
             *
             * const response = await axios.post(
             *     "http://localhost:5000/api/auth/login",
             *     {
             *         email,
             *         password
             *     }
             * );
             *
             * ================================
             */

            // Tạm thời giả lập đăng nhập
            const session = await loginUser({ email, password });
            saveAuthSession(session);

            navigate("/");

        } catch (error) {
            setError(error.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };


    // ================================
    // REGISTER
    // ================================

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");

        if (!name.trim()) {
            setError("Vui lòng nhập họ và tên.");
            return;
        }

        if (!email.trim()) {
            setError("Vui lòng nhập email.");
            return;
        }

        if (!password.trim()) {
            setError("Vui lòng tạo mật khẩu.");
            return;
        }

        if (password.length < 8) {
            setError(
                "Mật khẩu phải có ít nhất 8 ký tự."
            );
            return;
        }

        if (!confirmPassword.trim()) {
            setError(
                "Vui lòng xác nhận mật khẩu."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError(
                "Mật khẩu xác nhận không khớp."
            );
            return;
        }

        try {
            setLoading(true);

            const session = await registerUser({ name, email, password });
            saveAuthSession(session);

            navigate("/");

        } catch (error) {
            setError(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="auth-page">

            {/* ================================
                BACKGROUND
            ================================= */}

            <div className="auth-decoration auth-decoration-1" />
            <div className="auth-decoration auth-decoration-2" />


            <div className="auth-container">

                {/* ================================
                    LOGO
                ================================= */}

                <div className="auth-logo">

                    <div className="auth-logo-icon">
                        <Image
                            src={logo}
                            alt="EasyEnglish"
                            preview={false}
                        />
                    </div>

                    <div className="auth-logo-text">

                        <div>
                            <span className="logo-easy">
                                Easy
                            </span>

                            <span className="logo-english">
                                English
                            </span>
                        </div>

                        <p>
                            Học dễ dàng - Nói tự tin
                        </p>

                    </div>

                </div>


                {/* ================================
                    AUTH CARD
                ================================= */}

                <div className="auth-card">


                    {/* ================================
                        TABS
                    ================================= */}

                    <div className="auth-tabs">

                        <button
                            type="button"
                            className={`auth-tab ${isLogin
                                    ? "active"
                                    : ""
                                }`}
                            onClick={() =>
                                changeMode("login")
                            }
                        >
                            Đăng nhập
                        </button>


                        <button
                            type="button"
                            className={`auth-tab ${!isLogin
                                    ? "active"
                                    : ""
                                }`}
                            onClick={() =>
                                changeMode("register")
                            }
                        >
                            Đăng ký
                        </button>

                    </div>


                    {/* ================================
                        CONTENT
                    ================================= */}

                    <div className="auth-content">


                        {isLogin ? (

                            /* =================================
                               LOGIN
                            ================================= */

                            <>

                                <div className="auth-heading">

                                    <div className="auth-welcome-icon">
                                        👋
                                    </div>

                                    <h1>
                                        Chào mừng trở lại!
                                    </h1>

                                    <p>
                                        Đăng nhập để tiếp tục
                                        hành trình học tiếng Anh
                                        của bạn.
                                    </p>

                                </div>


                                <form
                                    className="auth-form"
                                    onSubmit={handleLogin}
                                >


                                    {/* EMAIL */}

                                    <div className="auth-field">

                                        <label>
                                            Email
                                        </label>

                                        <div className="auth-input-wrapper">

                                            <MailOutlined />

                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập email của bạn"
                                                autoComplete="email"
                                            />

                                        </div>

                                    </div>


                                    {/* PASSWORD */}

                                    <div className="auth-field">

                                        <div className="auth-label-row">

                                            <label>
                                                Mật khẩu
                                            </label>


                                            <button
                                                type="button"
                                                className="forgot-password"
                                                onClick={() =>
                                                    navigate(
                                                        "/forgot-password"
                                                    )
                                                }
                                            >
                                                Quên mật khẩu?
                                            </button>

                                        </div>


                                        <div className="auth-input-wrapper">

                                            <LockOutlined />

                                            <input
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập mật khẩu"
                                                autoComplete="current-password"
                                            />


                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
                                            >

                                                {showPassword ? (
                                                    <EyeInvisibleOutlined />
                                                ) : (
                                                    <EyeOutlined />
                                                )}

                                            </button>

                                        </div>

                                    </div>


                                    {/* ERROR */}

                                    {error && (
                                        <div className="auth-error">
                                            {error}
                                        </div>
                                    )}


                                    {/* LOGIN */}

                                    <button
                                        type="submit"
                                        className="auth-submit"
                                        disabled={loading}
                                    >

                                        <span>
                                            {loading
                                                ? "Đang đăng nhập..."
                                                : "Đăng nhập"}
                                        </span>

                                        {!loading && (
                                            <ArrowRightOutlined />
                                        )}

                                    </button>

                                </form>


                                {/* SWITCH */}

                                <div className="auth-switch">

                                    <span>
                                        Chưa có tài khoản?
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            changeMode(
                                                "register"
                                            )
                                        }
                                    >
                                        Đăng ký ngay
                                    </button>

                                </div>

                            </>

                        ) : (

                            /* =================================
                               REGISTER
                            ================================= */

                            <>

                                <div className="auth-heading">

                                    <div className="auth-welcome-icon">
                                        🚀
                                    </div>

                                    <h1>
                                        Tạo tài khoản mới
                                    </h1>

                                    <p>
                                        Bắt đầu hành trình học
                                        tiếng Anh cùng
                                        EasyEnglish.
                                    </p>

                                </div>


                                <form
                                    className="auth-form"
                                    onSubmit={handleRegister}
                                >


                                    {/* NAME */}

                                    <div className="auth-field">

                                        <label>
                                            Họ và tên
                                        </label>

                                        <div className="auth-input-wrapper">

                                            <UserOutlined />

                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) =>
                                                    setName(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập họ và tên"
                                                autoComplete="name"
                                            />

                                        </div>

                                    </div>


                                    {/* EMAIL */}

                                    <div className="auth-field">

                                        <label>
                                            Email
                                        </label>

                                        <div className="auth-input-wrapper">

                                            <MailOutlined />

                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập email của bạn"
                                                autoComplete="email"
                                            />

                                        </div>

                                    </div>


                                    {/* PASSWORD */}

                                    <div className="auth-field">

                                        <label>
                                            Mật khẩu
                                        </label>

                                        <div className="auth-input-wrapper">

                                            <LockOutlined />

                                            <input
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Tạo mật khẩu"
                                                autoComplete="new-password"
                                            />

                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
                                            >

                                                {showPassword ? (
                                                    <EyeInvisibleOutlined />
                                                ) : (
                                                    <EyeOutlined />
                                                )}

                                            </button>

                                        </div>

                                    </div>


                                    {/* CONFIRM PASSWORD */}

                                    <div className="auth-field">

                                        <label>
                                            Xác nhận mật khẩu
                                        </label>

                                        <div className="auth-input-wrapper">

                                            <LockOutlined />

                                            <input
                                                type={
                                                    showConfirmPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={
                                                    confirmPassword
                                                }
                                                onChange={(e) =>
                                                    setConfirmPassword(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nhập lại mật khẩu"
                                                autoComplete="new-password"
                                            />

                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        !showConfirmPassword
                                                    )
                                                }
                                            >

                                                {showConfirmPassword ? (
                                                    <EyeInvisibleOutlined />
                                                ) : (
                                                    <EyeOutlined />
                                                )}

                                            </button>

                                        </div>

                                    </div>


                                    {/* ERROR */}

                                    {error && (
                                        <div className="auth-error">
                                            {error}
                                        </div>
                                    )}


                                    {/* REGISTER */}

                                    <button
                                        type="submit"
                                        className="auth-submit"
                                        disabled={loading}
                                    >

                                        <span>
                                            {loading
                                                ? "Đang tạo tài khoản..."
                                                : "Tạo tài khoản"}
                                        </span>

                                        {!loading && (
                                            <ArrowRightOutlined />
                                        )}

                                    </button>

                                </form>


                                {/* SWITCH */}

                                <div className="auth-switch">

                                    <span>
                                        Đã có tài khoản?
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            changeMode(
                                                "login"
                                            )
                                        }
                                    >
                                        Đăng nhập
                                    </button>

                                </div>

                            </>

                        )}

                    </div>

                </div>


                {/* ================================
                    FOOTER
                ================================= */}

                <div className="auth-footer">

                    <span>
                        © 2026 EasyEnglish
                    </span>

                    <span>•</span>

                    <span>
                        Học tiếng Anh mỗi ngày
                    </span>
                    <span>          Được tạo bởi <strong>Chung</strong> ❤️
                    </span>
                </div>

            </div>

        </div>
    );
}

export default Auth;