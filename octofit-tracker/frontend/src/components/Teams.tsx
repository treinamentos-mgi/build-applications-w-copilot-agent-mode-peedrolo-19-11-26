import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot?: string; members?: string[] };

const loadTeams = async () => {
  const { teams } = await getJson<{ teams: Team[] }>('/api/teams');
  return teams;
};

export default function Teams() {
  return (
    <CapabilityCard
      title="Equipes"
      description="Gerencie equipes e integrantes."
      emptyText="Sem equipes cadastradas."
      load={loadTeams}
      renderItem={(team) => (
        <>
          <strong>{team.name}</strong>
          {team.mascot && <span> — Mascote: {team.mascot}</span>}
          <span> — Integrantes: {team.members?.length ?? 0}</span>
        </>
      )}
    />
  );
}
