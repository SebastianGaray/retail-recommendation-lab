import type { Locale } from "../lib/catalog";

const en = {
  skip: "Skip to catalog",
  brand: "Retail Recommendation Lab",
  methodologyNav: "Methodology",
  synthetic: "Synthetic demo · No tracking",
  title: "Try a retail recommender with a real cart.",
  intro:
    "Add a few products, then see how five recommendation strategies respond to what is in your cart.",
  catalog: "Product catalog",
  catalogHint: "Search, filter or open a product to see its details.",
  search: "Search products",
  category: "Category",
  all: "All categories",
  sort: "Sort",
  featured: "Featured",
  priceLow: "Price: low to high",
  priceHigh: "Price: high to low",
  rating: "Rating",
  filters: "Filters",
  add: "Add to cart",
  details: "View details",
  soldOut: "Out of stock",
  cart: "Cart",
  empty:
    "Your cart is empty. Add a product to activate cart-aware recommendations.",
  remove: "Remove",
  decrease: "Decrease quantity",
  increase: "Increase quantity",
  reset: "Reset session",
  viewRecommendations: "View recommendations",
  analyze: "Analyze cart",
  recommendations: "Recommendations",
  recommendationHint:
    "The results update from your cart. You can switch strategies to compare them.",
  strategy: "Strategy",
  popularity: "Popularity",
  categoryPopularity: "Category popularity",
  frequentlyBoughtTogether: "Frequently bought together",
  itemSimilarity: "Item similarity",
  hybrid: "Hybrid",
  fallback: "Image unavailable",
  close: "Close",
  quantity: "Quantity",
  subtotal: "Synthetic subtotal",
  reasonTitle: "Why this result",
  global_popularity: "Frequently chosen in the synthetic data.",
  category_popularity: "Popular in a category that is in your cart.",
  frequently_bought_together:
    "Often appears in the same synthetic baskets as a cart item.",
  item_similarity: "Has shopping patterns similar to a cart item.",
  hybrid_ranker: "Selected using a fixed mix of the available signals.",
  cold_start_fallback:
    "Uses overall popularity when the cart has little context.",
  error: "Recommendation artifacts are temporarily unavailable.",
  comparison: "Strategy comparison",
  comparisonNote:
    "Results from a small synthetic holdout set. They are included for inspection, not as a production benchmark.",
  precision: "Precision@3",
  recall: "Recall@3",
  hitRate: "Hit rate@3",
  coverage: "Coverage",
  metricPrecision: "Relevant purchases among the first three recommendations.",
  metricRecall: "Share of held-out purchases recovered in the first three.",
  metricHit: "Share of eligible customers with at least one hit.",
  metricCoverage: "Share of the small catalog recommended at least once.",
  methodology: "What happens behind the page",
  methodologyText:
    "PySpark prepares static files from earlier synthetic events. The browser reads those files and removes products already in the cart or out of stock.",
  architecture: "How it is built",
  architectureText:
    "Synthetic Parquet files are processed offline into JSON. Astro serves the site from GitHub Pages; there is no backend or login.",
  limitations: "Limitations",
  limitationsText:
    "The catalog and evaluation set are deliberately small. These results only describe generated data.",
  theme: "Theme",
  system: "System",
  light: "Light",
  dark: "Dark",
  language: "Language",
  statusAdded: "added to cart",
  statusRemoved: "removed from cart",
  noResults: "No products match these filters.",
  cartOpen: "Open cart",
  menu: "Navigation",
  portfolio: "Portfolio",
  home: "Home",
  catalogNav: "Catalog",
  evaluation: "Evaluation",
  catalogKicker: "01 / Catalog",
  rankingKicker: "02 / Ranking",
  evaluationKicker: "03 / Evaluation",
  offlineModel: "Offline model",
  hybridSignalsLabel: "Hybrid signals",
  hybridSignalsIntro: "The hybrid score combines these normalized signals:",
  signalPopularity: "Overall popularity",
  signalCategory: "Categories in the cart",
  signalBasket: "Products bought together",
  signalSimilarity: "Item similarity",
  signalNovelty: "Novelty",
  engineering: "Engineering process",
  engineeringKicker: "04 / Process",
  engineeringTitle: "How SDD and AI assistance were used",
  engineeringIntro:
    "A traceable workflow connected product requirements, implementation support, human review, and automated evidence.",
  processSpecification: "Specification",
  processSpecificationText:
    "SDD defined artifact contracts, recommendation behavior, failure recovery, accessibility, and acceptance checks before implementation.",
  processAi: "AI assistance",
  processAiText:
    "AI-assisted tools helped explore designs, implement scoped changes, review code and copy, and propose unit, integration, and browser tests.",
  processHuman: "Human decisions",
  processHumanText:
    "Product scope, ranking signals, metric interpretation, limitations, and final acceptance remained human responsibilities.",
  processEvidence: "Validation evidence",
  processEvidenceText:
    "Reproducible PySpark artifacts, schema checks, Ruff, Pyright, Vitest, Playwright, accessibility tests, audits, and CodeQL verified the result.",
  processExample: "Example: explainable hybrid ranking",
  processExampleText:
    "The specification required visible signals and fixed weights. AI assistance helped review ranking and fallback cases. Human review approved the signals and wording. Artifact tests and browser flows verified the public behavior.",
  processBenefits: "What this added",
  processBenefitsText:
    "Clearer scope, more systematic edge cases, explicit accountability, and traceability from a requirement to the code and check that supports it.",
  processBoundary:
    "AI output was treated as a proposal, not as evidence. Only reviewed changes with passing checks were accepted.",
  processDocuments: "Versioned SDD documents",
  processSpec: "Specification",
  processPlan: "Implementation plan",
  processTasks: "Completed tasks",
} as const;

