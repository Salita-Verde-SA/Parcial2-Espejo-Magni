import { create } from 'zustand'

interface PaymentState {
  status: 'idle' | 'processing' | 'approved' | 'rejected' | 'error'
  mpPaymentId: number | null
  statusDetail: string | null

  setPaymentStatus: (status: PaymentState['status'], mpPaymentId?: number | null, statusDetail?: string | null) => void
  reset: () => void
}

export const usePaymentStore = create<PaymentState>((set) => ({
  status: 'idle',
  mpPaymentId: null,
  statusDetail: null,

  setPaymentStatus: (status, mpPaymentId = null, statusDetail = null) =>
    set((state) => ({
      status,
      mpPaymentId: mpPaymentId !== undefined ? mpPaymentId : state.mpPaymentId,
      statusDetail: statusDetail !== undefined ? statusDetail : state.statusDetail,
    })),

  reset: () => set({ status: 'idle', mpPaymentId: null, statusDetail: null }),
}))
