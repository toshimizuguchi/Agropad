import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";

export default function Toast() {
  const toast = useStore((s) => s.toast);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      if (toast) {
        ref.current.classList.add("show");
      } else {
        ref.current.classList.remove("show");
      }
    }
  }, [toast]);

  return (
    <div ref={ref} className="toast">
      {toast}
    </div>
  );
}
