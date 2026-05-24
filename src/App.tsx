import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-center" toastOptions={{ style: { background: '#1f2937', color: '#fff', fontSize: 14, borderRadius: 12, padding: '10px 16px' }, success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } } }} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
