simple-llm-node/
├─ docs/
│  └─ sample.md
├─ storage/
│  └─ embeddings.json            # tạo sau khi ingest
├─ src/
│  ├─ server.js                  # Express app + routes
│  ├─ rag.js                     # split, embed, cosine search
│  ├─ providers/
│  │  ├─ bedrock.js              # chat + embeddings qua Bedrock
│  │  └─ ollama.js               # chat + embeddings qua Ollama
│  └─ util.js                    # tiện ích chung
├─ .env.example
├─ package.json
└─ README.md
