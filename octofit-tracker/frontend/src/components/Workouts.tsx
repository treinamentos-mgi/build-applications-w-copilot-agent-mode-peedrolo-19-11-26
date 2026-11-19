import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

const focusLabels: Record<string, string> = {
  endurance: 'resistência',
  strength: 'força',
  mobility: 'mobilidade',
};

const difficultyLabels: Record<string, string> = {
  easy: 'fácil',
  moderate: 'moderada',
  hard: 'difícil',
};

const loadSuggestions = async () => {
  const email = encodeURIComponent('mona@example.com');
  const { suggestions } = await getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${email}`);
  return suggestions;
};

export default function Workouts() {
  return (
    <CapabilityCard
      title="Sugestões de treino"
      description="Receba recomendações de treino com base nos seus padrões de atividade."
      emptyText="Sem sugestões de treino disponíveis."
      load={loadSuggestions}
      renderItem={(suggestion) => (
        <>
          <strong>{suggestion.title}</strong>
          {suggestion.focus && <span> — Foco: {focusLabels[suggestion.focus] ?? 'condicionamento'}</span>}
          {suggestion.minutes !== undefined && <span> — {suggestion.minutes} min</span>}
          {suggestion.difficulty && <span> — Dificuldade: {difficultyLabels[suggestion.difficulty] ?? 'variada'}</span>}
          {suggestion.reason && <p className="mb-0">{suggestion.reason}</p>}
        </>
      )}
    />
  );
}
