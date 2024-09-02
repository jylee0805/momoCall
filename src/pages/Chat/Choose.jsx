import { ChatContext, ChatDispatchContext } from "../../chatContextProvider";
import { useContext } from "react";

function Choose() {
  const { state, renderState } = useContext(ChatContext);
  const { dispatch, renderDispatch } = useContext(ChatDispatchContext);

  return (
    <div className={`${renderState.isChoose ? "flex" : "hidden"} justify-center items-center bg-black-800/80 w-container h-full fixed top-0 z-10`}>
      <div className="w-64 h-60 bg-white mx-auto py-2 px-4 flex flex-col gap-3 text-sm rounded-xl">
        <h4 className="text-center font-bold leading-normal text-base text-primary-800">請選擇規格數量</h4>
        <div className="bg-black-0 p-1 rounded-t-large flex justify-center items-center">
          <img src={state.productInfo?.image} alt="product-image" className="w-small h-small rounded-lg mr-3" />
          <div className="flex flex-col justify-between">
            <p className="text-xs leading-normal">{state.productInfo?.productNumber}</p>
            <p className="text-xs leading-normal font-bold line-clamp-1">{state.productInfo?.productName || "商品名稱未找到"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-around items-center">
            <label htmlFor="spec">規格</label>
            <select name="spec" id="spec" className="w-2/4 border-1 border-black-600 rounded-md text-center" onChange={(e) => dispatch({ type: "SELECT_SPEC", payload: e.target.value })}>
              <option value="yellow">{state.productInfo?.spec}</option>
            </select>
          </div>
          <div className="flex justify-around items-center ">
            <label htmlFor="number">數量</label>
            <div className="flex justify-around w-2/4 border-1 border-black-600 rounded-md">
              <button onClick={() => dispatch({ type: "SUB_PRODUCT_NUM" })}>-</button>
              <p className="leading-normal">{state.count}</p>
              <button onClick={() => dispatch({ type: "ADD_PRODUCT_NUM" })}>+</button>
            </div>
          </div>
          <div className="flex justify-around items-center">
            <p>總金額：</p>
            <p className="text-black-600 w-2/4 text-center">${state.productInfo?.price * state.count}</p>
          </div>
        </div>
        <div className="flex justify-around items-center">
          <button className="block w-full h-8" onClick={() => renderDispatch({ type: "TO_PURCHASE" })}>
            取消
          </button>
          <button onClick={() => renderDispatch({ type: "TO_CHECKOUT" })} className="text-primary-800 font-bold block w-full h-8">
            下一步
          </button>
        </div>
      </div>
    </div>
  );
}
export default Choose;
