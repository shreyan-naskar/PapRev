import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Navbar } from "./components/shared/Navbar";
import { UploadPage } from "./pages/Upload";
import { ReviewPage } from "./pages/Review";
import { DashboardPage } from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <div className="page-shell app-shell">
        <Navbar />
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/review/:paperId/:jobId" element={<ReviewPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
