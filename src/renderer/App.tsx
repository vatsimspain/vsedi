import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Wizard from './Wizard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Wizard />} />
      </Routes>
    </Router>
  );
}
