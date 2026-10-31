// Daily schedule, in the TV's local time:
//   07:00-20:00  day: filtered YouTube
//   20:00-22:00  night: empty home screen
//   22:00-07:00  lockdown: nothing to watch anywhere
export const NIGHT_START_HOUR = 20;
export const LOCKDOWN_START_HOUR = 22;
export const MORNING_HOUR = 7;

export function isNightTime(date) {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR || hour < MORNING_HOUR;
}

export function isLockdownTime(date) {
  const hour = date.getHours();
  return hour >= LOCKDOWN_START_HOUR || hour < MORNING_HOUR;
}
