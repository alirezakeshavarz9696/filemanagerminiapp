import baseConfig from "../../telegram-miniapp.config.js";

const env = import.meta.env;

const readBool = (value, fallback) => {
  if (value === undefined) return fallback;
  return value === "true";
};

export const telegramConfig = {
  ...baseConfig,
  botUsername: env.VITE_TELEGRAM_BOT_USERNAME || baseConfig.botUsername,
  webAppUrl: env.VITE_TELEGRAM_WEBAPP_URL || baseConfig.webAppUrl,
  enableStandalone: readBool(
    env.VITE_TELEGRAM_ENABLE_STANDALONE,
    baseConfig.enableStandalone
  ),
  loginWidget: {
    ...baseConfig.loginWidget,
    enabled: readBool(
      env.VITE_TELEGRAM_LOGIN_WIDGET_ENABLED,
      baseConfig.loginWidget.enabled
    ),
    botUsername:
      env.VITE_TELEGRAM_LOGIN_WIDGET_BOT_USERNAME ||
      baseConfig.loginWidget.botUsername,
    authUrl:
      env.VITE_TELEGRAM_LOGIN_WIDGET_AUTH_URL ||
      baseConfig.loginWidget.authUrl,
  },
};
