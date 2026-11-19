import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamScore = { teamName: string; totalPoints: number; rank: number };

const loadLeaderboard = async () => {
  const { leaderboard } = await getJson<{ leaderboard: TeamScore[] }>('/api/leaderboard');
  return leaderboard;
};

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Placar"
      description="Compare a pontuação total das equipes."
      emptyText="Sem classificação disponível."
      load={loadLeaderboard}
      renderItem={(team) => (
        <>
          Posição {team.rank}: <strong>{team.teamName}</strong> — {team.totalPoints} pontos
        </>
      )}
    />
  );
}
