import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import { AuthProvider } from "./contexts/AuthContext";
import VideoMeetComponent from "./pages/VideoMeet";
import History from "./pages/history";
import Home from "./pages/home";

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Authentication/> }/>
          <Route path="/home" element={<Home/>} />
          <Route path="history"  element={<History/>}/>
          <Route path="/:url" element={<VideoMeetComponent/> } />
        </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
