import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import FacePage from "@/pages/FacePage";
import SentimentPage from "@/pages/SentimentPage";
import ChatbotPage from "@/pages/ChatbotPage";
import ProductPage from "@/pages/ProductPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/face" element={<FacePage />} />
            <Route path="/sentiment" element={<SentimentPage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/products" element={<ProductPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors theme="dark" position="top-right" />
    </div>
  );
}

export default App;
