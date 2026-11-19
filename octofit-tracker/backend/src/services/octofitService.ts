import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

const activityFocusByType: Record<string, string> = {
  run: 'endurance',
  cycle: 'endurance',
  walk: 'endurance',
  strength: 'strength',
};

const activityLabelByType: Record<string, string> = {
  run: 'corrida',
  cycle: 'ciclismo',
  walk: 'caminhada',
  strength: 'força',
};

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw httpError(400, `O campo ${field} é obrigatório.`);
  }
  return value;
}

function objectId(value: unknown, field: string) {
  if (typeof value !== 'string' || !/^[\da-f]{24}$/i.test(value) || !Types.ObjectId.isValid(value)) {
    throw httpError(400, `O campo ${field} deve conter um ID válido.`);
  }
  return new Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Os dados da atividade são inválidos.');
  const userId = objectId(input.userId, 'userId');
  const teamId = objectId(input.teamId, 'teamId');
  const type = requiredText(input.type, 'type');
  const minutes = input.minutes;
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'O campo minutes deve ser um número positivo.');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user) throw httpError(404, 'A pessoa informada não foi encontrada.');
  if (!team) throw httpError(404, 'A equipe informada não foi encontrada.');

  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Os dados da equipe são inválidos.');
  const name = requiredText(input.name, 'name');
  const mascot = requiredText(input.mascot, 'mascot');
  const requestedMembers = input.members ?? [];
  if (!Array.isArray(requestedMembers)) {
    throw httpError(400, 'O campo members deve ser uma lista de IDs.');
  }

  const memberIds = [...new Set(requestedMembers.map((memberId) => objectId(memberId, 'members').toString()))];
  const members = memberIds.map((memberId) => new Types.ObjectId(memberId));
  if (members.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== members.length) {
      throw httpError(404, 'Um ou mais integrantes informados não foram encontrados.');
    }
  }

  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const [teams, activityTotals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(activityTotals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map(({ _id, name }) => ({ teamName: name, totalPoints: totalsByTeam.get(_id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('_id fitnessGoal').lean();
  if (!user) throw httpError(404, 'A pessoa informada não foi encontrada.');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1, _id: -1 }).lean();
  const activityFocus = recentActivity ? activityFocusByType[recentActivity.type] : undefined;
  const recentActivityLabel = recentActivity ? activityLabelByType[recentActivity.type] : undefined;
  const preferredFocus = activityFocus ?? user.fitnessGoal;
  let workouts = await Workout.find({ focus: preferredFocus }).sort({ title: 1 }).lean();
  let reason = activityFocus && recentActivityLabel
    ? `Sugestão baseada na sua atividade recente de ${recentActivityLabel}.`
    : `Sugestão baseada na sua meta de ${user.fitnessGoal}.`;

  if (workouts.length === 0 && preferredFocus !== user.fitnessGoal) {
    workouts = await Workout.find({ focus: user.fitnessGoal }).sort({ title: 1 }).lean();
    reason = `Sugestão baseada na sua meta de ${user.fitnessGoal}.`;
  }

  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
