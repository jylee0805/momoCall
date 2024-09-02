import { useEffect, useContext } from "react";
import { ChatContext, ChatDispatchContext } from "../../chatContextProvider";
import { useNavigate } from "react-router-dom";
import { db, storage, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, ref, uploadBytesResumable, getDownloadURL, where } from "../../utils/firebase";
import { fetchShopInfo, fetchGPT } from "../../utils/fetch";
import useGoogleVisionAPI from "../../utils/useGoogleVisionAPI";
import tappay from "../../utils/tappay";
import { format, isToday, isYesterday, differenceInMinutes } from "date-fns";
import { zhTW } from "date-fns/locale";
import "react-photo-view/dist/react-photo-view.css";

import Header from "./Header";
import OrderCard from "./OrderCard";
import ShopCard from "./ShopCard";
import DateLabel from "./DateLabel";
import ChatSection from "./ChatSection";
import Choose from "./Choose";
import Checkout from "./Checkout";
import Order from "./Order";
import TypeIn from "./TypeIn";

function Chat() {
  const { labels, handleAnalyzeImage } = useGoogleVisionAPI();
  const queryParams = new URLSearchParams(window.location.search);
  const shopId = queryParams.get("member") || "0";
  const orderNumber = queryParams.get("order");
  const productNumber = queryParams.get("product");

  const { state } = useContext(ChatContext);
  const { dispatch, renderDispatch, scrollToBottom } = useContext(ChatDispatchContext);
  const navigate = useNavigate();

  useEffect(() => {
    const checkParams = async () => {
      const chatroomSnapshot = await getDocs(collection(db, "chatroom"));
      const validShopIds = chatroomSnapshot.docs.map((doc) => doc.id);

      if (!shopId || !validShopIds.includes(shopId)) {
        navigate("/404");
        return;
      }
    };

    dispatch({ type: "SET_MESSAGE_SENT", payload: false });
    checkParams();

    if (shopId) {
      renderDispatch({ type: "TOGGLE_SHOP_INFO", payload: true });
      fetchShopInfo(shopId, null, productNumber, dispatch, renderDispatch);
      if (orderNumber) {
        renderDispatch({ type: "TOGGLE_ORDER_INFO", payload: true });
        renderDispatch({ type: "TOGGLE_PRODUCT_INFO", payload: false });
        fetchShopInfo(shopId, orderNumber, null, dispatch, renderDispatch);
      } else {
        renderDispatch({ type: "TOGGLE_ORDER_INFO", payload: false });
        renderDispatch({ type: "TOGGLE_PRODUCT_INFO", payload: true });
        productNumber ? fetchShopInfo(shopId, null, productNumber, dispatch, renderDispatch) : "";
      }
    } else {
      renderDispatch({ type: "TOGGLE_ORDER_INFO", payload: false });
      renderDispatch({ type: "TOGGLE_PRODUCT_INFO", payload: false });
    }

    const chatroomName = shopId || " ";
    const q = query(collection(db, "chatroom", chatroomName, "messages"), orderBy("created_time"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ ...doc.data(), id: doc.id });
      });

      dispatch({ type: "SET_MESSAGES", payload: msgs });
      scrollToBottom();
    });

    const handleScroll = () => {
      const height = document.documentElement.scrollHeight;

      renderDispatch({
        type: "SET_DIV_HEIGHT",
        payload: height < 850 ? "h-screen" : "h-auto",
      });
    };

    const setupTappay = async () => {
      await tappay.setupSDK();
      tappay.setupCard();
    };
    setupTappay();

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();

    const sendQAMessage = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const shopId = queryParams.get("member");
      const messagesCollectionRef = collection(db, "chatroom", shopId, "messages");

      const shopQuery = query(collection(db, "shops"), where("shopId", "==", shopId));
      const shopSnapshot = await getDocs(shopQuery);
      const shopName = shopSnapshot.docs[0].data().shopName;

      if (!state.messageSent) {
        console.log(state.shopName);

        const qaMessage = {
          content: `歡迎來到${shopName}！我是你的 AI 小幫手，你可以先從選單了解我們的服務～`,
          created_time: serverTimestamp(),
          from: "shop",
          isQA: true,
        };
        await addDoc(messagesCollectionRef, qaMessage);
        dispatch({ type: "SET_MESSAGE_SENT", payload: true });
      }
    };

    if (state.shopName) {
      sendQAMessage();
    }
  }, [state.shopName]);

  let scrollTimeout;

  useEffect(() => {
    if (state.messages.length > 0) {
      const handleScroll = () => {
        dispatch({ type: "SET_IS_SCROLLING", payload: true });
        clearTimeout(scrollTimeout);

        const scrollPosition = window.scrollY + 10;
        let newLabel = "";

        for (let i = 0; i < state.messages.length; i++) {
          const message = state.messages[i];
          const messageDate = message.created_time ? message.created_time.toDate() : null;

          let dateLabel = "Loading...";
          if (messageDate) {
            const now = new Date();
            const minutesDifference = differenceInMinutes(now, messageDate);

            if (minutesDifference < 30) {
              dateLabel = "剛剛";
            } else if (isToday(messageDate)) {
              dateLabel = "今天";
            } else if (isYesterday(messageDate)) {
              dateLabel = "昨天";
            } else {
              dateLabel = format(messageDate, "M/d (EEE)", { locale: zhTW });
            }
          }

          const element = document.getElementById(`message-${i}`);
          if (element && element.offsetTop >= scrollPosition) {
            newLabel = dateLabel;
            break;
          }
        }
        dispatch({ type: "SET_DATE_LABEL", payload: newLabel });

        scrollTimeout = setTimeout(() => {
          dispatch({ type: "SET_IS_SCROLLING", payload: false });
        }, 900);
      };

      window.addEventListener("scroll", handleScroll);

      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [state.messages]);

  const predefinedResponses = state.faqs.map((item) => ({
    pattern: new RegExp(item.keyword, "i"),
    response: item.response,
  }));

  const addMessage = async (document, content, from) => {
    await addDoc(document, {
      content: content,
      created_time: serverTimestamp(),
      from: from,
      isUseful: "",
    });
  };

  const sendMessage = async (url) => {
    const queryParams = new URLSearchParams(window.location.search);
    const shopId = queryParams.get("member");
    const messagesCollectionRef = collection(db, "chatroom", shopId, "messages");

    if (url !== undefined) {
      console.log(typeof typeof url);

      setTimeout(() => {
        renderDispatch({ type: "TOGGLE_IMG_LOADING" });
        renderDispatch({ type: "TOGGLE_GPT_LOADING" });
        scrollToBottom();
      }, 500);

      await addMessage(messagesCollectionRef, url, "user1");
    } else if (state.inputValue.trim() !== "") {
      await addMessage(messagesCollectionRef, state.inputValue, "user1");

      let response = "";
      const matchedResponse = predefinedResponses.find(({ pattern }) => pattern.test(state.inputValue));

      const chatroomName = shopId || " ";
      const q = query(collection(db, "chatroom", chatroomName, "messages"), orderBy("created_time"));
      const messages = await getDocs(q);
      const messagesList = messages.docs
        .map((message) => (message.data().content === `歡迎來到${state.shopName}！我是你的 AI 小幫手，你可以先從選單了解我們的服務～` ? "" : message.data().content))
        .toString();

      if (matchedResponse) {
        response = matchedResponse.response;
        await addMessage(messagesCollectionRef, response, "shop");
      } else if (url !== undefined) {
        fetchGPT(messagesList + labels, messagesCollectionRef, shopId);
      } else {
        fetchGPT(messagesList, messagesCollectionRef, shopId);
      }

      dispatch({ type: "RESET_INPUT_VALUE" });
      scrollToBottom();
    }
  };

  const handleKeyDown = (e) => {
    if (e.keyCode === 13) {
      sendMessage();
    }
  };

  const imageFormats = [".jpeg", ".jpg", ".png", ".gif"];

  const sendImage = (event) => {
    const file = event.target.files[0];
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      alert("請選擇一個有效的圖片文件（JPEG, PNG, GIF）。");
      event.target.value = "";
      return;
    }
    if (state.inputValue === "") {
      renderDispatch({ type: "TOGGLE_IMG_LOADING" });
    }
    scrollToBottom();

    const storageRef = ref(storage, `images/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {},
      (error) => {
        console.error("Upload failed:", error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          sendMessage(downloadURL);
          try {
            await handleAnalyzeImage(downloadURL);
          } catch (error) {
            console.error("handleAnalyzeClick 發生錯誤：", error);
          }
        });
      }
    );
  };

  useEffect(() => {
    if (labels.length > 0) {
      const messagesCollectionRef = collection(db, "chatroom", shopId, "messages");
      fetchGPT(`圖片相關如下${labels}`, messagesCollectionRef, shopId);
      setTimeout(() => {
        renderDispatch({ type: "TOGGLE_GPT_LOADING" });
      }, 1000);
    }
  }, [labels]);

  useEffect(() => {
    const fetchFaqs = async () => {
      const querySnapshot = await getDocs(collection(db, "faq"));
      const faqList = querySnapshot.docs.map((doc) => ({
        keyword: doc.data().keyword,
        response: doc.data().response,
      }));

      dispatch({ type: "SET_FAQS", payload: faqList });
    };

    fetchFaqs();
  }, []);

  async function checkout() {
    try {
      if (!tappay.canGetPrime()) {
        window.alert("付款資料輸入有誤");
        return;
      }

      const result = await tappay.getPrime();
      if (result.status !== 0) {
        window.alert("付款資料輸入有誤");
        return;
      }

      renderDispatch({ type: "FINISH_CHECKOUT" });
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="bg-black-200 w-container my-0 mx-auto relative font-sans">
      <Header />
      <OrderCard />
      <ShopCard />
      <DateLabel />
      <ChatSection productNumber={productNumber} imageFormats={imageFormats} />
      <Choose />
      <Checkout checkout={checkout} />
      <Order addMessage={addMessage} shopId={shopId} />
      <TypeIn sendImage={sendImage} handleKeyDown={handleKeyDown} sendMessage={() => sendMessage()} />
    </div>
  );
}

export default Chat;
