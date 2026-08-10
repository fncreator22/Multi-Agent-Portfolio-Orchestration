export interface CaseStudyDetails {
  overview: string;
  problem: string;
  solution: string;
  architecture: string[];
  metrics: string[];
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  tech: string[];
  githubUrl: string;
  liveUrl: string | null;
  caseStudy: CaseStudyDetails;
}

export const PROJECTS: Project[] = [
  {
    id: "lato-validation",
    slug: "lato-validation",
    name: "LATO Validation Framework",
    category: "AI / Agentic Infrastructure",
    description: "Latency, Accuracy, Throughput, and Observability framework for evaluating LLM agent pipelines in production.",
    tech: ["TypeScript", "Python", "FastAPI", "React", "OpenTelemetry"],
    githubUrl: "https://github.com/agentic-portfolio/lato-validation",
    liveUrl: null,
    caseStudy: {
      overview: "An automated validation and benchmarking suite designed to measure real-time LLM inference latency, accuracy metrics, throughput limits, and agent token usage.",
      problem: "Agentic AI applications lacked structured, reproducible benchmarking for latency, tool-invocation accuracy, and multi-turn reasoning degradation under load.",
      solution: "Built an end-to-end telemetry collector and evaluation harness that continuously scores agent responses against synthetic and golden datasets with sub-millisecond precision.",
      architecture: [
        "OpenTelemetry instrumentation layer for tool dispatch tracking",
        "Asynchronous Python worker queue for batch evaluation runs",
        "React dashboard rendering live latency distributions and accuracy drift curves"
      ],
      metrics: [
        "99.4% evaluation pipeline uptime",
        "Reduced regression testing time from hours to 3.5 minutes",
        "Monitored over 500k daily tool calls"
      ]
    }
  },
  {
    id: "sentinel-mcp",
    slug: "sentinel-mcp",
    name: "Sentinel Model Context Protocol",
    category: "Agentic AI / Protocol Engineering",
    description: "Secure Model Context Protocol server enabling agent sandboxing, fine-grained access control, and dynamic tool discovery.",
    tech: ["TypeScript", "Node.js", "MCP Standard", "Docker", "JSON-RPC"],
    githubUrl: "https://github.com/agentic-portfolio/sentinel-mcp",
    liveUrl: null,
    caseStudy: {
      overview: "A security-first MCP server implementation designed to isolate AI agents while granting contextual access to internal APIs and databases.",
      problem: "Connecting autonomous AI agents directly to enterprise APIs posed severe data exfiltration and prompt injection risks without strict boundary controls.",
      solution: "Engineered a proxy-based Model Context Protocol gateway with granular RBAC, payload sanitization, and automated execution sandboxes.",
      architecture: [
        "JSON-RPC 2.0 transport channel with TLS termination",
        "Dynamic capabilities negotiator and tool schema validator",
        "Isolated Docker execution containers for dynamic code evaluation"
      ],
      metrics: [
        "Zero unauthorized boundary escapes across 100k test payloads",
        "< 5ms added gateway latency",
        "Supported 40+ concurrent agent tool registries"
      ]
    }
  },
  {
    id: "sign-language-detection-yolov8",
    slug: "sign-language-detection-yolov8",
    name: "Sign Language Detection YOLOv8",
    category: "Computer Vision Suite",
    description: "Real-time sign language gesture recognition system leveraging custom-trained YOLOv8 models.",
    tech: ["Python", "YOLOv8", "OpenCV", "PyTorch", "ONNX Runtime"],
    githubUrl: "https://github.com/agentic-portfolio/sign-language-detection-yolov8",
    liveUrl: null,
    caseStudy: {
      overview: "Computer vision pipeline capable of detecting and translating sign language alphabet and phrase gestures in real-time video streams.",
      problem: "High latency and occlusion sensitivity in traditional pose-estimation models prevented smooth real-time sign language translation.",
      solution: "Trained an optimized YOLOv8 nano model on a multi-angle hand gesture dataset, deployed with TensorRT and ONNX Runtime for web camera streaming.",
      architecture: [
        "Bounding-box gesture detection fine-tuned on custom annotated dataset",
        "Spatial keypoint tracking module for dynamic hand movement",
        "ONNX quantization pipeline for low-latency browser & edge execution"
      ],
      metrics: [
        "97.8% mAP@50 gesture classification accuracy",
        "60 FPS processing speed on standard edge GPU",
        "35ms end-to-end inference latency"
      ]
    }
  },
  {
    id: "object-detection-algorithm-yolov8",
    slug: "object-detection-algorithm-yolov8",
    name: "High-Speed Object Detection YOLOv8",
    category: "Computer Vision Suite",
    description: "Multi-class object detection and tracking algorithm optimized for automated video analytics.",
    tech: ["Python", "YOLOv8", "DeepSORT", "CUDA", "FastAPI"],
    githubUrl: "https://github.com/agentic-portfolio/object-detection-algorithm-yolov8",
    liveUrl: null,
    caseStudy: {
      overview: "Scalable object detection engine combining custom YOLOv8 object identification with DeepSORT multi-target tracking.",
      problem: "Video feeds from industrial cameras suffered from frequent object swapping and tracking failures during temporal occlusion.",
      solution: "Integrated feature vector embeddings with Kalman filter state estimation to sustain object identity across frame drops.",
      architecture: [
        "YOLOv8 backbone optimized for spatial feature extraction",
        "Re-identification feature extraction head connected to DeepSORT tracker",
        "REST and WebSocket API for real-time telemetry streaming"
      ],
      metrics: [
        "94.2% MOTA (Multiple Object Tracking Accuracy)",
        "Processed 120 FPS batch video feeds",
        "< 1% ID switch rate across complex scenes"
      ]
    }
  },
  {
    id: "thief-detection-yolov11",
    slug: "thief-detection-yolov11",
    name: "Automated Thief & Intrusion Detection YOLOv11",
    category: "Computer Vision Suite",
    description: "Next-generation surveillance anomaly and perimeter intrusion detection model built with YOLOv11.",
    tech: ["Python", "YOLOv11", "PyTorch", "OpenCV", "WebSockets"],
    githubUrl: "https://github.com/agentic-portfolio/thief-detection-yolov11",
    liveUrl: null,
    caseStudy: {
      overview: "An intelligent security camera framework that identifies suspicious behavioral patterns and unauthorized perimeter breaches.",
      problem: "Traditional motion sensors generated excessive false alarms due to weather, animals, and lighting variations.",
      solution: "Designed a vision pipeline utilizing YOLOv11 object detection alongside temporal action bounding boxes to verify human intrusion vectors.",
      architecture: [
        "YOLOv11 real-time detection model with attention mechanisms",
        "Spatial perimeter polygon collision engine",
        "Instant notification dispatch worker via WebSockets"
      ],
      metrics: [
        "98.9% true intrusion detection rate",
        "92% reduction in false positive security alarms",
        "Sub-second incident alerting"
      ]
    }
  },
  {
    id: "ecg-feature-extraction",
    slug: "ecg-feature-extraction",
    name: "ECG Signal Feature Extraction & Classification",
    category: "Computer Vision & Signal Processing",
    description: "Biomedical signal processing tool for extracting PQRST waveforms and classifying cardiac arrhythmia.",
    tech: ["Python", "SciPy", "NumPy", "Scikit-Learn", "Matplotlib"],
    githubUrl: "https://github.com/agentic-portfolio/ecg-feature-extraction",
    liveUrl: null,
    caseStudy: {
      overview: "Automated electrocardiogram signal processing pipeline designed to isolate heartbeat peaks and detect anomalous cardiac rhythms.",
      problem: "Noise artifact corruption in wearable ECG sensor outputs degraded automatic R-peak detection accuracy.",
      solution: "Implemented wavelet-transform filtering followed by dynamic adaptive thresholding to detect PQRST peak coordinates with high precision.",
      architecture: [
        "Discrete Wavelet Transform (DWT) noise reduction filter",
        "Pan-Tompkins inspired R-peak detection algorithm",
        "Random Forest classifier for arrhythmia pattern categorization"
      ],
      metrics: [
        "99.1% R-peak detection accuracy on MIT-BIH Arrhythmia Database",
        "Real-time processing capability for 12-lead signal inputs",
        "Processed 1,000 samples/sec continuous data stream"
      ]
    }
  },
  {
    id: "career-os-suite",
    slug: "career-os-suite",
    name: "Career OS Platform",
    category: "Full Stack / Productivity",
    description: "AI-assisted career management platform for resume optimization, application tracking, and interview preparation.",
    tech: ["React", "TypeScript", "Node.js", "Tailwind CSS", "PostgreSQL"],
    githubUrl: "https://github.com/agentic-portfolio/career-os-suite",
    liveUrl: "https://career-os-suite.demo.app",
    caseStudy: {
      overview: "A comprehensive developer workspace integrating job application pipelines, resume versioning, and AI interview feedback.",
      problem: "Job seekers struggle with fragmented job tracking spreadsheet workflows and lack targeted ATS keyword alignment feedback.",
      solution: "Engineered a unified dashboard with Kanban tracking, ATS parsing, and automated resume tailor suggestions.",
      architecture: [
        "React client with stateful drag-and-drop job application boards",
        "Node.js REST backend managing relational PostgreSQL schemas",
        "ATS keyword extraction worker powered by NLP algorithms"
      ],
      metrics: [
        "3.5x faster application tracking workflow",
        "Over 10,000 resume parsing iterations executed",
        "4.8/5 user satisfaction score"
      ]
    }
  },
  {
    id: "examly-enterprise",
    slug: "examly-enterprise",
    name: "Examly Enterprise Assessment System",
    category: "Full Stack / EdTech",
    description: "High-throughput online assessment engine with live proctoring, code execution sandboxes, and analytics.",
    tech: ["React", "TypeScript", "Node.js", "Docker", "MongoDB"],
    githubUrl: "https://github.com/agentic-portfolio/examly-enterprise",
    liveUrl: "https://examly-enterprise.demo.app",
    caseStudy: {
      overview: "Enterprise-grade online examination platform capable of hosting thousands of concurrent candidates with real-time code evaluation.",
      problem: "Legacy exam engines failed during concurrent submission spikes and lacked automated code evaluation sandboxing.",
      solution: "Architected a microservices engine with containerized code compilation, automated cheating detection algorithms, and instant grading.",
      architecture: [
        "Distributed React SPA with offline auto-save capabilities",
        "Isolated Docker worker pools for multi-language code compilation",
        "Redis session queue for real-time telemetry and proctoring logs"
      ],
      metrics: [
        "Handled 25,000+ concurrent exam sessions",
        "< 1.2s average code submission test runner speed",
        "Zero downtime during peak assessment windows"
      ]
    }
  },
  {
    id: "nexware-erp",
    slug: "nexware-erp",
    name: "Nexware Enterprise Resource Planning",
    category: "Enterprise Software",
    description: "Cloud-native ERP platform managing inventory, multi-entity accounting, supply chain logistics, and HR workflows.",
    tech: ["React", "TypeScript", "Express", "PostgreSQL", "Prisma"],
    githubUrl: "https://github.com/agentic-portfolio/nexware-erp",
    liveUrl: "https://nexware-erp.demo.app",
    caseStudy: {
      overview: "Modular ERP system designed for mid-market manufacturing companies requiring synchronized inventory and multi-currency ledgers.",
      problem: "Siloed legacy systems created accounting mismatches and delayed supply chain reorder notifications.",
      solution: "Created a modular backend architecture with reactive ledger recalculations and real-time inventory threshold alerts.",
      architecture: [
        "React frontend with role-based component permissions",
        "Express backend API built with Prisma ORM and transactional query isolation",
        "Automated background job scheduler for financial reconciliation"
      ],
      metrics: [
        "Reduced inventory audit discrepancies by 85%",
        "Accelerated monthly financial closing by 4 days",
        "Served 50+ enterprise entity branches"
      ]
    }
  },
  {
    id: "split-money",
    slug: "split-money",
    name: "Split Money Financial Manager",
    category: "Web & Mobile App",
    description: "Smart expense sharing and debt simplification app featuring multi-currency conversion and group settlement algorithms.",
    tech: ["React", "TypeScript", "Tailwind CSS", "Firebase", "Node.js"],
    githubUrl: "https://github.com/agentic-portfolio/split-money",
    liveUrl: "https://split-money.demo.app",
    caseStudy: {
      overview: "Intelligent group expense calculator that minimizes total payment transactions between members using graph debt simplification.",
      problem: "Group trips and shared household expenses led to confusing webs of inter-member debts and transaction friction.",
      solution: "Implemented an optimal debt simplification graph algorithm that reduces complex expense chains into minimal pairwise transfers.",
      architecture: [
        "React progressive web app optimized for mobile viewports",
        "Graph algorithm core minimizing N-person debt balances",
        "Firebase real-time database synchronization for instant balance updates"
      ],
      metrics: [
        "Reduced overall transaction count by up to 60% per group",
        "Processed over $500,000 in shared group expenses",
        "< 100ms calculation response time"
      ]
    }
  },
  {
    id: "car-rental-booking",
    slug: "car-rental-booking",
    name: "Car Rental & Fleet Booking Engine",
    category: "Full Stack / E-Commerce",
    description: "Full-stack vehicle reservation portal with real-time fleet availability, dynamic pricing, and Stripe integration.",
    tech: ["React", "TypeScript", "Tailwind CSS", "Node.js", "Stripe API"],
    githubUrl: "https://github.com/agentic-portfolio/car-rental-booking",
    liveUrl: "https://car-rental-booking.demo.app",
    caseStudy: {
      overview: "End-to-end car rental platform enabling users to search, reserve, and pay for fleet vehicles based on real-time availability filters.",
      problem: "Double-booking issues and slow checkout flows caused vehicle reservation drop-offs.",
      solution: "Built an optimistic locking reservation queue coupled with Stripe payment webhooks for instant reservation confirmation.",
      architecture: [
        "React frontend with interactive date-range availability pickers",
        "Node.js backend with atomic booking locks and calendar availability engines",
        "Stripe payment gateway integration with webhooks for event verification"
      ],
      metrics: [
        "100% elimination of double-booking race conditions",
        "30% increase in checkout conversion rate",
        "Sub-second search filter performance across 5,000+ vehicles"
      ]
    }
  },
  {
    id: "lawyer-portfolio-website",
    slug: "lawyer-portfolio-website",
    name: "Legal Practice & Consultation Portal",
    category: "Web Design & Development",
    description: "Professional web application for legal firms featuring client consultation scheduling and case highlights.",
    tech: ["React", "TypeScript", "Tailwind CSS", "Framer Motion"],
    githubUrl: "https://github.com/agentic-portfolio/lawyer-portfolio-website",
    liveUrl: "https://lawyer-portfolio.demo.app",
    caseStudy: {
      overview: "High-converting digital presence for legal professionals designed to streamline prospective client intake and case consultations.",
      problem: "Legacy legal practice websites lacked mobile responsiveness, secure client intake forms, and automated calendar scheduling.",
      solution: "Designed a modern UI with Framer Motion animations, accessible typography, and automated client intake routing.",
      architecture: [
        "Responsive React SPA crafted with Tailwind design tokens",
        "Framer Motion layout animations and smooth scroll interactions",
        "Serverless client intake API with automated email notifications"
      ],
      metrics: [
        "98/100 Google Lighthouse performance score",
        "45% increase in online consultation inquiries",
        "100% WCAG AA accessibility compliance"
      ]
    }
  }
];
