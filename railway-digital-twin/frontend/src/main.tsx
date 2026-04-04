import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { TelemetryProvider } from "./contexts/TelemetryContext.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <TelemetryProvider>
        <App />
      </TelemetryProvider>
    </BrowserRouter>
  </React.StrictMode>
);
