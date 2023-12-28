import React from "react";
import browser from "webextension-polyfill";

export default function PermissionFrame() {
  return (
    <div className="blocked_permission">
      <iframe src={browser.runtime.getURL("blockPermission.html")} allow="microphone"></iframe>
    </div>
  );
}
