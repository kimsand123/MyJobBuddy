// Skal stå først: slår Zods kodegenerering (eval) fra, før nogen skemaer oprettes.
import "./shared/zodSetup";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { App } from "./app/App";
import { listenForInstallPrompt } from "./app/listenForInstallPrompt";
import { registerServiceWorker } from "./app/registerServiceWorker";

// Før React starter: browserens tilbud om installation kan komme, før Hjem er vist.
listenForInstallPrompt();

const rootElement = document.getElementById("root");

if (rootElement !== null) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

registerServiceWorker();
