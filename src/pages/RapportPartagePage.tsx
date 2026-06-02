import { useParams } from 'react-router-dom';
import RapportPage from './RapportPage';

export default function RapportPartagePage() {
  const { token } = useParams<{ token: string }>();

  // On passe le token directement à RapportPage (pas de bricolage d'URL).
  // Évite la "course" au chargement qui affichait "Rapport introuvable" au 1er affichage.
  return <RapportPage shareTokenOverride={token} />;
}
