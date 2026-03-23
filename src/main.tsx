import React from "react";
import ReactDOM from "react-dom/client";
import "./main.css";
import AppProviders from "./app/providers/AppProviders";
import AppRouter from "./app/router/AppRouter";

function Main() {
  return (
    <React.StrictMode>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Main />);