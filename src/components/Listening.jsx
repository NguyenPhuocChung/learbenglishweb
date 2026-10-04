import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "./AppHeader";
import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    HomeOutlined,
    ReloadOutlined,
    SoundFilled,
} from "@ant-design/icons";

import { fetchLearnerVocabulary, updateVocabularyStatus } from "../services/api";
import "./../styles/Listening.css";
import MobileBottomNav from "./MobileBottomNav";

const DATE_OPTIONS = [
    { value: "today", label: "Hôm nay" },
    { value: "yesterday", label: "Hôm qua" },
    { value: "7days", label: "7 ngày gần đây" },
    { value: "30days", label: "30 ngày gần đây" },
    { value: "custom", label: "Tùy chọn ngày" },
];

function normalizeText(text) {
    return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function Listening() {
    const navigate = useNavigate();

    // =========================
    // SETUP
    // =========================
    const [showSetup, setShowSetup] = useState(true);
    const [savedWords, setSavedWords] = useState([]);
    const [loadingWords, setLoadingWords] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [dateMode, setDateMode] = useState("today");

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [selectedTags, setSelectedTags] = useState([]);

    // =========================
    // LISTENING
    // =========================
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [answers, setAnswers] = useState({});

    const [inputValue, setInputValue] = useState("");

    const [isPlaying, setIsPlaying] = useState(false);

    const [finished, setFinished] = useState(false);

    useEffect(() => {
        let active = true;
        fetchLearnerVocabulary()
            .then((entries) => { if (active) setSavedWords(entries); })
            .catch((error) => { if (active) setLoadError(error.message); })
            .finally(() => { if (active) setLoadingWords(false); });
        return () => { active = false; };
    }, []);

    const allTags = useMemo(
        () => [...new Set(savedWords.flatMap((word) => word.tags ?? []))],
        [savedWords],
    );

    // =========================
    // DATE FILTER
    // =========================
    const isDateInRange = (savedAt) => {
        if (!savedAt) return false;

        const date = new Date(savedAt);

        const now = new Date();

        const startToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const startYesterday = new Date(startToday);
        startYesterday.setDate(startYesterday.getDate() - 1);

        const start7Days = new Date(startToday);
        start7Days.setDate(start7Days.getDate() - 6);

        const start30Days = new Date(startToday);
        start30Days.setDate(start30Days.getDate() - 29);

        if (dateMode === "today") {
            return date >= startToday && date <= now;
        }

        if (dateMode === "yesterday") {
            return date >= startYesterday && date < startToday;
        }

        if (dateMode === "7days") {
            return date >= start7Days && date <= now;
        }

        if (dateMode === "30days") {
            return date >= start30Days && date <= now;
        }

        if (dateMode === "custom") {
            if (!fromDate && !toDate) return true;

            if (fromDate) {
                const from = new Date(`${fromDate}T00:00:00`);

                if (date < from) {
                    return false;
                }
            }

            if (toDate) {
                const to = new Date(`${toDate}T23:59:59`);

                if (date > to) {
                    return false;
                }
            }

            return true;
        }

        return true;
    };

    // =========================
    // FILTER WORDS
    // =========================
    const filteredWords = useMemo(() => {
        return savedWords.filter((word) => {
            const matchDate = isDateInRange(word.savedAt);

            const matchTag =
                selectedTags.length === 0 ||
                selectedTags.some((tag) => word.tags?.includes(tag));

            return matchDate && matchTag;
        });
    }, [savedWords, dateMode, fromDate, toDate, selectedTags]);

    // =========================
    // TAG TOGGLE
    // =========================
    const toggleTag = (tag) => {
        setSelectedTags((prev) => {
            if (prev.includes(tag)) {
                return prev.filter((item) => item !== tag);
            }

            return [...prev, tag];
        });
    };

    // =========================
    // START
    // =========================
    const startListening = () => {
        if (filteredWords.length === 0) return;

        const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);

        setWords(shuffled);

        setCurrentIndex(0);

        setAnswers({});

        setInputValue("");

        setFinished(false);

        setShowSetup(false);
    };

    // =========================
    // CURRENT WORD
    // =========================
    const currentWord = words[currentIndex];

    const currentResult = currentWord
        ? answers[currentWord.id]
        : null;

    // =========================
    // SPEECH
    // =========================
    const speakWord = () => {
        if (!currentWord) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(
            currentWord.word
        );

        utterance.lang = "en-US";
        utterance.rate = 0.78;
        utterance.pitch = 1;

        utterance.onstart = () => {
            setIsPlaying(true);
        };

        utterance.onend = () => {
            setIsPlaying(false);
        };

        utterance.onerror = () => {
            setIsPlaying(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    // =========================
    // CHECK ANSWER
    // =========================
    const checkAnswer = () => {
        if (!currentWord) return;

        if (currentResult) return;

        const userAnswer = normalizeText(inputValue);

        if (!userAnswer) return;

        const correctAnswer = normalizeText(currentWord.word);

        const isCorrect = userAnswer === correctAnswer;
        const nextStatus = isCorrect ? "mastered" : "learning";

        setSavedWords((current) => current.map((word) => word.id === currentWord.id
            ? { ...word, status: nextStatus, lastReviewedAt: new Date().toISOString() }
            : word));
        updateVocabularyStatus(currentWord.word, nextStatus)
            .catch((error) => setLoadError(error.message));

        setAnswers((prev) => ({
            ...prev,

            [currentWord.id]: {
                userAnswer: inputValue,
                correct: isCorrect,
                checked: true,
            },
        }));
    };

    // =========================
    // ENTER
    // =========================
    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();

            if (!currentResult) {
                checkAnswer();
            }
        }
    };

    // =========================
    // NEXT
    // =========================
    const nextWord = () => {
        if (currentIndex >= words.length - 1) {
            window.speechSynthesis.cancel();

            setIsPlaying(false);

            setFinished(true);

            return;
        }

        window.speechSynthesis.cancel();

        setIsPlaying(false);

        const nextIndex = currentIndex + 1;

        setCurrentIndex(nextIndex);

        const nextAnswer = answers[words[nextIndex]?.id];

        setInputValue(nextAnswer?.userAnswer || "");
    };

    // =========================
    // BACK
    // =========================
    const previousWord = () => {
        if (currentIndex <= 0) return;

        window.speechSynthesis.cancel();

        setIsPlaying(false);

        const previousIndex = currentIndex - 1;

        setCurrentIndex(previousIndex);

        const previousAnswer =
            answers[words[previousIndex]?.id];

        setInputValue(previousAnswer?.userAnswer || "");
    };

    // =========================
    // REPLAY
    // =========================
    const restartListening = () => {
        setCurrentIndex(0);

        setAnswers({});

        setInputValue("");

        setFinished(false);

        setShowSetup(false);
    };

    // =========================
    // BACK TO SETUP
    // =========================
    const backToSetup = () => {
        window.speechSynthesis.cancel();

        setShowSetup(true);

        setFinished(false);

        setWords([]);

        setAnswers({});

        setCurrentIndex(0);

        setInputValue("");
    };

    // =========================
    // RESULT
    // =========================
    const resultList = Object.values(answers);

    const correctCount = resultList.filter(
        (item) => item.correct
    ).length;

    const wrongCount = resultList.filter(
        (item) => !item.correct
    ).length;

    // =========================
    // SETUP SCREEN
    // =========================
    if (showSetup) {
        return (
            <div className="listening-page">
                <AppHeader />
                <div className="listening-container">

                    <div className="listening-setup">

                        <div className="listening-setup-header">
                            <div className="listening-main-icon">
                                🎧
                            </div>

                            <div>
                                <h1>Luyện nghe tiếng Anh</h1>

                                <p>
                                    Nghe từ tiếng Anh và tự viết lại
                                    những gì bạn nghe được.
                                </p>
                            </div>
                        </div>

                        {loadError && <div className="empty-filter" role="alert">{loadError}</div>}

                        {/* DATE */}

                        <section className="listening-option-section">

                            <div className="option-title">
                                <span>📅</span>

                                <div>
                                    <h3>Chọn ngày</h3>

                                    <p>
                                        Chọn những từ được lưu trong khoảng thời gian
                                        bạn muốn luyện.
                                    </p>
                                </div>
                            </div>

                            <div className="option-grid">

                                {DATE_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        className={`option-card ${dateMode === option.value
                                            ? "active"
                                            : ""
                                            }`}
                                        onClick={() =>
                                            setDateMode(option.value)
                                        }
                                    >
                                        <span className="option-radio">
                                            {dateMode === option.value
                                                ? "✓"
                                                : ""}
                                        </span>

                                        {option.label}
                                    </button>
                                ))}

                            </div>

                            {dateMode === "custom" && (
                                <div className="custom-date-box">

                                    <div>
                                        <label>Từ ngày</label>

                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) =>
                                                setFromDate(e.target.value)
                                            }
                                        />
                                    </div>

                                    <span className="date-arrow">
                                        →
                                    </span>

                                    <div>
                                        <label>Đến ngày</label>

                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) =>
                                                setToDate(e.target.value)
                                            }
                                        />
                                    </div>

                                </div>
                            )}
                        </section>

                        {/* TAG */}

                        <section className="listening-option-section">

                            <div className="option-title">

                                <span>🏷️</span>

                                <div>
                                    <h3>Chọn chủ đề</h3>

                                    <p>
                                        Có thể chọn nhiều chủ đề cùng lúc.
                                    </p>
                                </div>

                            </div>

                            <div className="tag-list">

                                {allTags.map((tag) => {

                                    const active =
                                        selectedTags.includes(tag);

                                    return (
                                        <button
                                            key={tag}
                                            className={`topic-tag ${active ? "active" : ""
                                                }`}
                                            onClick={() =>
                                                toggleTag(tag)
                                            }
                                        >
                                            {active && "✓ "}
                                            {tag}
                                        </button>
                                    );
                                })}

                            </div>

                            {selectedTags.length === 0 && (
                                <div className="all-topic-note">
                                    Không chọn chủ đề = luyện tất cả chủ đề
                                </div>
                            )}

                        </section>

                        {/* PREVIEW */}

                        <div className="listening-preview">

                            <div>
                                <span className="preview-icon">
                                    🎯
                                </span>

                                <div>
                                    <strong>
                                        {filteredWords.length} từ
                                    </strong>

                                    <p>
                                        phù hợp với lựa chọn của bạn
                                    </p>
                                </div>
                            </div>

                            <div className="preview-tags">

                                <span>
                                    📅{" "}
                                    {
                                        DATE_OPTIONS.find(
                                            (item) =>
                                                item.value === dateMode
                                        )?.label
                                    }
                                </span>

                                {selectedTags.length > 0 && (
                                    <span>
                                        🏷️ {selectedTags.length} chủ đề
                                    </span>
                                )}

                            </div>

                        </div>

                        {/* START */}

                        <button
                            className="start-listening-button"
                            disabled={loadingWords || filteredWords.length === 0}
                            onClick={startListening}
                        >
                            <SoundFilled />

                            {loadingWords ? "Đang tải từ đã lưu..." : "Bắt đầu luyện nghe"}

                            <ArrowRightOutlined />
                        </button>

                        {!loadingWords && filteredWords.length === 0 && (
                            <div className="empty-filter">
                                Không có từ nào phù hợp với lựa chọn.
                                <br />
                                Hãy thử chọn ngày hoặc chủ đề khác.
                            </div>
                        )}

                    </div>
                </div>
                                <MobileBottomNav />

            </div>
        );
    }

    // =========================
    // FINISHED
    // =========================
    if (finished) {
        return (
            <div className="listening-page">
                <AppHeader />
                <div className="listening-container">

                    <div className="listening-finished">

                        <div className="finished-trophy">
                            🏆
                        </div>

                        <h1>Hoàn thành!</h1>

                        <p>
                            Bạn đã hoàn thành toàn bộ bài luyện nghe.
                        </p>

                        <div className="result-summary">

                            <div className="result-card">
                                <strong>{words.length}</strong>
                                <span>Tổng số từ</span>
                            </div>

                            <div className="result-card correct">
                                <strong>{correctCount}</strong>
                                <span>Đúng</span>
                            </div>

                            <div className="result-card wrong">
                                <strong>{wrongCount}</strong>
                                <span>Sai</span>
                            </div>

                        </div>

                        <div className="finished-actions">

                            <button
                                className="restart-button"
                                onClick={restartListening}
                            >
                                <ReloadOutlined />
                                Luyện lại
                            </button>

                            <button
                                className="change-set-button"
                                onClick={backToSetup}
                            >
                                Chọn bộ khác
                            </button>

                            <button
                                className="home-button"
                                onClick={() => navigate("/")}
                            >
                                <HomeOutlined />
                                Về trang chủ
                            </button>

                        </div>

                    </div>
                </div>

            </div>
        );
    }

    // =========================
    // LISTENING SCREEN
    // =========================
    if (!currentWord) return null;

    return (
        <div className="listening-page">
            <AppHeader />

            <div className="listening-container">

                {/* TOP */}

                <div className="listening-topbar">

                    <button
                        className="exit-listening"
                        onClick={backToSetup}
                    >
                        <ArrowLeftOutlined />
                        Chọn lại
                    </button>

                    <div className="listening-progress">

                        <span>
                            {currentIndex + 1}
                        </span>

                        <span className="progress-divider">
                            /
                        </span>

                        <span className="total">
                            {words.length}
                        </span>

                    </div>

                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${((currentIndex + 1) /
                                    words.length) *
                                    100
                                    }%`,
                            }}
                        />
                    </div>

                </div>

                {/* CARD */}

                <div className="listening-card">

                    <div className="listening-card-header">

                        <span>
                            🎧 NGHE VÀ VIẾT LẠI
                        </span>

                        {currentWord.tags?.length > 0 && (
                            <div className="current-tags">
                                {currentWord.tags.map((tag) => (
                                    <span key={tag}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                    </div>

                    {/* SPEAKER */}

                    <div className="speaker-area">

                        <button
                            className={`speaker-button ${isPlaying ? "playing" : ""
                                }`}
                            onClick={speakWord}
                        >
                            <SoundFilled />
                        </button>

                        <h2>
                            {isPlaying
                                ? "Đang phát..."
                                : "Bấm để nghe"}
                        </h2>

                        <p>
                            Hãy nghe thật kỹ rồi nhập từ bạn nghe được.
                        </p>

                    </div>

                    {/* INPUT */}

                    <div className="answer-area">

                        <label>
                            Bạn nghe được từ gì?
                        </label>

                        <input
                            autoFocus
                            type="text"
                            value={inputValue}
                            disabled={!!currentResult}
                            onChange={(e) =>
                                setInputValue(e.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập từ tiếng Anh..."
                        />

                        {!currentResult && (
                            <div className="enter-hint">
                                Nhấn <kbd>Enter</kbd> để kiểm tra
                            </div>
                        )}

                    </div>

                    {/* RESULT */}

                    {currentResult && (
                        <div
                            className={`answer-result ${currentResult.correct
                                ? "correct"
                                : "wrong"
                                }`}
                        >

                            {currentResult.correct ? (
                                <>
                                    <div className="result-icon">
                                        <CheckCircleFilled />
                                    </div>

                                    <div>
                                        <strong>
                                            Chính xác!
                                        </strong>

                                        <p>
                                            Bạn đã nghe và viết đúng từ.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="result-icon">
                                        <CloseCircleFilled />
                                    </div>

                                    <div>
                                        <strong>
                                            Chưa chính xác
                                        </strong>

                                        <p>
                                            Bạn đã nhập:{" "}
                                            <b>
                                                {currentResult.userAnswer}
                                            </b>
                                        </p>

                                        <div className="correct-answer">
                                            <div className="correct-word">
                                                Đáp án đúng:{" "}
                                                <b>{currentWord.word}</b>

                                                <span>
                                                    {currentWord.phonetic}
                                                </span>
                                            </div>

                                            <div className="meaning-listening">
                                                {currentWord.meanings?.map((meaning, index) => (
                                                    <div
                                                        className="meaning-item"
                                                        key={index}
                                                    >
                                                        <span className="meaning-type">
                                                            {meaning.type}
                                                        </span>

                                                        <span className="meaning-text">
                                                            {meaning.meaning}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>
                    )}

                    {/* NAVIGATION */}

                    <div className="listening-navigation">

                        <button
                            className="nav-button back"
                            disabled={currentIndex === 0}
                            onClick={previousWord}
                        >
                            <ArrowLeftOutlined />
                            Back
                        </button>

                        {currentResult ? (
                            <button
                                className="nav-button next"
                                onClick={nextWord}
                            >
                                {currentIndex === words.length - 1
                                    ? "Hoàn thành"
                                    : "Next"}

                                {currentIndex ===
                                    words.length - 1 ? (
                                    <CheckCircleFilled />
                                ) : (
                                    <ArrowRightOutlined />
                                )}
                            </button>
                        ) : (
                            <button
                                className="nav-button check"
                                disabled={!inputValue.trim()}
                                onClick={checkAnswer}
                            >
                                Kiểm tra
                            </button>
                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Listening;