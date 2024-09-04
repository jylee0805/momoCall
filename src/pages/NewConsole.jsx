import { Link } from "react-router-dom";
import { FiLogOut, FiPenTool, FiPlus, FiX } from "react-icons/fi";
import { useEffect, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../utils/firebase";
import { collection, getDocs, updateDoc, addDoc, deleteDoc, doc, orderBy, query } from "../utils/firebase";

const initialState = {
  currentFaqId: null,
  inputValue: "",
  textareaValue: "",
  faqs: [],
  searchTerm: "",
  isEditMode: false,
};
function reducer(state, action) {
  switch (action.type) {
    case "SET_INPUT_VALUE":
      return { ...state, inputValue: action.payload };
    case "SET_TEXTAREA_VALUE":
      return { ...state, textareaValue: action.payload };
    case "SET_FAQS":
      return { ...state, faqs: action.payload };
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "EDIT":
      return {
        ...state,
        inputValue: action.payload.input,
        textareaValue: action.payload.textarea,
        isEditMode: true,
        isSelectKeyWord: !state.isSelectKeyWord,
        currentFaqId: action.payload.id,
      };
    case "RESET":
      return { ...state, inputValue: "", textareaValue: "", isEditMode: false, currentFaqId: null };
    default:
      return state;
  }
}
function Console() {
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
    <div className="w-full max-w-screen h-screen m-[auto] bg-white flex flex-col p-3 pt-0 font-sans relative">
      <header className="flex items-center py-4">
        <button className="mr-3" onClick={logout}>
          <FiLogOut className="w-6 h-6 transform -scale-x-100" />
        </button>

        <Link to="/" className="flex-grow ">
          <h1 className="text-2xl leading-normal font-bold text-primary text-center">momoCallback</h1>
        </Link>
      </header>

      <div className="flex-grow bg-black-200 p-3 rounded-t-lg flex  ">
        <div>
          <div className="relative mb-4 ">
            <input
              type="text"
              placeholder="請輸入提問關鍵字"
              className="block w-60 leading-normal mx-auto mt-1 py-[5.5px] text-sm text-black-100 text-center bg-white placeholder-black-600 rounded-full  focus:outline outline-black-600 "
              value={state.searchTerm}
              onChange={handleSearch}
            />
            {state.searchTerm && <FiX className="absolute right-9 top-1/2 transform -translate-y-1/2 cursor-pointer" onClick={clearSearch} />}
          </div>
          <div className="overflow-scroll h-[calc(100vh-150px)] space-y-5 w-72 overflow-x-hidden ">
            {state.searchTerm && filteredFaqs.length === 0 && <p className="text-black text-base leading-normal text-center">查無相關問答</p>}
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className="w-fit mx-auto">
                <div
                  className={`w-60  rounded-lg py-2 px-4 flex justify-center items-center cursor-pointer ${faq.id === state.currentFaqId ? "bg-primary-800" : "bg-primary-600"}`}
                  onClick={() => handleEdit(faq.id, faq.keyword, faq.response)}
                >
                  <p className={`${faq.id === state.currentFaqId ? "text-white" : "text-black"} text-base leading-normal`}>{faq.keyword}</p>
                  {/* 
                  <button className="cursor-pointer " onClick={() => handleEdit(faq.id, faq.keyword, faq.response)}>
                    <FiPenTool className="w-6 h-6 hover:text-primary" />
                  </button> 
                  */}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className=" flex flex-col w-full px-5 gap-3">
          <div className="flex justify-between items-center">
            <p className="text-xl leading-normal font-bold">{state.isEditMode ? "修改問答" : "新增問答"}</p>
            <button className=" py-2 px-4 rounded-lg flex items-center cursor-pointer hover:bg-black-400" onClick={() => dispatch({ type: "RESET" })}>
              <FiPlus className="w-6 h-6 mr-1" />
              <p className="text-base leading-normal font-bold">新增問答</p>
            </button>
          </div>
          <input
            type="text"
            aria-label="請輸入提問關鍵字"
            placeholder="請輸入提問關鍵字"
            className="py-2 px-3 rounded-lg"
            value={state.inputValue}
            onChange={(e) => dispatch({ type: "SET_INPUT_VALUE", payload: e.target.value })}
          />
          <textarea
            type="text"
            aria-label="請輸入回覆內容"
            placeholder="請輸入回覆內容"
            value={state.textareaValue}
            className="rounded-lg flex-grow  py-2 px-3 resize-none text-justify"
            onChange={(e) => dispatch({ type: "SET_TEXTAREA_VALUE", payload: e.target.value })}
          />
          <div className="flex gap-1">
            <button
              className={`flex-1 text-xs leading-normal text-black-0 py-3 px-2 rounded-md bg-primary ml-auto outline-none hover:bg-primary focus:outline focus:outline-1 focus:outline-primary focus:outline-offset-0 ${
                state.isEditMode ? "block" : "hidden"
              }`}
              onClick={() => {
                deleteFaq(state.currentFaqId);
                dispatch({ type: "RESET" });
              }}
            >
              {state.isEditMode ? "刪除問答" : ""}
            </button>
            <button
              className={`flex-1 text-xs leading-normal text-black-0 py-3 px-2 rounded-md bg-primary-800 outline-none hover:bg-primary focus:outline focus:outline-1 focus:outline-primary focus:outline-offset-0 ${
                state.isEditMode ? "" : "ml-auto"
              }`}
              onClick={handleSubmit}
            >
              {state.isEditMode ? "確認修改" : "確認新增"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Console;
