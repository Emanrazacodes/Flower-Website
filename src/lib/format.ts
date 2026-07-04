export const currency = (n: number) =>
  `Rs ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(Math.round(n))}`;

export const discountedPrice = (price: number, discount: number) =>
  Math.round(price * (1 - discount / 100));
