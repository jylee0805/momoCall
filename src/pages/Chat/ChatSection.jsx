import { ChatContext } from "../../chatContextProvider";
import { useContext } from "react";
import PropTypes from "prop-types";
import happy from "../../images/happy.png";
import MessageBox from "./MessageBox";
import ProductCard from "./ProductCard";
import { FiAlertTriangle } from "react-icons/fi";
import loading from "../../images/loading.gif";
import beenEater from "../../images/beenEater.gif";

function ChatSection({ productNumber, imageFormats, shopId }) {
  const { renderState } = useContext(ChatContext);

  return (
    <div className={`px-3 py-4 space-y-4 ${renderState.divHeightClass} mb-[56px] min-h-screen`}>
      <div className="bg-accent flex justify-center items-center h-8 px-6 rounded-large mt-44 ">
        <FiAlertTriangle className="w-notice h-notice mr-4" />
        <p className="text-sm leading-normal">提醒您，請勿透露個人資料</p>
      </div>

      <ProductCard productNumber={productNumber} />

      <MessageBox imageFormats={imageFormats} shopId={shopId} />

      <div className={`items-center flex gap-3 ${renderState.isImageLoading ? "flex flex-row-reverse" : renderState.isGPTLoading ? "flex" : "hidden"}`}>
        <img src={happy} alt="" className="w-9 h-9" />
        <img src={beenEater} alt="" className="w-14 h-14" />
        <img src={loading} alt="" className="-ml-7" />
      </div>
    </div>
  );
}

ChatSection.propTypes = {
  productNumber: PropTypes.number,
  imageFormats: PropTypes.array.isRequired,
};

export default ChatSection;
