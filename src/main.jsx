import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { StrictMode } from "react";
import App from "./App";
import Home from "./pages/Home.jsx";
import Admin from "./pages/Admin.jsx";
import Search from "./pages/Search.jsx";
import Chat from "./pages/Chat";
import Console from "./pages/Console.jsx";
import NotFound from "./pages/NotFound.jsx";
import NewConsole from "./pages/NewConsole.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="chat" element={<Chat />} />
          <Route path="console" element={<Console />} />
          <Route path="admin" element={<Admin />} />
          <Route path="newconsole" element={<NewConsole />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
