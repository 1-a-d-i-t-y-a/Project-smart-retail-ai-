import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet, useLocation } from "react-router-dom";

const titles = {
  "/": { title: "Overview", subtitle: "Real-time customer intelligence" },
  "/face": { title: "Face Recognition", subtitle: "Recognise returning customers via webcam" },
  "/sentiment": { title: "Sentiment", subtitle: "Analyse feedback tone at scale" },
  "/chatbot": { title: "FAQ Chatbot", subtitle: "Hybrid rules + AI fallback" },
  "/products": { title: "Product Classifier", subtitle: "Image-based category detection" },
};

export default function AppLayout() {
  const loc = useLocation();
  const meta = titles[loc.pathname] || { title: "Retail/IQ", subtitle: "" };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grain-overlay">
      <Sidebar />
      <div className="pl-64">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="px-8 py-6 max-w-[1600px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
