import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function HomePage() {
  const [message, setMessage] = useState('Loading concierge status...');

  useEffect(() => {
    api.get('/status/')
      .then((response) => setMessage(response.data.message))
      .catch(() => setMessage('Unable to reach backend.'));
  }, []);

  return (
    <section className="home-page">
      <div className="container card">
        <h2>Welcome to Copper Dome Concierge</h2>
        <p>{message}</p>
      </div>
    </section>
  );
}