export type StorefrontMessages = { [Key in keyof typeof en]: string };

const es = {
  skip: "Ir al catálogo",
  brand: "Laboratorio de Recomendaciones",
  methodologyNav: "Metodología",
  synthetic: "Demo sintética · Sin seguimiento",
  title: "Prueba recomendaciones de retail con un carrito.",
  intro:
    "Agrega algunos productos y revisa cómo responden cinco estrategias según lo que tienes en el carrito.",
  catalog: "Catálogo de productos",
  catalogHint: "Busca, filtra o abre un producto para revisar sus detalles.",
  search: "Buscar productos",
  category: "Categoría",
  all: "Todas las categorías",
  sort: "Ordenar",
  featured: "Destacados",
  priceLow: "Precio: menor a mayor",
  priceHigh: "Precio: mayor a menor",
  rating: "Calificación",
  filters: "Filtros",
  add: "Agregar al carrito",
  details: "Ver detalles",
  soldOut: "Sin stock",
  cart: "Carrito",
  empty:
    "Tu carrito está vacío. Agrega un producto para activar recomendaciones contextuales.",
  remove: "Quitar",
  decrease: "Disminuir cantidad",
  increase: "Aumentar cantidad",
  reset: "Reiniciar sesión",
  viewRecommendations: "Ver recomendaciones",
  analyze: "Analizar carrito",
  recommendations: "Recomendaciones",
  recommendationHint:
    "Los resultados cambian con el carrito. Puedes alternar estrategias para compararlas.",
  strategy: "Estrategia",
  popularity: "Popularidad",
  categoryPopularity: "Popularidad por categoría",
  frequentlyBoughtTogether: "Comprados juntos",
  itemSimilarity: "Similitud de productos",
  hybrid: "Híbrida",
  fallback: "Imagen no disponible",
  close: "Cerrar",
  quantity: "Cantidad",
  subtotal: "Subtotal sintético",
  reasonTitle: "Por qué aparece",
  global_popularity: "Elegido con frecuencia en los datos sintéticos.",
  category_popularity: "Popular en una categoría presente en tu carrito.",
  frequently_bought_together:
    "Suele aparecer en las mismas canastas sintéticas que un producto del carrito.",
  item_similarity:
    "Tiene patrones de compra similares a un producto del carrito.",
  hybrid_ranker:
    "Seleccionado con una combinación fija de las señales disponibles.",
  cold_start_fallback:
    "Usa popularidad general cuando el carrito tiene poco contexto.",
  error: "Los artefactos de recomendación no están disponibles temporalmente.",
  comparison: "Comparación de estrategias",
  comparisonNote:
    "Resultados de un conjunto sintético pequeño. Se muestran para revisarlos, no como benchmark de producción.",
  precision: "Precisión@3",
  recall: "Recall@3",
  hitRate: "Tasa de acierto@3",
  coverage: "Cobertura",
  metricPrecision:
    "Compras relevantes entre las primeras tres recomendaciones.",
  metricRecall:
    "Proporción de compras retenidas recuperadas entre las primeras tres.",
  metricHit: "Proporción de clientes elegibles con al menos un acierto.",
  metricCoverage:
    "Proporción del catálogo pequeño recomendada al menos una vez.",
  methodology: "Qué ocurre detrás de la página",
  methodologyText:
    "PySpark prepara archivos estáticos a partir de eventos sintéticos anteriores. El navegador lee esos archivos y excluye productos del carrito o sin stock.",
  architecture: "Cómo está construido",
  architectureText:
    "Los archivos Parquet sintéticos se procesan offline y generan JSON. Astro sirve el sitio desde GitHub Pages; no hay backend ni inicio de sesión.",
  limitations: "Limitaciones",
  limitationsText:
    "El catálogo y el conjunto de evaluación son pequeños a propósito. Los resultados solo describen datos generados.",
  theme: "Tema",
  system: "Sistema",
  light: "Claro",
  dark: "Oscuro",
  language: "Idioma",
  statusAdded: "agregado al carrito",
  statusRemoved: "quitado del carrito",
  noResults: "Ningún producto coincide con los filtros.",
  cartOpen: "Abrir carrito",
  menu: "Navegación",
  portfolio: "Portafolio",
  home: "Inicio",
  catalogNav: "Catálogo",
  evaluation: "Evaluación",
  catalogKicker: "01 / Catálogo",
  rankingKicker: "02 / Ranking",
  evaluationKicker: "03 / Evaluación",
  offlineModel: "Modelo offline",
  hybridSignalsLabel: "Señales del modo híbrido",
  hybridSignalsIntro: "El puntaje híbrido combina estas señales normalizadas:",
  signalPopularity: "Popularidad general",
  signalCategory: "Categorías del carrito",
  signalBasket: "Productos comprados juntos",
  signalSimilarity: "Similitud entre productos",
  signalNovelty: "Novedad",
  engineering: "Proceso de ingeniería",
  engineeringKicker: "04 / Proceso",
  engineeringTitle: "Cómo se usaron SDD y la asistencia de IA",
  engineeringIntro:
    "Un flujo trazable conectó requisitos de producto, apoyo de implementación, revisión humana y evidencia automatizada.",
  processSpecification: "Especificación",
  processSpecificationText:
    "SDD definió contratos de artefactos, comportamiento de recomendaciones, recuperación ante fallos, accesibilidad y controles de aceptación.",
  processAi: "Asistencia de IA",
  processAiText:
    "Las herramientas de IA ayudaron a explorar diseños, implementar cambios acotados, revisar código y textos, y proponer pruebas unitarias, de integración y navegador.",
  processHuman: "Decisiones humanas",
  processHumanText:
    "El alcance, las señales del ranking, la interpretación de métricas, las limitaciones y la aceptación final permanecieron bajo responsabilidad humana.",
  processEvidence: "Evidencia de validación",
  processEvidenceText:
    "Los artefactos PySpark reproducibles, esquemas, Ruff, Pyright, Vitest, Playwright, accesibilidad, auditorías y CodeQL verificaron el resultado.",
  processExample: "Ejemplo: ranking híbrido explicable",
  processExampleText:
    "La especificación exigió señales visibles y pesos fijos. La IA ayudó a revisar casos de ranking y fallback. La revisión humana aprobó señales y textos. Las pruebas verificaron el comportamiento público.",
  processBenefits: "Qué aportó",
  processBenefitsText:
    "Alcance más claro, casos borde más sistemáticos, responsabilidad explícita y trazabilidad desde un requisito hasta el código y control que lo respaldan.",
  processBoundary:
    "La salida de IA se trató como una propuesta, no como evidencia. Solo se aceptaron cambios revisados con todos los controles aprobados.",
  processDocuments: "Documentos SDD versionados",
  processSpec: "Especificación",
  processPlan: "Plan de implementación",
  processTasks: "Tareas terminadas",
} satisfies StorefrontMessages;

const catalogs: Record<Locale, StorefrontMessages> = { en, es };

export function getMessages(locale: Locale): StorefrontMessages {
  return catalogs[locale];
}
