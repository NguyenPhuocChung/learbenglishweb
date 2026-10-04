import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Button,
  Drawer,
  Spin,
  message,
} from "antd";

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  BookOutlined,
  CloseOutlined,
  HeartOutlined,
  PauseCircleFilled,
  PlayCircleFilled,
  PlusOutlined,
  SoundFilled,
  StarFilled,
  TranslationOutlined,
} from "@ant-design/icons";
import {
  completeLearnerStory,
  fetchLearnerVocabulary,
  fetchStoryBySlug,
  getLearningWords,
  lookupDictionary,
  saveLearningWord,
  saveVocabularyForLearner,
  translateText,
} from "../services/api";


/* =========================================================
   STORY DATA
========================================================= */

const STORY = {
  title: "My First Trip",
  subtitle: "A new adventure begins",
  category: "Travel",
  level: "Beginner",
  time: "5 phút",

  image:
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
};

/* =========================================================
   PARAGRAPHS
========================================================= */

const PARAGRAPHS = [
  `Emma arrived at the airport early in the morning.
   She was very excited about her first trip abroad.`,

  `She checked her luggage and walked toward the
   departure gate. The airport was crowded, but she
   felt happy and ready for the adventure.`,

  `During the flight, Emma looked out of the window.
   She could see beautiful clouds and the blue sky.`,

  `When she finally arrived in Paris, she smiled.
   This was the beginning of an unforgettable journey.`,
];

/* =========================================================
   POS
========================================================= */

const POS_MAP = {
  noun: "Danh từ",
  n: "Danh từ",

  verb: "Động từ",
  v: "Động từ",

  adjective: "Tính từ",
  adj: "Tính từ",

  adverb: "Phó từ",
  adv: "Phó từ",

  pronoun: "Đại từ",
  pron: "Đại từ",

  preposition: "Giới từ",
  prep: "Giới từ",

  conjunction: "Liên từ",
  conj: "Liên từ",

  interjection: "Thán từ",
  interj: "Thán từ",

  determiner: "Từ hạn định",
  det: "Từ hạn định",

  article: "Mạo từ",
  art: "Mạo từ",
};

function getPartOfSpeech(pos) { if (!pos) return "Từ vựng"; const key = String(pos).toLowerCase().trim().replace(/\.$/, ""); return POS_MAP[key] || pos; }

/* =========================================================
   WORD PARSER
========================================================= */

