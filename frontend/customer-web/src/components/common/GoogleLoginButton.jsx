import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function GoogleLoginButton({ onSuccess, onError }) {
  const btnRef = useRef(null);
  const { loginWithIdToken } = useAuth();
  const [scriptReady, setScriptReady] = useState(typeof window !== "undefined" && !!window.google?.accounts?.id);

  // The GSI script tag loads with async/defer, so it may not be ready the
  // instant this component mounts. Poll briefly instead of checking once -
  // checking only once silently breaks login if the script is still loading.
  useEffect(() => {
    if (scriptReady) return;
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setScriptReady(true);
        clearInterval(interval);
      }
    }, 100);
    const timeout = setTimeout(() => clearInterval(interval), 10000); // give up after 10s
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [scriptReady]);

  useEffect(() => {
    if (!scriptReady || !GOOGLE_CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        try {
          const data = await loginWithIdToken(credential);
          onSuccess?.(data);
        } catch (err) {
          onError?.(err);
        }
      },
    });

    window.google.accounts.id.renderButton(btnRef.current, {
      theme: "outline",
      size: "large",
      width: 300,
      text: "continue_with",
    });
  }, [scriptReady, loginWithIdToken, onSuccess, onError]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="rounded-lg border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
        Set <code>VITE_GOOGLE_CLIENT_ID</code> in your <code>.env</code> to enable Google login.
      </div>
    );
  }

  if (!scriptReady) {
    return <div className="h-10 w-[300px] rounded-lg bg-cream animate-pulse" />;
  }

  return <div ref={btnRef} />;
}
