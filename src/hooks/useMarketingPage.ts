import { useEffect } from "react";

export const useMarketingPage = () => {
  useEffect(() => {
    document.body.classList.add("nexa-body");
    window.scrollTo({ top: 0, behavior: "auto" });

    return () => {
      document.body.classList.remove("nexa-body");
    };
  }, []);
};
