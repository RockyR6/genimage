import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const navigate = useNavigate();
  const [credit, setCredit] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  

  const loadCreditsData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/credits", {
        headers: { token },
      });

      if (data.success) {
        setCredit(data.credits);
        setUser(data.user);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

 const generateImage = async (prompt) => {
  try {

    const { data } = await axios.post(
      backendUrl + "/api/image/generate-image",
      {
        prompt,
        userId: user._id,
      },
      { headers: { token } }
    );

    if (data.success) {
      loadCreditsData();
      return data.resultImage;
    }
  } catch (error) {
    console.log(error);

    if (error.response && error.response.data) {
      const { message, creditBalance } = error.response.data;

      toast.error(message || "Something went wrong");
      if (creditBalance === 0) {
        navigate("/buy");
      }
    } else {
      toast.error("Something went wrong.");
    }

    return null;
  }
};


  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      loadCreditsData();
    }
  }, [token]);

  const value = {
    user,
    setUser,
    showLogin,
    setShowLogin,
    backendUrl,
    token,
    setToken,
    credit,
    setCredit,
    loadCreditsData,
    logout,
    generateImage,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
