export function formatDateShortBR(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function parseDateShortBR(dateString: string): Date | null {

  if (!dateString) return null;

  try {
    const [datePart, timePart] = dateString.trim().split(' ');
    if (!datePart || !timePart) return null;

    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year) return null;

    const [hours, minutes] = timePart.split(':');
    if (!hours || !minutes) return null;

    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes)
    );

    return isNaN(parsedDate.getTime()) ? null : parsedDate;

  } catch {
    return null;
  }
}