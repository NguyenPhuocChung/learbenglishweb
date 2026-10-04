import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "./AppHeader";

import {
    SoundOutlined,
    ReloadOutlined,
    CheckOutlined,
    CloseOutlined,
    LeftOutlined,
    RightOutlined,
    BulbOutlined,
    TrophyFilled,
    CalendarOutlined,
    FilterOutlined,
    PlayCircleFilled,
    CheckCircleFilled,
} from "@ant-design/icons";

import { fetchLearnerVocabulary, updateVocabularyStatus } from "../services/api";

import "../styles/Review.css";
import MobileBottomNav from "./MobileBottomNav";

const shuffle = (array) =>
    [...array].sort(() => Math.random() - 0.5);

const STATUS_OPTIONS = [
    {
        value: "new",
        label: "Chưa học",
        emoji: "🔴",
    },
    {
        value: "learning",
        label: "Đang học",
        emoji: "🟡",
    },
    {
        value: "mastered",
        label: "Đã thuộc",
        emoji: "🟢",
    },
];

function Review() {
    const navigate = useNavigate();

    /* =====================================================
       REVIEW CONFIG
    ===================================================== */

    const [showSetup, setShowSetup] = useState(true);
    const [savedWords, setSavedWords] = useState([]);
    const [loadingWords, setLoadingWords] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [selectedStatuses, setSelectedStatuses] =
        useState(["new"]);

    const [selectedTags, setSelectedTags] =
        useState([]);

    const [dateMode, setDateMode] =
        useState("today");

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    const [cardLimit, setCardLimit] =
        useState("all");

    /* =====================================================
       FLASHCARD DATA
    ===================================================== */

    const [words, setWords] = useState([]);

    const [currentIndex, setCurrentIndex] =
        useState(0);

    const [isFlipped, setIsFlipped] =
        useState(false);

    /* =====================================================
       RESULT
    ===================================================== */

    const [knownWords, setKnownWords] =
        useState([]);

    const [hardWords, setHardWords] =
        useState([]);

    const [unknownWords, setUnknownWords] =
        useState([]);

    /* =====================================================
       OTHER
    ===================================================== */

    const [isSpeaking, setIsSpeaking] =
        useState(false);

    const [finished, setFinished] =
        useState(false);

    /* =====================================================
       TAGS
    ===================================================== */

    const tags = useMemo(() => {
        const tagSet = new Set();

        savedWords.forEach((word) => {
            word.tags?.forEach((tag) =>
                tagSet.add(tag)
            );
        });

        return [...tagSet];
    }, [savedWords]);

    useEffect(() => {
        let active = true;
        fetchLearnerVocabulary()
            .then((entries) => { if (active) setSavedWords(entries); })
            .catch((error) => { if (active) setLoadError(error.message); })
            .finally(() => { if (active) setLoadingWords(false); });
        return () => { active = false; };
    }, []);

    /* =====================================================
       TOGGLE STATUS
    ===================================================== */

    const toggleStatus = (status) => {
        setSelectedStatuses((prev) => {
            if (prev.includes(status)) {
                return prev.filter(
                    (item) => item !== status
                );
            }

            return [...prev, status];
        });
    };

    /* =====================================================
       TOGGLE TAG
    ===================================================== */

    const toggleTag = (tag) => {
        setSelectedTags((prev) => {
            if (prev.includes(tag)) {
                return prev.filter(
                    (item) => item !== tag
                );
            }

            return [...prev, tag];
        });
    };

    const saveWordStatus = (word, status) => {
        setSavedWords((current) => current.map((entry) => entry.word === word.word
            ? { ...entry, status, lastReviewedAt: new Date().toISOString() }
            : entry));
        updateVocabularyStatus(word.word, status)
            .catch((error) => setLoadError(error.message));
    };

    /* =====================================================
       DATE FILTER
    ===================================================== */

    const isDateInRange = (savedAt) => {
        const date = new Date(savedAt);

        const now = new Date();

        // Hôm nay
        if (dateMode === "today") {
            return (
                date.getFullYear() ===
                now.getFullYear() &&
                date.getMonth() === now.getMonth() &&
                date.getDate() === now.getDate()
            );
        }

        // Hôm qua
        if (dateMode === "yesterday") {
            const yesterday = new Date(now);

            yesterday.setDate(
                yesterday.getDate() - 1
            );

            return (
                date.getFullYear() ===
                yesterday.getFullYear() &&
                date.getMonth() ===
                yesterday.getMonth() &&
                date.getDate() ===
                yesterday.getDate()
            );
        }

        // 7 ngày
        if (dateMode === "7days") {
            const start = new Date(now);

            start.setHours(0, 0, 0, 0);
            start.setDate(
                start.getDate() - 6
            );

            return date >= start;
        }

        // 30 ngày
        if (dateMode === "30days") {
            const start = new Date(now);

            start.setHours(0, 0, 0, 0);
            start.setDate(
                start.getDate() - 29
            );

            return date >= start;
        }

        // Tùy chỉnh
        if (dateMode === "custom") {
            if (!fromDate && !toDate) {
                return true;
            }

            const start = fromDate
                ? new Date(`${fromDate}T00:00:00`)
                : null;

            const end = toDate
                ? new Date(`${toDate}T23:59:59`)
                : null;

            if (start && date < start) {
                return false;
            }

            if (end && date > end) {
                return false;
            }

            return true;
        }

        return true;
    };

    /* =====================================================
       PREVIEW FILTER
    ===================================================== */

    const previewWords = useMemo(() => {
        return savedWords.filter((word) => {
            // Status
            if (
                selectedStatuses.length > 0 &&
                !selectedStatuses.includes(
                    word.status
                )
            ) {
                return false;
            }

            // Tag
            if (
                selectedTags.length > 0 &&
                !word.tags?.some((tag) =>
                    selectedTags.includes(tag)
                )
            ) {
                return false;
            }

            // Date
            if (!isDateInRange(word.savedAt)) {
                return false;
            }

            return true;
        });
    }, [
        selectedStatuses,
        selectedTags,
        dateMode,
        fromDate,
        toDate,
        savedWords,
    ]);

    /* =====================================================
       START REVIEW
    ===================================================== */

    const startReview = () => {
        let result = shuffle(previewWords);

        if (cardLimit !== "all") {
            result = result.slice(
                0,
                Number(cardLimit)
            );
        }

        setWords(result);

        setCurrentIndex(0);

        setIsFlipped(false);

        setKnownWords([]);

        setHardWords([]);

        setUnknownWords([]);

        setFinished(false);

        setShowSetup(false);
    };

    /* =====================================================
       CURRENT WORD
    ===================================================== */

    const currentWord =
        words[currentIndex] || null;

    /* =====================================================
       PROGRESS
    ===================================================== */

    const progress =
        words.length > 0
            ? Math.round(
                ((currentIndex + 1) /
                    words.length) *
                100
            )
            : 0;

    /* =====================================================
       SPEAK
    ===================================================== */

    const speakWord = (event) => {
        event?.stopPropagation();

        if (!currentWord) return;

        if (!("speechSynthesis" in window)) {
            alert(
                "Trình duyệt của bạn không hỗ trợ phát âm."
            );
            return;
        }

        window.speechSynthesis.cancel();

        const utterance =
            new SpeechSynthesisUtterance(
                currentWord.word
            );

        utterance.lang = "en-US";
        utterance.rate = 0.75;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () =>
            setIsSpeaking(true);

        utterance.onend = () =>
            setIsSpeaking(false);

        utterance.onerror = () =>
            setIsSpeaking(false);

        window.speechSynthesis.speak(
            utterance
        );
    };

    /* =====================================================
       NEXT
    ===================================================== */

    const nextCard = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(
                (prev) => prev + 1
            );

            setIsFlipped(false);

            return;
        }

        setFinished(true);
    };

    /* =====================================================
       PREVIOUS
    ===================================================== */

    const previousCard = () => {
        if (currentIndex <= 0) return;

        setCurrentIndex(
            (prev) => prev - 1
        );

        setIsFlipped(false);
    };

    /* =====================================================
       MARK
    ===================================================== */

    const markUnknown = () => {
        if (!currentWord) return;

        saveWordStatus(currentWord, "new");

        setUnknownWords((prev) =>
            prev.includes(currentWord.id)
                ? prev
                : [...prev, currentWord.id]
        );

        nextCard();
    };

    const markHard = () => {
        if (!currentWord) return;

        saveWordStatus(currentWord, "learning");

        setHardWords((prev) =>
            prev.includes(currentWord.id)
                ? prev
                : [...prev, currentWord.id]
        );

        nextCard();
    };

    const markKnown = () => {
        if (!currentWord) return;

        saveWordStatus(currentWord, "mastered");

        setKnownWords((prev) =>
            prev.includes(currentWord.id)
                ? prev
                : [...prev, currentWord.id]
        );

        nextCard();
    };

    /* =====================================================
       RESTART
    ===================================================== */

    const restartReview = () => {
        setWords(shuffle(words));

        setCurrentIndex(0);

        setKnownWords([]);

        setHardWords([]);

        setUnknownWords([]);

        setIsFlipped(false);

        setFinished(false);
    };

    /* =====================================================
       BACK TO SETUP
    ===================================================== */

    const backToSetup = () => {
        window.speechSynthesis?.cancel();

        setShowSetup(true);

        setFinished(false);
    };

    /* =====================================================
       CLEAN SPEECH
    ===================================================== */

    useEffect(() => {
        return () => {
            window.speechSynthesis?.cancel();
        };
    }, []);

    /* =====================================================
       SETUP SCREEN
    ===================================================== */

    if (showSetup) {
        return (
            <div className="review-page">
                <AppHeader />

                <main className="review-setup">

                    <div className="setup-header">

                        <span className="review-eyebrow">
                            CUSTOM REVIEW
                        </span>

                        <h1>
                            Bạn muốn ôn từ nào?
                        </h1>

                        <p>
                            Chọn điều kiện bên dưới.
                            Hệ thống sẽ tạo flashcard
                            phù hợp cho bạn.
                        </p>

                    </div>

                    {loadError && <div className="review-load-error" role="alert">{loadError}</div>}

                    {/* ================= STATUS ================= */}

                    <section className="setup-card">

                        <div className="setup-card-header">

                            <div className="setup-card-icon">
                                <FilterOutlined />
                            </div>

                            <div>
                                <h3>
                                    Trạng thái từ
                                </h3>

                                <span>
                                    Có thể chọn nhiều
                                </span>
                            </div>

                        </div>

                        <div className="multi-options">

                            {STATUS_OPTIONS.map(
                                (status) => {

                                    const active =
                                        selectedStatuses.includes(
                                            status.value
                                        );

                                    return (
                                        <button
                                            key={status.value}
                                            className={
                                                active
                                                    ? "option-button active"
                                                    : "option-button"
                                            }
                                            onClick={() =>
                                                toggleStatus(
                                                    status.value
                                                )
                                            }
                                        >

                                            <span>
                                                {status.emoji}
                                            </span>

                                            <strong>
                                                {status.label}
                                            </strong>

                                            {active && (
                                                <CheckCircleFilled />
                                            )}

                                        </button>
                                    );
                                }
                            )}

                        </div>

                    </section>

                    {/* ================= DATE ================= */}

                    <section className="setup-card">

                        <div className="setup-card-header">

                            <div className="setup-card-icon">
                                <CalendarOutlined />
                            </div>

                            <div>
                                <h3>
                                    Ngày lưu từ vựng
                                </h3>

                                <span>
                                    Mặc định: hôm nay
                                </span>
                            </div>

                        </div>

                        <div className="date-options">

                            <button
                                className={
                                    dateMode === "today"
                                        ? "date-button active"
                                        : "date-button"
                                }
                                onClick={() =>
                                    setDateMode("today")
                                }
                            >
                                Hôm nay
                            </button>

                            <button
                                className={
                                    dateMode === "yesterday"
                                        ? "date-button active"
                                        : "date-button"
                                }
                                onClick={() =>
                                    setDateMode("yesterday")
                                }
                            >
                                Hôm qua
                            </button>

                            <button
                                className={
                                    dateMode === "7days"
                                        ? "date-button active"
                                        : "date-button"
                                }
                                onClick={() =>
                                    setDateMode("7days")
                                }
                            >
                                7 ngày qua
                            </button>

                            <button
                                className={
                                    dateMode === "30days"
                                        ? "date-button active"
                                        : "date-button"
                                }
                                onClick={() =>
                                    setDateMode("30days")
                                }
                            >
                                30 ngày qua
                            </button>

                            <button
                                className={
                                    dateMode === "custom"
                                        ? "date-button active"
                                        : "date-button"
                                }
                                onClick={() =>
                                    setDateMode("custom")
                                }
                            >
                                Tùy chỉnh
                            </button>

                        </div>

                        {dateMode === "custom" && (

                            <div className="custom-date">

                                <div>

                                    <label>
                                        Từ ngày
                                    </label>

                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) =>
                                            setFromDate(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                                <span>→</span>

                                <div>

                                    <label>
                                        Đến ngày
                                    </label>

                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) =>
                                            setToDate(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                            </div>

                        )}

                    </section>

                    {/* ================= TAG ================= */}

                    <section className="setup-card">

                        <div className="setup-card-header">

                            <div className="setup-card-icon">
                                🏷️
                            </div>

                            <div>
                                <h3>
                                    Chủ đề
                                </h3>

                                <span>
                                    Có thể chọn nhiều
                                </span>
                            </div>

                        </div>

                        <div className="multi-options tag-options">

                            {tags.map((tag) => {

                                const active =
                                    selectedTags.includes(tag);

                                return (
                                    <button
                                        key={tag}
                                        className={
                                            active
                                                ? "tag-option active"
                                                : "tag-option"
                                        }
                                        onClick={() =>
                                            toggleTag(tag)
                                        }
                                    >
                                        #{tag}

                                        {active && (
                                            <CheckOutlined />
                                        )}

                                    </button>
                                );

                            })}

                        </div>

                    </section>

                    {/* ================= LIMIT ================= */}

                    <section className="setup-card">

                        <div className="setup-card-header">

                            <div className="setup-card-icon">
                                📚
                            </div>

                            <div>
                                <h3>
                                    Số lượng flashcard
                                </h3>

                                <span>
                                    Chọn số lượng muốn ôn
                                </span>
                            </div>

                        </div>

                        <div className="card-limit-options">

                            {[
                                ["all", "Tất cả"],
                                ["5", "5 từ"],
                                ["10", "10 từ"],
                                ["20", "20 từ"],
                                ["30", "30 từ"],
                            ].map(([value, label]) => (

                                <button
                                    key={value}
                                    className={
                                        cardLimit === value
                                            ? "limit-button active"
                                            : "limit-button"
                                    }
                                    onClick={() =>
                                        setCardLimit(value)
                                    }
                                >
                                    {label}
                                </button>

                            ))}

                        </div>

                    </section>

                    {/* ================= PREVIEW ================= */}

                    <div className="review-preview">

                        <div>

                            <span>
                                BỘ TỪ VỰNG CỦA BẠN
                            </span>

                            <strong>
                                {previewWords.length}
                            </strong>

                            <small>
                                từ phù hợp với lựa chọn
                            </small>

                        </div>

                        <div className="preview-icon">
                            🧠
                        </div>

                    </div>

                    {/* ================= START ================= */}

                    <button
                        className="start-review-button"
                        disabled={
                            loadingWords ||
                            selectedStatuses.length === 0 ||
                            previewWords.length === 0
                        }
                        onClick={startReview}
                    >

                        <PlayCircleFilled />

                        {loadingWords
                            ? "Đang tải từ đã lưu..."
                            : previewWords.length === 0
                                ? "Không có từ phù hợp"
                                : `Bắt đầu ôn ${Math.min(
                                    previewWords.length,
                                    cardLimit === "all"
                                        ? previewWords.length
                                        : Number(cardLimit)
                                )} từ`}

                    </button>

                </main>

            </div>
        );
    }

    /* =====================================================
       FINISHED
    ===================================================== */

    if (finished) {
        return (
            <div className="review-page">
                <AppHeader />

                <main className="review-result">

                    <div className="result-icon">
                        <TrophyFilled />
                    </div>

                    <span className="result-label">
                        HOÀN THÀNH
                    </span>

                    <h1>
                        Bạn đã hoàn thành!
                    </h1>

                    <p>
                        Bạn vừa ôn tập{" "}
                        <strong>{words.length}</strong>{" "}
                        từ vựng.
                    </p>

                    <div className="result-cards">

                        <div className="result-card known">
                            <div>
                                <CheckOutlined />
                            </div>

                            <strong>
                                {knownWords.length}
                            </strong>

                            <span>
                                Đã nhớ
                            </span>
                        </div>

                        <div className="result-card hard">
                            <div>
                                <BulbOutlined />
                            </div>

                            <strong>
                                {hardWords.length}
                            </strong>

                            <span>
                                Cần ôn thêm
                            </span>
                        </div>

                        <div className="result-card unknown">
                            <div>
                                <CloseOutlined />
                            </div>

                            <strong>
                                {unknownWords.length}
                            </strong>

                            <span>
                                Chưa nhớ
                            </span>
                        </div>

                    </div>

                    <div className="result-actions">

                        <button
                            className="restart-button"
                            onClick={restartReview}
                        >
                            <ReloadOutlined />
                            Ôn lại
                        </button>

                        <button
                            className="home-button"
                            onClick={() =>
                                navigate("/")
                            }
                        >
                            Về trang chủ
                        </button>

                        <button
                            className="home-button"
                            onClick={backToSetup}
                        >
                            Chọn bộ khác
                        </button>

                    </div>

                </main>

            </div>
        );
    }

    /* =====================================================
       EMPTY
    ===================================================== */

    if (!currentWord) {
        return (
            <div className="review-page">
                <AppHeader />

                <div className="review-empty">

                    <div className="empty-icon">
                        📚
                    </div>

                    <h2>
                        Chưa có từ vựng
                    </h2>

                    <p>
                        Không có từ nào phù hợp với
                        lựa chọn của bạn.
                    </p>

                    <button
                        onClick={backToSetup}
                    >
                        Chọn lại
                    </button>

                </div>

            </div>
        );
    }

    /* =====================================================
       FLASHCARD
    ===================================================== */

    return (
        <div className="review-page">
            <AppHeader />

            <main className="review-main">

                <section className="review-heading">

                    <div>

                        <span className="review-eyebrow">
                            DAILY REVIEW
                        </span>

                        <h1>
                            Ôn tập từ vựng
                        </h1>

                        <p>
                            Lật thẻ, nghe phát âm và kiểm tra
                            xem bạn còn nhớ từ không.
                        </p>

                    </div>

                    <div className="review-counter">

                        <strong>
                            {currentIndex + 1}
                        </strong>

                        <span>
                            / {words.length}
                        </span>

                    </div>

                </section>

                <div className="review-progress">

                    <div className="review-progress-track">

                        <div
                            className="review-progress-value"
                            style={{
                                width: `${progress}%`,
                            }}
                        />

                    </div>

                    <span>
                        {progress}%
                    </span>

                </div>

                {/* FLASHCARD */}

                <section className="flashcard-section">

                    <div
                        className={
                            isFlipped
                                ? "flashcard flipped"
                                : "flashcard"
                        }
                        onClick={() =>
                            setIsFlipped(
                                (prev) => !prev
                            )
                        }
                    >

                        <div className="flashcard-inner">

                            {/* FRONT */}

                            <div className="flashcard-face flashcard-front">

                                <span className="card-label">
                                    TỪ VỰNG
                                </span>

                                <div className="word-display">

                                    <h2>
                                        {currentWord.word}
                                    </h2>

                                    {currentWord.phonetic && (
                                        <div className="phonetic">
                                            {currentWord.phonetic}
                                        </div>
                                    )}

                                    <button
                                        className={
                                            isSpeaking
                                                ? "speak-button speaking"
                                                : "speak-button"
                                        }
                                        onClick={speakWord}
                                    >

                                        <SoundOutlined />

                                        {isSpeaking
                                            ? "Đang phát..."
                                            : "Nghe phát âm"}

                                    </button>

                                </div>

                                <div className="flip-hint">

                                    <span>👆</span>

                                    Bấm vào thẻ để xem nghĩa

                                </div>

                            </div>

                            {/* BACK */}

                            <div className="flashcard-face flashcard-back">

                                <span className="card-label">
                                    NGHĨA
                                </span>

                                <div className="back-word">

                                    <strong>
                                        {currentWord.word}
                                    </strong>

                                    {currentWord.phonetic && (
                                        <span>
                                            {currentWord.phonetic}
                                        </span>
                                    )}

                                </div>

                                <div className="meaning-list">

                                    {currentWord.meanings?.map(
                                        (item, index) => (

                                            <div
                                                className="meaning-item"
                                                key={index}
                                            >

                                                <div className="meaning-type">
                                                    {item.type}
                                                </div>

                                                <div className="meaning-text">
                                                    {item.meaning}
                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                                <div className="card-tags">

                                    {currentWord.tags?.map(
                                        (tag) => (
                                            <span key={tag}>
                                                #{tag}
                                            </span>
                                        )
                                    )}

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* NAVIGATION */}

                    <div className="card-navigation">

                        <button
                            onClick={previousCard}
                            disabled={
                                currentIndex === 0
                            }
                        >
                            <LeftOutlined />
                            Trước
                        </button>

                        <span>
                            {currentIndex + 1} /{" "}
                            {words.length}
                        </span>

                        <button onClick={nextCard}>
                            Sau
                            <RightOutlined />
                        </button>

                    </div>

                    {/* ANSWER */}

                    <div className="answer-title">
                        Bạn nhớ từ này không?
                    </div>

                    <div className="answer-buttons">

                        <button
                            className="answer-button unknown"
                            onClick={markUnknown}
                        >
                            <span>😵</span>

                            <strong>
                                Chưa nhớ
                            </strong>

                            <small>
                                Ôn lại sớm
                            </small>
                        </button>

                        <button
                            className="answer-button hard"
                            onClick={markHard}
                        >
                            <span>🤔</span>

                            <strong>
                                Hơi nhớ
                            </strong>

                            <small>
                                Ôn lại sau
                            </small>
                        </button>

                        <button
                            className="answer-button known"
                            onClick={markKnown}
                        >
                            <span>😎</span>

                            <strong>
                                Đã nhớ
                            </strong>

                            <small>
                                Tốt lắm!
                            </small>
                        </button>

                    </div>

                </section>

            </main>
            <MobileBottomNav />

        </div>
    );
}

export default Review;