import { useEffect, useState } from "react";
import { initTelegram } from "./initTelegram.js";

const STORAGE_KEY = "telegram_user";
const TG_WEBAPP_DATA_KEY = "tgWebAppData";

const readStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (error) {
    return null;
  }
};

const normalizeUser = (user) => {
  if (!user || typeof user !== "object") return null;
  return {
    id: user.id ?? null,
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    username: user.username ?? "",
    photo_url: user.photo_url ?? "",
    language_code: user.language_code ?? "",
  };
};

const readInitDataFromUrl = () => {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash || "";
  const search = window.location.search || "";
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const searchParams = new URLSearchParams(search);
  return hashParams.get(TG_WEBAPP_DATA_KEY) || searchParams.get(TG_WEBAPP_DATA_KEY) || "";
};

const parseUserFromInitData = (initData) => {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const userJson = params.get("user");
  if (!userJson) return null;
  try {
    return normalizeUser(JSON.parse(userJson));
  } catch (error) {
    return null;
  }
};

const storeUser = (user) => {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    // Ignore storage failures (private mode, quota, etc.).
  }
};

// React hook to read Telegram WebApp user data safely.
export const useTelegramUser = () => {
  const [user, setUser] = useState(readStoredUser);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const { isTelegram: detected, webApp } = initTelegram();
    const initData = readInitDataFromUrl();
    const fallbackUser = parseUserFromInitData(initData);
    setIsTelegram(detected || Boolean(initData));

    if (!detected || !webApp) {
      if (fallbackUser) {
        setUser(fallbackUser);
        storeUser(fallbackUser);
      }
      setIsReady(true);
      return;
    }

    // Telegram-specific: user info is provided inside initDataUnsafe.
    const telegramUser = normalizeUser(webApp.initDataUnsafe?.user);
    setUser(telegramUser);
    storeUser(telegramUser);
    setIsReady(true);
  }, []);

  return { user, isTelegram, isReady };
};
