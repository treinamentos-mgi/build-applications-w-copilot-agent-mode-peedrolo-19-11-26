import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

const activityLabels: Record<string, string> = {
  run: 'Corrida',
  cycle: 'Ciclismo',
  walk: 'Caminhada',
  strength: 'Força',
};

const loadActivities = async () => {
  const { activities } = await getJson<{ activities: Activity[] }>('/api/activities');
  return activities;
};

export default function Activities() {
  return (
    <CapabilityCard
      title="Atividades"
      description="Acompanhe os minutos de atividade e os pontos das pessoas participantes."
      emptyText="Sem atividades registradas."
      load={loadActivities}
      renderItem={(activity) => (
        <>
          <strong>{activityLabels[activity.type] ?? 'Atividade'}</strong>
          <span> — {activity.minutes} min — {activity.points} pontos</span>
        </>
      )}
    />
  );
}
