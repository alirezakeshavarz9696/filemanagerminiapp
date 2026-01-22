import { useEffect, useRef } from "react";
import { telegramConfig } from "../telegram/telegramConfig.js";

const buildWidgetAttributes = (script) => {
  const config = telegramConfig.loginWidget;
  script.setAttribute("data-telegram-login", config.botUsername);
  script.setAttribute("data-size", "large");
  script.setAttribute("data-userpic", "false");
  script.setAttribute("data-request-access", config.requestAccess || "write");

  if (config.authUrl) {
    script.setAttribute("data-auth-url", config.authUrl);
  }

  script.setAttribute("data-radius", "6");
};

export default function TelegramLoginWidget() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!telegramConfig.loginWidget.enabled) return;
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    buildWidgetAttributes(script);
    containerRef.current.appendChild(script);
  }, []);

  return <div className="login-widget" ref={containerRef} />;
}
