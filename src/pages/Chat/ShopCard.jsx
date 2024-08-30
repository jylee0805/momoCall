import { ChatContext } from "../../chatContext";
import { useContext } from "react";
import happy from "../img/happy.png";

function ShopCard() {
  const { state, renderState } = useContext(ChatContext);

  return (
    <div className={`w-full product bg-white ${renderState.showShopInfo && !renderState.showOrderInfo ? "flex" : "hidden"} justify-center gap-6 py-2 mt-[68px] items-center`}>
      <img src={happy} alt="camera" className="w-20 rounded-full" />
      <div className="w4/6 my-2 flex flex-col py-2 justify-between">
        <h4 className="w-fit text-base font-bold leading-normal line-clamp-1">{state.shopName || "商家名稱未找到"}</h4>
        <p className="text-base leading-normal text-secondary">momoCall 回應率：100%</p>
      </div>
    </div>
  );
}
export default ShopCard;
