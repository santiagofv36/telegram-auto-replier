function getVenezuelaTime() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Caracas',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());

  const weekday = parts.find((p) => p.type === 'weekday')?.value || '';

  const hour = Number(parts.find((p) => p.type === 'hour')?.value);

  return { weekday, hour };
}

function isSaturday(day: string) {
  return day === 'Sat';
}

function isSunday(day: string) {
  return day === 'Sun';
}

export function getAutoReply() {
  const { weekday, hour } = getVenezuelaTime();

  const BUSINESS_START = Number(process.env.BUSINESS_START || 8);
  const BUSINESS_END = Number(process.env.BUSINESS_END || 17);

  const WEEKEND_MESSAGE =
    process.env.WEEKEND_MESSAGE ||
    'Hola 😊 ahora no estoy disponible. Escríbeme el lunes.';

  const AFTER_HOURS_MESSAGE =
    process.env.AFTER_HOURS_MESSAGE ||
    'Hola, en este momento no estoy disponible.';

  if (isSunday(weekday)) {
    return WEEKEND_MESSAGE;
  }

  if (isSaturday(weekday)) {
    if (hour < 12) return null;
    return WEEKEND_MESSAGE;
  }

  if (hour < BUSINESS_START || hour >= BUSINESS_END) {
    return AFTER_HOURS_MESSAGE;
  }

  return null;
}

/**
 * 👇 helper para grupos
 */
export function formatGroupReply(message: string, senderName?: string) {
  if (!senderName) return message;

  return `@${senderName} ${message}`;
}
