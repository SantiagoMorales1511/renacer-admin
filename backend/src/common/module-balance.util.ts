export function moduleBalance(params: {
  price: number;
  paid: number;
  attended: boolean;
  dictated: boolean;
}) {
  const balance = params.price > 0 ? Math.max(params.price - params.paid, 0) : 0;
  const owes = balance > 0 && (params.paid > 0 || (params.attended && params.dictated));
  return { paid: params.paid, balance: owes ? balance : 0 };
}
