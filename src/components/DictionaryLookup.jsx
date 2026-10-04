import { useRef, useState } from "react";
import {
  BookOutlined,
  LoadingOutlined,
  PlusOutlined,
  SearchOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import vocabularyData from "../data/savedVocabulary.json";
import {
  lookupDictionary,
  saveLearningWord,
  saveVocabularyForLearner,
  translateText,
} from "../services/api";
import "../styles/DictionaryLookup.css";

const suggestions = ["journey", "beautiful", "explore", "adventure"];

function findSavedWord(query) {
  const normalizedQuery = query.toLowerCase();

  return vocabularyData.find((item) => {
    const matchesWord = item.word.toLowerCase() === normalizedQuery;
    const matchesMeaning = item.meanings?.some((meaning) =>
      meaning.meaning.toLowerCase().includes(normalizedQuery),
    );

    return matchesWord || matchesMeaning;
  });
}

function DictionaryLookup() {
  const [query, setQuery] = useState("");
  const [lookup, setLookup] = useState(null);
  const requestId = useRef(0);
  const [messageApi, contextHolder] = message.useMessage();

  const searchWord = async (event, suggestedWord) => {
    event?.preventDefault();
    const word = (suggestedWord ?? query).trim();
    if (!word) return;

    setQuery(word);
    const currentRequest = ++requestId.current;
    const savedWord = findSavedWord(word);
    setLookup({ status: "loading", word, savedWord });

    try {
      const data = await lookupDictionary(word);
      if (currentRequest !== requestId.current) return;
      if (!data.exists) {
        setLookup(savedWord ? { status: "saved", word, savedWord } : { status: "not-found", word });
        return;
      }

      const meanings = data.meanings
        .map((meaning) => ({
          partOfSpeech: meaning.pos ?? "Nghĩa",
          definition: meaning.definition,
          example: meaning.example,
          source: meaning.source,
        }))
        .slice(0, 5);
      let translation = data.translations.find((item) => item.lang_code === "vi")?.translation;

      if (!meanings.length && !translation && /^[a-z]+(?:[-'][a-z]+)*$/i.test(word)) {
        try {
          translation = await translateText(word);
        } catch {
          translation = null;
        }
      }

      if (currentRequest !== requestId.current) return;
      setLookup({
        status: "found",
        word,
        savedWord,
        entry: { word: data.word, phonetic: data.ipa, meanings, audio: data.audio },
        translation,
      });
    } catch {
      if (currentRequest !== requestId.current) return;
      setLookup(savedWord ? { status: "saved", word, savedWord } : { status: "not-found", word });
    }
  };

  const saveWord = async () => {
    const word = (lookup?.entry?.word ?? lookup?.savedWord?.word ?? lookup?.word)?.toLowerCase();
    if (!word) return;

    try {
      saveLearningWord(word);
      const result = await saveVocabularyForLearner(word, {
        phonetic: lookup?.entry?.phonetic ?? "",
        meanings: (lookup?.entry?.meanings ?? []).map((meaning) => ({
          type: meaning.partOfSpeech ?? "Từ vựng",
          meaning: meaning.definition ?? "",
        })),
      });
      if (result.alreadySaved) {
        messageApi.info(`“${word}” đã có trong danh sách học tập.`);
        return;
      }

      messageApi.success(`Đã lưu “${word}” vào danh sách học tập.`);
    } catch (error) {
      messageApi.error(error.message || "Không thể đồng bộ từ vựng lên tài khoản.");
    }
  };

  const pronounce = (word, audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => pronounceWithSpeech(word));
      return;
    }

    pronounceWithSpeech(word);
  };

  const pronounceWithSpeech = (word) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const dictionaryMeanings = lookup?.entry?.meanings;
  const audioUrl = lookup?.entry?.audio;

  return (
    <section className="dictionary-lookup" aria-labelledby="dictionary-title">
      {contextHolder}
      <div className="dictionary-copy">
        <span className="dictionary-kicker"><BookOutlined /> TỪ ĐIỂN ANH - VIỆT</span>
        <h2 id="dictionary-title">Tra nhanh một từ</h2>
        <p>Tìm nghĩa, cách phát âm và cách dùng trong tiếng Anh.</p>
        <div className="dictionary-suggestions" aria-label="Từ gợi ý">
          <span>Thử tra:</span>
          {suggestions.map((word) => (
            <button key={word} type="button" onClick={(event) => searchWord(event, word)}>
              {word}
            </button>
          ))}
        </div>
      </div>

      <div className="dictionary-panel">
        <form className="dictionary-search" onSubmit={searchWord}>
          <SearchOutlined aria-hidden="true" />
          <input
            aria-label="Nhập từ tiếng Anh cần tra"
            autoComplete="off"
            placeholder="Nhập từ tiếng Anh..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" disabled={!query.trim() || lookup?.status === "loading"}>
            {lookup?.status === "loading" ? <LoadingOutlined /> : "Tra từ"}
          </button>
        </form>

        {!lookup && (
          <div className="dictionary-empty">
            <span className="dictionary-empty-icon"><BookOutlined /></span>
            <span>Kết quả tra cứu sẽ hiển thị tại đây</span>
          </div>
        )}

        {lookup?.status === "loading" && (
          <div className="dictionary-empty" role="status">
            <LoadingOutlined />
            <span>Đang tìm nghĩa của “{lookup.word}”...</span>
          </div>
        )}

        {(lookup?.status === "found" || lookup?.status === "saved") && (
          <div className="dictionary-result" aria-live="polite">
            <div className="dictionary-word-heading">
              <div>
                <h3>{lookup.entry?.word ?? lookup.savedWord.word}</h3>
                {(lookup.entry?.phonetic || lookup.savedWord?.phonetic) && (
                  <span className="dictionary-phonetic">
                    {lookup.entry?.phonetic ?? lookup.savedWord.phonetic}
                  </span>
                )}
              </div>
              <button
                className="dictionary-audio-button"
                type="button"
                aria-label={`Phát âm ${lookup.word}`}
                title="Nghe phát âm"
                onClick={() => pronounce(lookup.entry?.word ?? lookup.savedWord.word, audioUrl)}
              >
                <SoundOutlined />
              </button>
            </div>

            {(dictionaryMeanings?.length ? dictionaryMeanings : lookup.savedWord?.meanings)?.map((meaning, index) => (
              <div className="dictionary-meaning" key={`${meaning.partOfSpeech ?? meaning.type}-${index}`}>
                <span>{meaning.partOfSpeech ?? meaning.type}</span>
                <p>{meaning.definition ?? meaning.meaning}</p>
                {meaning.example && <em>“{meaning.example}”</em>}
              </div>
            ))}

            {!lookup.savedWord && lookup.translation && (
              <div className="dictionary-meaning">
                <span>Nghĩa tiếng Việt</span>
                <p>{lookup.translation}</p>
              </div>
            )}

            <div className="dictionary-result-actions">
              <button type="button" onClick={saveWord}>
                <PlusOutlined /> Lưu từ
              </button>
              <a href="https://dict.minhqnd.com" target="_blank" rel="noreferrer">
                Nguồn từ điển: dict.minhqnd.com
              </a>
            </div>
          </div>
        )}

        {lookup?.status === "not-found" && (
          <div className="dictionary-empty dictionary-error" role="status">
            <span>Chưa tìm thấy “{lookup.word}”. Hãy kiểm tra chính tả hoặc thử lại khi có kết nối mạng.</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default DictionaryLookup;