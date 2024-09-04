import { Outlet } from "react-router-dom";
import { ChatContextProvider } from "./chatContextProvider";

function App() {
  return (
    <div>
      <ChatContextProvider>
        <Outlet />
      </ChatContextProvider>
    </div>
  );
}

export default App;
