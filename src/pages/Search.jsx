import { FiChevronLeft } from "react-icons/fi";
import momoLogo from "/momocallLogo.png";
import { useEffect, useReducer, useState } from "react";
import { db } from "../utils/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";

const initialState = {
  searchTerm: "",
  results: [],
  isSearching: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "SET_RESULTS":
      return { ...state, results: action.payload, isSearching: true };
    case "RESET_SEARCH":
      return { ...state, isSearching: false };
    case "CLEAR_SEARCH_TERM":
      return { ...state, searchTerm: "" };
    default:
      return state;
  }
};

const SearchPages = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [latestMessages, setLatestMessages] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      const fetchedResults = await fetchAllChatrooms();
      dispatch({ type: "SET_RESULTS", payload: fetchedResults });
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchLatestMessages = async () => {
      const updatedMessages = {};
      for (const result of state.results) {
        if (result.collectionName === "chatroom") {
          const messagesRef = collection(db, `chatroom/${result.id}/messages`);
          const messagesQuery = query(
            messagesRef,
            orderBy("created_time", "desc"),
            limit(1)
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          if (!messagesSnapshot.empty) {
            const latestMessage = messagesSnapshot.docs[0].data();
            updatedMessages[result.id] = latestMessage;
          }
        }
      }
      setLatestMessages(updatedMessages);
    };

    fetchLatestMessages();
  }, [state.results]);

  const handleInputChange = (event) => {
    dispatch({ type: "SET_SEARCH_TERM", payload: event.target.value });
  };

  const handleKeyPress = async (event) => {
    if (event.key === "Enter") {
      const fetchedResults = await searchFirestore(state.searchTerm);
      dispatch({ type: "SET_RESULTS", payload: fetchedResults });
    }
  };

  const handleLinkClick = async () => {
    dispatch({ type: "CLEAR_SEARCH_TERM" });
    const fetchedResults = await fetchAllChatrooms();
    dispatch({ type: "SET_RESULTS", payload: fetchedResults });
    navigate("/");
  };

  return (
    <div className="w-container max-w-screen min-h-screen m-[auto] bg-white justify-center p-3 pt-0 font-sans">
      <header className="flex items-center py-4">
        <Link to="/" onClick={handleLinkClick}>
          <button className="mr-3">
            <FiChevronLeft className="w-6 h-6" />
          </button>
        </Link>
        <Link to="/" onClick={handleLinkClick}>
          <h1 className="text-2xl leading-normal font-bold text-primary ml-20">
            momoCall
          </h1>
        </Link>
      </header>
      <input
        type="text"
        placeholder="請輸入商店名稱、商品名稱或商品編號"
        className="leading-normal w-full h-8 text-sm text-black-100 text-center bg-black-400 placeholder-black rounded-full mb-4 hover:bg-black-200 focus:outline outline-black-600 focus:bg-black-200"
        value={state.searchTerm}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
      />
      <div>
        {!state.isSearching &&
          state.results
            .filter(
              (result, index, self) =>
                index === self.findIndex((r) => r.shopId === result.shopId)
            )
            .sort((a, b) => {
              const aTime = latestMessages[a.id]?.created_time?.seconds || 0;
              const bTime = latestMessages[b.id]?.created_time?.seconds || 0;
              return bTime - aTime;
            })
            .map((result, index) => {
              let urlParam = "";
              if (result.type === "member") {
                urlParam = "member";
              } else if (result.type === "order") {
                urlParam = "order";
              } else if (result.type === "product") {
                urlParam = "product";
              }

              return (
                <Link
                  to={`/chat?${urlParam}`}
                  key={result.id}
                  className={`w-full py-4 flex items-center border-t border-gray-300 cursor-pointer ${
                    index === state.results.length - 1
                      ? "border-b border-gray-300"
                      : ""
                  }`}
                >
                  <img
                    className="w-large h-large rounded-full"
                    src={momoLogo}
                  ></img>

                  <div className="flex ml-4 flex-col py-2 justify-between w-full h-large">
                    <div className="flex justify-between items-center">
                      <h2 className="text-base font-bold text-primary leading-normal w-messageContent h-6 line-clamp-1">
                        {result.shopName}
                      </h2>
                      <p className="text-xs text-gray-500 leading-normal">
                        {latestMessages[result.id]?.created_time
                          ? new Date(
                              latestMessages[result.id].created_time.seconds *
                                1000
                            ).toLocaleDateString("zh-TW", {
                              month: "2-digit",
                              day: "2-digit",
                            })
                          : " "}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-500 leading-normal w-messageContent h-6 line-clamp-1">
                        {latestMessages[result.id]?.content || ""}
                      </p>
                      {latestMessages[result.id] && result.unreadCount > 0 && (
                        <div className="bg-primary-800 text-black-0 text-base w-6 h-6 rounded-full flex items-center justify-center ml-2">
                          {result.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
        {state.isSearching && state.results.length === 0 && (
          <p className="text-base leading-normal text-black text-center">
            找不到您搜尋的內容
          </p>
        )}
        {state.isSearching &&
          state.results
            .filter((result) => result.collectionName === "chatroom")
            .sort((a, b) => {
              const aTime = latestMessages[a.id]?.created_time?.seconds || 0;
              const bTime = latestMessages[b.id]?.created_time?.seconds || 0;
              return bTime - aTime;
            })
            .map((result, index) => {
              let urlParam = `member=${result.id}`;
              if (result.type === "member") {
                urlParam = `member=${result.id}`;
              } else if (result.type === "order") {
                urlParam = `member=${result.id}&order=${result.myOrderNumber}`;
              } else if (result.type === "product") {
                urlParam = `member=${result.id}&product=${result.myProductNumber}`;
              }

              return (
                <Link
                  to={`/chat?${urlParam}`}
                  key={result.id}
                  className={`w-full py-4 flex items-center border-t border-gray-300 cursor-pointer ${
                    index === state.results.length - 1
                      ? "border-b border-gray-300"
                      : ""
                  }`}
                >
                  <img
                    className="w-large h-large rounded-full"
                    src={momoLogo}
                  ></img>

                  <div className="flex ml-4 flex-col py-2 justify-between w-full h-large">
                    <div className="flex justify-between items-center">
                      <h2 className="text-base font-bold text-primary leading-normal w-messageContent h-6 line-clamp-1">
                        {result.shopName}
                      </h2>
                      <p className="text-xs text-gray-500 leading-normal">
                        {latestMessages[result.id]?.created_time
                          ? new Date(
                              latestMessages[result.id].created_time.seconds *
                                1000
                            ).toLocaleDateString("zh-TW", {
                              month: "2-digit",
                              day: "2-digit",
                            })
                          : " "}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-500 leading-normal w-messageContent h-6 line-clamp-1">
                        {latestMessages[result.id]?.content || ""}
                      </p>
                      {latestMessages[result.id] && result.unreadCount > 0 && (
                        <div className="bg-primary-800 text-black-0 text-base w-6 h-6 rounded-full flex items-center justify-center ml-2">
                          {result.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
};

export default SearchPages;

const fetchAllChatrooms = async () => {
  let results = [];
  const chatroomSnapshot = await getDocs(collection(db, "chatroom"));
  for (const doc of chatroomSnapshot.docs) {
    let data = { id: doc.id, ...doc.data(), collectionName: "chatroom" };
    results.push(data);
  }
  return results;
};

const searchFirestore = async (searchTerm) => {
  let results = [];

  const chatroomQuery = query(
    collection(db, "chatroom"),
    where("shopName", "==", searchTerm)
  );
  const chatroomSnapshot = await getDocs(chatroomQuery);
  for (const doc of chatroomSnapshot.docs) {
    let data = {
      id: doc.id,
      ...doc.data(),
      collectionName: "chatroom",
      type: "member",
    };
    results.push(data);
  }

  const ordersQuery = query(
    collection(db, "orders"),
    where("orderNumber", "==", searchTerm)
  );
  const ordersSnapshot = await getDocs(ordersQuery);
  for (const doc of ordersSnapshot.docs) {
    const orderData = doc.data();
    const shopId = orderData.shopId;
    const myOrderNumber = orderData.orderNumber;

    const chatroomByShopIdQuery = query(
      collection(db, "chatroom"),
      where("shopId", "==", shopId)
    );
    const chatroomByShopIdSnapshot = await getDocs(chatroomByShopIdQuery);
    for (const chatroomDoc of chatroomByShopIdSnapshot.docs) {
      let data = {
        id: chatroomDoc.id,
        ...chatroomDoc.data(),
        collectionName: "chatroom",
        type: "order",
        myOrderNumber,
      };
      results.push(data);
    }
  }

  const shopsSnapshot = await getDocs(collection(db, "shops"));
  for (const shopDoc of shopsSnapshot.docs) {
    const shopIdentifier = shopDoc.id;
    const productsRef = collection(db, `shops/${shopIdentifier}/products`);
    const productsQuery = query(
      productsRef,
      where("productName", "==", searchTerm)
    );
    const productsSnapshot = await getDocs(productsQuery);

    if (!productsSnapshot.empty) {
      const shopData = shopDoc.data();
      const shopId = shopData.shopId;
      const productData = productsSnapshot.docs[0].data();
      const myProductNumber = productData.productNumber;

      const chatroomByShopIdQuery = query(
        collection(db, "chatroom"),
        where("shopId", "==", shopId)
      );
      const chatroomByShopIdSnapshot = await getDocs(chatroomByShopIdQuery);
      for (const chatroomDoc of chatroomByShopIdSnapshot.docs) {
        let data = {
          id: chatroomDoc.id,
          ...chatroomDoc.data(),
          collectionName: "chatroom",
          type: "product",
          myProductNumber,
        };
        results.push(data);
      }
    }
  }

  return results;
};
