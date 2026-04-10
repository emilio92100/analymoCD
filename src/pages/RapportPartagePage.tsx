import { useParams } from 'react-router-dom';
import RapportPage from './RapportPage';
import { useEffect } from 'react';

export default function RapportPartagePage() {
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    // Pas de vérification auth pour les rapports partagés
  }, []);

  // On passe le token via searchParams pour réutiliser RapportPage
  useEffect(() => {
    if (token) {
      const url = new URL(window.location.href);
      url.searchParams.set('token', token);
      window.history.replaceState(null, '', url.toString());
    }
  }, [token]);

  return <RapportPage />;
}
