---
title: "live2d-agent-架构设计"
date: 2026-07-21
categories: [日记, 开发笔记]
---

最终，我决定放弃原来插件的复杂架构，直接使用兼容性更好的云服务主导，以下是最终重构后的架构设计。

## 一、核心设计理念
1.  **解耦**：核心逻辑不依赖具体厂商，通过接口与工厂模式隔离变化。
2.  **标准**：定义标准的 Input/Output Schema，REST API 作为通用协议层。
3.  **务实**：音频处理直接调用 `ffmpeg`，不引入多余的中间库。
4.  **可扩展**：当前对接小米 MiMo（ASR/TTS），但预留服务商抽象，未来可平滑切换到 OpenAI、阿里云等。
---
## 二、项目目录结构
```text
project/
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI 入口
│   ├── config.py              # 环境配置
│   │
│   ├── routers/               # 路由层：对外暴露接口
│   │   ├── __init__.py
│   │   ├── websocket.py       # 实时交互主流程
│   │   ├── stt.py             # 语音识别 REST API
│   │   ├── tts.py             # 语音合成 REST API
│   │   └── live2d.py          # Live2D 模拟接口
│   │
│   ├── services/              # 服务层：核心业务逻辑
│   │   ├── __init__.py
│   │   ├── base.py            # 抽象基类
│   │   ├── factory.py         # 服务工厂
│   │   ├── agent_service.py   # Agent 逻辑
│   │   ├── live2d_service.py  # Live2D 模拟逻辑
│   │   └── impl/              # 具体厂商实现
│   │       ├── __init__.py
│   │       ├── mimo_stt.py    # 小米 MiMo ASR 实现
│   │       └── mimo_tts.py    # 小米 MiMo TTS 实现
│   │
│   ├── models/                # 数据层：数据结构定义
│   │   ├── __init__.py
│   │   └── schemas.py         # Pydantic 模型
│   │
│   └── utils/                 # 工具层：通用辅助功能
│       ├── __init__.py
│       └── audio_helper.py    # ffmpeg 音频处理
│
├── static/                    # 前端文件
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
│
├── .env                       # 环境变量
├── requirements.txt
└── README.md
```
---
## 三、核心模块代码实现
### 1. 配置管理 (`app/config.py`)
```python
from pydantic_settings import BaseSettings
from typing import Literal
class Settings(BaseSettings):
    # ===== 服务商选择 =====
    STT_PROVIDER: Literal["mimo"] = "mimo"
    TTS_PROVIDER: Literal["mimo"] = "mimo"
    # ===== 小米 MiMo API =====
    MIMO_API_KEY: str = ""
    # ASR（语音识别）
    MIMO_ASR_URL: str = "https://api.xiaomimimo.com/v1/chat/completions"
    MIMO_ASR_MODEL: str = "mimo-v2.5-asr"
    # TTS（语音合成）
    MIMO_TTS_URL: str = "https://api.xiaomimimo.com/v1/chat/completions"
    MIMO_TTS_MODEL: str = "mimo-v2.5-tts"
    # ===== OpenCode Agent =====
    OPENCODE_API_KEY: str = ""
    OPENCODE_MODEL: str = "gpt-4"
    class Config:
        env_file = ".env"
settings = Settings()
```
---
### 2. 数据模型 (`app/models/schemas.py`)
定义全系统通用的数据结构：
```python
from pydantic import BaseModel
from typing import Optional
# ===== STT (语音转文字) =====
class STTRequest(BaseModel):
    audio_data: str       # Base64 编码
    format: str = "wav"   # 原始格式: wav / mp3 / webm
class STTResponse(BaseModel):
    text: str
# ===== TTS (文字转语音) =====
class TTSRequest(BaseModel):
    text: str
    voice_id: str = "mimo_default"  # 对应 MiMo 预置音色
class TTSResponse(BaseModel):
    audio_url: str        # 相对路径 /static/audio/xxx.wav
# ===== Agent (对话) =====
class AgentRequest(BaseModel):
    text: str
    conversation_id: Optional[str] = None
class AgentResponse(BaseModel):
    text: str
    emotion: str = "neutral"
    conversation_id: str
```
---
### 3. 工具函数 (`app/utils/audio_helper.py`)
直接调用 `ffmpeg`，处理浏览器录音格式与 API 要求格式的差异：
```python
import subprocess
import base64
import tempfile
import os
def convert_audio_to_wav(input_base64: str, input_format: str = "webm") -> str:
    """
    将前端录音转换为标准 WAV 格式 (16kHz, Mono)
    """
    audio_bytes = base64.b64decode(input_base64)
    # 创建临时文件
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{input_format}") as f_in:
        f_in.write(audio_bytes)
        input_path = f_in.name
    output_path = input_path.replace(f".{input_format}", ".wav")
    # 调用 ffmpeg
    # -y: 覆盖输出 -i: 输入文件 -ar: 采样率 -ac: 声道数
    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-ar", "16000", "-ac", "1", "-f", "wav",
        output_path
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        with open(output_path, "rb") as f:
            return base64.b64encode(f.read()).decode()
    finally:
        # 清理临时文件
        if os.path.exists(input_path): os.unlink(input_path)
        if os.path.exists(output_path): os.unlink(output_path)
```
---
### 4. 抽象基类 (`app/services/base.py`)
定义标准接口，确保未来扩展性：
```python
from abc import ABC, abstractmethod
from app.models.schemas import STTRequest, STTResponse, TTSRequest, TTSResponse
class BaseSTT(ABC):
    @abstractmethod
    async def transcribe(self, request: STTRequest) -> STTResponse:
        pass
class BaseTTS(ABC):
    @abstractmethod
    async def synthesize(self, request: TTSRequest) -> TTSResponse:
        pass
```
---
### 5. STT 实现 (`app/services/impl/mimo_stt.py`)
对接小米 MiMo ASR API，使用官方文档中的 `input_audio` 结构：
```python
import httpx
from app.services.base import BaseSTT
from app.models.schemas import STTRequest, STTResponse
from app.config import settings
class MiMoSTT(BaseSTT):
    """小米 MiMo-V2.5-ASR 实现"""
    async def transcribe(self, request: STTRequest) -> STTResponse:
        # 构造符合 MiMo ASR 文档的请求体
        payload = {
            "model": settings.MIMO_ASR_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_audio",
                            "input_audio": {
                                "data": f"data:audio/{request.format};base64,{request.audio_data}",
                                "format": request.format,
                            }
                        }
                    ]
                }
            ],
            "asr_options": {
                "language": "auto"
            }
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                settings.MIMO_ASR_URL,
                headers={
                    "Authorization": f"Bearer {settings.MIMO_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()
        # 从 MiMo 响应中取出识别文本
        text = data["choices"][0]["message"]["content"]
        return STTResponse(text=text)
```
---
### 6. TTS 实现 (`app/services/impl/mimo_tts.py`)
对接小米 MiMo TTS API，使用官方示例中的 `messages` + `audio` 结构：
```python
import httpx
import uuid
import os
from app.services.base import BaseTTS
from app.models.schemas import TTSRequest, TTSResponse
from app.config import settings
class MiMoTTS(BaseTTS):
    """小米 MiMo-V2.5-TTS 实现"""
    def __init__(self):
        # 初始化时确保音频存储目录存在
        self.audio_dir = "static/audio"
        os.makedirs(self.audio_dir, exist_ok=True)
    async def synthesize(self, request: TTSRequest) -> TTSResponse:
        # 构造符合 MiMo TTS 文档的请求体
        payload = {
            "model": settings.MIMO_TTS_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": request.text  # 这里可以扩展为风格指令
                },
                {
                    "role": "assistant",
                    "content": ""  # 实际合成文本由 assistant.content 指定，可按需调整
                }
            ],
            "audio": {
                "format": "wav",
                "voice": request.voice_id
            }
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                settings.MIMO_TTS_URL,
                headers={
                    "Authorization": f"Bearer {settings.MIMO_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()
        # 从响应中提取 Base64 音频数据（示例结构见官方文档）
        audio_b64 = data["choices"][0]["message"]["audio"]["data"]
        audio_bytes = base64.b64decode(audio_b64)
        filename = f"{uuid.uuid4()}.wav"
        filepath = os.path.join(self.audio_dir, filename)
        with open(filepath, "wb") as f:
            f.write(audio_bytes)
        return TTSResponse(audio_url=f"/static/audio/{filename}")
```
---
### 7. 服务工厂 (`app/services/factory.py`)
根据配置加载具体服务：
```python
from app.config import settings
from app.services.base import BaseSTT, BaseTTS
from app.services.impl.mimo_stt import MiMoSTT
from app.services.impl.mimo_tts import MiMoTTS
class ServiceFactory:
    @staticmethod
    def get_stt() -> BaseSTT:
        if settings.STT_PROVIDER == "mimo":
            return MiMoSTT()
        raise ValueError("Unsupported STT Provider")
    @staticmethod
    def get_tts() -> BaseTTS:
        if settings.TTS_PROVIDER == "mimo":
            return MiMoTTS()
        raise ValueError("Unsupported TTS Provider")
```
---
### 8. REST API 路由示例 (`app/routers/stt.py`)
```python
from fastapi import APIRouter, Depends
from app.models.schemas import STTRequest, STTResponse
from app.services.base import BaseSTT
from app.services.factory import ServiceFactory
from app.utils.audio_helper import convert_audio_to_wav
router = APIRouter(prefix="/api/stt", tags=["STT"])
def get_stt_service() -> BaseSTT:
    return ServiceFactory.get_stt()
@router.post("/transcribe", response_model=STTResponse)
async def speech_to_text(
    request: STTRequest, 
    stt: BaseSTT = Depends(get_stt_service)
):
    # 如果前端传的是 webm，先转 wav
    if request.format != "wav":
        request.audio_data = convert_audio_to_wav(request.audio_data, request.format)
        request.format = "wav"
    return await stt.transcribe(request)
```
---
## 四、架构流程总结
1.  **前端**：录音生成 Base64 (WebM) -> WebSocket/POST 发送。
2.  **Router**：接收 Base64 -> 调用 `audio_helper` 转 WAV（若需要）。
3.  **Service**：通过 `Factory` 获取具体实现 -> 调用云端 API (MiMo ASR/TTS)。
4.  **Agent**：处理文本 -> 返回回复与情绪。
5.  **Response**：返回 JSON 或音频 URL。