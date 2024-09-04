import { Link } from "react-router-dom";
import { FiLogOut, FiPenTool, FiPlus, FiX } from "react-icons/fi";
import { useRef, useEffect, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../utils/firebase";
import { collection, getDocs, updateDoc, addDoc, deleteDoc, doc, orderBy, query } from "../utils/firebase";

const initialState = {
  openId: null,
  currentFaqId: null,
  inputValue: "",
  textareaValue: "",
  faqs: [],
  searchTerm: "",
  isModalOpen: false,
  isEditMode: false,
};
function reducer(state, action) {
  switch (action.type) {
    case "SET_OPEN_ID":
      return { ...state, openId: action.payload };

    case "SET_INPUT_VALUE":
      return { ...state, inputValue: action.payload };
    case "SET_TEXTAREA_VALUE":
      return { ...state, textareaValue: action.payload };
    case "SET_FAQS":
      return { ...state, faqs: action.payload };
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "TOGGLE_MODAL":
      return { ...state, inputValue: action.payload.input, textareaValue: action.payload.textarea, isEditMode: action.payload.editMode, isModalOpen: action.payload.open };

    case "EDIT":
      return { ...state, inputValue: action.payload.input, textareaValue: action.payload.textarea, isEditMode: true, isModalOpen: true, currentFaqId: action.payload.id };
    case "RESET":
      return { ...state, inputValue: "", textareaValue: "", isEditMode: false, isModalOpen: false, currentFaqId: null };
    default:
      return state;
  }
}
function Console() {
  const textareaRef = useRef(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, "faq"), orderBy("updatedTime", "desc"));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const faqList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          keyword: doc.data().keyword,
          response: doc.data().response,
          updatedTime: doc.data().updatedTime,
        }));
        dispatch({ type: "SET_FAQS", payload: faqList });
      } else {
        console.log("No data");
      }
    };
    fetchData();
  }, []);

  const toggleCollapse = (id) => {
    dispatch({ type: "SET_OPEN_ID", payload: state.openId === id ? null : id });
  };

  const handleTextareaInput = () => {
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const toggleModal = (input = "", textarea = "", editMode = false) => {
    dispatch({ type: "TOGGLE_MODAL", payload: { input, textarea, editMode, open: !state.isModalOpen } });
  };

  const addFaq = async (keyword, response) => {
    try {
      const docRef = await addDoc(collection(db, "faq"), { keyword, response, updatedTime: new Date() });
      console.log("Document written with ID: ", docRef.id);
      const newFaqs = [...state.faqs, { id: docRef.id, keyword, response, updatedTime: new Date() }];

      dispatch({ type: "SET_FAQS", payload: newFaqs.sort((a, b) => b.updatedTime - a.updatedTime) });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const updateFaq = async (id, keyword, response) => {
    try {
      const faqDoc = doc(db, "faq", id);
      await updateDoc(faqDoc, { keyword, response, updatedTime: new Date() });
      console.log("Document updated with ID: ", id);
      const updatedFaqs = state.faqs.map((faq) => (faq.id === id ? { id, keyword, response, updatedTime: new Date() } : faq));

      dispatch({ type: "SET_FAQS", payload: updatedFaqs.sort((a, b) => b.updatedTime - a.updatedTime) });
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  const deleteFaq = async (id) => {
    try {
      const faqDoc = doc(db, "faq", id);
      await deleteDoc(faqDoc);
      console.log("Document deleted with ID: ", id);
      dispatch({ type: "SET_FAQS", payload: state.faqs.filter((faq) => faq.id !== id) });
    } catch (e) {
      console.error("Error deleting document: ", e);
    }
  };

  const handleSubmit = () => {
    if (state.inputValue && state.textareaValue) {
      if (state.isEditMode) {
        updateFaq(state.currentFaqId, state.inputValue, state.textareaValue);
      } else {
        addFaq(state.inputValue, state.textareaValue);
      }
      dispatch({ type: "RESET" });
    } else {
      alert("請填寫所有欄位");
    }
  };

  const handleEdit = (id, keyword, response) => {
    dispatch({ type: "EDIT", payload: { input: keyword, textarea: response, id: id } });
  };

  const handleSearch = (e) => {
    dispatch({ type: "SET_SEARCH_TERM", payload: e.target.value });
  };

  const clearSearch = () => {
    dispatch({ type: "SET_SEARCH_TERM", payload: "" });
  };
  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const filteredFaqs = state.faqs.filter((faq) => faq.keyword.includes(state.searchTerm) || faq.response.includes(state.searchTerm));

  return (
    <div className="w-container max-w-screen h-screen m-[auto] bg-white flex flex-col p-3 pt-0 font-sans relative">
      <header className="flex items-center py-4">
        <button className="mr-3" onClick={logout}>
          <FiLogOut className="w-6 h-6 transform -scale-x-100" />
        </button>

        <Link to="/">
          <h1 className="text-2xl leading-normal font-bold text-primary ml-12">momoCallback</h1>
        </Link>
      </header>
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="請輸入提問關鍵字"
          className="leading-normal w-full py-[5.5px] text-sm text-black-100 text-center bg-black-200 placeholder-black-600 rounded-full hover:bg-black-200 focus:outline outline-black-600 focus:bg-black-200"
          value={state.searchTerm}
          onChange={handleSearch}
        />
        {state.searchTerm && <FiX className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={clearSearch} />}
      </div>
      <div className="flex-grow overflow-scroll bg-black-200 p-3 rounded-t-lg">
        <div className="space-y-5">
          {state.searchTerm && filteredFaqs.length === 0 && <p className="text-black text-base leading-normal text-center">查無相關問答</p>}
          {filteredFaqs.map((faq, index) => (
            <div key={faq.id}>
              <div className="bg-primary-600 rounded-lg py-2 px-4 flex justify-between items-center cursor-pointer" onClick={() => toggleCollapse(index)}>
                <p className="text-black text-base leading-normal">{faq.keyword}</p>
                <button className="cursor-pointer" onClick={() => handleEdit(faq.id, faq.keyword, faq.response)}>
                  <FiPenTool className="w-6 h-6 hover:text-primary" />
                </button>
              </div>
              <div className={`bg-black-0 rounded-lg px-4 transition-max-height duration-300 ease-in overflow-hidden ${state.openId === index ? "max-h-screen py-2 mt-2" : "max-h-0"}`}>
                <p className="text-black text-base leading-normal">{faq.response}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-black-200 rounded-b-lg py-3 px-3">
        <button className="w-full py-2 px-4 rounded-lg flex items-center cursor-pointer hover:bg-black-400" onClick={() => toggleModal()}>
          <FiPlus className="w-6 h-6 mr-1" />
          <p className="text-base leading-normal font-bold">新增問答</p>
        </button>
      </div>
      {state.isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
          <div className="bg-black-0 rounded-lg w-[319px] h-fit py-3 px-4 space-y-2 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="flex justify-between items-center">
              <p className="text-base leading-normal">{state.isEditMode ? "修改問答" : "新增問答"}</p>
              <FiX className="w-6 h-6 text-black hover:text-red-600 cursor-pointer" onClick={toggleModal} />
            </div>
            <input
              type="text"
              aria-label="請輸入提問關鍵字"
              placeholder="請輸入提問關鍵字"
              className="text-sm leading-normal w-full bg-black-200 border border-black-600 rounded-md py-1 px-3 focus:bg-black-0 focus:border-primary"
              value={state.inputValue}
              onChange={(e) => dispatch({ type: "SET_INPUT_VALUE", payload: e.target.value })}
            />
            <textarea
              ref={textareaRef}
              name="replyContent"
              id="replyContent"
              aria-label="請輸入回覆內容"
              placeholder="請輸入回覆內容"
              className="text-sm leading-normal w-full h-[84px] bg-black-200 border border-black-600 rounded-md py-1 px-3 focus:bg-black-0 focus:border-primary"
              onInput={handleTextareaInput}
              value={state.textareaValue}
              onChange={(e) => dispatch({ type: "SET_TEXTAREA_VALUE", payload: e.target.value })}
              style={{ overflow: "scroll" }}
            ></textarea>
            <div className="flex gap-1">
              <button
                className={`text-xs leading-normal text-black-0 py-1 px-2 rounded-md bg-primary ml-auto outline-none hover:bg-primary focus:outline focus:outline-1 focus:outline-primary focus:outline-offset-0 ${
                  state.isEditMode ? "block" : "hidden"
                }`}
                onClick={() => {
                  deleteFaq(state.currentFaqId);
                  toggleModal();
                }}
              >
                {state.isEditMode ? "刪除問答" : ""}
              </button>
              <button
                className={`text-xs leading-normal text-black-0 py-1 px-2 rounded-md bg-primary-800 outline-none hover:bg-primary focus:outline focus:outline-1 focus:outline-primary focus:outline-offset-0 ${
                  state.isEditMode ? "" : "ml-auto"
                }`}
                onClick={handleSubmit}
              >
                {state.isEditMode ? "確認修改" : "確認新增"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Console;
