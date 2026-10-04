import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppHeader from "./AppHeader";
import {
    SearchOutlined,
    ArrowLeftOutlined,
    PlayCircleFilled,
    BookOutlined,
    ClockCircleOutlined,
    StarFilled,
    CheckCircleFilled,
    RightOutlined,
} from "@ant-design/icons";
import { fetchLearnerProgress, requestApi } from "../services/api";

import "../styles/stories.css";
import MobileBottomNav from "./MobileBottomNav";

function Stories() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState(searchParams.get("topic") || "all");
    const [level, setLevel] = useState("all");
    const [stories, setStories] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        let active = true;
        Promise.all([
            requestApi("/stories?limit=100"),
            requestApi("/topics"),
            fetchLearnerProgress(),
        ])
            .then(([storyResult, topicResult, progress]) => {
                if (!active) return;
                const completedIds = new Set((progress.learnedStories ?? []).map((story) => String(story._id)));
                setTopics(topicResult.data ?? []);
                setStories((storyResult.data ?? []).map((story) => {
                    const wordCount = story.content?.trim().split(/\s+/).filter(Boolean).length ?? 0;
                    const topicName = story.topic?.name ?? "Other";
                    return {
                        id: story._id,
                        slug: story.slug,
                        title: story.title,
                        description: story.description,
                        level: story.level,
                        levelVi: story.level === "Beginner" ? "Cơ bản" : story.level === "Intermediate" ? "Trung cấp" : "Nâng cao",
                        category: topicName,
                        categorySlug: story.topic?.slug ?? "",
                        categoryVi: topicName,
                        duration: `${Math.max(1, Math.ceil(wordCount / 130))} min`,
                        words: story.vocabulary?.length || wordCount,
                        progress: completedIds.has(String(story._id)) ? 100 : 0,
                        emoji: topicName === "Travel" ? "✈️" : topicName === "Food" ? "🍽️" : topicName === "Nature" ? "🌿" : "📖",
                        color: topicName === "Food" ? "yellow" : topicName === "Nature" ? "green" : topicName === "Travel" ? "orange" : "blue",
                        featured: false,
                        coverImage: story.coverImage,
                    };
                }));
            })
            .catch((error) => { if (active) setLoadError(error.message); })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, []);

    const categories = [
        { key: "all", label: "Tất cả", emoji: "✨" },
        ...topics.map((topic) => ({ key: topic.slug, label: topic.name, emoji: "📚" })),
    ];
    const totalVocabulary = stories.reduce((total, story) => total + story.words, 0);
    const estimatedHours = Math.max(1, Math.round(stories.reduce((total, story) => total + Number.parseInt(story.duration, 10), 0) / 60));
    const featuredStory = stories[0];

    const filteredStories = useMemo(() => {
        return stories.filter((story) => {
            const matchSearch =
                story.title.toLowerCase().includes(search.toLowerCase()) ||
                story.description.toLowerCase().includes(search.toLowerCase());

            const matchCategory =
                category === "all" || story.categorySlug === category;

            const matchLevel =
                level === "all" || story.level === level;

            return matchSearch && matchCategory && matchLevel;
        });
    }, [stories, search, category, level]);

    const openStory = (story) => navigate(`/stories/${story.slug}`);

    return (
        <div className="stories-page">
            <AppHeader />

            {/* ================= MAIN ================= */}
            <main className="stories-main">

                {/* BACK */}
                <button
                    className="back-home"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeftOutlined />
                    Quay lại trang chủ
                </button>

                {/* ================= HERO ================= */}
                <section className="stories-hero">

                    <div className="stories-hero-content">

                        <div className="hero-small-badge">
                            📚 English Stories
                        </div>

                        <h1>
                            Học tiếng Anh
                            <br />
                            qua những câu chuyện
                            <span> ✨</span>
                        </h1>

                        <p>
                            Đọc những câu chuyện thú vị, học từ vựng mới
                            và luyện nghe tiếng Anh mỗi ngày.
                        </p>

                        <div className="stories-stats">

                            <div className="story-stat">
                                <div className="stat-icon orange">
                                    <BookOutlined />
                                </div>

                                <div>
                                    <strong>{stories.length}</strong>
                                    <span>Câu chuyện</span>
                                </div>
                            </div>

                            <div className="story-stat">
                                <div className="stat-icon green">
                                    <StarFilled />
                                </div>

                                <div>
                                    <strong>{totalVocabulary}</strong>
                                    <span>Từ vựng</span>
                                </div>
                            </div>

                            <div className="story-stat">
                                <div className="stat-icon blue">
                                    <PlayCircleFilled />
                                </div>

                                <div>
                                    <strong>{estimatedHours}h</strong>
                                    <span>Luyện nghe</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="stories-hero-art">
                        <div className="cloud cloud-1">☁️</div>
                        <div className="cloud cloud-2">☁️</div>

                        <div className="story-book">
                            <div className="book-cover">
                                <span>📖</span>
                                <strong>English</strong>
                                <small>Stories</small>
                            </div>
                        </div>

                        <div className="hero-character">
                            🦊
                        </div>

                        <div className="floating-word word-1">
                            Hello! 👋
                        </div>

                        <div className="floating-word word-2">
                            Let's learn! ✨
                        </div>
                    </div>

                </section>

                {/* ================= SEARCH ================= */}
                <section className="stories-tools">

                    <div className="stories-search">
                        <SearchOutlined />

                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm câu chuyện..."
                        />

                        {search && (
                            <button onClick={() => setSearch("")}>
                                ×
                            </button>
                        )}
                    </div>

                    <div className="level-filter">

                        <span>Trình độ:</span>

                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                        >
                            <option value="all">Tất cả</option>
                            <option value="Beginner">Cơ bản</option>
                            <option value="Intermediate">Trung cấp</option>
                            <option value="Advanced">Nâng cao</option>
                        </select>

                    </div>

                </section>

                {/* ================= CATEGORY ================= */}
                <section className="category-section">

                    <div className="section-heading">
                        <div>
                            <h2>Khám phá câu chuyện</h2>
                            <p>Chọn một chủ đề bạn yêu thích</p>
                        </div>

                        <span className="story-count">
                            {filteredStories.length} câu chuyện
                        </span>
                    </div>

                    <div className="category-list">

                        {categories.map((item) => (
                            <button
                                key={item.key}
                                className={
                                    category === item.key
                                        ? "category-chip active"
                                        : "category-chip"
                                }
                                onClick={() => setCategory(item.key)}
                            >
                                <span>{item.emoji}</span>
                                {item.label}
                            </button>
                        ))}

                    </div>

                </section>

                {/* ================= FEATURED ================= */}
                {featuredStory && category === "all" &&
                    !search &&
                    level === "all" && (
                        <section className="featured-story">

                            <div className="featured-left">

                                <div className="featured-label">
                                    ⭐ ĐANG HỌC
                                </div>

                                <h2>{featuredStory.title}</h2>

                                <p>
                                    {featuredStory.description}
                                </p>

                                <div className="featured-meta">
                                    <span>
                                        <BookOutlined />
                                        {featuredStory.words} từ
                                    </span>

                                    <span>
                                        <ClockCircleOutlined />
                                        {featuredStory.duration}
                                    </span>

                                    <span>
                                        🌱 {featuredStory.level}
                                    </span>
                                </div>

                                <div className="featured-progress">

                                    <div className="progress-header">
                                        <span>Tiến độ</span>
                                        <strong>{featuredStory.progress}%</strong>
                                    </div>

                                    <div className="progress-track">
                                        <div
                                            className="progress-value"
                                            style={{ width: `${featuredStory.progress}%` }}
                                        />
                                    </div>

                                </div>

                                <button
                                    className="featured-button"
                                    onClick={() =>
                                        navigate(`/stories/${featuredStory.slug}`)
                                    }
                                >
                                    <PlayCircleFilled />
                                    Tiếp tục học
                                    <RightOutlined />
                                </button>

                            </div>

                            <div className="featured-right">
                                <div className="featured-circle">
                                    ✈️
                                </div>

                                <div className="plane">
                                    ☁️
                                </div>

                                <div className="travel-card">
                                    <span>{featuredStory.category.toUpperCase()}</span>
                                    <strong>{featuredStory.title}</strong>
                                    <small>{featuredStory.level} · Let's learn</small>
                                </div>
                            </div>

                        </section>
                    )}

                {/* ================= STORY GRID ================= */}
                <section className="story-library">

                    <div className="section-heading">
                        <div>
                            <h2>
                                {search
                                    ? `Kết quả cho "${search}"`
                                    : "Tất cả câu chuyện"}
                            </h2>

                            <p>
                                Chọn một câu chuyện và bắt đầu học ngay
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="empty-stories">Đang tải Stories...</div>
                    ) : loadError ? (
                        <div className="empty-stories" role="alert">{loadError}</div>
                    ) : filteredStories.length > 0 ? (

                        <div className="story-grid">

                            {filteredStories.map((story) => (

                                <article
                                    className="story-card"
                                    key={story.id}
                                >

                                    <div
                                        className={`story-cover ${story.color}`}
                                    >

                                        {story.progress === 100 && (
                                            <div className="completed-badge">
                                                <CheckCircleFilled />
                                                Đã hoàn thành
                                            </div>
                                        )}

                                        <div className="story-emoji">
                                            {story.emoji}
                                        </div>

                                        <div className="story-level">
                                            {story.levelVi}
                                        </div>

                                    </div>

                                    <div className="story-card-body">

                                        <div className="story-card-category">
                                            {story.categoryVi}
                                        </div>

                                        <h3>{story.title}</h3>

                                        <p>{story.description}</p>

                                        <div className="story-card-meta">

                                            <span>
                                                <ClockCircleOutlined />
                                                {story.duration}
                                            </span>

                                            <span>
                                                <BookOutlined />
                                                {story.words} từ
                                            </span>

                                        </div>

                                        {story.progress > 0 && (
                                            <div className="card-progress">

                                                <div className="card-progress-info">
                                                    <span>Tiến độ</span>
                                                    <strong>
                                                        {story.progress}%
                                                    </strong>
                                                </div>

                                                <div className="card-progress-track">
                                                    <div
                                                        style={{
                                                            width: `${story.progress}%`,
                                                        }}
                                                    />
                                                </div>

                                            </div>
                                        )}

                                        <button
                                            className="story-card-button"
                                            onClick={() => openStory(story)}
                                        >
                                            {story.progress === 100
                                                ? "Đọc lại"
                                                : story.progress > 0
                                                    ? "Tiếp tục"
                                                    : "Bắt đầu học"}

                                            <RightOutlined />
                                        </button>

                                    </div>

                                </article>

                            ))}

                        </div>

                    ) : (

                        <div className="empty-stories">

                            <div>🔎</div>

                            <h3>
                                Không tìm thấy câu chuyện
                            </h3>

                            <p>
                                Thử tìm kiếm với từ khóa khác nhé.
                            </p>

                            <button
                                onClick={() => {
                                    setSearch("");
                                    setCategory("all");
                                    setLevel("all");
                                }}
                            >
                                Xem tất cả
                            </button>

                        </div>

                    )}

                </section>

                {/* ================= DAILY GOAL ================= */}
                <section className="daily-goal">

                    <div className="goal-icon">
                        🎯
                    </div>

                    <div className="goal-content">
                        <span>MỤC TIÊU HÔM NAY</span>
                        <h3>
                            Đọc thêm một câu chuyện nhé!
                        </h3>

                        <p>
                            Chỉ cần 5 phút mỗi ngày, tiếng Anh của bạn
                            sẽ tiến bộ từng chút một.
                        </p>
                    </div>

                    <div className="goal-progress">

                        <div className="goal-progress-circle">
                            <strong>1/2</strong>
                        </div>

                        <span>stories</span>

                    </div>

                </section>

            </main>
            <MobileBottomNav />

        </div>
    );
}

export default Stories;