import { ChatContext, ChatDispatchContext } from "../../chatContextProvider";
import { useContext } from "react";
import PropTypes from "prop-types";

function Checkout({ checkout }) {
  const { state, renderState } = useContext(ChatContext);
  const { renderDispatch } = useContext(ChatDispatchContext);

  return (
    <div className={`${renderState.isPurchase ? "flex" : "hidden"} justify-center items-center w-container h-full fixed top-0 z-10`}>
      <div className="w-64 h-84 bg-white mx-auto py-2 px-4 flex flex-col gap-4 text-sm rounded-xl">
        <h4 className="text-center font-bold leading-normal text-lg text-primary-800 mt-2">訂單即將送出</h4>
        <p className="text-center font-bold">已確認品項、數量並進行結帳嗎？</p>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <p>產品名稱：</p>
            <p className="text-black-600 line-clamp-1 w-3/5 text-end">{state.productInfo?.productName || "商品名稱未找到"}</p>
          </div>
          <div className="flex justify-between items-center">
            <p>數量：</p>
            <p className="text-black-600">{state.count}</p>
          </div>
          <div className="flex justify-between items-center">
            <p>規格：</p>
            <p className="text-black-600">{state.productInfo?.spec}</p>
          </div>
          <div className="flex justify-between items-center">
            <p>訂單金額：</p>
            <p className="text-black-600">{state.productInfo?.price * state.count || 0}</p>
          </div>
        </div>

        <h4 className="text-center font-bold leading-normal text-base text-primary-800">請輸入付款資訊</h4>
        <div className="flex flex-col gap-5">
          <div className="h-6 border-b-1 border-black-600 " id="card-number"></div>
          <div className="flex gap-4">
            <div className=" h-6 border-b-1 border-black-600 " id="card-expiration-date"></div>
            <div className="h-6 border-b-1 border-black-600 " id="card-ccv"></div>
          </div>
        </div>

        <div className="flex justify-around items-center ">
          <button className="block w-full h-9 text-black-600" onClick={() => renderDispatch({ type: "TO_CHECKOUT" })}>
            上一步
          </button>
          <button onClick={checkout} className="block w-full h-9 text-primary-800 font-bold ">
            確認
          </button>
        </div>
      </div>
    </div>
  );
}

Checkout.propTypes = {
  checkout: PropTypes.func.isRequired,
};

export default Checkout;
