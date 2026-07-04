import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

const categoryNames = [
  ["Receita Pessoal", "income"],
  ["Receita Fazenda", "income"],
  ["Fazenda / Agro", "expense"],
  ["Maquinas Agricolas", "expense"],
  ["Pecas Agricolas", "expense"],
  ["Insumos", "expense"],
  ["Combustivel", "expense"],
  ["Veiculos", "expense"],
  ["Alimentacao", "expense"],
  ["Restaurante", "expense"],
  ["Mercado", "expense"],
  ["Mobilidade", "expense"],
  ["Saude", "expense"],
  ["Farmacia", "expense"],
  ["Educacao", "expense"],
  ["Telefonia", "expense"],
  ["Internet", "expense"],
  ["Moradia e Contas", "expense"],
  ["Energia", "expense"],
  ["Agua", "expense"],
  ["Seguros", "expense"],
  ["Impostos e Taxas", "expense"],
  ["Cartao de Credito", "transfer"],
  ["Emprestimos", "expense"],
  ["Investimentos", "investment"],
  ["Transferencia Propria", "transfer"],
  ["Transferencia Familiar", "transfer"],
  ["Assinaturas", "expense"],
  ["Lazer", "expense"],
  ["Doacoes", "expense"],
  ["Outros", "expense"]
] as const;

const rules = [
  { keywords: ["UBER ONE"], category: "Assinaturas", subcategory: "Uber One", financialNature: "Despesa", origin: "Pessoal", priority: 5 },
  { keywords: ["UBER", "UBERRIDES", "UBER *TRIP", "DL*UBERRIDES", "DL *UBERRIDES", "DL *UBER*RIDES"], category: "Mobilidade", subcategory: "Uber", financialNature: "Despesa", origin: "Pessoal", priority: 10 },
  { keywords: ["COAMO", "LAR COOPERATIVA", "GNOVA GRAINS"], category: "Receita Fazenda", financialNature: "Receita", origin: "Fazenda", priority: 15 },
  { keywords: ["AGRO", "COCAMAR", "FERTIL", "MAQUINAS AGRICOLAS", "PECAS AGRICOLAS", "TRACOL", "PLANTA FERTIL", "FERROMAQ"], category: "Fazenda / Agro", financialNature: "Despesa", origin: "Fazenda", priority: 20 },
  { keywords: ["POSTO", "AUTO POSTO", "PILOTO"], category: "Combustivel", financialNature: "Despesa", origin: "Pessoal", priority: 25 },
  { keywords: ["AUTO CENTER", "AUTO ELETRICA", "AUTO PECAS", "BAVARIA", "MERCERAUTO"], category: "Veiculos", financialNature: "Despesa", origin: "Pessoal", priority: 30 },
  { keywords: ["TIM"], category: "Telefonia", financialNature: "Despesa", origin: "Pessoal", priority: 40 },
  { keywords: ["UPNET"], category: "Internet", financialNature: "Despesa", origin: "Pessoal", priority: 40 },
  { keywords: ["COPEL"], category: "Energia", financialNature: "Despesa", origin: "Pessoal", priority: 40 },
  { keywords: ["SANEPAR"], category: "Agua", financialNature: "Despesa", origin: "Pessoal", priority: 40 },
  { keywords: ["UNIMED", "HOSPITAL", "CLINICA"], category: "Saude", financialNature: "Despesa", origin: "Pessoal", priority: 40 },
  { keywords: ["FARMACIA"], category: "Farmacia", financialNature: "Despesa", origin: "Pessoal", priority: 40 },
  { keywords: ["IFOOD", "RESTAURANTE", "BURGUER", "LANCHONETE"], category: "Restaurante", financialNature: "Despesa", origin: "Pessoal", priority: 40 },
  { keywords: ["UNIVERSIDADE"], category: "Educacao", financialNature: "Despesa", origin: "Pessoal", priority: 40 },
  { keywords: ["DETRAN", "RECEITA FEDERAL", "DAS"], category: "Impostos e Taxas", financialNature: "Despesa", origin: "Pessoal", priority: 40 },
  { keywords: ["SEGUROS", "BRASILSEG", "AXA", "ESSOR"], category: "Seguros", financialNature: "Despesa", origin: "Pessoal", priority: 40 },
  { keywords: ["RDB", "APLICACAO", "RESGATE"], category: "Investimentos", financialNature: "Investimento", origin: "Investimento", priority: 35 },
  { keywords: ["PAGAMENTO DE FATURA", "PAGTO FATURA"], category: "Cartao de Credito", subcategory: "Fatura", financialNature: "Transferencia", origin: "Transferencia", priority: 8 }
];

async function main() {
  await prisma.user.upsert({
    where: { email: "usuario@local" },
    update: {},
    create: { name: "Usuario", email: "usuario@local" }
  });

  await prisma.account.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "Conta Nubank", bank: "Nubank", type: "corrente" }
  });

  await prisma.card.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "Cartao Nubank", bank: "Nubank" }
  });

  for (const [name, type] of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: { type },
      create: { name, type }
    });
  }

  const subcategories = [
    ["Mobilidade", "Uber"],
    ["Assinaturas", "Uber One"],
    ["Cartao de Credito", "Fatura"],
    ["Fazenda / Agro", "Operacao Rural"],
    ["Combustivel", "Postos"],
    ["Veiculos", "Manutencao"]
  ];

  for (const [categoryName, subName] of subcategories) {
    const category = await prisma.category.findUniqueOrThrow({ where: { name: categoryName } });
    await prisma.subcategory.upsert({
      where: { categoryId_name: { categoryId: category.id, name: subName } },
      update: {},
      create: { categoryId: category.id, name: subName }
    });
  }

  const paymentMethods = [
    ["Pix", "Instant"],
    ["Dinheiro", "Cash"],
    ["Debito", "Debit"],
    ["Credito", "Credit"],
    ["TED", "Transfer"],
    ["DOC", "Transfer"],
    ["Boleto", "Bill"],
    ["Transferencia", "Transfer"],
    ["Outros", "Other"]
  ];

  for (const [name, type] of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { name },
      update: { type },
      create: { name, type }
    });
  }

  await prisma.classificationRule.deleteMany({});
  for (const rule of rules) {
    const category = await prisma.category.findUniqueOrThrow({ where: { name: rule.category } });
    const subcategory = rule.subcategory
      ? await prisma.subcategory.findUnique({ where: { categoryId_name: { categoryId: category.id, name: rule.subcategory } } })
      : null;

    for (const keyword of rule.keywords) {
      await prisma.classificationRule.create({
        data: {
          keyword,
          normalizedKeyword: normalizeText(keyword),
          categoryId: category.id,
          subcategoryId: subcategory?.id,
          categoryName: category.name,
          subcategoryName: subcategory?.name,
          financialNature: rule.financialNature,
          origin: rule.origin,
          priority: rule.priority
        }
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
