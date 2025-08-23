import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'PPP', { locale: ko });
};
