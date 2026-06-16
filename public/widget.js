(function () {
  // Prevent duplicate initialization
  if (window.__ElaraChatInitialized) return;
  window.__ElaraChatInitialized = true;

  // Configuration: Dynamically determine the server URL based on where this script is hosted
  const scriptTag = document.currentScript;
  const SERVER_URL = scriptTag && scriptTag.src ? new URL(scriptTag.src).origin : window.location.origin;
  const IFRAME_URL = `${SERVER_URL}/chat-iframe`;
  
  // Create iframe container element
  const container = document.createElement("div");
  container.id = "elara-chat-container";
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  
  // Initial size accommodates the animated character
  container.style.width = "450px";
  container.style.height = "350px";
  container.style.zIndex = "999999";
  container.style.transition = "width 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1), right 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
  container.style.borderRadius = "4px";
  container.style.overflow = "hidden";
  container.style.boxShadow = "none";

  // Create the iframe
  const iframe = document.createElement("iframe");
  iframe.src = IFRAME_URL;
  iframe.id = "elara-chat-iframe";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.style.background = "transparent";
  iframe.style.colorScheme = "light";
  iframe.setAttribute("allow", "telephone=yes");

  container.appendChild(iframe);
  document.body.appendChild(container);

  // Responsive sizing constants
  const DESKTOP_WIDTH = 400;
  const DESKTOP_HEIGHT = 620;

  // Listen for messages from the chat iframe
  window.addEventListener("message", function (event) {
    // Only accept messages from our server
    if (event.origin !== window.location.origin && !IFRAME_URL.startsWith(event.origin)) {
      return;
    }

    const data = event.data;
    if (typeof data !== "object" || !data.type) return;

    if (data.type === "ELARA_TOGGLE") {
      const isOpen = data.isOpen;
      const isMobile = window.innerWidth <= 500;

      if (isOpen) {
        // Expand container size to hold the full chat panel
        if (isMobile) {
          container.style.width = "100%";
          container.style.height = "100%";
          container.style.bottom = "0";
          container.style.right = "0";
          container.style.borderRadius = "0px";
        } else {
          container.style.width = `${DESKTOP_WIDTH}px`;
          container.style.height = `${DESKTOP_HEIGHT}px`;
          container.style.bottom = "20px";
          container.style.right = "20px";
          container.style.borderRadius = "6px";
          container.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.12)";
        }
      } else {
        // Collapse container size to show only the animated character
        container.style.width = "450px";
        container.style.height = "350px";
        container.style.bottom = "20px";
        container.style.right = "20px";
        container.style.borderRadius = "4px";
        container.style.boxShadow = "none";
      }
    }
  });

  // Handle host window resize to ensure mobile widget remains fullscreen if open
  window.addEventListener("resize", function () {
    const isMobile = window.innerWidth <= 500;
    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) return;
    
    iframeWindow.postMessage({ type: "ELARA_PARENT_RESIZE", isMobile }, "*");
  });
})();
