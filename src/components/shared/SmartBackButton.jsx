import React from "react";
import { useNavigate } from "react-router-dom";

export default function SmartBackButton({
  children,
  fallback = "/",
  className = "",
  type = "button",
}) {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallback);
  };

  return (
    <button type={type} className={className} onClick={goBack}>
      {children}
    </button>
  );
}
