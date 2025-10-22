simple-llm-node — RAG tối giản, chạy được với Ollama hoặc Amazon Bedrock

Một bộ khởi tạo (starter) nhỏ gọn để bạn thử RAG cục bộ với Node.js.
Hỗ trợ 2 provider hoán đổi qua .env: Ollama (chạy tại chỗ, GPU/CPU) và Amazon Bedrock (managed).

simple-llm-node/<br />
├─ docs/<br />
│  └─ sample.md<br />
├─ storage/<br />
│  └─ embeddings.json            # Tạo sau khi ingest<br />
├─ src/<br />
│  ├─ server.js                  # Express app + routes<br />
│  ├─ rag.js                     # split, embed, cosine search<br />
│  ├─ providers/<br />
│  │  ├─ bedrock.js              # chat + embeddings qua Bedrock<br />
│  │  └─ ollama.js               # chat + embeddings qua Ollama<br />
│  └─ util.js                    # tiện ích chung<br />
├─ .env.example<br />
├─ package.json<br />
└─ README.md<br />

Tính năng chính

🔁 RAG pipeline tối giản: đọc Markdown → chunk → embedding → lưu embeddings.json → cosine search → augment context → chat.

🔌 Pluggable providers: chuyển qua lại Ollama / Bedrock bằng biến môi trường (không đổi code).

🧪 CLI ingest + REST API gọn nhẹ để hỏi/đáp và benchmark nhanh.

🖥️ (Tuỳ chọn) Gradio demo siêu nhanh để test UI.

Yêu cầu

Node.js ≥ 18, Yarn

Quyền chạy Ollama (nếu dùng Ollama) hoặc quyền gọi Bedrock (nếu dùng Bedrock)

Windows / macOS / Linux đều OK

Cài đặt nhanh
# 1) Clone & cài dependency
yarn install

# 2) Tạo file .env từ mẫu
cp .env.example .env

# 3) (Nếu dùng Ollama) kéo model chat + embedding
#   Ví dụ model chat: llama3.1, qwen2.5, deepseek-r1:8b (tuỳ bạn)
#   Ví dụ model embed: nomic-embed-text:latest hoặc bge-m3
ollama pull llama3.1
ollama pull nomic-embed-text

# 4) Ingest tài liệu (mặc định đọc thư mục ./docs)
yarn run ingest

# 5) Chạy server
yarn run dev


Tip: Trên Windows, đảm bảo Ollama đang chạy (dịch vụ nền). Nếu ollama run báo không thấy model, hãy ollama pull <model> trước.

Cấu hình .env

Sao chép từ .env.example và chỉnh phù hợp:

# Provider: 'ollama' hoặc 'bedrock'
PROVIDER=ollama

# --------- OLLAMA ----------
OLLAMA_BASE_URL=http://127.0.0.1:11434<br />
OLLAMA_CHAT_MODEL=llama3.1         # hoặc qwen2.5, deepseek-r1:8b, ...<br />
OLLAMA_EMBED_MODEL=nomic-embed-text # hoặc bge-m3, mxbai-embed-large, ...<br />

# --------- BEDROCK ---------
BEDROCK_REGION=us-east-1
BEDROCK_CHAT_MODEL=anthropic.claude-3-haiku-20240307-v1:0
BEDROCK_EMBED_MODEL=amazon.titan-embed-text-v1
# BEDROCK_MAX_TOKENS=1024           # tuỳ chọn: giới hạn token đầu ra
# BEDROCK_TEMPERATURE=0.7           # tuỳ chọn: điều chỉnh nhiệt độ
# BEDROCK_SYSTEM_PROMPT="Bạn là trợ lý hữu ích" # tuỳ chọn: system prompt
# AWS_PROFILE=default               # nếu dùng profile cục bộ (~/.aws/credentials)
# AWS_SDK_LOAD_CONFIG=1             # cần bật khi dùng profile

# --------- APP / RAG --------
PORT=3000<br />
DOCS_DIR=./docs<br />
EMBEDDINGS_PATH=./storage/embeddings.json<br />
CHUNK_SIZE=1000<br />
CHUNK_OVERLAP=120<br />
TOP_K=5<br />


Gợi ý embedding đa ngôn ngữ (Ollama): bge-m3, multilingual-e5-large (nếu có), hoặc nomic-embed-text (tổng quát, nhanh).
Bedrock: titan-embed-text-v1/v2 là lựa chọn cân bằng cho đa ngôn ngữ phổ biến.

Scripts tiện dụng (trong package.json)
{ 
  "scripts": {
    "dev": "node src/server.js",
    "ingest": "node src/server.js --ingest"
  }
}


yarn run ingest → đọc DOCS_DIR, cắt đoạn, tạo vector, lưu EMBEDDINGS_PATH

yarn run dev → mở REST API

Cách hoạt động (RAG pipeline)

Load tất cả *.md trong DOCS_DIR

Chunk theo CHUNK_SIZE, CHUNK_OVERLAP

Embed mỗi chunk bằng provider đã cấu hình

Persist vào EMBEDDINGS_PATH (gồm vectors + metadata)

Lúc /api/ask:

Cosine search top K

Context compression (gộp + cắt bớt)

Prompt augmentation → gửi tới chat model

Trả về answer + citations (nguồn chunk)

REST API
Sức khoẻ
GET /health


→ { status: "ok" }

Ingest lại (nếu bạn cập nhật docs)
POST /api/ingest
Body (tuỳ chọn): { "dir": "./docs" }

Hỏi/Đáp
POST /api/ask
Content-Type: application/json

{
  "question": "Qua 0h Ca2 thì quy chiếu ngày nào?",
  "topK": 5
}


Ví dụ cURL

curl -s http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"Ngưỡng R tối đa của BAT-12V-100Ah là bao nhiêu?"}'

Ingest tài liệu mẫu nhanh

Đặt file vào docs/, ví dụ docs/sample.md, hoặc dùng bộ RAG Test Corpus — ACME bạn đã tạo.
Sau đó:

yarn run ingest


Kết quả sẽ xuất hiện trong storage/embeddings.json.

Dùng Ollama

Cài Ollama và chạy daemon.

Kéo model chat và embed:

ollama pull llama3.1
ollama pull nomic-embed-text    # hoặc bge-m3


Kiểm tra nhanh:

ollama run llama3.1
ollama run nomic-embed-text


Đặt PROVIDER=ollama trong .env.

Lỗi thường gặp

Error: pull model manifest: file does not exist → Tên model sai hoặc bạn đang trỏ tới file cục bộ mà chưa tạo Modelfile.
Ví dụ dùng file GGUF cục bộ:

# Modelfile (cùng thư mục .gguf)
FROM ./DeepSeek-R1-0528-Qwen3-8B-Q3_K_M.gguf


Rồi: ollama create mylocal-r1 -f Modelfile → OLLAMA_CHAT_MODEL=mylocal-r1.

ollama run not working / không thấy model → Chưa pull hoặc daemon chưa chạy.