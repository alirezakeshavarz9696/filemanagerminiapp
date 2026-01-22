const telegramMiniAppConfig = {
  appName: "File Manager Mini App",
  botUsername: "YOUR_BOT_USERNAME",
  webAppUrl: "https://example.com",
  allowedOrigins: ["http://localhost:5173"],
  enableStandalone: true,
  loginWidget: {
    enabled: true,
    botUsername: "YOUR_BOT_USERNAME",
    authUrl: "https://example.com/auth/telegram",
    requestAccess: "write",
  },
  theme: {
    autoApply: true,
  },
};

export default telegramMiniAppConfig;
