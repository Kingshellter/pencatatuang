export class CreateTransactionDto {
  amount: number;
  description: string;
  type: 'income' | 'expense';
}
