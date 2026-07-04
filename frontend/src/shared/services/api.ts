import axios from "axios";

export const api = axios.create({ baseURL: "http://localhost:3333/api" });

export const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export function formatDate(value: string | Date) {
  if (typeof value === "string") {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
    const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
  }
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}
