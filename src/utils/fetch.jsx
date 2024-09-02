import { db, collection, query, where, getDocs, doc, addDoc, serverTimestamp } from "../utils/firebase";

export const fetchShopInfo = async (shopId, orderNumber, productNumber, dispatch, renderDispatch) => {
  try {
    const shopQuery = query(collection(db, "shops"), where("shopId", "==", shopId));
    const shopSnapshot = await getDocs(shopQuery);

    if (!shopSnapshot.empty) {
      const shopDoc = shopSnapshot.docs[0];
      const shopDocId = shopDoc.id;
      const shopName = shopDoc.data().shopName;

      dispatch({ type: "SET_SHOP_NAME", payload: shopName });

      if (orderNumber) {
        const ordersCollectionRef = collection(db, "orders");
        const orderQuery = query(ordersCollectionRef, where("shopId", "==", shopId), where("orderNumber", "==", orderNumber));
        const querySnapshot = await getDocs(orderQuery);

        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          dispatch({ type: "SET_ORDER_INFO", payload: orderDoc.data() });
        } else {
          console.log("No matching order found!");
        }
      } else if (productNumber) {
        const productsCollectionRef = collection(doc(db, "shops", shopDocId), "products");
        const productQuery = query(productsCollectionRef, where("productNumber", "==", productNumber));
        const productSnapshot = await getDocs(productQuery);

        if (!productSnapshot.empty) {
          const productDoc = productSnapshot.docs[0];
          dispatch({ type: "SET_PRODUCT_INFO", payload: productDoc.data() });
        } else {
          console.log("No matching product found!");
          dispatch({ type: "SET_PRODUCT_INFO", payload: null });
        }
      } else {
        const productsCollectionRef = collection(doc(db, "shops", shopDocId), "products");
        const productSnapshot = await getDocs(productsCollectionRef);
        const productList = productSnapshot.docs.map((doc) => doc.data());
        const randomIndex = Math.floor(Math.random() * productList.length);
        const productDoc = productSnapshot.docs[randomIndex];
        dispatch({ type: "SET_PRODUCT_INFO", payload: productDoc.data() });
      }

      renderDispatch({ type: "TOGGLE_SHOP_INFO", payload: true });
    } else {
      console.log("No matching shop found for the given shopId!");
      dispatch({ type: "SET_SHOP_NAME", payload: "商家名稱未找到" });
      renderDispatch({ type: "TOGGLE_SHOP_INFO", payload: true });
    }
  } catch (error) {
    console.error("Error fetching shop documents:", error);
  }
};

export const fetchGPT = async (inputText, document, shopId) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const shopQuery = query(collection(db, "shops"), where("shopId", "==", shopId));
  const shopSnapshot = await getDocs(shopQuery);
  const shopDoc = shopSnapshot.docs[0];
  const shopName = shopDoc.data().shopName;
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: `你是一個全程使用繁體中文並且非常人性化回覆「已登入」的使用者提問MOMO電商${shopName}客服相關問題的富邦媒體電商客服人員`,
          },
          {
            role: "user",
            content: inputText,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (res.ok) {
      const data = await res.json();

      await addDoc(document, {
        content: data.choices[0].message.content,
        created_time: serverTimestamp(),
        from: "shop",
        isUseful: "",
      });
    } else if (res.status === 429) {
      console.error("Too many requests. Please try again later.");
    } else {
      console.log(res.json());
      console.error("Error:", res.status, res.statusText);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
};
