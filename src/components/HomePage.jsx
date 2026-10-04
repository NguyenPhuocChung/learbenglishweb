import React, { useEffect, useState } from "react";
import {
  BookOutlined,
  CustomerServiceOutlined,
  ReadOutlined,
  ArrowRightOutlined,
  TrophyFilled,
  ClockCircleOutlined,
  PlayCircleFilled,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import AppHeader from "./AppHeader";
import DictionaryLookup from "./DictionaryLookup";
import { fetchHomeData, fetchLearnerProgress } from "../services/api";
import MobileBottomNav from "./MobileBottomNav";
const Home = () => {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState(null);
  const [learnerProgress, setLearnerProgress] = useState(null);
  const [homeError, setHomeError] = useState("");

  useEffect(() => {
    let active = true;
    fetchHomeData()
      .then((data) => { if (active) setHomeData(data); })
      .catch((error) => { if (active) setHomeError(error.message); });
    fetchLearnerProgress()
      .then((data) => { if (active) setLearnerProgress(data); })
      .catch(() => { });
    return () => { active = false; };
  }, []);

  const topicIcons = ["✈️", "🍔", "🐶", "🌳"];
  const topicClasses = ["topic-blue", "topic-orange", "topic-green", "topic-purple"];
  const topics = (homeData?.topics ?? []).slice(0, 4).map((topic, index) => ({
    ...topic,
    title: topic.name,
    subtitle: topic.description || "Khám phá câu chuyện theo chủ đề",
    icon: topicIcons[index % topicIcons.length],
    className: topicClasses[index % topicClasses.length],
  }));
  const featuredStory = homeData?.featuredStory;
  const completedStories = learnerProgress?.completedStories ?? 0;
  const savedWords = learnerProgress?.savedWords ?? 0;
  const publishedStoryCount = homeData?.stats?.totalStories ?? 0;
  const storyProgress = publishedStoryCount
    ? Math.min(Math.round((completedStories / publishedStoryCount) * 100), 100)
    : 0;
  const featuredWordCount = featuredStory?.content?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  const featuredVocabularyCount = featuredStory?.vocabulary?.length || new Set(
    (featuredStory?.content?.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []).map((word) => word.toLowerCase()),
  ).size;
  const featuredDuration = Math.max(1, Math.ceil(featuredWordCount / 130));
  const featuredIcon = featuredStory?.topic?.name === "Travel"
    ? "✈️"
    : featuredStory?.topic?.name === "Food"
      ? "🍽️"
      : featuredStory?.topic?.name === "Nature"
        ? "🌿"
        : "📖";

  return (
    <div className="home-page">
      <AppHeader />

      {/* ================= MAIN ================= */}

      <main className="home-container">

        {/* ================= HERO ================= */}

        <section className="home-hero">

          <div className="hero-left">

            <div className="welcome-badge">
              👋 Chào mừng bạn quay lại!
            </div>

            <h1>
              Học tiếng Anh
              <br />

              <span>
                vui hơn mỗi ngày
              </span>
            </h1>

            <p className="hero-description">
              Đọc truyện, học từ vựng và luyện nghe
              qua những bài học ngắn, dễ hiểu.
            </p>

            <div className="hero-buttons">

              <button
                className="primary-button"
                onClick={() => navigate("/stories")}
              >
                <BookOutlined />

                Bắt đầu học

                <ArrowRightOutlined />
              </button>

              <button
                className="secondary-button"
                onClick={() => navigate("/vocabulary")}
              >
                <ReadOutlined />

                Ôn từ vựng
              </button>

            </div>

            <div className="hero-stats">

              <div className="hero-stat">
                <strong>{savedWords}</strong>
                <span>Từ đã học</span>
              </div>

              <div className="stat-divider" />

              <div className="hero-stat">
                <strong>{completedStories}</strong>
                <span>Bài đã hoàn thành</span>
              </div>

              <div className="stat-divider" />

              <div className="hero-stat">
                <strong>{learnerProgress?.streakDays ?? 0}</strong>
                <span>Ngày liên tiếp</span>
              </div>

            </div>

          </div>


          {/* ================= HERO ILLUSTRATION ================= */}

          <div className="hero-illustration">

            <div className="floating-star star-one">
              ⭐
            </div>

            <div className="floating-star star-two">
              ✨
            </div>

            <div className="floating-word word-one">
              Hello!
            </div>

            <div className="floating-word word-two">
              Learn 📚
            </div>

            <div className="hero-character">

              <div className="character-circle">
                🐻
              </div>

              <div className="character-book">
                📖
              </div>

            </div>

            <div className="hero-cloud cloud-one" />
            <div className="hero-cloud cloud-two" />

          </div>

        </section>

        <DictionaryLookup />
        {homeError && <p className="home-data-error" role="status">{homeError}</p>}

        {/* ================= TODAY PROGRESS ================= */}

        <section className="progress-section">

          <div className="section-heading">

            <div>
              <span className="section-label">
                HÔM NAY
              </span>

              <h2>
                Tiến độ học tập
              </h2>
            </div>

            

          </div>


          <div className="progress-grid">

            {/* PROGRESS */}

            <div className="progress-main-card">

              <div className="progress-card-top">

                <div className="progress-icon">
                  🎯
                </div>

                <div>
                  <strong>
                    Tiến độ đọc Story
                  </strong>

                  <span>
                    {completedStories} / {publishedStoryCount} Story đã hoàn thành
                  </span>
                </div>

              </div>

              <div className="progress-number">
                <strong>{storyProgress}%</strong>

                <span>
                  hoàn thành
                </span>
              </div>

              <div className="home-progress-bar">
                <div
                  style={{
                    width: `${storyProgress}%`,
                  }}
                />
              </div>

              <div className="progress-bottom">

                <span>
                  {completedStories} Story hoàn thành
                </span>

                <span>
                  {publishedStoryCount} Story đã xuất bản
                </span>

              </div>

            </div>


            {/* STREAK */}

            <div className="small-progress-card streak-card">

              <div className="small-card-icon">
                🔥
              </div>

              <div className="small-card-number">
                {learnerProgress?.streakDays ?? 0}
              </div>

              <strong>
                Ngày liên tiếp
              </strong>

              <p>
                Giữ vững chuỗi học tập nhé!
              </p>

            </div>


            {/* WORD */}

            <div className="small-progress-card">

              <div className="small-card-icon blue">
                📚
              </div>

              <div className="small-card-number">
                {savedWords}
              </div>

              <strong>
                Từ mới hôm nay
              </strong>

              <p>
                Từ vựng đã lưu
              </p>

            </div>

          </div>

        </section>


        {/* ================= LEARNING FEATURES ================= */}

        <section className="feature-section">

          <div className="section-heading">

            <div>
              <span className="section-label">
                KHÁM PHÁ
              </span>

              <h2>
                Bạn muốn học gì?
              </h2>
            </div>

          </div>


          <div className="feature-grid">

            {/* STORY */}

            <button
              className="feature-card feature-story"
              onClick={() => navigate("/stories")}
            >

              <div className="feature-card-icon">
                📖
              </div>

              <div className="feature-content">

                <span className="feature-small">
                  ĐỌC & HỌC
                </span>

                <h3>
                  Đọc truyện
                </h3>

                <p>
                  Học tiếng Anh qua những
                  câu chuyện thú vị.
                </p>

                <div className="feature-footer">
                  {publishedStoryCount} bài học
                  <ArrowRightOutlined />
                </div>

              </div>

            </button>


            {/* VOCABULARY */}

            <button
              className="feature-card feature-vocab"
              onClick={() => navigate("/learning")}
            >

              <div className="feature-card-icon">
                🧠
              </div>

              <div className="feature-content">

                <span className="feature-small">
                  GHI NHỚ
                </span>

                <h3>
                  Từ vựng
                </h3>

                <p>
                  Học và lưu lại những từ
                  bạn chưa biết.
                </p>

                <div className="feature-footer">
                  {savedWords} từ
                  <ArrowRightOutlined />
                </div>

              </div>

            </button>

            {/* SPEAKING */}

            <button
              className="feature-card feature-speaking"
              onClick={() => navigate("/speaking")}
            >
              <div className="feature-card-icon">
                🗣️
              </div>

              <div className="feature-content">

                <span className="feature-small">
                  LUYỆN PHÁT ÂM
                </span>

                <h3>
                  Luyện nói
                </h3>

                <p>
                  Đọc từ vựng và kiểm tra
                  độ chính xác phát âm.
                </p>

                <div className="feature-footer">
                  Kiểm tra ngay
                  <ArrowRightOutlined />
                </div>

              </div>

            </button>
            {/* LISTENING */}

            <button
              className="feature-card feature-listen"
              onClick={() => navigate("/listening")}
            >

              <div className="feature-card-icon">
                🎧
              </div>

              <div className="feature-content">

                <span className="feature-small">
                  LUYỆN NGHE
                </span>

                <h3>
                  Nghe tiếng Anh
                </h3>

                <p>
                  Luyện nghe với giọng đọc
                  tiếng Anh chậm và rõ.
                </p>

                <div className="feature-footer">
                  Kiểm tra ngay
                  <ArrowRightOutlined />
                </div>

              </div>

            </button>


            {/* REVIEW */}

            <button
              className="feature-card feature-review"
              onClick={() => navigate("/review")}
            >

              <div className="feature-card-icon">
                🏆
              </div>

              <div className="feature-content">

                <span className="feature-small">
                  LUYỆN TẬP
                </span>

                <h3>
                  Ôn tập
                </h3>

                <p>
                  Kiểm tra lại những gì
                  bạn đã học.
                </p>

                <div className="feature-footer">
                  Bắt đầu
                  <ArrowRightOutlined />
                </div>

              </div>

            </button>

          </div>

        </section>


        {/* ================= CONTINUE ================= */}

        <section className="continue-section">

          <div className="section-heading">

            <div>
              <span className="section-label">
                TIẾP TỤC HỌC
              </span>

              <h2>
                Bài học của bạn
              </h2>
            </div>

            <button
              className="view-more"
              onClick={() => navigate("/stories")}
            >
              Xem tất cả
              <ArrowRightOutlined />
            </button>

          </div>


          {featuredStory ? (
            <div className="continue-card">

              <div className="story-thumbnail">

                <div className="thumbnail-emoji">
                  {featuredIcon}
                </div>

                <span>
                  {featuredStory.level}
                </span>

              </div>


              <div className="continue-info">

                <div className="continue-category">
                  {featuredStory.topic?.name ?? "Story"}
                </div>

                <h3>
                  {featuredStory.title}
                </h3>

                <p>
                  {featuredStory.description}
                </p>

                <div className="continue-meta">

                  <span>
                    <ClockCircleOutlined />
                    {featuredDuration} phút
                  </span>

                  <span>
                    <BookOutlined />
                    {featuredWordCount} từ vựng
                  </span>

                </div>

                <div className="continue-progress">

                  <div className="continue-progress-top">
                    <span>
                      Tiến độ
                    </span>

                    <strong>
                      {storyProgress}%
                    </strong>
                  </div>

                  <div className="continue-bar">
                    <div
                      style={{
                        width: `${storyProgress}%`,
                      }}
                    />
                  </div>

                </div>

              </div>


              <button
                className="continue-button"
                onClick={() =>
                  navigate(`/stories/${featuredStory.slug}`)
                }
              >
                <PlayCircleFilled />
                Học tiếp
              </button>

            </div>
          ) : (
            <p className="home-data-empty">Chưa có Story xuất bản để tiếp tục học.</p>
          )}

        </section>


        {/* ================= TOPICS ================= */}

        <section className="topics-section">

          <div className="section-heading">

            <div>
              <span className="section-label">
                CHỦ ĐỀ
              </span>

              <h2>
                Khám phá theo chủ đề
              </h2>
            </div>

          </div>


          <div className="topic-grid">

            {topics.map((topic) => (

              <button
                key={topic._id}
                className={`topic-card ${topic.className}`}
                onClick={() =>
                  navigate(
                    `/stories?topic=${encodeURIComponent(topic.slug)}`
                  )
                }
              >

                <div className="topic-icon">
                  {topic.icon}
                </div>

                <div>
                  <strong>
                    {topic.title}
                  </strong>

                  <span>
                    {topic.subtitle}
                  </span>
                </div>

                <ArrowRightOutlined />

              </button>

            ))}

          </div>

        </section>


        {/* ================= DAILY TIP ================= */}

        <section className="daily-tip">

          <div className="tip-left">

            <div className="tip-big-icon">
              💡
            </div>

            <div>

              <span>
                MẸO HỌC HÔM NAY
              </span>

              <h3>
                Đừng cố học quá nhiều từ cùng lúc!
              </h3>

              <p>
                Hãy chọn 5–10 từ quan trọng,
                đặt câu và gặp lại chúng nhiều lần.
              </p>

            </div>

          </div>

          <div className="tip-decoration">
            🌟
          </div>

        </section>

      </main>




      {/* ================= CSS ================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .home-page {
          min-height: 100vh;

          background:
            radial-gradient(
              circle at 5% 0%,
              #eef6ff 0,
              transparent 28%
            ),
            radial-gradient(
              circle at 95% 20%,
              #f5efff 0,
              transparent 25%
            ),
            #f7f9fc;

          color: #172033;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          padding-bottom: 50px;
        }


        /* ================= NAVBAR ================= */

        .home-navbar {
          height: 72px;

          padding: 0 5%;

          background: rgba(
            255,
            255,
            255,
            .88
          );

          backdrop-filter: blur(18px);

          border-bottom:
            1px solid #e9edf3;

          display: flex;
          align-items: center;
          justify-content: space-between;

          position: sticky;
          top: 0;

          z-index: 100;
        }

        .home-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .logo-icon {
          width: 60px;
          height: 60px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          font-size: 20px;
          background: #fafbfc;
          box-shadow:
            0 8px 20px
            rgba(
              22,
              119,
              255,
              .2
            );
        }

        .logo-text {
          display: flex;
          flex-direction: column;

          line-height: 1;
        }

        .logo-text strong {
          font-size: 17px;
          color: #172033;
        }

        .logo-text span {
          font-size: 11px;
          color: #1677ff;
          margin-top: 4px;
          font-weight: 700;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .nav-item {
          border: 0;
          background: transparent;

          padding: 9px 15px;

          border-radius: 10px;

          color: #69778c;

          font-weight: 600;

          cursor: pointer;

          transition: .2s;
        }

        .nav-item:hover,
        .nav-item.active {
          background: #edf5ff;
          color: #1677ff;
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .streak {
          display: flex;
          align-items: center;
          gap: 5px;

          color: #f08c00;

          font-weight: 800;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 8px;

          font-size: 13px;
          font-weight: 600;
        }

        .user-avatar {
          width: 36px;
          height: 36px;

          border-radius: 50%;

          display: grid;
          place-items: center;

          color: white;
          font-weight: 800;

          background:
            linear-gradient(
              135deg,
              #ff9c6e,
              #ff7875
            );
        }


        /* ================= CONTAINER ================= */

        .home-container {
          width: min(
            1180px,
            calc(100% - 40px)
          );

          margin: auto;
          padding: 35px 0 80px;
        }


        /* ================= HERO ================= */

        .home-hero {
          min-height: 390px;

          display: grid;
          grid-template-columns:
            1.05fr
            .95fr;

          overflow: hidden;

          border-radius: 30px;

          background:
            linear-gradient(
              120deg,
              #eaf5ff,
              #f5f9ff
            );

          border:
            1px solid #e2edfa;

          box-shadow:
            0 20px 60px
            rgba(
              32,
              75,
              125,
              .08
            );
        }

        .hero-left {
          padding: 48px 45px;

          display: flex;
          flex-direction: column;
          justify-content: center;

          position: relative;
          z-index: 2;
        }

        .welcome-badge {
          width: fit-content;

          padding: 7px 13px;

          background: white;

          border-radius: 30px;

          color: #1677ff;

          font-size: 12px;

          font-weight: 700;

          margin-bottom: 17px;

          box-shadow:
            0 5px 18px
            rgba(0,0,0,.04);
        }

        .hero-left h1 {
          margin: 0;

          font-size:
            clamp(
              38px,
              5vw,
              56px
            );

          line-height: 1.08;

          letter-spacing: -2px;
        }

        .hero-left h1 span {
          color: #1677ff;
        }

        .hero-description {
          max-width: 490px;

          color: #66758b;

          line-height: 1.7;

          margin: 17px 0 23px;

          font-size: 15px;
        }

        .hero-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .primary-button,
        .secondary-button {
          border: 0;

          border-radius: 13px;

          padding: 12px 17px;

          display: flex;
          align-items: center;
          gap: 9px;

          font-weight: 700;

          cursor: pointer;

          transition: .2s;
        }

        .primary-button {
          color: white;

          background: #1677ff;

          box-shadow:
            0 9px 24px
            rgba(
              22,
              119,
              255,
              .2
            );
        }

        .primary-button:hover {
          background: #0958d9;
          transform: translateY(-2px);
        }

        .secondary-button {
          background: white;
          color: #536178;
        }

        .secondary-button:hover {
          color: #1677ff;
          transform: translateY(-2px);
        }

        .hero-stats {
          display: flex;
          align-items: center;

          gap: 15px;

          margin-top: 28px;
        }

        .hero-stat {
          display: flex;
          flex-direction: column;
        }

        .hero-stat strong {
          font-size: 20px;
        }

        .hero-stat span {
          color: #8591a4;
          font-size: 10px;
          margin-top: 2px;
        }

        .stat-divider {
          width: 1px;
          height: 30px;
          background: #d8e3ef;
        }


        /* ================= ILLUSTRATION ================= */

        .hero-illustration {
          position: relative;

          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-character {
          position: relative;

          width: 240px;
          height: 240px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .character-circle {
          width: 190px;
          height: 190px;

          border-radius: 50%;

          display: grid;
          place-items: center;

          font-size: 110px;

          background:
            linear-gradient(
              145deg,
              #fff,
              #dceeff
            );

          box-shadow:
            0 20px 50px
            rgba(
              35,
              89,
              150,
              .15
            );
        }

        .character-book {
          position: absolute;

          right: 0;
          bottom: 15px;

          width: 70px;
          height: 70px;

          border-radius: 22px;

          display: grid;
          place-items: center;

          background: white;

          font-size: 34px;

          box-shadow:
            0 12px 30px
            rgba(0,0,0,.1);

          transform: rotate(8deg);
        }

        .floating-star {
          position: absolute;
          font-size: 28px;
          animation: float 3s ease-in-out infinite;
        }

        .star-one {
          left: 12%;
          top: 23%;
        }

        .star-two {
          right: 12%;
          top: 18%;

          animation-delay: .8s;
        }

        .floating-word {
          position: absolute;

          padding: 9px 13px;

          border-radius: 13px;

          background: white;

          color: #1677ff;

          font-size: 12px;

          font-weight: 800;

          box-shadow:
            0 10px 25px
            rgba(0,0,0,.08);
        }

        .word-one {
          left: 8%;
          bottom: 24%;
          transform: rotate(-5deg);
        }

        .word-two {
          right: 7%;
          bottom: 28%;
          transform: rotate(5deg);
        }

        .hero-cloud {
          position: absolute;

          width: 100px;
          height: 35px;

          border-radius: 50px;

          background: rgba(
            255,
            255,
            255,
            .7
          );
        }

        .cloud-one {
          left: -20px;
          bottom: 30px;
        }

        .cloud-two {
          right: -25px;
          top: 35px;
        }

        @keyframes float {

          0%,
          100% {
            transform:
              translateY(0);
          }

          50% {
            transform:
              translateY(-9px);
          }

        }


        /* ================= SECTIONS ================= */

        .progress-section,
        .feature-section,
        .continue-section,
        .topics-section {
          margin-top: 45px;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          margin-bottom: 17px;
        }

        .section-label {
          color: #1677ff;

          font-size: 10px;

          font-weight: 850;

          letter-spacing: 1.5px;
        }

        .section-heading h2 {
          margin: 5px 0 0;

          font-size: 24px;

          letter-spacing: -.5px;
        }

        .view-more {
          border: 0;

          background: transparent;

          color: #1677ff;

          font-weight: 700;

          display: flex;
          align-items: center;
          gap: 6px;

          cursor: pointer;
        }


        /* ================= PROGRESS ================= */

        .progress-grid {
          display: grid;

          grid-template-columns:
            1.5fr
            .75fr
            .75fr;

          gap: 15px;
        }

        .progress-main-card,
        .small-progress-card {
          background: white;

          border:
            1px solid #edf0f5;

          border-radius: 21px;

          padding: 23px;

          box-shadow:
            0 10px 35px
            rgba(
              35,
              55,
              80,
              .04
            );
        }

        .progress-card-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-icon,
        .small-card-icon {
          width: 46px;
          height: 46px;

          border-radius: 14px;

          display: grid;
          place-items: center;

          background: #edf5ff;

          font-size: 22px;
        }

        .progress-card-top strong {
          display: block;
          font-size: 14px;
        }

        .progress-card-top span {
          color: #8a96a8;
          font-size: 11px;
        }

        .progress-number {
          margin-top: 23px;

          display: flex;
          align-items: baseline;
          gap: 7px;
        }

        .progress-number strong {
          font-size: 35px;
          color: #1677ff;
        }

        .progress-number span {
          color: #8a96a8;
          font-size: 12px;
        }

        .home-progress-bar,
        .continue-bar {
          height: 8px;

          background: #edf2f8;

          border-radius: 20px;

          overflow: hidden;
        }

        .home-progress-bar div,
        .continue-bar div {
          height: 100%;

          border-radius: inherit;

          background:
            linear-gradient(
              90deg,
              #1677ff,
              #69b1ff
            );
        }

        .progress-bottom {
          display: flex;
          justify-content: space-between;

          margin-top: 8px;

          font-size: 10px;
          color: #8995a6;
        }

        .small-progress-card {
          display: flex;
          flex-direction: column;
        }

        .small-card-icon.blue {
          background: #e9f7ff;
        }

        .small-card-number {
          font-size: 31px;
          font-weight: 850;
          margin-top: 15px;
        }

        .small-progress-card > strong {
          font-size: 13px;
        }

        .small-progress-card p {
          color: #8a96a8;
          font-size: 11px;
          line-height: 1.5;
          margin: 6px 0 0;
        }


        /* ================= FEATURES ================= */

        .feature-grid {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 15px;
        }

        .feature-card {
          border: 0;

          border-radius: 21px;

          min-height: 235px;

          padding: 22px;

          text-align: left;

          cursor: pointer;

          display: flex;
          flex-direction: column;

          transition:
            transform .2s,
            box-shadow .2s;
        }

        .feature-card:hover {
          transform: translateY(-5px);

          box-shadow:
            0 18px 35px
            rgba(
              30,
              60,
              100,
              .1
            );
        }

        .feature-story {
          background: #eaf5ff;
        }

        .feature-vocab {
          background: #fff4e6;
        }

        .feature-listen {
          background: #edf9f1;
        }

        .feature-review {
          background: #f4efff;
        }

        .feature-card-icon {
          width: 52px;
          height: 52px;

          border-radius: 16px;

          display: grid;
          place-items: center;

          background: rgba(
            255,
            255,
            255,
            .8
          );

          font-size: 25px;
        }

        .feature-content {
          margin-top: auto;
        }

        .feature-small {
          display: block;

          font-size: 9px;

          font-weight: 850;

          letter-spacing: 1px;

          color: #7c8799;

          margin-bottom: 5px;
        }

        .feature-content h3 {
          margin: 0;

          font-size: 19px;
        }

        .feature-content p {
          margin: 7px 0 15px;

          color: #718096;

          font-size: 11px;

          line-height: 1.5;
        }

        .feature-footer {
          display: flex;

          align-items: center;

          justify-content: space-between;

          color: #1677ff;

          font-size: 11px;

          font-weight: 800;
        }


        /* ================= CONTINUE ================= */

        .continue-card {
          background: white;

          border:
            1px solid #edf0f5;

          border-radius: 22px;

          padding: 17px;

          display: grid;

          grid-template-columns:
            190px
            1fr
            auto;

          gap: 20px;

          align-items: center;

          box-shadow:
            0 10px 35px
            rgba(
              35,
              55,
              80,
              .04
            );
        }

        .story-thumbnail {
          height: 150px;

          border-radius: 17px;

          position: relative;

          overflow: hidden;

          display: grid;
          place-items: center;

          background:
            linear-gradient(
              135deg,
              #d9edff,
              #eef7ff
            );
        }

        .thumbnail-emoji {
          font-size: 65px;
        }

        .story-thumbnail span {
          position: absolute;

          top: 10px;
          left: 10px;

          padding: 5px 8px;

          background: white;

          color: #1677ff;

          border-radius: 7px;

          font-size: 8px;

          font-weight: 850;
        }

        .continue-category {
          color: #1677ff;

          font-size: 10px;

          font-weight: 800;
        }

        .continue-info h3 {
          margin: 4px 0;

          font-size: 22px;
        }

        .continue-info p {
          color: #8995a6;

          font-size: 12px;

          margin: 0 0 12px;
        }

        .continue-meta {
          display: flex;

          gap: 15px;

          color: #7c889a;

          font-size: 10px;
        }

        .continue-meta span {
          display: flex;

          align-items: center;

          gap: 5px;
        }

        .continue-progress {
          max-width: 420px;

          margin-top: 15px;
        }

        .continue-progress-top {
          display: flex;

          justify-content: space-between;

          color: #8b96a7;

          font-size: 9px;

          margin-bottom: 5px;
        }

        .continue-progress-top strong {
          color: #1677ff;
        }

        .continue-button {
          border: 0;

          padding: 11px 16px;

          border-radius: 12px;

          background: #1677ff;

          color: white;

          font-weight: 750;

          display: flex;

          align-items: center;

          gap: 7px;

          cursor: pointer;

          white-space: nowrap;
        }


        /* ================= TOPICS ================= */

        .topic-grid {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 13px;
        }

        .topic-card {
          border: 0;

          background: white;

          border-radius: 17px;

          padding: 16px;

          display: flex;

          align-items: center;

          gap: 11px;

          text-align: left;

          cursor: pointer;

          border:
            1px solid #edf0f5;

          transition: .2s;
        }

        .topic-card:hover {
          transform: translateY(-3px);

          box-shadow:
            0 12px 25px
            rgba(
              0,
              0,
              0,
              .06
            );
        }

        .topic-icon {
          width: 44px;
          height: 44px;

          border-radius: 13px;

          display: grid;
          place-items: center;

          font-size: 22px;
        }

        .topic-blue .topic-icon {
          background: #eaf5ff;
        }

        .topic-orange .topic-icon {
          background: #fff2df;
        }

        .topic-green .topic-icon {
          background: #eaf8ef;
        }

        .topic-purple .topic-icon {
          background: #f2ecff;
        }

        .topic-card div:nth-child(2) {
          flex: 1;
        }

        .topic-card strong {
          display: block;
          font-size: 13px;
        }

        .topic-card span {
          display: block;

          color: #909bab;

          font-size: 10px;

          margin-top: 2px;
        }

        .topic-card > .anticon {
          color: #a4afbd;
          font-size: 11px;
        }


        /* ================= TIP ================= */

        .daily-tip {
          margin-top: 40px;

          border-radius: 23px;

          padding: 25px 30px;

          background:
            linear-gradient(
              110deg,
              #fff8df,
              #fffdf4
            );

          border:
            1px solid #ffe7a3;

          display: flex;

          justify-content: space-between;

          align-items: center;
        }

        .tip-left {
          display: flex;

          align-items: center;

          gap: 17px;
        }

        .tip-big-icon {
          width: 58px;
          height: 58px;

          border-radius: 17px;

          display: grid;
          place-items: center;

          background: #fff0b8;

          font-size: 29px;
        }

        .tip-left span {
          color: #9b7800;

          font-size: 9px;

          font-weight: 850;

          letter-spacing: 1px;
        }

        .tip-left h3 {
          margin: 4px 0;

          font-size: 17px;
        }

        .tip-left p {
          margin: 0;

          color: #817447;

          font-size: 11px;
        }

        .tip-decoration {
          font-size: 45px;
        }


        /* ================= MOBILE ================= */

        .mobile-bottom-nav {
          display: none;
        }


        @media (max-width: 950px) {

          .desktop-nav {
            display: none;
          }

          .progress-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .progress-main-card {
            grid-column: 1 / -1;
          }

          .feature-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .topic-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

        }


        @media (max-width: 700px) {

          .home-navbar {
            padding: 0 15px;
          }

          .navbar-user .streak,
          .user-profile span {
            display: none;
          }

          .home-container {
            width:
              calc(100% - 24px);

            padding:
              18px 0 85px;
          }

          .home-hero {
            grid-template-columns: 1fr;

            min-height: auto;

            border-radius: 23px;
          }

          .hero-left {
            padding:
              28px 22px;
          }

          .hero-left h1 {
            font-size: 39px;
          }

          .hero-description {
            font-size: 13px;
          }

          .hero-illustration {
            min-height: 230px;
          }

          .hero-character {
            transform: scale(.75);
          }

          .hero-stats {
            gap: 10px;
          }

          .hero-stat strong {
            font-size: 17px;
          }

          .hero-stat span {
            font-size: 8px;
          }

          .progress-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .small-progress-card {
            padding: 17px;
          }

          .feature-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .feature-card {
            min-height: 205px;
            padding: 17px;
          }

          .feature-content h3 {
            font-size: 17px;
          }

          .continue-card {
            grid-template-columns: 1fr;

            gap: 13px;
          }

          .story-thumbnail {
            height: 150px;
          }

          .continue-button {
            width: 100%;
            justify-content: center;
          }

          .topic-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .daily-tip {
            padding: 20px;
          }

          .tip-decoration {
            display: none;
          }

          .mobile-bottom-nav {
            position: fixed;

            left: 10px;
            right: 10px;
            bottom: 10px;

            height: 65px;

            background:
              rgba(
                255,
                255,
                255,
                .95
              );

            backdrop-filter:
              blur(15px);

            border:
              1px solid #e8edf3;

            border-radius: 19px;

            box-shadow:
              0 10px 35px
              rgba(
                0,
                0,
                0,
                .12
              );

            display: grid;

            grid-template-columns:
              repeat(5, 1fr);

            z-index: 200;
          }

          .mobile-bottom-nav button {
            border: 0;

            background: transparent;

            color: #8b96a7;

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            gap: 3px;

            font-size: 18px;

            cursor: pointer;
          }

          .mobile-bottom-nav span {
            font-size: 8px;
          }

          .mobile-bottom-nav
          .mobile-nav-active {
            color: #1677ff;
          }

        }


        @media (max-width: 420px) {

          .hero-buttons {
            flex-direction: column;
          }

          .primary-button,
          .secondary-button {
            justify-content: center;
            width: 100%;
          }

          .feature-grid {
            gap: 9px;
          }

          .feature-card {
            min-height: 190px;
            padding: 14px;
          }

          .feature-card-icon {
            width: 45px;
            height: 45px;
          }

          .progress-grid {
            gap: 9px;
          }

          .small-progress-card {
            padding: 14px;
          }

          .topic-grid {
            gap: 8px;
          }

          .topic-card {
            padding: 11px;
          }

        }

      `}</style>
      <MobileBottomNav />

    </div>
  );
};

export default Home;