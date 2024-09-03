import { ChatContext, ChatDispatchContext } from "../../chatContextProvider";
import { useContext } from "react";
import { db, doc, updateDoc, collection, addDoc, serverTimestamp } from "../../utils/firebase";
import { AiOutlineLike, AiOutlineDislike, AiFillDislike, AiFillLike } from "react-icons/ai";
import happy from "../../images/happy.png";
import { marked } from "marked";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import PropTypes from "prop-types";
import responses from "../../pages/responses.json";

function MessageBox({ imageFormats }) {
  const { state } = useContext(ChatContext);
  const { dispatch, scrollToBottom } = useContext(ChatDispatchContext);
  let regex = new RegExp(`歡迎來到.*！我是你的 AI 小幫手，你可以先從選單了解我們的服務～`);
  const queryParams = new URLSearchParams(window.location.search);
  const shopId = queryParams.get("member");
  const handleQAClick = async (pattern) => {
    const responseItem = responses.find((item) => item.pattern === pattern);
    const messagesCollectionRef = collection(db, "chatroom", shopId, "messages");

    if (responseItem) {
      const userMessage = {
        content: pattern,
        created_time: serverTimestamp(),
        from: "user1",
      };
      await addDoc(messagesCollectionRef, userMessage);

      const shopMessage = {
        content: responseItem.response,
        created_time: serverTimestamp(),
        from: "shop",
      };

      await addDoc(messagesCollectionRef, shopMessage);

      scrollToBottom();
    } else {
      console.error("未找到相應的回覆");
    }
  };

  const updateUseful = async (messageId, isUseful, index) => {
    dispatch({ type: "SET_USEFUL_UPDATE", payload: true });
    try {
      const messageDoc = doc(db, "chatroom", shopId, "messages", messageId);
      await updateDoc(messageDoc, { isUseful });
      console.log("Document updated with ID: ", shopId);
      dispatch({ type: "TOGGLE_USEFUL", payload: { index, isUseful: isUseful } });
    } catch (e) {
      console.error("Error updating document: ", e);
    } finally {
      dispatch({ type: "SET_USEFUL_UPDATE", payload: false });
    }
  };

  {
    return state.messages.map((message, index) => {
      return (
        <div key={index} id={`message-${index}`}>
          <div key={index} className={`group flex gap-1 mr-3 relative ${message.from === "user1" ? "items-end flex-col" : "max-w-[258px] flex-wrap"}`}>
            {message.from !== "user1" && <img src={happy} alt="" className="w-9 h-9" />}
            <div
              className={` w-fit max-w-52 text-black break-words rounded-lg p-3 relative ${message.from === "user1" ? "bg-white" : "bg-primary-600"} ${message.from === "user1" ? "" : "ml-2"} ${
                message.from === "user1"
                  ? "after:absolute after:top-4 after:-right-3 after:content-[''] after:w-0 after:h-0 after:block after:border-b-[20px] after:border-l-[20px] after:border-l-white after:border-b-transparent"
                  : "after:absolute after:top-4 after:-left-3 after:content-[''] after:w-0 after:h-0 after:block after:border-b-[20px] after:border-r-[20px] after:border-r-primary-600 after:border-b-transparent"
              }`}
            >
              {imageFormats.some((format) => message.content.includes(format)) ? (
                <PhotoProvider maskOpacity={0.5}>
                  <PhotoView src={message.content}>
                    <img src={message.content} alt="Sent" className="rounded-lg max-w-full h-auto" />
                  </PhotoView>
                </PhotoProvider>
              ) : (
                <p dangerouslySetInnerHTML={{ __html: marked(message.content) }}></p>
              )}
              {message.isQA && (
                <div>
                  <button className="bg-primary text-white text-center w-[182px] h-[24px] mt-[10px] mb-[10px] rounded" onClick={() => handleQAClick("配送問題")}>
                    配送問題
                  </button>
                  <button className="bg-primary text-white text-center w-[182px] h-[24px] mb-[10px] rounded" onClick={() => handleQAClick("運送時間")}>
                    運送時間
                  </button>
                  <button className="bg-primary text-white text-center w-[182px] h-[24px] mb-[10px] rounded" onClick={() => handleQAClick("聯絡方式")}>
                    聯絡方式
                  </button>
                </div>
              )}
            </div>
            <div className={`flex items-center gap-2 ${message.from === "user1" ? "" : "ml-12 "}`}>
              <small className="text-xs leading-normal">{message.created_time?.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "Loading..."}</small>

              {state.messages[index].isUseful !== "No" && message.from === "shop" && !regex.test(message.content) && (
                <button onClick={() => updateUseful(state.messages[index].id, "Yes", index)} className="leading-4">
                  <AiOutlineLike className={`${state.messages[index].isUseful === "Yes" ? "hidden" : "inline"}`} />
                  <AiFillLike className={`${state.messages[index].isUseful == "Yes" ? "inline text-primary" : "hidden"}`} />
                </button>
              )}

              {!(state.messages[index].isUseful || message.from === "user1" || regex.test(message.content)) && <div className="border-1 border-black-600 h-4"></div>}

              {state.messages[index].isUseful !== "Yes" && message.from === "shop" && !regex.test(message.content) && (
                <button onClick={() => updateUseful(state.messages[index].id, "No", index)} className="leading-4">
                  <AiOutlineDislike className={`${state.messages[index].isUseful === "No" ? "hidden" : "inline"}`} />
                  <AiFillDislike className={`${state.messages[index].isUseful == "No" ? "inline text-secondary" : "hidden"}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    });
  }
}

MessageBox.propTypes = {
  imageFormats: PropTypes.array.isRequired,
};
export default MessageBox;
