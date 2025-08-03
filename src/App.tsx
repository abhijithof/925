import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import FormPage from './components/FormPage';
import RatePage from './components/RatePage';
import ThankYouPage from './components/ThankYouPage';
import AdminPage from './admin/AdminPage';
import SystemReadyPopup from './components/SystemReadyPopup';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen">
          <SystemReadyPopup 
            message="System is ready for evaluation! 🚀"
            type="success"
            autoDismiss={true}
            dismissTime={8000}
          />
          <Routes>
            <Route path="/" element={<FormPage />} />
            <Route path="/rate" element={<RatePage />} />
            <Route path="/thankyou" element={<ThankYouPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;