import { ChatContext, ChatDispatchContext } from "../../chatContextProvider";
import { useContext } from "react";
import PropTypes from "prop-types";
import { db, collection } from "../../utils/firebase";

function Order({ addMessage, shopId }) {
  const { renderState } = useContext(ChatContext);
  const { renderDispatch } = useContext(ChatDispatchContext);
  const messagesCollectionRef = collection(db, "chatroom", shopId, "messages");

  return (
    <div className={`${renderState.isCheckout ? "flex" : "hidden"} justify-center items-center w-container h-full fixed top-0 bg-black-800/80`}>
      <div className="w-64 h-32 bg-white mx-auto py-2 px-4 flex flex-col gap-3 text-sm rounded-xl">
        <h4 className="text-center font-bold leading-normal text-lg text-primary-800 mt-2">付款成功，即將為您出貨</h4>
        <p className="text-center font-bold">訂單編號：20240827000001</p>

        <button
          onClick={async () => {
            await addMessage(messagesCollectionRef, `謝謝您的購買，您的訂單將會盡速為您出貨`, "shop");

            renderDispatch({ type: "FINISH_CHECKOUT" });
          }}
          className="block w-full h-8 text-primary-800 font-bold "
        >
          確認
        </button>
      </div>
    </div>
  );
}

Order.propTypes = {
  addMessage: PropTypes.func.isRequired,
  shopId: PropTypes.string.isRequired,
};

export default Order;
