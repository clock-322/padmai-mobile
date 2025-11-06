export interface PaymentApiItem {
  _id: string;
  studentId: string;
  studentName: string;
  className: string;
  name: string; // e.g., Tuition Fee
  amount: number;
  paymentType: string; // e.g., Monthly
  createdAt: string;
  updatedAt: string;
}

export interface PaymentsApiResponse {
  success: boolean;
  message: string;
  data: {
    payments: PaymentApiItem[];
    count: number;
  };
}