const WORD_SPLIT =
  /(\b[A-Za-z]+(?:'[A-Za-z]+)?\b)/;

const WORD_TEST =
  /^[A-Za-z]+(?:'[A-Za-z]+)?$/;

/* =========================================================
   SENTENCE PARSER
========================================================= */

function splitSentences(text) {
  const cleanText = text
    .replace(/\s+/g, " ")
    .trim();

  return (
    cleanText.match(
      /[^.!?]+[.!?]+|[^.!?]+$/g
    ) || []
  );
}

/* =========================================================
   ALL SENTENCES
========================================================= */

/* =========================================================
   DICTIONARY HOOK
========================================================= */
function useDictionary(word) {
  const [state, setState] = useState({
    status: "idle",
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!word) {
      return;
    }

    const controller =
      new AbortController();

    setState({
      status: "loading",
      data: null,
      error: null,
    });

    async function fetchDictionary() {
      try {
        const data = await lookupDictionary(word, {
          signal: controller.signal,
        });
        console.log("useDictionary fetchDictionary data:", data);
        if (!data.exists) {
          setState({
            status: "notfound",
            data: null,
            error: null,
          });

          return;
        }

        setState({
          status: "success",

          data: {
            title: data.word || word,
            ipa: data.ipa,
            meanings: data.meanings,
            audio: data.audio,
            relations: data.relations,
          },

          error: null,
        });
      } catch (error) {
        if (
          error.name ===
          "AbortError"
        ) {
          return;
        }

        setState({
          status: "error",
          data: null,
          error: error.message,
        });
      }
    }

    fetchDictionary();

    return () =>
      controller.abort();
  }, [word]);

  return state;
}

/* =========================================================
   TRANSLATION HOOK
========================================================= */

function useSentenceTranslation(
  sentence,
  enabled
) {
  const [state, setState] =
    useState({
      status: "idle",
      translation: "",
      error: null,
    });

  useEffect(() => {
    if (!enabled || !sentence) {
      return;
    }

    const controller =
      new AbortController();

    setState({
      status: "loading",
      translation: "",
      error: null,
    });

    async function translateSentence() {
      try {
        const translation = await translateText(sentence, {
          signal: controller.signal,
        });

        setState({
          status: "success",
          translation,
          error: null,
        });
      } catch (error) {
        if (
          error.name ===
          "AbortError"
        ) {
          return;
        }

        setState({
          status: "error",
          translation: "",
          error:
            error.message ||
            "Không thể dịch câu.",
        });
      }
    }

    translateSentence();

    return () =>
      controller.abort();
  }, [sentence, enabled]);

  return state;
}

/* =========================================================
   DICTIONARY CARD
========================================================= */

function DictionaryCard({
  word,
  sentence,
  onClose,
  onAdd,
}) {
  const {
    status,
    data,
    error,
  } = useDictionary(word);
  const [
    mode,
    setMode,
  ] = useState("word");

  const [
    messageApi,
    contextHolder,
  ] = message.useMessage();

  const {
    status: translationStatus,
    translation,
    error: translationError,
  } =
    useSentenceTranslation(
      sentence,
      mode === "sentence"
    );

  /* -------------------------------------------------------
     PLAY WORD
  ------------------------------------------------------- */

  const playWordAudio = () => {
    if (!data?.audio) {
      messageApi.warning(
        "Từ này chưa có file phát âm."
      );

      return;
    }

    const audio =
      new Audio(data.audio);

    audio.play().catch(() => {
      messageApi.error(
        "Không thể phát âm thanh."
      );
    });
  };

  // 
  /* -------------------------------------------------------
     PLAY SENTENCE
  ------------------------------------------------------- */

  const playSentence = () => {
    if (
      !(
        "speechSynthesis" in
        window
      )
    ) {
      messageApi.error(
        "Trình duyệt không hỗ trợ đọc văn bản."
      );

      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        sentence
      );

    utterance.lang =
      "en-US";

    utterance.rate = 0.85;

    utterance.pitch = 1;

    utterance.volume = 1;

    utterance.onerror = () => {
      messageApi.error(
        "Không thể phát câu."
      );
    };

    window.speechSynthesis.speak(
      utterance
    );
  };

  /* -------------------------------------------------------
     ADD WORD
  ------------------------------------------------------- */

  const handleAdd = () => {
    onAdd(word, {
      phonetic: data?.ipa ?? "",
      meanings: (data?.meanings ?? []).slice(0, 5).map((meaning) => ({
        type: getPartOfSpeech(meaning.pos),
        meaning: meaning.definition,
      })),
    });
  };

  return (
    <>
      {contextHolder}

      <div className="dictionary-card">

        {/* =================================================
            CLOSE
        ================================================= */}

        <button
          className="dictionary-close"
          onClick={onClose}
        >
          <CloseOutlined />
        </button>

        {/* =================================================
            MODE
        ================================================= */}

        <div className="dictionary-mode">

          <button
            className={
              mode === "word"
                ? "dictionary-mode-button active"
                : "dictionary-mode-button"
            }
            onClick={() =>
              setMode("word")
            }
          >
            <BookOutlined />

            Tra từ
          </button>

          <button
            className={
              mode === "sentence"
                ? "dictionary-mode-button active"
                : "dictionary-mode-button"
            }
            onClick={() =>
              setMode("sentence")
            }
          >
            <TranslationOutlined />

            Dịch câu
          </button>

        </div>

        {/* =================================================
            WORD MODE
        ================================================= */}

        {mode === "word" && (
          <>

            {status === "loading" && (
              <div className="dictionary-loading">

                <Spin size="large" />

                <div>
                  Đang tra từ{" "}
                  <strong>
                    "{word}"
                  </strong>
                </div>

              </div>
            )}

            {status === "notfound" && (
              <Alert
                type="warning"
                showIcon
                message={
                  `Không tìm thấy "${word}"`
                }
              />
            )}

            {status === "error" && (
              <Alert
                type="error"
                showIcon
                message="Không thể kết nối từ điển"
                description={error}
              />
            )}

            {status === "success" &&
              data && (
                <>

                  {/* WORD HEADER */}

                  <div className="dictionary-header">

                    <div>

                      <div className="dictionary-word">
                        {data.title}
                      </div>

                      {data.ipa && (
                        <div className="dictionary-ipa">
                          {data.ipa}
                        </div>
                      )}

                    </div>

                    {data.audio && (
                      <button
                        className="sound-button"
                        onClick={
                          playWordAudio
                        }
                      >
                        <SoundFilled />
                      </button>
                    )}

                  </div>

                  {/* MEANINGS */}

                  <div className="dictionary-section">

                    {data.meanings.length >
                      0 ? (
                      data.meanings
                        .slice(0, 4)
                        .map(
                          (
                            meaning,
                            index
                          ) => (
                            <div
                              className="meaning-item"
                              key={index}
                            >

                              <div className="pos-badge">
                                <div className="pos-badge"> {getPartOfSpeech(meaning.pos)} </div>
                              </div>

                              <div className="meaning-text">
                                {
                                  meaning.definition
                                }
                              </div>

                              {meaning.example && (
                                <div className="example-box">

                                  <BulbOutlined />

                                  <span>
                                    {
                                      meaning.example
                                    }
                                  </span>

                                </div>
                              )}



                            </div>
                          )
                        )
                    ) : (
                      <div className="empty-meaning">
                        Chưa có nghĩa tiếng Việt.
                      </div>
                    )}

                  </div>

                  {/* =================================================
                      SENTENCE PREVIEW
                  ================================================= */}

                  <div className="sentence-preview">

                    <div className="sentence-preview-title">
                      <TranslationOutlined />

                      Câu chứa từ này
                    </div>

                    <p>
                      {sentence}
                    </p>

                    <button
                      className="translate-sentence-link"
                      onClick={() =>
                        setMode(
                          "sentence"
                        )
                      }
                    >
                      Dịch nguyên câu
                    </button>

                  </div>

                  {/* RELATED */}
                  {data.related_words?.length > 0 && (
                    <div className="related-words">
                      <strong>
                        Từ liên quan:
                      </strong>
                      {data.related_words?.join(", ")}
                    </div>
                  )}


                  {/* ADD */}

                  <button
                    className="add-learning-button"
                    onClick={
                      handleAdd
                    }
                  >
                    <PlusOutlined />

                    Thêm vào học tập
                  </button>

                </>
              )}

          </>
        )}

        {/* =================================================
            SENTENCE MODE
        ================================================= */}

        {mode === "sentence" && (
          <div className="sentence-translation">

            <div className="sentence-heading">

              <div>
                <div className="sentence-heading-label">
                  📖 Dịch nguyên câu
                </div>

                <h3>
                  Câu tiếng Anh
                </h3>
              </div>

              <button
                className="sentence-sound-button"
                onClick={
                  playSentence
                }
              >
                <SoundFilled />
              </button>

            </div>

            {/* ENGLISH */}

            <div className="sentence-original">

              <div className="sentence-language">
                🇬🇧 English
              </div>

              <p>
                {sentence}
              </p>

            </div>

            {/* TRANSLATION */}

            <div className="sentence-result">

              <div className="sentence-language">
                🇻🇳 Tiếng Việt
              </div>

              {translationStatus ===
                "loading" && (
                  <div className="translation-loading">

                    <Spin />

                    <span>
                      Đang dịch câu...
                    </span>

                  </div>
                )}

              {translationStatus ===
                "error" && (
                  <Alert
                    type="error"
                    showIcon
                    message="Không thể dịch câu"
                    description={
                      translationError
                    }
                  />
                )}

              {translationStatus ===
                "success" && (
                  <p className="translation-text">
                    {translation}
                  </p>
                )}

            </div>

            {/* BACK */}

            <button
              className="back-to-word-button"
              onClick={() =>
                setMode("word")
              }
            >
              ← Quay lại tra từ
            </button>

          </div>
        )}

      </div>
    </>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function EnglishStory() {
  const { slug = "my-first-trip" } = useParams();
  const navigate = useNavigate();
  const [storyData, setStoryData] = useState(STORY);
  const [paragraphs, setParagraphs] = useState(PARAGRAPHS);
  const [storyLoadResult, setStoryLoadResult] = useState({ slug: "", error: "" });
  const [isCompleted, setIsCompleted] = useState(false);
  const storyLoading = storyLoadResult.slug !== slug;
  const storyError = storyLoadResult.slug === slug ? storyLoadResult.error : "";

  const [
    speechRate,
    setSpeechRate,
  ] = useState(0.85);

  const [
    selected,
    setSelected,
  ] = useState(null);
  const [words, setWords] = useState([]);

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);

  const [
    currentParagraph,
    setCurrentParagraph,
  ] = useState(0);

  const [
    messageApi,
    contextHolder,
  ] = message.useMessage();

  const [
    isMobile,
    setIsMobile,
  ] = useState(
    window.innerWidth <= 650
  );
  //
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


  //
  useEffect(() => {
    let active = true;

    fetchStoryBySlug(slug)
      .then((story) => {
        if (!active) return;
        const contentParagraphs = String(story.content ?? "")
          .split(/\n\s*\n/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean);
        const contentWords = String(story.content ?? "").trim().split(/\s+/).filter(Boolean).length;
        setStoryData({
          _id: story._id,
          title: story.title,
          subtitle: story.description,
          category: story.topic?.name ?? "Stories",
          level: story.level,
          time: `${Math.max(1, Math.ceil(contentWords / 130))} phút`,
          image: story.coverImage || STORY.image,
        });
        setParagraphs(contentParagraphs.length ? contentParagraphs : [String(story.content ?? "")]);
        setCurrentParagraph(0);
        setIsCompleted(false);
        setStoryLoadResult({ slug, error: "" });
      })
      .catch((error) => { if (active) setStoryLoadResult({ slug, error: error.message }); });

    return () => {
      active = false;
      window.speechSynthesis?.cancel();
    };
  }, [slug]);

  /* =======================================================
     CLEANUP SPEECH
  ======================================================= */

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* =======================================================
     RESPONSIVE
  ======================================================= */

  useEffect(() => {

    const handleResize = () => {
      setIsMobile(
        window.innerWidth <= 650
      );
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };

  }, []);

  /* =======================================================
     ADD WORD
  ======================================================= */

  const addToLearning = async (word, details = {}) => {
    try {
      saveLearningWord(word);
      const result = await saveVocabularyForLearner(word, {
        ...details,
        tags: [storyData.category.toLowerCase()],
      });
      if (result.alreadySaved) {
        messageApi.info(
          `"${word}" đã có trong danh sách học tập.`
        );
        return;
      }

      messageApi.success(`"${word}" đã được thêm vào học tập!`);
    } catch (error) {
      messageApi.error(error.message || "Không thể đồng bộ từ vựng lên tài khoản.");
    }
  };

  /* =======================================================
     CLICK WORD
  ======================================================= */

  const handleWordClick = (
    event,
    word,
    key,
    sentence
  ) => {

    event.stopPropagation();

    setSelected({
      word,
      key,
      sentence,
    });
  };

  /* =======================================================
     RENDER WORDS
  ======================================================= */

  const renderSentence = (
    sentence,
    paragraphIndex,
    sentenceIndex
  ) => {

    return sentence
      .split(WORD_SPLIT)
      .map(
        (part, index) => {

          if (
            !WORD_TEST.test(
              part
            )
          ) {
            return part;
          }

          const key =
            `${paragraphIndex}-${sentenceIndex}-${index}`;

          const active =
            selected?.key === key;

          return (
            <span
              key={key}
              className={
                `story-word ${active
                  ? "story-word-active"
                  : ""
                }`
              }
              onClick={(event) =>
                handleWordClick(
                  event,
                  part,
                  key,
                  sentence
                )
              }
            >
              {part}
            </span>
          );
        }
      );
  };

  /* =======================================================
     RENDER PARAGRAPH
  ======================================================= */

  const renderParagraph = (
    text,
    paragraphIndex
  ) => {

    const sentences =
      splitSentences(text);

    return sentences.map(
      (
        sentence,
        sentenceIndex
      ) => {

        const sentenceKey =
          `${paragraphIndex}-${sentenceIndex}`;

        return (
          <span
            key={sentenceKey}
            className="story-sentence"
          >
            {renderSentence(
              sentence,
              paragraphIndex,
              sentenceIndex
            )}{" "}
          </span>
        );
      }
    );
  };

  /* =======================================================
     PROGRESS
  ======================================================= */

  const progress =
    Math.round(
      (
        (currentParagraph + 1) /
        paragraphs.length
      ) * 100
    );

  const markStoryCompleted = async () => {
    if (isCompleted) return;
    setIsCompleted(true);

    if (!storyData._id) {
      messageApi.success("🎉 Bạn đã đọc hết câu chuyện!");
      return;
    }

    try {
      await completeLearnerStory(storyData._id);
      messageApi.success("🎉 Đã lưu tiến độ học tập!");
    } catch (error) {
      setIsCompleted(false);
      messageApi.error(error.message || "Không thể lưu tiến độ Story.");
    }
  };

  /* =======================================================
     NEXT
  ======================================================= */

  const nextParagraph = () => {

    if (
      currentParagraph <
      paragraphs.length - 1
    ) {

      setCurrentParagraph(
        currentParagraph + 1
      );

    } else {

      markStoryCompleted();
    }
  };

  /* =======================================================
     PREVIOUS
  ======================================================= */

  const previousParagraph = () => {

    if (
      currentParagraph > 0
    ) {

      setCurrentParagraph(
        currentParagraph - 1
      );
    }
  };

  /* =======================================================
     SPEECH
  ======================================================= */

  const speakParagraph = (
    paragraphIndex
  ) => {

    if (
      paragraphIndex < 0 ||
      paragraphIndex >=
      paragraphs.length
    ) {

      setIsPlaying(false);

      return;
    }

    const text =
      paragraphs[
        paragraphIndex
      ]
        .replace(/\s+/g, " ")
        .trim();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    utterance.lang =
      "en-US";

    utterance.rate =
      speechRate;

    utterance.pitch = 1;

    utterance.volume = 1;

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {

      const nextIndex =
        paragraphIndex + 1;

      if (
        nextIndex <
        paragraphs.length
      ) {

        setCurrentParagraph(
          nextIndex
        );

        setTimeout(() => {

          speakParagraph(
            nextIndex
          );

        }, 250);

      } else {

        setIsPlaying(false);

        markStoryCompleted();
      }
    };

    utterance.onerror = () => {

      setIsPlaying(false);

      messageApi.error(
        "Không thể phát giọng đọc."
      );
    };

    window.speechSynthesis.speak(
      utterance
    );
  };

  /* =======================================================
     TOGGLE PLAY
  ======================================================= */

  const togglePlay = () => {

    if (
      !(
        "speechSynthesis" in
        window
      )
    ) {

      messageApi.error(
        "Trình duyệt của bạn không hỗ trợ đọc văn bản."
      );

      return;
    }

    /* PAUSE */

    if (
      isPlaying &&
      !window.speechSynthesis
        .paused
    ) {

      window.speechSynthesis.pause();

      setIsPlaying(false);

      return;
    }

    /* RESUME */

    if (
      window.speechSynthesis
        .paused
    ) {

      window.speechSynthesis.resume();

      setIsPlaying(true);

      return;
    }

    /* START */

    window.speechSynthesis.cancel();

    speakParagraph(
      currentParagraph
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  if (storyLoading) {
    return <div className="english-story-page"><Spin size="large" /></div>;
  }

  if (storyError) {
    return (
      <div className="english-story-page">
        <Alert
          type="error"
          showIcon
          message="Không thể mở Story"
          description={storyError}
          action={<Button onClick={() => navigate("/stories")}>Về danh sách</Button>}
        />
      </div>
    );
  }

  return (
    <div className="english-story-page">

      {contextHolder}

      {/* =================================================
          NAVBAR
      ================================================= */}

      <header className="story-navbar">

        <div className="navbar-left">

          <button
            className="back-button"
            onClick={() =>
              window.history.back()
            }
          >
            <ArrowLeftOutlined />
          </button>

          <div className="brand-mini">

            <div className="brand-icon">
              <BookOutlined />
            </div>

            <span>
              Read stories
            </span>

          </div>

        </div>



      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="story-main">

        {/* BREADCRUMB */}

        <div className="breadcrumb">

          <span>{storyData.category}</span>

          <span>›</span>

          <span>{storyData.level}</span>

          <span>›</span>

          <strong>
            {storyData.title}
          </strong>

        </div>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="story-hero">

          <div className="hero-content">

            <div className="category-badge">
              {storyData.category}
            </div>

            <h1>
              {storyData.title}
            </h1>

            <p>
              {storyData.subtitle}
            </p>

            <div className="story-meta">

              <span className="level-badge">

                <StarFilled />

                {storyData.level}

              </span>

              <span>
                ⏱ {storyData.time}
              </span>

              <span>
                📖{" "}
                {paragraphs.length}{" "}
                đoạn
              </span>

            </div>

          </div>

          <div className="hero-image">

            <img
              src={storyData.image}
              alt={storyData.category}
            />

            <div className="hero-image-overlay">
              ✈️
            </div>

          </div>

        </section>

        {/* =================================================
            PROGRESS
        ================================================= */}

        <section className="progress-card">

          <div className="progress-top">

            <div>

              <span className="progress-label">
                Tiến độ đọc
              </span>

              <strong>
                Đoạn{" "}
                {currentParagraph + 1}
                {" "}
                /{" "}
                {paragraphs.length}
              </strong>

            </div>

            <span className="progress-percent">
              {progress}%
            </span>

          </div>

          <div className="progress-track">

            <div
              className="progress-fill"
              style={{
                width:
                  `${progress}%`,
              }}
            />

          </div>

        </section>

        {/* =================================================
            READING
        ================================================= */}

        <section className="reading-layout">

          {/* STORY */}

          <article className="story-reader">

            <div className="reader-header">

              <div>

                <div className="reader-label">
                  📖 Đọc truyện
                </div>

                <h2>
                  {storyData.title}
                </h2>

              </div>

              <div className="reader-actions">

                <div className="speed-control">

                  <span>
                    🐢
                  </span>

                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={
                      speechRate
                    }
                    onChange={(e) =>
                      setSpeechRate(
                        Number(
                          e.target.value
                        )
                      )
                    }
                  />

                  <span>
                    🐇
                  </span>

                  <strong>
                    {speechRate.toFixed(
                      2
                    )}
                    x
                  </strong>

                </div>

                <button
                  className="listen-button"
                  onClick={
                    togglePlay
                  }
                >

                  {isPlaying ? (
                    <PauseCircleFilled />
                  ) : (
                    <PlayCircleFilled />
                  )}

                  <span>
                    {isPlaying
                      ? "Đang nghe"
                      : "Nghe truyện"}
                  </span>

                </button>

              </div>

            </div>

            {/* TIP */}

            <div className="reading-tip">

              <div className="tip-icon">
                💡
              </div>

              <div>

                <strong>
                  Mẹo học nhanh
                </strong>

                <p>
                  Nhấn vào bất kỳ từ nào
                  bạn chưa biết để xem
                  nghĩa và cách phát âm.
                  Bạn cũng có thể dịch
                  nguyên câu.
                </p>

              </div>

            </div>

            {/* TEXT */}

            <div className="story-text">

              {paragraphs.map(
                (
                  paragraph,
                  index
                ) => (

                  <p
                    key={index}
                    className={
                      index ===
                        currentParagraph
                        ? "paragraph-active"
                        : ""
                    }
                  >

                    {renderParagraph(
                      paragraph,
                      index
                    )}

                  </p>
                )
              )}

            </div>

            {/* FOOTER */}

            <div className="reader-footer">

              <button
                className="reader-nav secondary"
                disabled={
                  currentParagraph ===
                  0
                }
                onClick={
                  previousParagraph
                }
              >

                <ArrowLeftOutlined />

                Đoạn trước

              </button>

              <div className="page-dots">

                {paragraphs.map(
                  (
                    _,
                    index
                  ) => (

                    <button
                      key={index}
                      className={
                        index ===
                          currentParagraph
                          ? "dot active"
                          : "dot"
                      }
                      onClick={() =>
                        setCurrentParagraph(
                          index
                        )
                      }
                    />

                  )
                )}

              </div>

              <button
                className="reader-nav primary"
                onClick={
                  nextParagraph
                }
              >

                {currentParagraph ===
                  paragraphs.length - 1
                  ? "Hoàn thành"
                  : "Đoạn tiếp"}

                <ArrowRightOutlined />

              </button>

            </div>

          </article>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="learning-sidebar">

            <div className="sidebar-card">

              <div className="sidebar-icon">
                🎯
              </div>

              <h3>
                Học từ vựng
              </h3>

              <p>
                Những từ bạn bấm vào sẽ
                được lưu lại để ôn tập
                sau.
              </p>

              <div className="sidebar-stat">

                {/* Khối hiển thị từ mới */}
                <div>
                  <strong>{statistics.new}</strong>
                  <span>Từ mới</span>
                </div>

                {/* Khối hiển thị từ đã học */}
                <div>
                  <strong>{statistics.mastered}</strong>
                  <span>Đã ôn</span>
                </div>

              </div>

              <button className="review-button" onClick={() => navigate("/vocabulary")}>

                <BookOutlined />

                Xem từ đã học

              </button>

            </div>

            <div className="sidebar-card small-card">

              <div className="small-card-title">
                💡 Gợi ý
              </div>

              <p>
                Đừng cố nhớ tất cả từ mới.
                Hãy tập trung vào những
                từ xuất hiện nhiều lần.
              </p>

            </div>

          </aside>

        </section>

      </main>

      {/* =================================================
          DESKTOP DICTIONARY
      ================================================= */}

      {selected &&
        !isMobile && (

          <div className="dictionary-overlay">

            <div
              className="dictionary-backdrop"
              onClick={() =>
                setSelected(null)
              }
            />

            <div className="dictionary-position">

              <DictionaryCard
                word={
                  selected.word
                }
                sentence={
                  selected.sentence
                }
                onClose={() =>
                  setSelected(null)
                }
                onAdd={
                  addToLearning
                }
              />

            </div>

          </div>

        )}

      {/* =================================================
          MOBILE DRAWER
      ================================================= */}

      {selected &&
        isMobile && (

          <Drawer
            open={true}
            placement="bottom"
            height="auto"
            closable={false}
            onClose={() =>
              setSelected(null)
            }
            styles={{
              body: {
                padding: 0,
              },
            }}
          >

            <DictionaryCard
              word={
                selected.word
              }
              sentence={
                selected.sentence
              }
              onClose={() =>
                setSelected(null)
              }
              onAdd={
                addToLearning
              }
            />

          </Drawer>

        )}

      {/* =================================================
          CSS
      ================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .english-story-page {
          min-height: 100vh;

          background:
            radial-gradient(
              circle at top left,
              #eef6ff 0,
              transparent 35%
            ),
            #f7f9fc;

          color: #172033;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }


        /* =================================================
           NAVBAR
        ================================================= */

        .story-navbar {
          height: 72px;

          background:
            rgba(255,255,255,.9);

          backdrop-filter:
            blur(15px);

          border-bottom:
            1px solid #e9edf3;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 0 32px;

          position: sticky;
          top: 0;

          z-index: 50;
        }

        .navbar-left,
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .back-button,
        .nav-icon-button {
          width: 42px;
          height: 42px;

          border: 0;
          border-radius: 13px;

          background: #f3f6fa;
          color: #516078;

          cursor: pointer;

          transition: .2s;
        }

        .back-button:hover,
        .nav-icon-button:hover {
          background: #e8f1ff;
          color: #1677ff;
          transform:
            translateY(-1px);
        }

        .brand-mini {
          display: flex;
          align-items: center;
          gap: 10px;

          font-weight: 800;
          color: #1d2a44;
        }

        .brand-icon {
          width: 38px;
          height: 38px;

          border-radius: 11px;

          display: grid;
          place-items: center;

          background:
            linear-gradient(
              135deg,
              #1677ff,
              #5b9dff
            );

          color: white;
        }

        .profile-button {
          border: 0;
          background: transparent;

          display: flex;
          align-items: center;
          gap: 9px;

          font-weight: 600;
          cursor: pointer;
        }

        .avatar {
          width: 36px;
          height: 36px;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              #ffd666,
              #ff9c6e
            );

          display: grid;
          place-items: center;

          color: white;
          font-weight: 800;
        }


        /* =================================================
           MAIN
        ================================================= */

        .story-main {
          width:
            min(
              1180px,
              calc(100% - 40px)
            );

          margin: 0 auto;

          padding:
            28px 0 60px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 9px;

          color: #8a96a8;

          font-size: 13px;

          margin-bottom: 20px;
        }

        .breadcrumb strong {
          color: #44516a;
        }


        /* =================================================
           HERO
        ================================================= */

        .story-hero {
          min-height: 260px;

          border-radius: 28px;

          overflow: hidden;

          position: relative;

          display: grid;

          grid-template-columns:
            1fr 420px;

          background:
            linear-gradient(
              120deg,
              #e9f4ff,
              #f5f9ff
            );

          box-shadow:
            0 18px 50px
            rgba(
              29,
              64,
              112,
              .08
            );
        }

        .hero-content {
          padding: 42px 45px;

          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .category-badge {
          width: fit-content;

          padding:
            7px 13px;

          border-radius: 30px;

          background: white;
          color: #1677ff;

          font-weight: 700;
          font-size: 13px;

          box-shadow:
            0 5px 18px
            rgba(0,0,0,.05);

          margin-bottom: 15px;
        }

        .hero-content h1 {
          margin: 0;

          font-size:
            clamp(
              34px,
              5vw,
              50px
            );

          line-height: 1.08;

          letter-spacing: -1.5px;

          color: #172b4d;
        }

        .hero-content p {
          margin:
            13px 0 20px;

          color: #65748b;

          font-size: 17px;
        }

        .story-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;

          color: #64748b;

          font-size: 13px;
          font-weight: 600;
        }

        .level-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;

          background: #fff7d6;
          color: #b7791f;

          border-radius: 20px;

          padding:
            6px 10px;
        }

        .hero-image {
          position: relative;
          overflow: hidden;
        }

        .hero-image img {
          width: 100%;
          height: 100%;

          object-fit: cover;
        }

        .hero-image::after {
          content: "";

          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              90deg,
              #e9f4ff 0%,
              transparent 35%
            );
        }

        .hero-image-overlay {
          position: absolute;

          right: 28px;
          bottom: 25px;

          z-index: 2;

          width: 62px;
          height: 62px;

          border-radius: 20px;

          display: grid;
          place-items: center;

          background:
            rgba(255,255,255,.9);

          box-shadow:
            0 10px 30px
            rgba(0,0,0,.12);

          font-size: 30px;
        }


        /* =================================================
           PROGRESS
        ================================================= */

        .progress-card {
          background: white;

          margin-top: 20px;

          border:
            1px solid #edf0f5;

          border-radius: 20px;

          padding:
            18px 22px;
        }

        .progress-top {
          display: flex;
          justify-content: space-between;
          align-items: center;

          margin-bottom: 10px;
        }

        .progress-top > div {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-label {
          color: #8a96a8;
          font-size: 13px;
        }

        .progress-percent {
          color: #1677ff;
          font-weight: 800;
        }

        .progress-track {
          height: 8px;

          background: #edf2f8;

          border-radius: 20px;

          overflow: hidden;
        }

        .progress-fill {
          height: 100%;

          background:
            linear-gradient(
              90deg,
              #1677ff,
              #69b1ff
            );

          border-radius: inherit;

          transition:
            width .35s ease;
        }


        /* =================================================
           READING
        ================================================= */

        .reading-layout {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            300px;

          gap: 22px;

          margin-top: 22px;
        }

        .story-reader {
          background: white;

          border-radius: 25px;

          border:
            1px solid #edf0f5;

          box-shadow:
            0 15px 40px
            rgba(
              31,
              55,
              89,
              .05
            );

          padding: 34px;
        }

        .reader-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;

          gap: 20px;

          margin-bottom: 24px;
        }

        .reader-label {
          color: #1677ff;

          font-size: 13px;
          font-weight: 800;

          margin-bottom: 7px;
        }

        .reader-header h2 {
          margin: 0;

          font-size: 25px;

          color: #172033;
        }

        .reader-actions {
          display: flex;
          align-items: center;
          gap: 12px;

          flex-wrap: wrap;

          justify-content: flex-end;
        }

        .speed-control {
          display: flex;
          align-items: center;
          gap: 7px;

          background: #f7f9fc;

          padding:
            8px 11px;

          border-radius: 12px;

          color: #718096;

          font-size: 12px;
        }

        .speed-control input {
          width: 85px;
          accent-color: #1677ff;
        }

        .speed-control strong {
          color: #1677ff;
          min-width: 36px;
        }

        .listen-button {
          border: 0;

          background: #edf5ff;
          color: #1677ff;

          border-radius: 13px;

          padding:
            10px 15px;

          display: flex;
          align-items: center;
          gap: 8px;

          font-weight: 700;

          cursor: pointer;

          transition: .2s;
        }

        .listen-button:hover {
          background: #dcecff;

          transform:
            translateY(-1px);
        }


        /* =================================================
           TIP
        ================================================= */

        .reading-tip {
          display: flex;
          gap: 13px;

          padding:
            15px 17px;

          background: #fffbea;

          border:
            1px solid #ffe58f;

          border-radius: 15px;

          margin-bottom: 30px;
        }

        .tip-icon {
          width: 38px;
          height: 38px;

          flex-shrink: 0;

          border-radius: 12px;

          background: #fff1b8;

          display: grid;
          place-items: center;
        }

        .reading-tip strong {
          font-size: 13px;
          color: #7a5c00;
        }

        .reading-tip p {
          margin:
            4px 0 0;

          color: #806f36;

          font-size: 13px;
        }


        /* =================================================
           STORY TEXT
        ================================================= */

        .story-text {
          font-size: 21px;

          line-height: 2;

          color: #27354d;

          letter-spacing: .05px;
        }

        .story-text p {
          margin:
            0 0 26px;

          padding:
            5px 8px;

          border-radius: 14px;

          transition: .2s;
        }

        .story-text p.paragraph-active {
          background: #f8fbff;
        }

        .story-sentence {
          border-radius: 8px;

          transition:
            background .15s;
        }

        .story-sentence:hover {
          background:
            rgba(
              232,
              243,
              255,
              .35
            );
        }

        .story-word {
          cursor: pointer;

          border-radius: 6px;

          padding:
            2px 3px;

          transition:
            background .15s,
            color .15s;
        }

        .story-word:hover {
          background: #e7f1ff;
          color: #1677ff;
        }

        .story-word-active {
          background: #cfe4ff;
          color: #0958d9;
        }


        /* =================================================
           FOOTER
        ================================================= */

        .reader-footer {
          border-top:
            1px solid #edf0f5;

          padding-top: 22px;

          margin-top: 15px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;
        }

        .reader-nav {
          border: 0;

          border-radius: 13px;

          padding:
            11px 16px;

          display: flex;
          align-items: center;
          gap: 8px;

          font-weight: 700;

          cursor: pointer;

          transition: .2s;
        }

        .reader-nav.secondary {
          background: #f3f6fa;
          color: #68758a;
        }

        .reader-nav.secondary:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .reader-nav.primary {
          background: #1677ff;
          color: white;

          box-shadow:
            0 7px 18px
            rgba(
              22,
              119,
              255,
              .22
            );
        }

        .reader-nav.primary:hover {
          background: #0958d9;

          transform:
            translateY(-1px);
        }

        .page-dots {
          display: flex;
          gap: 7px;
        }

        .dot {
          width: 8px;
          height: 8px;

          border: 0;
          padding: 0;

          border-radius: 50%;

          background: #d9e0e9;

          cursor: pointer;
        }

        .dot.active {
          width: 22px;

          border-radius: 10px;

          background: #1677ff;
        }


        /* =================================================
           SIDEBAR
        ================================================= */

        .learning-sidebar {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .sidebar-card {
          background: white;

          border-radius: 22px;

          border:
            1px solid #edf0f5;

          padding: 25px;
        }

        .sidebar-icon {
          width: 52px;
          height: 52px;

          border-radius: 16px;

          display: grid;
          place-items: center;

          background: #eef6ff;

          font-size: 25px;

          margin-bottom: 15px;
        }

        .sidebar-card h3 {
          margin: 0;

          font-size: 19px;
        }

        .sidebar-card p {
          color: #7b8798;

          font-size: 13px;

          line-height: 1.65;

          margin:
            9px 0 20px;
        }

        .sidebar-stat {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 10px;

          margin-bottom: 18px;
        }

        .sidebar-stat > div {
          background: #f7f9fc;

          border-radius: 14px;

          padding: 12px;
        }

        .sidebar-stat strong {
          display: block;

          font-size: 21px;

          color: #1677ff;
        }

        .sidebar-stat span {
          font-size: 11px;

          color: #8792a3;
        }

        .review-button {
          width: 100%;

          border: 0;

          background: #1677ff;
          color: white;

          border-radius: 12px;

          padding: 11px;

          font-weight: 700;

          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;
        }

        .small-card {
          background:
            linear-gradient(
              135deg,
              #fff9e6,
              #fff
            );
        }

        .small-card-title {
          font-weight: 800;

          color: #8a6500;
        }


        /* =================================================
           DICTIONARY OVERLAY
        ================================================= */

        .dictionary-overlay {
          position: fixed;

          inset: 0;

          z-index: 1000;

          pointer-events: none;
        }

        .dictionary-backdrop {
          position: absolute;

          inset: 0;

          background:
            rgba(
              17,
              29,
              52,
              .18
            );

          backdrop-filter:
            blur(2px);

          pointer-events: auto;
        }

        .dictionary-position {
          position: absolute;

          right: 35px;
          top: 100px;

          width: 410px;

          max-width:
            calc(
              100vw - 30px
            );

          pointer-events: auto;
        }

        .dictionary-card {
          position: relative;

          background: white;

          border-radius: 23px;

          padding: 24px;

          box-shadow:
            0 25px 80px
            rgba(
              24,
              39,
              67,
              .24
            );

          border:
            1px solid #edf0f5;

          max-height:
            calc(
              100vh - 130px
            );

          overflow-y: auto;
        }


        /* =================================================
           DICTIONARY MODE
        ================================================= */

        .dictionary-mode {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 7px;

          background: #f5f7fa;

          border-radius: 12px;

          padding: 4px;

          margin-bottom: 22px;
        }

        .dictionary-mode-button {
          border: 0;

          background: transparent;

          color: #7b8798;

          border-radius: 9px;

          padding:
            9px 10px;

          font-weight: 700;

          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 6px;

          transition: .2s;
        }

        .dictionary-mode-button:hover {
          color: #1677ff;
        }

        .dictionary-mode-button.active {
          background: white;

          color: #1677ff;

          box-shadow:
            0 2px 8px
            rgba(
              0,
              0,
              0,
              .07
            );
        }


        /* =================================================
           CLOSE
        ================================================= */

        .dictionary-close {
          position: absolute;

          right: 16px;
          top: 16px;

          width: 32px;
          height: 32px;

          border: 0;

          border-radius: 10px;

          background: #f3f5f8;

          color: #6c788b;

          cursor: pointer;

          z-index: 5;
        }


        /* =================================================
           WORD HEADER
        ================================================= */

        .dictionary-header {
          display: flex;

          justify-content: space-between;
          align-items: center;

          padding-right: 35px;

          margin-bottom: 22px;
        }

        .dictionary-word {
          font-size: 30px;

          font-weight: 850;

          color: #172033;
        }

        .dictionary-ipa {
          color: #718096;

          margin-top: 4px;

          font-size: 15px;
        }

        .sound-button {
          width: 48px;
          height: 48px;

          border-radius: 15px;

          border: 0;

          background: #eaf3ff;

          color: #1677ff;

          cursor: pointer;

          font-size: 18px;
        }

        .sound-button:hover {
          background: #d9eaff;

          transform:
            scale(1.04);
        }


        /* =================================================
           MEANING
        ================================================= */

        .meaning-item {
         
            display: flex;
            margin-bottom: 10px;
          flex-direction: column;
          border-top:
            1px solid #edf0f5;
        }

        .pos-badge {
          display: inline-block;

          padding:
            5px 9px;

          border-radius: 8px;

          background: #eef6ff;

          color: #1677ff;

          font-size: 11px;

          font-weight: 800;

          margin-bottom: 8px;
        }

        .meaning-text {
          font-size: 15px;

          font-weight: 650;

          color: #28364d;

          line-height: 1.5;
        }

        .example-box {
          margin-top: 10px;

          padding:
            11px 12px;

          border-radius: 11px;

          background: #fffbea;

          color: #79642c;

          display: flex;

          gap: 8px;

          font-size: 13px;

          line-height: 1.5;
        }


        /* =================================================
           SENTENCE PREVIEW
        ================================================= */

        .sentence-preview {
          margin-top: 18px;
margin-bottom: 18px;
          padding: 15px;

          border-radius: 14px;

          background: #f7faff;

          border:
            1px solid #e5f0ff;
        }

        .sentence-preview-title {
          display: flex;

          align-items: center;

          gap: 7px;

          color: #1677ff;

          font-size: 12px;

          font-weight: 800;

          margin-bottom: 8px;
        }

        .sentence-preview p {
          margin: 0;

          color: #34445c;

          font-size: 14px;

          line-height: 1.6;
        }

        .translate-sentence-link {
          border: 0;

          padding: 0;

          margin-top: 10px;

          background: transparent;

          color: #1677ff;

          font-size: 12px;

          font-weight: 800;

          cursor: pointer;
        }

        .translate-sentence-link:hover {
          text-decoration: underline;
        }


        /* =================================================
           RELATED
        ================================================= */

        .related-section {
          padding-top: 13px;

          margin-bottom: 18px;
        }

        .section-title {
          font-size: 12px;

          font-weight: 800;

          color: #8a96a8;

          text-transform: uppercase;

          margin-bottom: 9px;
        }

        .related-list {
          display: flex;

          flex-wrap: wrap;

          gap: 7px;
        }

        .related-list span {
          padding:
            7px 9px;

          border-radius: 9px;

          background: #f5f7fa;

          color: #65748b;

          font-size: 11px;
        }


        /* =================================================
           ADD
        ================================================= */

        .add-learning-button {
          width: 100%;

          border: 0;

          border-radius: 13px;

          padding: 13px;

          background: #1677ff;

          color: white;

          font-weight: 800;

          cursor: pointer;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 8px;

          box-shadow:
            0 8px 22px
            rgba(
              22,
              119,
              255,
              .2
            );
        }

        .add-learning-button:hover {
          background: #0958d9;
        }


        /* =================================================
           LOADING
        ================================================= */

        .dictionary-loading {
          min-height: 180px;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          gap: 15px;

          color: #7b8798;
        }

        .empty-meaning {
          color: #8792a3;

          padding:
            15px 0;
        }


        /* =================================================
           SENTENCE TRANSLATION
        ================================================= */

        .sentence-translation {
          padding-top: 3px;
        }

        .sentence-heading {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          margin-bottom: 18px;
        }

        .sentence-heading-label {
          color: #1677ff;

          font-size: 12px;

          font-weight: 800;

          margin-bottom: 4px;
        }

        .sentence-heading h3 {
          margin: 0;

          color: #172033;

          font-size: 22px;
        }

        .sentence-sound-button {
          width: 45px;
          height: 45px;

          flex-shrink: 0;

          border: 0;

          border-radius: 13px;

          background: #eaf3ff;

          color: #1677ff;

          cursor: pointer;

          font-size: 17px;
        }

        .sentence-sound-button:hover {
          background: #d9eaff;
        }

        .sentence-original,
        .sentence-result {
          border-radius: 16px;

          padding: 17px;

          margin-bottom: 12px;
        }

        .sentence-original {
          background: #f7f9fc;

          border:
            1px solid #edf0f5;
        }

        .sentence-result {
          background:
            linear-gradient(
              135deg,
              #eef7ff,
              #f7fbff
            );

          border:
            1px solid #dcecff;
        }

        .sentence-language {
          color: #8a96a8;

          font-size: 10px;

          font-weight: 800;

          text-transform: uppercase;

          letter-spacing: .5px;

          margin-bottom: 8px;
        }

        .sentence-original p {
          margin: 0;

          color: #27354d;

          font-size: 16px;

          line-height: 1.65;

          font-weight: 600;
        }

        .translation-text {
          margin: 0;

          color: #173b7a;

          font-size: 17px;

          line-height: 1.7;

          font-weight: 650;
        }

        .translation-loading {
          display: flex;

          align-items: center;

          gap: 10px;

          color: #7b8798;

          padding: 8px 0;
        }

        .back-to-word-button {
          width: 100%;

          border: 0;

          background: #f3f6fa;

          color: #68758a;

          border-radius: 12px;

          padding: 11px;

          font-weight: 700;

          cursor: pointer;

          margin-top: 5px;
        }

        .back-to-word-button:hover {
          background: #eaf3ff;

          color: #1677ff;
        }


        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 900px) {

          .story-hero {
            grid-template-columns: 1fr;
          }

          .hero-image {
            height: 220px;

            order: -1;
          }

          .hero-image::after {
            background:
              linear-gradient(
                180deg,
                transparent,
                #e9f4ff
              );
          }

          .reading-layout {
            grid-template-columns: 1fr;
          }

          .learning-sidebar {
            display: grid;

            grid-template-columns:
              1fr 1fr;
          }

          .reader-header {
            flex-direction: column;
          }

          .reader-actions {
            width: 100%;

            justify-content: flex-start;
          }

        }


        @media (max-width: 650px) {

          .story-navbar {
            height: 62px;

            padding:
              0 15px;
          }

          .brand-mini span,
          .profile-button span {
            display: none;
          }

          .story-main {
            width:
              min(
                100% - 24px,
                600px
              );

            padding-top: 18px;
          }

          .breadcrumb {
            font-size: 11px;
          }

          .story-hero {
            border-radius: 21px;
          }

          .hero-content {
            padding:
              25px 22px;
          }

          .hero-content h1 {
            font-size: 34px;
          }

          .hero-image {
            height: 175px;
          }

          .progress-card {
            border-radius: 16px;

            padding: 15px;
          }

          .reading-layout {
            margin-top: 15px;
          }

          .story-reader {
            padding:
              20px 17px;

            border-radius: 20px;
          }

          .reader-actions {
            flex-direction: column;

            align-items: stretch;
          }

          .speed-control {
            width: 100%;

            justify-content: center;
          }

          .speed-control input {
            flex: 1;
          }

          .listen-button {
            width: 100%;

            justify-content: center;
          }

          .reading-tip {
            padding: 12px;
          }

          .story-text {
            font-size: 18px;

            line-height: 1.9;
          }

          .reader-footer {
            flex-wrap: wrap;
          }

          .reader-nav {
            flex: 1;

            justify-content: center;
          }

          .page-dots {
            order: -1;

            width: 100%;

            justify-content: center;
          }

          .learning-sidebar {
            display: none;
          }

          .dictionary-overlay {
            display: none;
          }

          .dictionary-card {
            border-radius:
              22px 22px 0 0;

            border: 0;

            box-shadow: none;

            padding:
              20px 18px 28px;

            max-height: 75vh;
          }

          .dictionary-word {
            font-size: 27px;
          }

          .meaning-text {
            font-size: 17px;
          }

          .sentence-original p,
          .translation-text {
            font-size: 16px;
          }

        }

      `}</style>

    </div>
  );
}