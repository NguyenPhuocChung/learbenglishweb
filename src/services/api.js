import savedVocabularyData from "../data/savedVocabulary.json";

export const API_BASE = "https://dict.minhqnd.com";
export const TRANSLATE_API = "https://api.mymemory.translated.net/get";
export const STORAGE_KEY = "myLearningWords";
export const AUTH_TOKEN_KEY = "learnEnglishAuthToken";
export const AUTH_USER_KEY = "learnEnglishUser";

const APP_API_BASE = import.meta.env.VITE_API_BASE_URL || "https://leabenglishbe.onrender.com/api";

export async function requestApi(path, options = {}) {
  const headers = { ...options.headers };
  const token = getAuthToken();

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${APP_API_BASE}${path}`, { ...options, headers });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Không thể kết nối máy chủ.");
  }

  return result;
}

async function authRequest(path, options = {}) {
  return requestApi(path, options);
}

export async function loginUser(credentials) {
  const result = await authRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  return result.data;
}

export async function registerUser(details) {
  const result = await authRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(details),
  });
  return result.data;
}

export async function requestPasswordReset(email) {
  const result = await authRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, origin: window.location.origin }),
  });
  return result;
}

export async function resetUserPassword(token, password) {
  return authRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function saveAuthSession(session) {
  localStorage.setItem(AUTH_TOKEN_KEY, session.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userName", session.user.name);
  localStorage.setItem("userEmail", session.user.email);
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredAuthUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
}

export async function lookupDictionary(word, { signal } = {}) {
  const url =
    `${API_BASE}/api/v1/lookup` +
    `?word=${encodeURIComponent(word)}` +
    "&lang=en&def_lang=vi";
  const response = await fetch(url, { signal });

  if (response.status === 404) {
    return { exists: false, word, meanings: [], translations: [] };
  }

  if (!response.ok) {
    throw new Error(`Dictionary API error: ${response.status}`);
  }

  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];
  const englishResult = results.find((result) => result.lang_code === "en");
  const meanings = results
    .flatMap((result) => result.meanings ?? [])
    .filter((meaning) => meaning.definition_lang?.toLowerCase().startsWith("vi"));
  const translations = results.flatMap((result) => result.translations ?? []);
  const ipa = englishResult?.pronunciations?.find((item) => item.ipa)?.ipa;
  let audio = englishResult?.audio ?? null;

  if (audio?.startsWith("/")) {
    audio = `${API_BASE}${audio}`;
  }

  return {
    exists: Boolean(data.exists),
    word: data.word ?? word,
    meanings,
    translations,
    ipa,
    audio,
  };
}

export async function translateText(text, { signal } = {}) {
  const url =
    `${TRANSLATE_API}` +
    `?q=${encodeURIComponent(text)}` +
    "&langpair=en|vi";
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Translation API error: ${response.status}`);
  }

  const data = await response.json();
  const translation = data?.responseData?.translatedText;

  if (!translation) {
    throw new Error("No translation returned.");
  }

  return translation;
}

export function getLearningWords() {
  try {
    const words = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(words) ? words : [];
  } catch {
    return [];
  }
}

export function saveLearningWord(word) {
  const normalizedWord = word.trim().toLowerCase();
  if (!normalizedWord) return false;

  const words = getLearningWords();
  if (words.includes(normalizedWord)) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify([...words, normalizedWord]));
  return true;
}

export async function fetchHomeData() {
  const result = await requestApi("/home");
  return result.data;
}

export async function fetchLearnerProgress() {
  const result = await requestApi("/users/me/progress");
  return result.data;
}

export async function fetchStoryBySlug(slug) {
  const result = await requestApi(`/stories/slug/${encodeURIComponent(slug)}`);
  return result.data;
}

export async function completeLearnerStory(storyId) {
  const result = await requestApi(`/stories/${encodeURIComponent(storyId)}/complete`, {
    method: "POST",
  });
  return result.data;
}

export async function saveVocabularyForLearner(word, details = {}) {
  const result = await requestApi("/users/me/vocabulary", {
    method: "POST",
    body: JSON.stringify({ word, ...details }),
  });
  return result.data;
}

export async function updateVocabularyStatus(word, status) {
  const result = await requestApi(`/users/me/vocabulary/${encodeURIComponent(word)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return result.data;
}

export async function removeLearnerVocabulary(word) {
  const result = await requestApi(`/users/me/vocabulary/${encodeURIComponent(word)}`, {
    method: "DELETE",
  });
  return result.data;
}

export async function fetchLearnerVocabulary() {
  let progress = await fetchLearnerProgress();
  const accountWords = new Set(progress.savedVocabulary ?? []);
  const legacyWords = getLearningWords().filter((word) => !accountWords.has(word));

  if (legacyWords.length) {
    await Promise.allSettled(legacyWords.map((word) => {
      const savedEntry = savedVocabularyData.find((entry) => entry.word.toLowerCase() === word);
      return saveVocabularyForLearner(word, {
        phonetic: savedEntry?.phonetic ?? "",
        meanings: (savedEntry?.meanings ?? []).map((meaning) => ({
          type: meaning.type,
          meaning: meaning.meaning,
        })),
        tags: savedEntry?.tags ?? [],
      });
    }));
    progress = await fetchLearnerProgress();
  }

  const entriesByWord = new Map((progress.vocabularyEntries ?? []).map((entry) => [entry.word, entry]));

  return (progress.savedVocabulary ?? []).map((word, index) => {
    const entry = entriesByWord.get(word) ?? { word };
    return {
      ...entry,
      id: entry.id ?? entry.word ?? index,
      word: String(entry.word ?? word),
      phonetic: entry.phonetic ?? "",
      meanings: entry.meanings ?? [],
      tags: entry.tags ?? [],
      status: entry.status ?? "new",
      savedAt: entry.savedAt ?? new Date().toISOString(),
    };
  });
}