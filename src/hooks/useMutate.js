import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../store/toast';
import { errMsg } from '../services/api';

/** Mutation that toasts success/error and invalidates the given query keys. */
export const useMutate = (fn, { success, invalidate = [], onSuccess } = {}) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, vars) => { if (success) toast.success(typeof success === 'function' ? success(data) : success); invalidate.forEach((k) => qc.invalidateQueries({ queryKey: [k] })); onSuccess?.(data, vars); },
    onError: (e) => toast.error(errMsg(e)),
  });
};
