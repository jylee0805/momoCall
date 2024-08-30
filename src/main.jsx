import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { StrictMode } from "react";
import App from "./App";
import SearchPages from "./pages/Search.jsx";
import Finish from "./pages/Finish.jsx";
<<<<<<< HEAD
import ChatRoom from "./pages/ChatRoom.jsx";
=======
import Chat from "./pages/Chat.jsx";
import Backend from "./pages/Backend.jsx";
>>>>>>> main
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<SearchPages />} />
          <Route path="chat" element={<ChatRoom />} />
          <Route path="finishPage" element={<Finish />} />
          <Route path="backend" element={<Backend />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
