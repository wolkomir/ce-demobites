import React from "react";
import { createRoot } from "react-dom/client";
import PinnedTab from "./PinnedTab";

const container = document.getElementById("pinnedtab-root");
if (container) {
  const root = createRoot(container);
  root.render(<PinnedTab />);
}

