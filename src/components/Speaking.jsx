import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "./AppHeader";
import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CheckCircleFilled,
    HomeOutlined,
    ReloadOutlined,
    SoundFilled,
    AudioFilled,
} from "@ant-design/icons";

import { fetchLearnerVocabulary, updateVocabularyStatus } from "../services/api";
import "./../styles/Speaking.css";
import MobileBottomNav from "./MobileBottomNav";

const DATE_OPTIONS = [
    { value: "today", label: "Hôm nay" },
    { value: "yesterday", label: "Hôm qua" },
    { value: "7days", label: "7 ngày gần đây" },
    { value: "30days", label: "30 ngày gần đây" },
    { value: "custom", label: "Tùy chọn ngày" },
];

const PASS_SCORE = 80;

function normalizeText(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[.,!?;:'"]/g, "")
        .replace(/\s+/g, " ");
}

/*
 * Tính độ giống nhau giữa 2 chuỗi bằng Levenshtein Distance.
 * Ví dụ:
 *
 * destination
 * destination
 * => 100
 *
 * destination
 * destinasion
 * => gần 90%
 */
function similarityScore(source, target) {
    const a = normalizeText(source);
    const b = normalizeText(target);

    if (!a || !b) return 0;

    if (a === b) return 100;

    const matrix = Array.from(
        { length: a.length + 1 },
        () => Array(b.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i++) {
        matrix[i][0] = i;
    }

    for (let j = 0; j <= b.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;

            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    const distance = matrix[a.length][b.length];

    const maxLength = Math.max(a.length, b.length);

    return Math.max(
        0,
        Math.round((1 - distance / maxLength) * 100)
    );
}

function Speaking() {
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
    // SPEAKING
    // =========================

    const [words, setWords] = useState([]);

    const [currentIndex, setCurrentIndex] = useState(0);

    const [results, setResults] = useState({});

    const [isRecording, setIsRecording] = useState(false);

    const [transcript, setTranscript] = useState("");

    const [finished, setFinished] = useState(false);

    const recognitionRef = useRef(null);

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
    // DATE
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

        startYesterday.setDate(
            startYesterday.getDate() - 1
        );

        const start7Days = new Date(startToday);

        start7Days.setDate(
            start7Days.getDate() - 6
        );

        const start30Days = new Date(startToday);

        start30Days.setDate(
            start30Days.getDate() - 29
        );

        if (dateMode === "today") {
            return date >= startToday && date <= now;
        }

        if (dateMode === "yesterday") {
            return (
                date >= startYesterday &&
                date < startToday
            );
        }

        if (dateMode === "7days") {
            return date >= start7Days && date <= now;
        }

        if (dateMode === "30days") {
            return (
                date >= start30Days &&
                date <= now
            );
        }

        if (dateMode === "custom") {
            if (!fromDate && !toDate) {
                return true;
            }

            if (fromDate) {
                const from = new Date(
                    `${fromDate}T00:00:00`
                );

                if (date < from) {
                    return false;
                }
            }

            if (toDate) {
                const to = new Date(
                    `${toDate}T23:59:59`
                );

                if (date > to) {
                    return false;
                }
            }

            return true;
        }

        return true;
    };

    // =========================
    // FILTER
    // =========================

    const filteredWords = useMemo(() => {
        return savedWords.filter((word) => {
            const matchDate = isDateInRange(
                word.savedAt
            );

            const matchTag =
                selectedTags.length === 0 ||
                selectedTags.some((tag) =>
                    word.tags?.includes(tag)
                );

            return matchDate && matchTag;
        });
    }, [
        dateMode,
        fromDate,
        toDate,
        selectedTags,
        savedWords,
    ]);

    // =========================
    // TAG
    // =========================

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

    // =========================
    // START
    // =========================

    const startSpeaking = () => {
        if (filteredWords.length === 0) return;

        const shuffled = [...filteredWords].sort(
            () => Math.random() - 0.5
        );

        setWords(shuffled);

        setCurrentIndex(0);

        setResults({});

        setTranscript("");

        setFinished(false);

        setShowSetup(false);
    };

    // =========================
    // CURRENT WORD
    // =========================

    const currentWord = words[currentIndex];

    const currentResult = currentWord
        ? results[currentWord.id]
        : null;

    // =========================
    // CHECK BROWSER
    // =========================

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    // =========================
    // START RECORDING
    // =========================

    const startRecording = () => {
        if (!SpeechRecognition) {
            alert(
                "Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói. Hãy dùng Google Chrome."
            );

            return;
        }

        if (!currentWord) return;

        // Nếu đang ghi âm thì không tạo recognition mới
        if (isRecording) return;

        const recognition = new SpeechRecognition();

        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognitionRef.current = recognition;

        // QUAN TRỌNG:
        // Xóa kết quả cũ để có thể nói lại
        setResults((prev) => {
            const next = { ...prev };
            delete next[currentWord.id];
            return next;
        });

        setTranscript("");
        setIsRecording(true);

        recognition.onresult = (event) => {
            const text =
                event.results[0][0].transcript;

            setTranscript(text);

            const score = similarityScore(
                currentWord.word,
                text
            );
            const nextStatus = score >= PASS_SCORE ? "mastered" : "learning";

            setSavedWords((current) => current.map((word) => word.id === currentWord.id
                ? { ...word, status: nextStatus, lastReviewedAt: new Date().toISOString() }
                : word));
            updateVocabularyStatus(currentWord.word, nextStatus)
                .catch((error) => setLoadError(error.message));

            setResults((prev) => ({
                ...prev,
                [currentWord.id]: {
                    transcript: text,
                    score,
                    passed: score >= PASS_SCORE,
                },
            }));
        };

        recognition.onerror = (event) => {
            console.error(
                "Speech recognition error:",
                event.error
            );

            setIsRecording(false);

            if (event.error === "not-allowed") {
                alert(
                    "Bạn cần cho phép trình duyệt sử dụng microphone."
                );
            }

            if (event.error === "no-speech") {
                setTranscript("");
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
            recognitionRef.current = null;
        };

        recognition.start();
    };
    // =========================
    // STOP
    // =========================

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        setIsRecording(false);
    };

    // =========================
    // SPEAK MODEL
    // =========================

    const playModelPronunciation = () => {
        if (!currentWord) return;

        window.speechSynthesis.cancel();

        const utterance =
            new SpeechSynthesisUtterance(
                currentWord.word
            );

        utterance.lang = "en-US";

        utterance.rate = 0.8;

        utterance.pitch = 1;

        window.speechSynthesis.speak(
            utterance
        );
    };

    // =========================
    // NEXT
    // =========================

    const nextWord = () => {
        stopRecording();

        window.speechSynthesis.cancel();

        if (
            currentIndex >=
            words.length - 1
        ) {
            setFinished(true);

            return;
        }

        const nextIndex =
            currentIndex + 1;

        setCurrentIndex(nextIndex);

        setTranscript("");
    };

    // =========================
    // BACK
    // =========================

    const previousWord = () => {
        stopRecording();

        window.speechSynthesis.cancel();

        if (currentIndex <= 0) return;

        const previousIndex =
            currentIndex - 1;

        setCurrentIndex(previousIndex);

        const previousResult =
            results[
            words[previousIndex]?.id
            ];

        setTranscript(
            previousResult?.transcript || ""
        );
    };

    // =========================
    // RESTART
    // =========================

    const restartSpeaking = () => {
        setCurrentIndex(0);

        setResults({});

        setTranscript("");

        setFinished(false);

        setShowSetup(false);
    };

    // =========================
    // SETUP AGAIN
    // =========================

    const backToSetup = () => {
        stopRecording();

        window.speechSynthesis.cancel();

        setShowSetup(true);

        setFinished(false);

        setWords([]);

        setResults({});

        setCurrentIndex(0);

        setTranscript("");
    };

    // =========================
    // SCORE
    // =========================

    const resultList =
        Object.values(results);

    const passedCount =
        resultList.filter(
            (item) => item.passed
        ).length;

    const failedCount =
        resultList.filter(
            (item) => !item.passed
        ).length;

    // =========================
    // SETUP SCREEN
    // =========================

    if (showSetup) {
        return (
            <div className="speaking-page">
                <AppHeader />

                <div className="speaking-container">

                    <div className="speaking-setup">

                        <div className="speaking-setup-header">

                            <div className="speaking-main-icon">
                                🗣️
                            </div>

                            <div>
                                <h1>
                                    Luyện nói tiếng Anh
                                </h1>

                                <p>
                                    Đọc từ vựng và kiểm tra độ chính xác
                                    phát âm của bạn.
                                </p>
                            </div>

                        </div>

                        {loadError && <div className="speaking-note" role="alert">{loadError}</div>}

                        {/* DATE */}

                        <section className="speaking-option-section">

                            <div className="speaking-option-title">

                                <span>📅</span>

                                <div>
                                    <h3>
                                        Chọn ngày
                                    </h3>

                                    <p>
                                        Chọn những từ bạn muốn luyện.
                                    </p>
                                </div>

                            </div>

                            <div className="speaking-option-grid">

                                {DATE_OPTIONS.map(
                                    (option) => (
                                        <button
                                            key={
                                                option.value
                                            }
                                            className={`speaking-option-card ${dateMode ===
                                                option.value
                                                ? "active"
                                                : ""
                                                }`}
                                            onClick={() =>
                                                setDateMode(
                                                    option.value
                                                )
                                            }
                                        >

                                            <span className="speaking-radio">
                                                {dateMode ===
                                                    option.value
                                                    ? "✓"
                                                    : ""}
                                            </span>

                                            {option.label}

                                        </button>
                                    )
                                )}

                            </div>

                            {dateMode ===
                                "custom" && (
                                    <div className="speaking-custom-date">

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

                                        <span>
                                            →
                                        </span>

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

                        {/* TOPIC */}

                        <section className="speaking-option-section">

                            <div className="speaking-option-title">

                                <span>🏷️</span>

                                <div>
                                    <h3>
                                        Chọn chủ đề
                                    </h3>

                                    <p>
                                        Có thể chọn nhiều chủ đề.
                                    </p>
                                </div>

                            </div>

                            <div className="speaking-tags">

                                {allTags.map(
                                    (tag) => {

                                        const active =
                                            selectedTags.includes(
                                                tag
                                            );

                                        return (
                                            <button
                                                key={tag}
                                                className={
                                                    active
                                                        ? "active"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    toggleTag(
                                                        tag
                                                    )
                                                }
                                            >
                                                {active &&
                                                    "✓ "}

                                                {tag}
                                            </button>
                                        );
                                    }
                                )}

                            </div>

                            {selectedTags.length ===
                                0 && (
                                    <div className="speaking-note">
                                        Không chọn chủ đề = luyện tất cả
                                    </div>
                                )}

                        </section>

                        {/* PREVIEW */}

                        <div className="speaking-preview">

                            <div className="speaking-preview-left">

                                <span>🎯</span>

                                <div>
                                    <strong>
                                        {filteredWords.length} từ
                                    </strong>

                                    <p>
                                        phù hợp với lựa chọn
                                    </p>
                                </div>

                            </div>

                            <div className="speaking-preview-info">

                                <span>
                                    📅{" "}
                                    {
                                        DATE_OPTIONS.find(
                                            (item) =>
                                                item.value ===
                                                dateMode
                                        )?.label
                                    }
                                </span>

                                {selectedTags.length >
                                    0 && (
                                        <span>
                                            🏷️{" "}
                                            {
                                                selectedTags.length
                                            }{" "}
                                            chủ đề
                                        </span>
                                    )}

                            </div>

                        </div>

                        {/* START */}

                        <button
                            className="start-speaking-button"
                            disabled={
                                loadingWords ||
                                filteredWords.length ===
                                0
                            }
                            onClick={
                                startSpeaking
                            }
                        >
                            <AudioFilled />

                            {loadingWords ? "Đang tải từ đã lưu..." : "Bắt đầu luyện nói"}

                            <ArrowRightOutlined />
                        </button>

                        {!loadingWords && filteredWords.length ===
                            0 && (
                                <div className="speaking-empty">
                                    Không có từ phù hợp.
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
        const averageScore =
            resultList.length > 0
                ? Math.round(
                    resultList.reduce(
                        (sum, item) =>
                            sum + item.score,
                        0
                    ) / resultList.length
                )
                : 0;

        return (
            <div className="speaking-page">
                <AppHeader />

                <div className="speaking-container">

                    <div className="speaking-finished">

                        <div className="speaking-finished-icon">
                            🗣️
                        </div>

                        <h1>
                            Hoàn thành!
                        </h1>

                        <p>
                            Bạn đã hoàn thành bài luyện nói.
                        </p>

                        <div className="speaking-average">

                            <span>
                                Điểm trung bình
                            </span>

                            <strong
                                className={
                                    averageScore >= 80
                                        ? "good"
                                        : "bad"
                                }
                            >
                                {averageScore}%
                            </strong>

                        </div>

                        <div className="speaking-result-summary">

                            <div>
                                <strong>
                                    {words.length}
                                </strong>

                                <span>
                                    Tổng số từ
                                </span>
                            </div>

                            <div className="good-card">

                                <strong>
                                    {passedCount}
                                </strong>

                                <span>
                                    ≥ 80%
                                </span>

                            </div>

                            <div className="bad-card">

                                <strong>
                                    {failedCount}
                                </strong>

                                <span>
                                    &lt; 80%
                                </span>

                            </div>

                        </div>

                        <div className="speaking-finished-actions">

                            <button
                                onClick={
                                    restartSpeaking
                                }
                                className="speaking-restart"
                            >
                                <ReloadOutlined />
                                Luyện lại
                            </button>

                            <button
                                onClick={
                                    backToSetup
                                }
                            >
                                Chọn bộ khác
                            </button>

                            <button
                                onClick={() =>
                                    navigate("/")
                                }
                            >
                                <HomeOutlined />
                                Trang chủ
                            </button>

                        </div>

                    </div>

                </div>
            </div>
        );
    }

    if (!currentWord) {
        return null;
    }

    // =========================
    // SPEAKING SCREEN
    // =========================

    return (
        <div className="speaking-page">
            <AppHeader />

            <div className="speaking-container">

                {/* TOP */}

                <div className="speaking-topbar">

                    <button
                        onClick={
                            backToSetup
                        }
                    >
                        <ArrowLeftOutlined />
                        Chọn lại
                    </button>

                    <div className="speaking-counter">

                        <strong>
                            {currentIndex + 1}
                        </strong>

                        <span>
                            /
                        </span>

                        {words.length}

                    </div>

                    <div className="speaking-progress">

                        <div
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

                <div className="speaking-card">

                    <div className="speaking-card-header">

                        <span>
                            🗣️ PHÁT ÂM TỪ VỰNG
                        </span>

                        <div className="speaking-current-tags">

                            {currentWord.tags?.map(
                                (tag) => (
                                    <span key={tag}>
                                        {tag}
                                    </span>
                                )
                            )}

                        </div>

                    </div>

                    {/* WORD */}

                    <div className="word-speaking">

                        <h1>
                            {currentWord.word}
                        </h1>

                        <div className="speaking-phonetic">
                            {currentWord.phonetic}
                        </div>

                        <button
                            className="model-sound-button"
                            onClick={
                                playModelPronunciation
                            }
                        >
                            <SoundFilled />
                            Nghe mẫu
                        </button>

                    </div>

                    {/* MEANING */}

                    <div className="speaking-meaning">

                        <div className="meaning-title">
                            📖 Nghĩa
                        </div>

                        {currentWord.meanings?.map(
                            (meaning, index) => (
                                <div
                                    className="speaking-meaning-item"
                                    key={index}
                                >

                                    <span>
                                        {meaning.type}
                                    </span>

                                    <p>
                                        {meaning.meaning}
                                    </p>

                                </div>
                            )
                        )}

                    </div>

                    {/* RECORD */}

                    <div className="record-area">

                        {!currentResult && (
                            <>
                                <button
                                    className={`record-button ${isRecording
                                        ? "recording"
                                        : ""
                                        }`}
                                    onClick={
                                        isRecording
                                            ? stopRecording
                                            : startRecording
                                    }
                                >

                                    <AudioFilled />

                                </button>

                                <h3>
                                    {isRecording
                                        ? "Đang nghe bạn nói..."
                                        : "Bấm để ghi âm"}
                                </h3>

                                <p>
                                    Đọc to và rõ từ phía trên.
                                </p>
                            </>
                        )}

                        {transcript &&
                            !currentResult && (
                                <div className="live-transcript">
                                    Bạn nói:{" "}
                                    <strong>
                                        {transcript}
                                    </strong>
                                </div>
                            )}

                    </div>

                    {/* RESULT */}

                    {currentResult && (
                        <div
                            className={`speaking-result ${currentResult.passed ? "result-pass" : "result-fail"
                                }`}
                        >
                            <div className="result-score">
                                {currentResult.score}%
                            </div>

                            <div className="result-message">
                                {currentResult.passed
                                    ? "✓ Phát âm đạt yêu cầu"
                                    : "✕ Cần luyện thêm"}
                            </div>

                            <div className="result-transcript">
                                Bạn nói:
                                <strong>{currentResult.transcript}</strong>
                            </div>

                            {!currentResult.passed && (
                                <button
                                    type="button"
                                    className="speak-again-btn"
                                    onClick={startRecording}
                                    disabled={isRecording}
                                >
                                    🎙️ {isRecording ? "Đang nghe..." : "Nói lại"}
                                </button>
                            )}

                            <div className="speaking-tip">
                                {currentResult.passed
                                    ? "Bạn có thể chuyển sang từ tiếp theo."
                                    : "Hãy nghe mẫu và thử phát âm lại từ này."}
                            </div>
                        </div>
                    )}
                    {/* NAV */}

                    <div className="speaking-navigation">

                        <button
                            className="speaking-nav-back"
                            disabled={
                                currentIndex === 0
                            }
                            onClick={
                                previousWord
                            }
                        >
                            <ArrowLeftOutlined />
                            Back
                        </button>

                        {currentResult ? (
                            <button
                                className="speaking-nav-next"
                                onClick={
                                    nextWord
                                }
                            >
                                {currentIndex ===
                                    words.length - 1
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
                            <div className="speaking-navigation-space" />
                        )}

                    </div>

                </div>

            </div>

        </div>

    );
}

export default Speaking;