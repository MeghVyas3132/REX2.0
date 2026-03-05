#!/usr/bin/env python3
"""Generate test PDF files for REX2.0 knowledge corpus ingestion testing."""

from fpdf import FPDF
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def create_pdf(filename: str, title: str, sections: list[tuple[str, str]]):
    """Create a PDF with a title and multiple sections."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Title
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 15, title, new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(5)

    for heading, body in sections:
        # Section heading
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, heading, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

        # Section body
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6, body)
        pdf.ln(4)

    path = os.path.join(OUTPUT_DIR, filename)
    pdf.output(path)
    print(f"  Created: {path}")


# ── PDF 1: Machine Learning Fundamentals ─────────────────────────────────────
create_pdf(
    "machine_learning_fundamentals.pdf",
    "Machine Learning Fundamentals",
    [
        (
            "1. What is Machine Learning?",
            "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on developing algorithms that can access data and use it to learn for themselves. The process begins with observations or data, such as examples, direct experience, or instruction, to look for patterns in data and make better decisions in the future based on the examples provided.",
        ),
        (
            "2. Types of Machine Learning",
            "There are three main types of machine learning:\n\n"
            "Supervised Learning: The algorithm learns from labeled training data and makes predictions based on that data. Common algorithms include linear regression, logistic regression, support vector machines, and neural networks.\n\n"
            "Unsupervised Learning: The algorithm learns from unlabeled data and tries to find hidden patterns. Common algorithms include k-means clustering, hierarchical clustering, and principal component analysis (PCA).\n\n"
            "Reinforcement Learning: The algorithm learns by interacting with an environment, receiving rewards or penalties for actions taken. It is used in robotics, game playing, and autonomous vehicles.",
        ),
        (
            "3. Feature Engineering",
            "Feature engineering is the process of using domain knowledge to extract features from raw data. Features are individual measurable properties of the phenomena being observed. Good features capture the important aspects of the data and make the learning algorithm more effective. Techniques include normalization, one-hot encoding, polynomial features, and feature selection methods like mutual information and recursive feature elimination.",
        ),
        (
            "4. Model Evaluation Metrics",
            "Evaluating model performance is critical. Common metrics include:\n\n"
            "Accuracy: The ratio of correctly predicted observations to total observations.\n"
            "Precision: The ratio of correctly predicted positive observations to total predicted positives.\n"
            "Recall (Sensitivity): The ratio of correctly predicted positive observations to all actual positives.\n"
            "F1 Score: The harmonic mean of precision and recall.\n"
            "ROC-AUC: The area under the Receiver Operating Characteristic curve, measuring the model's ability to distinguish between classes.\n"
            "Mean Squared Error (MSE): Used for regression tasks, measuring average squared differences between predicted and actual values.",
        ),
        (
            "5. Overfitting and Underfitting",
            "Overfitting occurs when a model learns the training data too well, including noise and outliers, leading to poor generalization. Underfitting occurs when a model is too simple to capture the underlying pattern of the data. Techniques to combat overfitting include cross-validation, regularization (L1/L2), dropout (in neural networks), early stopping, and ensemble methods. Underfitting can be addressed by using more complex models, adding features, or reducing regularization.",
        ),
    ],
)

# ── PDF 2: Natural Language Processing ────────────────────────────────────────
create_pdf(
    "natural_language_processing.pdf",
    "Natural Language Processing: A Comprehensive Guide",
    [
        (
            "1. Introduction to NLP",
            "Natural Language Processing (NLP) is a field of artificial intelligence that gives machines the ability to read, understand, and derive meaning from human languages. It combines computational linguistics, machine learning, and deep learning to process and analyze large amounts of natural language data. Applications include machine translation, sentiment analysis, chatbots, text summarization, and named entity recognition.",
        ),
        (
            "2. Text Preprocessing",
            "Text preprocessing is a crucial step in NLP pipelines. Key techniques include:\n\n"
            "Tokenization: Splitting text into individual words or subwords.\n"
            "Stopword Removal: Removing common words (the, is, at) that add little meaning.\n"
            "Stemming: Reducing words to their root form (running -> run).\n"
            "Lemmatization: Similar to stemming but produces valid dictionary words.\n"
            "Part-of-Speech Tagging: Identifying whether each word is a noun, verb, adjective, etc.\n"
            "Named Entity Recognition (NER): Identifying entities like persons, organizations, and locations in text.",
        ),
        (
            "3. Word Embeddings",
            "Word embeddings are dense vector representations of words that capture semantic meaning. Key approaches include:\n\n"
            "Word2Vec: Developed by Google, uses skip-gram or CBOW architectures to learn word vectors from context.\n"
            "GloVe (Global Vectors): Developed by Stanford, learns embeddings from word co-occurrence statistics.\n"
            "FastText: Developed by Facebook, extends Word2Vec by representing words as bags of character n-grams.\n"
            "BERT Embeddings: Contextual embeddings from bidirectional transformer models that capture word meaning based on surrounding context.\n\n"
            "These embeddings enable mathematical operations on words, such as king - man + woman = queen.",
        ),
        (
            "4. Transformer Architecture",
            "The Transformer architecture, introduced in the paper 'Attention Is All You Need' (2017), revolutionized NLP. Key components include:\n\n"
            "Self-Attention Mechanism: Allows the model to weigh the importance of different words in a sentence relative to each other.\n"
            "Multi-Head Attention: Runs multiple attention operations in parallel, capturing different types of relationships.\n"
            "Positional Encoding: Adds information about word position since transformers process all words simultaneously.\n"
            "Feed-Forward Networks: Applied to each position separately and identically.\n\n"
            "Transformers are the foundation for models like BERT, GPT, T5, and LLaMA.",
        ),
        (
            "5. Retrieval-Augmented Generation (RAG)",
            "RAG combines retrieval-based and generative approaches. In a RAG system:\n\n"
            "1. A user query is converted into an embedding vector.\n"
            "2. The vector is used to search a knowledge base (vector database) for relevant documents.\n"
            "3. The retrieved documents are concatenated with the original query as context.\n"
            "4. A large language model generates a response grounded in the retrieved information.\n\n"
            "RAG reduces hallucination, provides up-to-date information, and allows domain-specific knowledge injection without fine-tuning. Popular vector databases include Pinecone, Weaviate, Chroma, and pgvector (PostgreSQL extension).",
        ),
    ],
)

# ── PDF 3: Cloud Architecture Best Practices ─────────────────────────────────
create_pdf(
    "cloud_architecture_best_practices.pdf",
    "Cloud Architecture Best Practices",
    [
        (
            "1. Cloud Computing Models",
            "Cloud computing offers three primary service models:\n\n"
            "Infrastructure as a Service (IaaS): Provides virtualized computing resources over the internet. Examples include AWS EC2, Google Compute Engine, and Azure Virtual Machines.\n\n"
            "Platform as a Service (PaaS): Provides a platform allowing customers to develop, run, and manage applications. Examples include Heroku, Google App Engine, and Azure App Service.\n\n"
            "Software as a Service (SaaS): Delivers software applications over the internet on a subscription basis. Examples include Salesforce, Google Workspace, and Microsoft 365.",
        ),
        (
            "2. Microservices Architecture",
            "Microservices architecture decomposes a large application into small, independent services that communicate over APIs. Benefits include independent deployment, technology diversity, fault isolation, and scalability. Challenges include distributed system complexity, data consistency, service discovery, and monitoring. Key patterns include API Gateway, Circuit Breaker, Saga Pattern for distributed transactions, and Event Sourcing with CQRS.",
        ),
        (
            "3. Containerization and Orchestration",
            "Docker containers package applications with their dependencies, ensuring consistency across environments. Key concepts:\n\n"
            "Docker Images: Read-only templates with instructions for creating containers.\n"
            "Docker Compose: Tool for defining multi-container applications.\n"
            "Kubernetes: Production-grade container orchestration platform.\n"
            "Helm Charts: Package manager for Kubernetes applications.\n\n"
            "Container orchestration handles scheduling, scaling, networking, and health management of containers across clusters.",
        ),
        (
            "4. Security Best Practices",
            "Cloud security requires a defense-in-depth approach:\n\n"
            "Identity and Access Management (IAM): Implement least privilege access with role-based access control (RBAC).\n"
            "Network Security: Use VPCs, security groups, and network ACLs to control traffic.\n"
            "Data Encryption: Encrypt data at rest and in transit using TLS/SSL and KMS.\n"
            "Secret Management: Store secrets in services like AWS Secrets Manager or HashiCorp Vault.\n"
            "Compliance and Auditing: Implement logging, monitoring, and regular audits.\n"
            "Zero Trust Architecture: Verify every request regardless of network location.",
        ),
        (
            "5. Observability and Monitoring",
            "The three pillars of observability are:\n\n"
            "Metrics: Numerical measurements over time (CPU usage, request latency, error rates). Tools include Prometheus, Grafana, and Datadog.\n\n"
            "Logs: Detailed records of events. Use structured logging (JSON format) with centralized aggregation via ELK Stack or Loki.\n\n"
            "Traces: End-to-end request tracking across distributed services. Tools include Jaeger, Zipkin, and OpenTelemetry.\n\n"
            "Service Level Objectives (SLOs) define reliability targets, while Service Level Indicators (SLIs) measure actual performance against those targets.",
        ),
    ],
)

# ── PDF 4: Data Engineering Pipeline Design ───────────────────────────────────
create_pdf(
    "data_engineering_pipelines.pdf",
    "Data Engineering Pipeline Design",
    [
        (
            "1. ETL vs ELT",
            "ETL (Extract, Transform, Load) and ELT (Extract, Load, Transform) are two approaches to data integration:\n\n"
            "ETL: Data is extracted from sources, transformed in a staging area, then loaded into the target system. Suitable when transformations are complex and the target system has limited processing power.\n\n"
            "ELT: Data is extracted and loaded directly into the target system, where transformations occur. Preferred with modern cloud data warehouses (Snowflake, BigQuery, Redshift) that have powerful processing capabilities.\n\n"
            "Modern data stacks increasingly favor ELT due to the scalability of cloud warehouses and the flexibility of transforming data in place.",
        ),
        (
            "2. Stream Processing",
            "Stream processing handles continuous data flows in real-time or near-real-time:\n\n"
            "Apache Kafka: Distributed event streaming platform for high-throughput, fault-tolerant messaging.\n"
            "Apache Flink: Framework for stateful stream processing with exactly-once semantics.\n"
            "Apache Spark Streaming: Micro-batch processing extension of Apache Spark.\n"
            "Amazon Kinesis: Fully managed real-time data streaming service.\n\n"
            "Key concepts include windowing (tumbling, sliding, session windows), watermarks for handling late data, and state management for aggregations.",
        ),
        (
            "3. Data Quality and Governance",
            "Data quality ensures data is accurate, complete, consistent, and timely. Key practices include:\n\n"
            "Data Validation: Check data types, ranges, and constraints at ingestion.\n"
            "Schema Registry: Maintain versioned schemas for data contracts.\n"
            "Data Lineage: Track data flow from source to destination.\n"
            "Data Cataloging: Maintain searchable inventory of data assets.\n"
            "Great Expectations: Open-source framework for data validation and documentation.\n"
            "dbt (data build tool): Transform data in-warehouse with built-in testing and documentation.",
        ),
        (
            "4. Orchestration Frameworks",
            "Data pipeline orchestration manages the execution of complex workflows:\n\n"
            "Apache Airflow: The most widely used open-source orchestrator. Uses DAGs (Directed Acyclic Graphs) to define workflow dependencies.\n"
            "Prefect: Modern Python-native orchestration with dynamic workflows.\n"
            "Dagster: Software-defined assets approach to data orchestration.\n"
            "Temporal: Durable execution framework for long-running workflows.\n\n"
            "DAG-based orchestration is particularly effective for workflows with complex dependencies, retry logic, and scheduling requirements. Each node in the DAG represents a task, and edges represent dependencies between tasks.",
        ),
        (
            "5. Vector Databases and Embeddings",
            "Vector databases are specialized for storing and querying high-dimensional vector embeddings:\n\n"
            "pgvector: PostgreSQL extension for vector similarity search. Supports L2 distance, inner product, and cosine distance.\n"
            "Pinecone: Fully managed vector database service.\n"
            "Weaviate: Open-source vector database with built-in vectorization.\n"
            "Chroma: Lightweight embedding database for AI applications.\n"
            "Milvus: Scalable open-source vector database.\n\n"
            "Vector search uses algorithms like HNSW (Hierarchical Navigable Small World) and IVF (Inverted File Index) for approximate nearest neighbor search. These databases are essential for RAG systems, recommendation engines, and semantic search applications.",
        ),
    ],
)

# ── PDF 5: API Design and REST Best Practices ────────────────────────────────
create_pdf(
    "api_design_best_practices.pdf",
    "API Design and REST Best Practices",
    [
        (
            "1. RESTful API Principles",
            "REST (Representational State Transfer) is an architectural style for designing networked applications. Key principles include:\n\n"
            "Resource-Based: APIs are organized around resources (nouns, not verbs).\n"
            "HTTP Methods: Use GET (read), POST (create), PUT (full update), PATCH (partial update), DELETE (remove).\n"
            "Statelessness: Each request contains all information needed to process it.\n"
            "Uniform Interface: Consistent resource identification through URIs.\n"
            "HATEOAS: Hypermedia as the Engine of Application State - responses include links to related resources.\n\n"
            "Example: GET /api/v1/workflows returns a list of workflows. POST /api/v1/workflows creates a new workflow. GET /api/v1/workflows/:id returns a specific workflow.",
        ),
        (
            "2. Authentication and Authorization",
            "Securing APIs requires robust authentication and authorization:\n\n"
            "JWT (JSON Web Tokens): Stateless tokens containing encoded claims. Consist of header, payload, and signature. Used for API authentication with access and refresh token patterns.\n\n"
            "OAuth 2.0: Authorization framework supporting multiple grant types (authorization code, client credentials, device code).\n\n"
            "API Keys: Simple authentication for server-to-server communication. Should be transmitted in headers, not URLs.\n\n"
            "RBAC (Role-Based Access Control): Assign permissions based on user roles (admin, editor, viewer).\n"
            "ABAC (Attribute-Based Access Control): Fine-grained access based on user, resource, and environment attributes.",
        ),
        (
            "3. Rate Limiting and Throttling",
            "Rate limiting protects APIs from abuse and ensures fair usage:\n\n"
            "Token Bucket: Tokens are added at a fixed rate; each request consumes a token.\n"
            "Sliding Window: Tracks requests within a moving time window.\n"
            "Fixed Window: Counts requests within fixed time intervals.\n\n"
            "Implementation typically uses Redis for distributed rate limiting. Response headers should include X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset. Return HTTP 429 (Too Many Requests) when limits are exceeded.",
        ),
        (
            "4. API Versioning Strategies",
            "API versioning ensures backward compatibility:\n\n"
            "URI Versioning: /api/v1/resource, /api/v2/resource\n"
            "Header Versioning: Accept: application/vnd.api.v1+json\n"
            "Query Parameter: /api/resource?version=1\n\n"
            "Best practices include maintaining at least two active versions, providing clear deprecation timelines, using semantic versioning for breaking changes, and documenting migration guides between versions.",
        ),
        (
            "5. Error Handling",
            "Consistent error responses improve developer experience:\n\n"
            "Use standard HTTP status codes: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Unprocessable Entity), 429 (Too Many Requests), 500 (Internal Server Error).\n\n"
            "Error response format should include: error code, human-readable message, field-specific validation errors, and a request ID for debugging.\n\n"
            "Example: { \"error\": { \"code\": \"VALIDATION_ERROR\", \"message\": \"Invalid workflow configuration\", \"details\": [{ \"field\": \"nodes\", \"message\": \"At least one node is required\" }], \"requestId\": \"req_abc123\" } }",
        ),
    ],
)

print(f"\nAll PDFs created in: {OUTPUT_DIR}")
print("Files ready for knowledge corpus ingestion via the REX UI.")
