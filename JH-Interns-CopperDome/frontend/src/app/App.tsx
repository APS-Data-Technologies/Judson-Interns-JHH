import { Routes, Route } from 'react-router-dom';
import Header from '../components/Header';
import HomePage from '../features/home/HomePage';

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}
