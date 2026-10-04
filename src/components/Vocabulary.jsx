import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, message, Popconfirm, Select } from "antd";
import AppHeader from "./AppHeader";
import {
  SearchOutlined,
  SoundOutlined,
  BookOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  PlayCircleFilled,
  CloseCircleFilled,
  FilterOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import {
  fetchLearnerVocabulary,
  removeLearnerVocabulary,
  updateVocabularyStatus,
} from "../services/api";
import "../styles/Vocabulary.css";
import MobileBottomNav from "./MobileBottomNav";

const STATUS = {
  mastered: {
    label: "Đã thuộc",
    className: "mastered",
    icon: <CheckCircleFilled />,
  },
  learning: {
    label: "Đang học",
    className: "learning",
    icon: <ClockCircleFilled />,
  },
  new: {
    label: "Chưa học",
    className: "new",
    icon: <CloseCircleFilled />,
  },
};

function Vocabulary() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    let active = true;
    fetchLearnerVocabulary()
      .then((entries) => { if (active) setWords(entries); })
      .catch((error) => { if (active) setLoadError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // =========================
  // LẤY DANH SÁCH TAG
  // =========================

  const tags = useMemo(() => {
    const result = new Set();

    words.forEach((item) => {
      item.tags?.forEach((tag) => result.add(tag));
    });

    return [...result];
  }, [words]);

  // =========================
  // THỐNG KÊ
  // =========================

  const statistics = useMemo(() => {
    return {
      total: words.length,

      mastered: words.filter(
        (item) => item.status === "mastered"
      ).length,

      learning: words.filter(
        (item) => item.status === "learning"
      ).length,

      new: words.filter(
        (item) => item.status === "new"
      ).length,
    };
  }, [words]);

  // =========================
  // FILTER + SEARCH + SORT
  // =========================

  const filteredWords = useMemo(() => {
    let result = [...words];

    // Search
    if (search.trim()) {
      const keyword = search.toLowerCase().trim();

      result = result.filter((item) => {
        const word = item.word?.toLowerCase() || "";

        const meanings =
          item.meanings
            ?.map((meaning) => meaning.meaning)
            .join(" ")
            .toLowerCase() || "";

        return (
          word.includes(keyword) ||
          meanings.includes(keyword)
        );
      });
    }

    // Status
    if (statusFilter !== "all") {
      result = result.filter(
        (item) => item.status === statusFilter
      );
    }

    // Tag
    if (tagFilter !== "all") {
      result = result.filter((item) =>
        item.tags?.includes(tagFilter)
      );
    }

    // Sort
    if (sortBy === "az") {
      result.sort((a, b) =>
        a.word.localeCompare(b.word)
      );
    }

    if (sortBy === "za") {
      result.sort((a, b) =>
        b.word.localeCompare(a.word)
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.savedAt) -
          new Date(a.savedAt)
      );
    }

    if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.savedAt) -
          new Date(b.savedAt)
      );
    }

    return result;
  }, [
    words,
    search,
    statusFilter,
    tagFilter,
    sortBy,
  ]);

  // =========================
  // PHÁT ÂM
  // =========================

  const speakWord = (word) => {
    if (!("speechSynthesis" in window)) {
      alert("Trình duyệt không hỗ trợ phát âm.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(word);

    utterance.lang = "en-US";
    utterance.rate = 0.75;

    window.speechSynthesis.speak(utterance);
  };

  // =========================
  // RESET
  // =========================

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTagFilter("all");
    setSortBy("newest");
  };

  const changeWordStatus = async (word, status) => {
    const previousStatus = word.status;
    setWords((current) => current.map((item) => item.word === word.word ? { ...item, status } : item));
    try {
      await updateVocabularyStatus(word.word, status);
      messageApi.success(`Đã cập nhật trạng thái “${word.word}”.`);
    } catch (error) {
      setWords((current) => current.map((item) => item.word === word.word ? { ...item, status: previousStatus } : item));
      messageApi.error(error.message || "Không thể cập nhật trạng thái từ vựng.");
    }
  };

  const removeWord = async (word) => {
    try {
      await removeLearnerVocabulary(word.word);
      setWords((current) => current.filter((item) => item.word !== word.word));
      messageApi.success(`Đã bỏ “${word.word}” khỏi từ vựng đã lưu.`);
    } catch (error) {
      messageApi.error(error.message || "Không thể xóa từ vựng.");
    }
  };

  return (
    <div className="vocabulary-page">
      <AppHeader />
      {contextHolder}

      {/* ================= MAIN ================= */}

      <main className="vocabulary-container">

        {/* HEADER */}

        <section className="vocabulary-header">

          <div>
            <div className="page-kicker">
              <BookOutlined />
              TỪ VỰNG CỦA TÔI
            </div>

            <h1>
              Kho từ vựng
              <span> của bạn</span>
            </h1>

            <p>
              Quản lý những từ bạn đã lưu và theo dõi
              quá trình học của mình.
            </p>
          </div>

          <button
            className="review-button"
            onClick={() => navigate("/review")}
          >
            <PlayCircleFilled />
            Ôn tập ngay
          </button>

        </section>

        {/* ================= STATISTICS ================= */}

        <section className="vocabulary-stats">

          <div className="stat-card total">
            <div className="stat-icon">
              <BookOutlined />
            </div>

            <div>
              <span>Tổng từ</span>
              <strong>{statistics.total}</strong>
            </div>
          </div>

          <div className="stat-card mastered">
            <div className="stat-icon">
              <CheckCircleFilled />
            </div>

            <div>
              <span>Đã thuộc</span>
              <strong>{statistics.mastered}</strong>
            </div>
          </div>

          <div className="stat-card learning">
            <div className="stat-icon">
              <ClockCircleFilled />
            </div>

            <div>
              <span>Đang học</span>
              <strong>{statistics.learning}</strong>
            </div>
          </div>

          <div className="stat-card new">
            <div className="stat-icon">
              <CloseCircleFilled />
            </div>

            <div>
              <span>Chưa học</span>
              <strong>{statistics.new}</strong>
            </div>
          </div>

        </section>

        {/* ================= SEARCH ================= */}

        <section className="vocabulary-tools">

          <div className="search-box">

            <SearchOutlined />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Tìm từ vựng hoặc nghĩa..."
            />

            {search && (
              <button
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}

          </div>

          <button
            className={
              showFilters
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() =>
              setShowFilters((prev) => !prev)
            }
          >
            <FilterOutlined />
            Bộ lọc
          </button>

        </section>

        {/* ================= FILTER ================= */}

        {showFilters && (
          <section className="filters-panel">

            <div className="filter-group">

              <label>Trạng thái</label>

              <div className="filter-options">

                <button
                  className={
                    statusFilter === "all"
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter("all")
                  }
                >
                  Tất cả
                </button>

                <button
                  className={
                    statusFilter === "mastered"
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter("mastered")
                  }
                >
                  🟢 Đã thuộc
                </button>

                <button
                  className={
                    statusFilter === "learning"
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter("learning")
                  }
                >
                  🟡 Đang học
                </button>

                <button
                  className={
                    statusFilter === "new"
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter("new")
                  }
                >
                  🔴 Chưa học
                </button>

              </div>

            </div>

            <div className="filter-group">

              <label>Chủ đề</label>

              <div className="filter-options">

                <button
                  className={
                    tagFilter === "all"
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setTagFilter("all")
                  }
                >
                  Tất cả
                </button>

                {tags.map((tag) => (
                  <button
                    key={tag}
                    className={
                      tagFilter === tag
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setTagFilter(tag)
                    }
                  >
                    #{tag}
                  </button>
                ))}

              </div>

            </div>

            <div className="filter-group">

              <label>Sắp xếp</label>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
              >
                <option value="newest">
                  Mới lưu nhất
                </option>

                <option value="oldest">
                  Cũ nhất
                </option>

                <option value="az">
                  A → Z
                </option>

                <option value="za">
                  Z → A
                </option>
              </select>

            </div>

            <button
              className="reset-filter"
              onClick={resetFilters}
            >
              <ReloadOutlined />
              Xóa bộ lọc
            </button>

          </section>
        )}

        {/* ================= RESULT ================= */}

        <div className="result-header">

          <div>
            <strong>
              {filteredWords.length}
            </strong>{" "}
            từ được tìm thấy
          </div>

          {(search ||
            statusFilter !== "all" ||
            tagFilter !== "all") && (
            <span>
              Đang áp dụng bộ lọc
            </span>
          )}

        </div>

        {loadError && <p className="vocabulary-load-error" role="alert">{loadError}</p>}

        {/* ================= WORD LIST ================= */}

        {filteredWords.length === 0 ? (

          <div className="empty-vocabulary">

            <div className="empty-icon">
                {loading ? "⏳" : "🔎"}
            </div>

            <h3>
                {loading ? "Đang tải từ đã lưu..." : loadError ? "Không tải được từ vựng" : "Chưa có từ phù hợp"}
            </h3>

            <p>
                {loading ? "Đang đồng bộ danh sách từ vựng của bạn." : loadError || "Thử thay đổi bộ lọc hoặc lưu thêm từ từ Story."}
            </p>

              {!loading && !loadError && <button onClick={resetFilters}>Xóa bộ lọc</button>}

          </div>

        ) : (

          <section className="vocabulary-list">

            {filteredWords.map((item) => {

              const status = STATUS[item.status] ?? STATUS.new;

              return (
                <article
                  className="vocabulary-item"
                  key={item.id}
                >

                  {/* WORD */}

                  <div className="word-main">

                    <div className="word-title">

                      <h2>
                        {item.word}
                      </h2>

                      <button
                        className="pronounce-button"
                        onClick={() =>
                          speakWord(item.word)
                        }
                      >
                        <SoundOutlined />
                      </button>

                    </div>

                    <div className="word-phonetic">
                      {item.phonetic}
                    </div>

                    <div className="word-tags">

                      {item.tags?.map((tag) => (
                        <span key={tag}>
                          #{tag}
                        </span>
                      ))}

                    </div>

                  </div>

                  {/* MEANING */}

                  <div className="word-meaning">

                    {item.meanings?.map(
                      (meaning, index) => (
                        <div
                          className="meaning-row"
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

                  {/* STATUS */}

                  <div className="word-status">

                    <div
                      className={`status-badge ${status.className}`}
                    >
                      {status.icon}
                      {status.label}
                    </div>

                    <small>
                      {new Date(
                        item.savedAt
                      ).toLocaleDateString(
                        "vi-VN"
                      )}
                    </small>

                    <Select
                      aria-label={`Trạng thái từ ${item.word}`}
                      size="small"
                      value={item.status}
                      options={Object.entries(STATUS).map(([value, option]) => ({ label: option.label, value }))}
                      onChange={(value) => changeWordStatus(item, value)}
                    />

                    <Popconfirm
                      title={`Bỏ “${item.word}” khỏi từ vựng đã lưu?`}
                      okText="Bỏ từ"
                      cancelText="Hủy"
                      onConfirm={() => removeWord(item)}
                    >
                      <Button
                        aria-label={`Xóa từ ${item.word}`}
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>

                  </div>

                </article>
              );
            })}

          </section>

        )}

      </main>

      {/* ================= MOBILE NAV ================= */}

      
    <MobileBottomNav />

    </div>
  );
}

export default Vocabulary;