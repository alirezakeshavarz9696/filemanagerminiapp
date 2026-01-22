import { telegramConfig } from "./telegramConfig.js";

export const initTelegram = () => {
  const isTelegram =
    typeof window !== "undefined" &&
    window.Telegram &&
    window.Telegram.WebApp;

  if (!isTelegram) {
    return { isTelegram: false, webApp: null };
  }

  const webApp = window.Telegram.WebApp;
  // Telegram-specific: notify WebApp that UI is ready and expand the view.
  webApp.ready();
  webApp.expand();

  // Telegram-specific: disable vertical swipes to keep UX stable.
  if (typeof webApp.disableVerticalSwipes === "function") {
    webApp.disableVerticalSwipes();
  }

  if (telegramConfig.theme?.autoApply && webApp.themeParams) {
    document.documentElement.style.setProperty(
      "--tg-theme-bg",
      webApp.themeParams.bg_color || "#0f172a"
    );
    document.documentElement.style.setProperty(
      "--tg-theme-text",
      webApp.themeParams.text_color || "#f7f7f7"
    );
  }

  return { isTelegram: true, webApp };
};
