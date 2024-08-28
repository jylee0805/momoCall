import React, { useEffect, useReducer } from "react";
import {
  FiChevronLeft,
  FiAlertTriangle,
  FiImage,
  FiSend,
} from "react-icons/fi";
import happy from "./img/happy.png";
import {
  db,
  storage,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
} from "../utils/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Link } from "react-router-dom";

const initialState = {
  messages: [],
  inputValue: "",
  showOrderInfo: false,
  showProductInfo: false,
};
function reducer(state, action) {
  switch (action.type) {
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "SET_INPUT_VALUE":
      return { ...state, inputValue: action.payload };
    case "TOGGLE_ORDER_INFO":
      return { ...state, showOrderInfo: action.payload };
    case "TOGGLE_PRODUCT_INFO":
      return { ...state, showProductInfo: action.payload };
    case "RESET_INPUT_VALUE":
      return { ...state, inputValue: "" };
    default:
      return state;
  }
}

function Finish() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (!queryParams.has("member")) {
      if (queryParams.has("order")) {
        dispatch({ type: "TOGGLE_ORDER_INFO", payload: true });
      }
      if (queryParams.has("product")) {
        dispatch({ type: "TOGGLE_PRODUCT_INFO", payload: true });
      }
    }

    const q = query(
      collection(db, "chatroom", "chat1", "messages"),
      orderBy("created_time")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push(doc.data());
      });
      dispatch({ type: "SET_MESSAGES", payload: msgs });
    });

    return () => unsubscribe(); // 清理快照監聽器
  }, []);

  const predefinedResponses = [
    { pattern: /訂單編號[\s\S]*/, response: "訂單編號是20240823153700" },
    {
      pattern: /營業時間[\s\S]*/,
      response: "我們的營業時間為每天9:00-18:00",
    },
    {
      pattern: /聯絡方式[\s\S]*/,
      response: "您好！可以透過客服電話或電子郵件聯絡我們喔～",
    },
  ];

  const sendMessage = async () => {
    if (state.inputValue.trim() !== "") {
      await addDoc(collection(db, "chatroom", "chat1", "messages"), {
        content: state.inputValue,
        created_time: serverTimestamp(),
        from: "user1",
      });
      const response =
        predefinedResponses.find(({ pattern }) =>
          pattern.test(state.inputValue)
        )?.response || "抱歉，我不太明白您的問題！";

      await addDoc(collection(db, "chatroom", "chat1", "messages"), {
        content: response,
        created_time: serverTimestamp(),
        from: "shop",
      });
      dispatch({ type: "RESET_INPUT_VALUE" }); // 清空輸入框
    }
  };

  const imageFormats = [".jpeg", ".jpg", ".png", ".gif"];
  const setChats = async (url) => {
    try {
      const messagesRef = collection(db, "chatroom", "chat1", "messages");
      const messageRef = doc(messagesRef);
      setDoc(messageRef, {
        content: url,
        created_time: serverTimestamp(),
        from: "user1",
      })
        .then(() => console.log("Document successfully written!"))
        .catch((error) => console.error("Error writing document: ", error));
    } catch (error) {
      console.error("Error getting random document:", error);
    }
  };
  const sendImage = (event) => {
    console.log(event.target.files);

    const file = event.target.files[0];
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      alert("請選擇一個有效的圖片文件（JPEG, PNG, GIF）。");
      event.target.value = "";
      return;
    }
    const storageRef = ref(storage, `images/${file.name}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {},
      (error) => {
        console.error("Upload failed:", error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setChats(downloadURL);
        });
      }
    );
  };

  return (
    <div className="bg-black-200 w-container h-100 my-0 mx-auto relative font-sans">
      <div className="bg-black-200 w-container px-3 fixed top-0 left-0 right-0 z-10 my-0 mx-auto">
        <div className="flex items-center py-4">
          <Link to={"/"}>
            <FiChevronLeft className="w-6 h-6 mr-3 cursor-pointer" />
          </Link>
          <h1 className="font-sans font-bold text-2xl leading-normal text-primary ml-20">
            對話紀錄
          </h1>
        </div>
      </div>

      {/* 這裡要做選擇，hidden or grid */}
      <div
        className={`${
          state.showOrderInfo ? "grid" : "hidden"
        }  bg-black-0 w-container py-2 px-3  grid-cols-4 gap-6  top-[68px] mt-[68px] left-0 right-0 z-10 my-0 mx-auto`}
      >
        <div className="flex flex-col items-center gap-y-2 col-span-1">
          <img
            src="https://images.unsplash.com/photo-1635865933730-e5817b5680cd?q=80&w=2864&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="product-image"
            className="rounded-full w-large h-large"
          />
          <p className="text-xs leading-normal text-center w-large bg-secondary-400 text-secondary rounded-lg">
            訂單成立
          </p>
        </div>
        <div className="flex flex-col gap-y-1 col-span-3">
          <p className="font-bold">
            商品名稱一行最多十七個字商品名稱一行最多十七個字
          </p>
          <p className="text-primary">NT. 499</p>
          <p>訂單編號：20240823153700</p>
        </div>
      </div>

      {/* 這裡要做選擇，hidden or flex */}
      <div
        className={`product bg-white ${
          state.showProductInfo ? "flex" : "hidden"
        } justify-center gap-6 py-2 mt-[68px] items-center`}
      >
        <img src={happy} alt="camera" className="w-20 rounded-full" />
        <div className="my-2 flex flex-col py-2 justify-between">
          <h4 className="text-base font-bold leading-normal">
            商家名稱最多也十六個字十六個字
          </h4>
          <p className="text-base leading-normal text-secondary">
            momoCall 回應率：100%
          </p>
        </div>
      </div>

      <div
        className={`px-3 py-4 space-y-4 ${
          !state.showOrderInfo && !state.showProductInfo ? "mt-[68px]" : ""
        } mb-12`}
      >
        <div className="bg-accent flex justify-center items-center h-8 px-6 rounded-large">
          <FiAlertTriangle className="w-notice h-notice mr-4" />
          <p className="text-sm leading-normal">提醒您，請勿透露個人資料</p>
        </div>
        <div className="flex justify-center">
          <div className="bg-black-0 rounded-large w-14">
            <p className="text-xs leading-normal px-4">今天</p>
          </div>
        </div>
        <div>
          <div
            className={`bg-black-0 p-4 rounded-t-lg ${
              state.showOrderInfo ? "hidden" : "flex"
            } justify-between border-b-1 border-black-400`}
          >
            <img
              src="https://images.unsplash.com/photo-1721020693392-e447ac5f52ee?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="product-image"
              className="w-middle h-middle rounded-lg mr-3"
            />
            <div className="flex flex-col justify-between">
              <p className="text-xs leading-normal">商品編號</p>
              <p className="text-xs leading-normal font-bold">
                商品名稱商品名稱商品名稱商品名稱商品名稱商品名稱最多兩行共四十個字多的用刪節號喔
              </p>
            </div>
          </div>
          <div
            className={`bg-black-0 rounded-b-lg ${
              state.showOrderInfo ? "hidden" : "flex"
            } justify-center`}
          >
            <button className="w-full py-2 text-xs leading-normal font-bold text-primary cursor-pointer">
              立即購買
            </button>
          </div>
        </div>
        {state.messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-1 mr-3 ${
              message.from === "user1" ? "justify-end" : ""
            }`}
          >
            {message.from !== "user1" && (
              <img src={happy} alt="" className="w-9 h-9" />
            )}
            <div
              className={`w-fit max-w-[65%]  text-black break-words rounded-lg p-3 relative ${
                message.from === "user1" ? "bg-white" : "bg-primary-600"
              } ${message.from === "user1" ? "order-2" : "order-1 ml-2"} ${
                message.from === "user1"
                  ? "after:absolute after:top-4 after:-right-3  after:content-[''] after:w-0 after:h-0 after:block  after:border-b-[20px] after:border-l-[20px] after:border-l-white after:border-b-transparent"
                  : "after:absolute after:top-4 after:-left-3  after:content-[''] after:w-0 after:h-0 after:block  after:border-b-[20px] after:border-r-[20px] after:border-r-primary-600 after:border-b-transparent"
              }`}
            >
              {imageFormats.some((format) =>
                message.content.includes(format)
              ) ? (
                <img
                  src={message.content}
                  alt="Sent"
                  className="rounded-lg max-w-full h-auto"
                />
              ) : (
                <p>{message.content}</p>
              )}
            </div>
            <small
              className={`self-end ${
                message.from === "user1" ? "order-1 mr-3" : "order-2 ml-2"
              }`}
            >
              {message.created_time?.toDate().toLocaleTimeString() ||
                "Loading..."}
            </small>
          </div>
        ))}

        {/* 注解掉的區塊 */}
        {/* 
        <div className="flex gap-x-1">
          <img
            src={annoy}
            alt="shopper-profile-image"
            className="w-small h-small rounded-full mr-1 bg-primary-600"
          />
          <p className="bg-primary-600 w-chatBox rounded-lg text-sm leading-normal p-3 relative ml-2 after:absolute after:top-4 after:-left-3  after:content-[''] after:w-0 after:h-0 after:block  after:border-b-[20px] after:border-r-[20px] after:border-r-primary-600 after:border-b-transparent">
            一行最多放十三個字十三個字十三個字十三個字十三個字
          </p>
          <p className="text-xs leading-normal text-black-800 self-end">
            12:00
          </p>
        </div>
        <div className="flex flex-row-reverse gap-1">
          <p className="bg-black-0 w-chatBox rounded-lg text-sm leading-normal p-3 relative mr-3 after:absolute after:top-4 after:-right-3 after:content-[''] after:w-0 after:h-0 after:block after:border-b-[20px] after:border-l-[20px] after:border-l-black-0 after:border-b-transparent">
            一行最多放十三個字十三個字 十三個字十三個字十三個字
          </p>
          <p className="text-xs leading-normal text-black-800 self-end">
            12:05
          </p>
        </div>
        <div className="flex gap-x-1">
          <img
            src={annoy}
            alt="shopper-profile-image"
            className="w-9 h-9 rounded-full mr-1 bg-primary-600"
          />
          <p className="bg-primary-600 w-chatBox rounded-lg text-sm leading-normal p-3 relative ml-2 after:absolute after:top-4 after:-left-3  after:content-[''] after:w-0 after:h-0 after:block  after:border-b-[20px] after:border-r-[20px] after:border-r-primary-600 after:border-b-transparent">
            一行最多放十三個字十三個字
          </p>
          <p className="text-xs leading-normal text-black-800 self-end">
            12:08
          </p>
        </div>
        <div className="flex gap-x-1">
          <img
            src={annoy}
            alt="shopper-profile-image"
            className="w-9 h-9 rounded-full mr-3 bg-primary-600"
          />
          <div className="bg-primary-600 w-chatBox rounded-lg p-1">
            <img
              src="https://images.unsplash.com/photo-1721020693392-e447ac5f52ee?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="product-image"
              className="w-uploadImage h-uploadImage rounded mb-1"
            />
            <div className="p-1">
              <p className="text-xs leading-normal">商品編號</p>
              <p className="text-xs leading-normal">
                商品名稱商品名稱商品名稱十五字
              </p>
            </div>
          </div>
          <p className="text-xs leading-normal text-black-800 self-end">
            12:08
          </p>
        </div> 
        */}
      </div>

      <div className="bg-primary-600 w-container py-2 px-3 flex justify-between gap-x-2 fixed bottom-0 left-0 right-0 z-10 my-0 mx-auto">
        <label className="bg-black-0 rounded-full p-1 cursor-pointer active:outline active:outline-primary active:outline-1 active:outline-offset-0">
          <FiImage className="w-6 h-6 text-primary hover:text-primary-800 active:text-primary" />
          <input
            type="file"
            className="hidden"
            accept="image/jpg,image/jpeg,image/png,image/gif"
            onChange={sendImage}
          />
        </label>
        <input
          type="text"
          className="w-[271px] bg-black-200 grow rounded-3xl pl-3 border-0 focus:outline-primary focus:outline focus:outline-1 focus:outline-offset-0 focus:bg-white hover:bg-white"
          placeholder="輸入訊息"
          value={state.inputValue}
          onChange={(e) =>
            dispatch({ type: "SET_INPUT_VALUE", payload: e.target.value })
          }
        />
        <button
          className="bg-white w-8 h-8 rounded-full active:border-primary active:border"
          onClick={sendMessage}
        >
          <FiSend className="w-5 h-5 mx-auto text-primary hover:text-primary" />
        </button>
      </div>
    </div>
  );
}

export default Finish;
