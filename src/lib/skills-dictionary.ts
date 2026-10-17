/**
 * Curated 300+ term canonical skills dictionary with alias normalization.
 */

export interface SkillEntry {
  canonical: string;
  aliases: string[];
  category: "languages" | "frameworks" | "databases" | "cloud_devops" | "architecture_ai" | "product_design";
}

export const SKILLS_DICTIONARY: SkillEntry[] = [
  // Programming Languages
  { canonical: "TypeScript", aliases: ["ts", "typescript.js"], category: "languages" },
  { canonical: "JavaScript", aliases: ["js", "es6", "ecmascript"], category: "languages" },
  { canonical: "Python", aliases: ["py", "python3"], category: "languages" },
  { canonical: "Go", aliases: ["golang"], category: "languages" },
  { canonical: "Rust", aliases: ["rustlang"], category: "languages" },
  { canonical: "Java", aliases: ["java8", "java11", "java17", "java21", "jvm"], category: "languages" },
  { canonical: "C++", aliases: ["cpp", "cplusplus"], category: "languages" },
  { canonical: "C#", aliases: ["csharp", "dotnet", ".net"], category: "languages" },
  { canonical: "Ruby", aliases: ["rb", "ruby-lang"], category: "languages" },
  { canonical: "PHP", aliases: ["php8"], category: "languages" },
  { canonical: "Kotlin", aliases: ["kt"], category: "languages" },
  { canonical: "Swift", aliases: ["swiftlang"], category: "languages" },
  { canonical: "Scala", aliases: ["scala-lang"], category: "languages" },
  { canonical: "Elixir", aliases: ["ex"], category: "languages" },
  { canonical: "SQL", aliases: ["ansi-sql", "tsql"], category: "languages" },
  { canonical: "Bash", aliases: ["shell", "zsh", "sh"], category: "languages" },
  { canonical: "R", aliases: ["r-lang"], category: "languages" },
  { canonical: "Dart", aliases: ["dartlang"], category: "languages" },
  { canonical: "Haskell", aliases: ["ghc"], category: "languages" },
  { canonical: "C", aliases: ["ansi-c"], category: "languages" },

  // Frontend & Mobile Frameworks
  { canonical: "React", aliases: ["react.js", "reactjs"], category: "frameworks" },
  { canonical: "Next.js", aliases: ["nextjs", "next"], category: "frameworks" },
  { canonical: "Vue.js", aliases: ["vue", "vuejs", "vue3"], category: "frameworks" },
  { canonical: "Nuxt.js", aliases: ["nuxt", "nuxtjs"], category: "frameworks" },
  { canonical: "Angular", aliases: ["angular.js", "angularjs", "ng"], category: "frameworks" },
  { canonical: "Svelte", aliases: ["sveltekit"], category: "frameworks" },
  { canonical: "Tailwind CSS", aliases: ["tailwind", "tailwindcss"], category: "frameworks" },
  { canonical: "CSS3", aliases: ["css", "styling"], category: "frameworks" },
  { canonical: "HTML5", aliases: ["html"], category: "frameworks" },
  { canonical: "Sass", aliases: ["scss"], category: "frameworks" },
  { canonical: "React Native", aliases: ["rn"], category: "frameworks" },
  { canonical: "Flutter", aliases: ["flutter-sdk"], category: "frameworks" },
  { canonical: "SwiftUI", aliases: ["swift-ui"], category: "frameworks" },
  { canonical: "Redux", aliases: ["redux-toolkit", "rtk"], category: "frameworks" },
  { canonical: "Zustand", aliases: ["zustand-state"], category: "frameworks" },
  { canonical: "TanStack Query", aliases: ["react-query", "reactquery"], category: "frameworks" },
  { canonical: "Storybook", aliases: ["sb"], category: "frameworks" },
  { canonical: "Vite", aliases: ["vitejs"], category: "frameworks" },
  { canonical: "Webpack", aliases: ["webpack5"], category: "frameworks" },
  { canonical: "Jest", aliases: ["jestjs"], category: "frameworks" },
  { canonical: "Cypress", aliases: ["cypress-io"], category: "frameworks" },
  { canonical: "Playwright", aliases: ["ms-playwright"], category: "frameworks" },
  { canonical: "Framer Motion", aliases: ["framer"], category: "frameworks" },

  // Backend Frameworks & Runtimes
  { canonical: "Node.js", aliases: ["node", "nodejs"], category: "frameworks" },
  { canonical: "Express.js", aliases: ["express", "expressjs"], category: "frameworks" },
  { canonical: "Fastify", aliases: ["fastifyjs"], category: "frameworks" },
  { canonical: "NestJS", aliases: ["nest", "nestjs"], category: "frameworks" },
  { canonical: "Django", aliases: ["django-rest-framework", "drf"], category: "frameworks" },
  { canonical: "FastAPI", aliases: ["fast-api"], category: "frameworks" },
  { canonical: "Flask", aliases: ["flask-py"], category: "frameworks" },
  { canonical: "Spring Boot", aliases: ["springboot", "spring"], category: "frameworks" },
  { canonical: "Ruby on Rails", aliases: ["rails", "ror"], category: "frameworks" },
  { canonical: "ASP.NET Core", aliases: ["aspnet", "dotnet-core"], category: "frameworks" },
  { canonical: "Gin", aliases: ["gin-gonic"], category: "frameworks" },
  { canonical: "Fiber", aliases: ["gofiber"], category: "frameworks" },
  { canonical: "Actix", aliases: ["actix-web"], category: "frameworks" },
  { canonical: "Axum", aliases: ["axum-rs"], category: "frameworks" },
  { canonical: "GraphQL", aliases: ["gql", "apollo"], category: "frameworks" },
  { canonical: "gRPC", aliases: ["protobuf", "protocol-buffers"], category: "frameworks" },
  { canonical: "tRPC", aliases: ["trpc-io"], category: "frameworks" },
  { canonical: "REST APIs", aliases: ["rest", "restful", "rest-api"], category: "frameworks" },
  { canonical: "WebSockets", aliases: ["ws", "socket.io"], category: "frameworks" },

  // Databases & Caches
  { canonical: "PostgreSQL", aliases: ["postgres", "pgsql", "psql"], category: "databases" },
  { canonical: "MySQL", aliases: ["my-sql"], category: "databases" },
  { canonical: "SQLite", aliases: ["sqlite3", "libsql"], category: "databases" },
  { canonical: "Redis", aliases: ["redis-cache"], category: "databases" },
  { canonical: "MongoDB", aliases: ["mongo"], category: "databases" },
  { canonical: "Elasticsearch", aliases: ["elastic", "es", "opensearch"], category: "databases" },
  { canonical: "DynamoDB", aliases: ["dynamo"], category: "databases" },
  { canonical: "Cassandra", aliases: ["apache-cassandra"], category: "databases" },
  { canonical: "ClickHouse", aliases: ["click-house"], category: "databases" },
  { canonical: "Snowflake", aliases: ["snowflake-dw"], category: "databases" },
  { canonical: "BigQuery", aliases: ["google-bigquery", "gbq"], category: "databases" },
  { canonical: "Prisma", aliases: ["prisma-orm"], category: "databases" },
  { canonical: "Drizzle ORM", aliases: ["drizzle"], category: "databases" },
  { canonical: "TypeORM", aliases: ["type-orm"], category: "databases" },
  { canonical: "SQLAlchemy", aliases: ["sqlalchemy-py"], category: "databases" },
  { canonical: "Kafka", aliases: ["apache-kafka"], category: "databases" },
  { canonical: "RabbitMQ", aliases: ["rabbit-mq"], category: "databases" },
  { canonical: "Pinecone", aliases: ["pinecone-db"], category: "databases" },
  { canonical: "Milvus", aliases: ["milvus-io"], category: "databases" },
  { canonical: "ChromaDB", aliases: ["chroma"], category: "databases" },
  { canonical: "Qdrant", aliases: ["qdrant-vector"], category: "databases" },
  { canonical: "Neo4j", aliases: ["neo-4j"], category: "databases" },
  { canonical: "CockroachDB", aliases: ["cockroach"], category: "databases" },

  // Cloud & DevOps
  { canonical: "AWS", aliases: ["amazon-web-services", "ec2", "s3", "lambda"], category: "cloud_devops" },
  { canonical: "Google Cloud", aliases: ["gcp", "google-cloud-platform"], category: "cloud_devops" },
  { canonical: "Azure", aliases: ["microsoft-azure"], category: "cloud_devops" },
  { canonical: "Kubernetes", aliases: ["k8s", "k8", "kube"], category: "cloud_devops" },
  { canonical: "Docker", aliases: ["container", "dockerfile", "containers"], category: "cloud_devops" },
  { canonical: "Terraform", aliases: ["tf", "hashicorp-terraform"], category: "cloud_devops" },
  { canonical: "Ansible", aliases: ["ansible-playbook"], category: "cloud_devops" },
  { canonical: "CI/CD", aliases: ["cicd", "continuous-integration", "pipelines"], category: "cloud_devops" },
  { canonical: "GitHub Actions", aliases: ["gha", "github-workflows"], category: "cloud_devops" },
  { canonical: "GitLab CI", aliases: ["gitlab-ci"], category: "cloud_devops" },
  { canonical: "ArgoCD", aliases: ["argo", "argo-cd"], category: "cloud_devops" },
  { canonical: "Helm", aliases: ["helm-charts"], category: "cloud_devops" },
  { canonical: "Prometheus", aliases: ["prom"], category: "cloud_devops" },
  { canonical: "Grafana", aliases: ["grafana-dashboards"], category: "cloud_devops" },
  { canonical: "Datadog", aliases: ["data-dog"], category: "cloud_devops" },
  { canonical: "OpenTelemetry", aliases: ["otel"], category: "cloud_devops" },
  { canonical: "Nginx", aliases: ["engine-x"], category: "cloud_devops" },
  { canonical: "Cloudflare", aliases: ["cf-workers", "cloudflare-pages"], category: "cloud_devops" },
  { canonical: "Linux", aliases: ["ubuntu", "debian", "rhel", "arch"], category: "cloud_devops" },
  { canonical: "Git", aliases: ["github", "gitlab"], category: "cloud_devops" },

  // Architecture, AI & Machine Learning
  { canonical: "Machine Learning", aliases: ["ml", "machine-learning"], category: "architecture_ai" },
  { canonical: "Deep Learning", aliases: ["dl", "neural-networks"], category: "architecture_ai" },
  { canonical: "Large Language Models", aliases: ["llm", "llms", "gpt", "foundation-models"], category: "architecture_ai" },
  { canonical: "PyTorch", aliases: ["torch"], category: "architecture_ai" },
  { canonical: "TensorFlow", aliases: ["tf-ml", "keras"], category: "architecture_ai" },
  { canonical: "Hugging Face", aliases: ["transformers", "huggingface"], category: "architecture_ai" },
  { canonical: "LangChain", aliases: ["lang-chain"], category: "architecture_ai" },
  { canonical: "LlamaIndex", aliases: ["llama-index"], category: "architecture_ai" },
  { canonical: "RAG", aliases: ["retrieval-augmented-generation"], category: "architecture_ai" },
  { canonical: "Fine-tuning", aliases: ["lora", "qlora", "sft", "rlhf"], category: "architecture_ai" },
  { canonical: "vLLM", aliases: ["v-llm", "tensorrt-llm"], category: "architecture_ai" },
  { canonical: "MLOps", aliases: ["ml-ops", "kubeflow", "mlflow"], category: "architecture_ai" },
  { canonical: "CUDA", aliases: ["gpu-computing", "nvidia-cuda"], category: "architecture_ai" },
  { canonical: "Ray", aliases: ["ray-core", "ray-train"], category: "architecture_ai" },
  { canonical: "Apache Spark", aliases: ["spark", "pyspark"], category: "architecture_ai" },
  { canonical: "Data Engineering", aliases: ["etl", "data-pipelines"], category: "architecture_ai" },
  { canonical: "System Design", aliases: ["distributed-systems", "high-availability"], category: "architecture_ai" },
  { canonical: "Microservices", aliases: ["micro-service", "service-oriented"], category: "architecture_ai" },
  { canonical: "Event-Driven Architecture", aliases: ["eda", "event-sourcing", "cqrs"], category: "architecture_ai" },
  { canonical: "Domain-Driven Design", aliases: ["ddd"], category: "architecture_ai" },

  // Product, Design & Methodology
  { canonical: "Figma", aliases: ["figma-design"], category: "product_design" },
  { canonical: "Design Systems", aliases: ["design-system", "component-library"], category: "product_design" },
  { canonical: "UI/UX Design", aliases: ["ui/ux", "product-design", "user-experience"], category: "product_design" },
  { canonical: "User Research", aliases: ["usability-testing", "user-interviews"], category: "product_design" },
  { canonical: "Wireframing", aliases: ["prototyping", "mockups"], category: "product_design" },
  { canonical: "Product Management", aliases: ["product-mgmt", "pm"], category: "product_design" },
  { canonical: "Agile", aliases: ["scrum", "kanban-method"], category: "product_design" },
  { canonical: "A/B Testing", aliases: ["split-testing", "experimentation"], category: "product_design" },
  { canonical: "Product Analytics", aliases: ["amplitude", "mixpanel", "posthog"], category: "product_design" },
  { canonical: "Roadmapping", aliases: ["product-strategy", "okrs"], category: "product_design" },
  { canonical: "SQL Analysis", aliases: ["data-analysis", "metrics"], category: "product_design" },
  { canonical: "Accessibility", aliases: ["a11y", "wcag"], category: "product_design" },
  { canonical: "Interaction Design", aliases: ["ixd", "micro-interactions"], category: "product_design" },
];

// Build alias lookup table for O(1) matching
const ALIAS_MAP = new Map<string, string>();

for (const entry of SKILLS_DICTIONARY) {
  ALIAS_MAP.set(entry.canonical.toLowerCase(), entry.canonical);
  for (const alias of entry.aliases) {
    ALIAS_MAP.set(alias.toLowerCase(), entry.canonical);
  }
}

/**
 * Normalizes any skill name or alias into its canonical form.
 */
export function normalizeSkill(skill: string): string {
  const cleaned = skill.trim().toLowerCase();
  return ALIAS_MAP.get(cleaned) || skill.trim();
}

/**
 * Checks if a candidate skill matches a target skill, accounting for aliases.
 */
export function isSkillMatch(skillA: string, skillB: string): boolean {
  return normalizeSkill(skillA).toLowerCase() === normalizeSkill(skillB).toLowerCase();
}
