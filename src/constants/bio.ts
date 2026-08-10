export interface BioInfo {
  name: string;
  role: string;
  tagline: string;
  summary: string;
  skills: {
    category: string;
    items: string[];
  }[];
  contact: {
    github: string;
    linkedin: string;
    email: string;
  };
}

export const BIO_DATA: BioInfo = {
  name: "Agentic Systems Architect",
  role: "AI & Full Stack Engineer",
  tagline: "Architecting autonomous multi-agent pipelines, computer vision systems, and high-scale applications.",
  summary:
    "Specialized in deep retrieval architectures, vector databases, model context protocols (MCP), custom computer vision pipelines (YOLOv8/v11), and enterprise full-stack web applications.",
  skills: [
    {
      category: "AI & Agentic Systems",
      items: ["Multi-Agent Orchestration", "Sentinel MCP", "Vector Stores (Chroma)", "RAG & Grounding", "FastAPI", "Ollama / Llama 3"],
    },
    {
      category: "Computer Vision & ML",
      items: ["YOLOv8 / YOLOv11", "Object Detection", "Sign Language Recognition", "ECG Signal Processing", "PyTorch / OpenCV"],
    },
    {
      category: "Full Stack & Web",
      items: ["TypeScript", "React", "Vite", "TailwindCSS", "Node.js / Express", "REST & GraphQL APIs"],
    },
    {
      category: "Architecture & DevOps",
      items: ["Hybrid Shell Systems", "Microservices", "Docker", "CI/CD Pipelines", "Git / GitHub Actions"],
    },
  ],
  contact: {
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    email: "contact@portfolio.internal",
  },
};
