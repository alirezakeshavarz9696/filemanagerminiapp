export const getTelegramAuth = () => {
  const inTelegram =
    typeof window !== "undefined" &&
    window.Telegram &&
    window.Telegram.WebApp;

  if (inTelegram) {
    const webApp = window.Telegram.WebApp;
    const user = webApp.initDataUnsafe?.user || null;
    return {
      source: "webapp",
      initData: webApp.initData || "",
      user,
    };
  }

  return {
    source: "standalone",
    initData: "",
    user: null,
  };
};
