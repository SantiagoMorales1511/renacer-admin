export interface StudentPricing {
  customPrice?: number | null;
  modulePrices?: { groupModuleId: string; price: number }[];
}

export function modulePriceFor(
  student: StudentPricing,
  module: { id: string; price: number },
): number {
  const own = student.modulePrices?.find((p) => p.groupModuleId === module.id);
  if (own) return own.price;
  if (student.customPrice !== null && student.customPrice !== undefined) {
    return student.customPrice;
  }
  return module.price;
}
