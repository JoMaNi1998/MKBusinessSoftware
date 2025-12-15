export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string'
      ? new Date(dateString)
      : dateString?.toDate?.() || new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export default formatDate;
