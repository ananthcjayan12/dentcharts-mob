import { useQuery } from '@tanstack/react-query';
import { proceduresService, Procedure } from '../api/services/procedures';

export const useProcedures = (search: string) => {
  return useQuery({
    queryKey: ['procedures', search],
    queryFn: () => proceduresService.list(search),
    staleTime: 1000 * 60 * 5,
  });
};
