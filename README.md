# 🚂 Railway Digital Twin — Визуальный цифровой двойник локомотива

> **HackNU 2026** | Full-stack прототип дашборда «цифрового двойника» локомотива с индексом здоровья и потоковой телеметрией

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📋 Содержание

- [О проекте](#-о-проекте)
- [Архитектура](#-архитектура)
- [Функциональность](#-функциональность)
- [Стек технологий](#-стек-технологий)
- [Быстрый старт (Docker)](#-быстрый-старт-docker)
- [Запуск без Docker](#-запуск-без-docker)
- [Переменные окружения](#-переменные-окружения)
- [API документация](#-api-документация)
- [Тестирование](#-тестирование)
- [Структура проекта](#-структура-проекта)
- [Индекс здоровья](#-формула-индекса-здоровья)
- [Скриншоты](#-скриншоты)

---

## 🎯 О проекте

**Railway Digital Twin** — это full-stack веб-приложение, которое агрегирует поток телеметрии локомотива в реальном времени и превращает сотни сырых параметров в понятную, приоритизированную картину состояния.

### Ключевые возможности

- **Индекс здоровья** (0–100) — единый интегральный показатель состояния локомотива с объяснимостью (топ-5 факторов)
- **Реалтайм дашборд** — обновление по WebSocket с задержкой < 500 мс
- **Симулятор телеметрии** — генерирует реалистичные данные на 1 Гц и 10 Гц (highload)
- **Replay** — просмотр последних 15 минут истории
- **Экспорт** — CSV телеметрии и PDF рейсового отчёта
- **Диспетчерский вид** — мониторинг всего флота составов

---

## 🏗 Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
│   Кабина машиниста  │  Диспетчер  │  Исторические данные │
└───────────────┬─────────────────────────────────────────┘
                │ WebSocket / REST API
┌───────────────▼─────────────────────────────────────────┐
│               BACKEND (FastAPI + Python)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │Simulator │ │Telemetry │ │  Health  │ │  Export    │  │
│  │(mock data│ │ Router   │ │  Index   │ │  Service   │  │
│  │ 1–10 Гц) │ │(WS/SSE)  │ │ Engine   │ │(PDF/CSV)   │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└────────────┬────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────┐
│  PostgreSQL (история 72ч)  │  Redis (очередь событий)   │
└─────────────────────────────────────────────────────────┘
```

**Поток данных:**
```
Симулятор → WebSocket → Буфер + EMA-сглаживание → Индекс здоровья → UI
                                                 → PostgreSQL (история)
                                                 → Redis (pub/sub)
```

---

## ⚡ Функциональность

### Дашборд машиниста
| Панель | Параметры |
|---|---|
| **Индекс здоровья** | 0–100, цветовая индикация, топ-5 факторов |
| **Скорость** | текущая, график тренда, ограничения |
| **Топливо/Энергия** | уровень, расход, прогноз |
| **Температуры/Давления** | масло, охлаждение, тормоза |
| **Электрика** | напряжение, ток, статус |
| **Алерты** | приоритетные предупреждения, рекомендации |
| **Карта** | текущее положение на участке пути |

### Диспетчерский вид
- Список всего флота с индексами здоровья
- Статус связи каждого состава
- Критичные алерты по всем составам

### Realtime и надёжность
- WebSocket с авто-переподключением (backoff)
- EMA-сглаживание шумов (α = 0.3)
- Буферизация при разрыве соединения
- Индикатор «нет связи»
- Highload режим: x10 событий/сек

---

## 🛠 Стек технологий

| Слой | Технологии |
|---|---|
| **Frontend** | React 18, Vite, Recharts, Tailwind CSS, Socket.IO-client |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, WebSockets |
| **База данных** | PostgreSQL 15 + SQLAlchemy 2.0 (asyncpg) |
| **Очередь** | Redis 7 |
| **Миграции** | Alembic |
| **Аутентификация** | JWT (python-jose) + bcrypt (passlib) |
| **Инфра** | Docker Compose, Nginx |
| **Документация API** | OpenAPI / Swagger UI |

---

## 🐳 Быстрый старт (Docker)

### Требования
- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.20+

### 1. Клонировать репозиторий

```bash
git clone https://github.com/Kushahn/Ohio-Respect-HackNU26--Digital-Twin.git
cd railway-digital-twin
```

### 2. Настроить переменные окружения

```bash
cp backend/.env.example backend/.env
```

> Для локального запуска значения по умолчанию уже заполнены — менять ничего не нужно.

### 3. Запустить все сервисы

```bash
docker compose up --build
```

Первый запуск занимает ~3–5 минут (сборка образов).

### 4. Открыть приложение

| Сервис | URL |
|---|---|
| 🖥 **Дашборд (UI)** | http://localhost:3000 |
| 📡 **Backend API** | http://localhost:8000 |
| 📚 **Swagger UI** | http://localhost:8000/docs |
| 🗄 **pgAdmin** (опц.) | http://localhost:5050 |

### Остановить

```bash
docker compose down
```

Удалить тома с данными:

```bash
docker compose down -v
```

### Учётные данные по умолчанию

| Роль | Логин | Пароль |
|---|---|---|
| Машинист | `driver` | `driver123` |
| Диспетчер | `dispatcher` | `disp123` |
| Администратор | `admin` | `admin123` |

---

## 🔧 Запуск без Docker

### Требования

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

---
Требования — установить заранее
Git — git-scm.com

Node.js 18+ — nodejs.org (LTS версия)

Python 3.10+ — python.org (при установке отметь "Add to PATH")

PostgreSQL 15+ — postgresql.org

Redis — через Memurai (Redis для Windows) или redis.io/download

Шаг 1 — Клонировать репозиторий

git clone https://github.com/Kushahn/Ohio-Respect-HackNU26--Digital-Twin.git
cd Ohio-Respect-HackNU26--Digital-Twin\railway-digital-twin
Шаг 2 — Настроить переменные окружения
copy .env.example .env
notepad .env
В файле .env заполни:

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/railway_twin
REDIS_URL=redis://localhost:6379
SECRET_KEY=any-random-secret-string-here
NODE_ENV=development
Шаг 3 — Создать базу данных PostgreSQL
Открой SQL Shell (psql) из меню Пуск и выполни:

sql
CREATE DATABASE railway_twin;
\q
Шаг 4 — Запустить Backend
Открой первый терминал (PowerShell или CMD):

cd railway-digital-twin\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
Применить миграции и запустить сервер:

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
Backend будет доступен на http://localhost:8000

Шаг 5 — Запустить Frontend
Открой второй терминал:

cd railway-digital-twin\frontend
npm install
npm run dev
Frontend будет доступен на http://localhost:3000

Шаг 6 — Запустить Redis (Memurai)
Если установил Memurai — он запускается автоматически как служба Windows. Проверить:

memurai-cli ping
Ответ должен быть PONG.

Шаг 7 — Запустить Celery (воркер задач)
Открой третий терминал:

cd railway-digital-twin\backend
venv\Scripts\activate
celery -A core worker --loglevel=info --pool=solo
--pool=solo обязателен на Windows (стандартный fork не работает)

Шаг 8 — Запустить симулятор телеметрии
Открой четвёртый терминал:

cd railway-digital-twin\backend
venv\Scripts\activate
python manage.py simulate_telemetry

### Backend

#### 1. Перейти в папку backend

```bash
cd backend
```

#### 2. Создать и активировать виртуальное окружение

**Windows:**
```bat
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python -m venv venv
source venv/bin/activate
```

#### 3. Установить зависимости

> ⚠️ На Windows с MinGW numpy собрать из исходников нельзя — сначала ставим бинарник:

**Windows:**
```bat
pip install --only-binary=all numpy
pip install fastapi uvicorn[standard]
pip install sqlalchemy[asyncio] asyncpg alembic
pip install redis[hiredis]
pip install pydantic pydantic-settings python-dotenv
pip install python-jose[cryptography] passlib[bcrypt]
pip install scipy pandas websockets httpx
```

**macOS / Linux:**
```bash
pip install -r requirements.txt
```

#### 4. Настроить переменные окружения

```bash
cp .env.example .env
# Отредактируй .env: DATABASE_URL, REDIS_URL, SECRET_KEY
```

#### 5. Применить миграции базы данных

```bash
alembic upgrade head
```

#### 6. Запустить сервер

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend доступен: http://localhost:8000

---

### Frontend

#### 1. Перейти в папку frontend

```bash
cd frontend
```

#### 2. Установить зависимости

```bash
npm install
```

#### 3. Настроить переменные окружения

```bash
cp .env.example .env.local
# VITE_API_URL=http://localhost:8000
# VITE_WS_URL=ws://localhost:8000
```

#### 4. Запустить dev-сервер

```bash
npm run dev
```

Frontend доступен: http://localhost:3000

---

### Запуск симулятора телеметрии (опционально)

Если хочешь запустить симулятор отдельно:

```bash
cd backend
python -m app.simulator.run --hz 1       # нормальный режим
python -m app.simulator.run --hz 10      # highload x10
```

---

## 🔐 Переменные окружения

### backend/.env

```env
# База данных
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/railway_twin

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
# ⚠️ Сгенерируй случайный ключ: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# CORS (через запятую)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Симулятор
SIMULATOR_HZ=1
SIMULATOR_LOCOMOTIVES=3

# Окружение
ENVIRONMENT=development
DEBUG=true
```

> ⚠️ **Никогда не коммить `.env` в репозиторий!** Только `.env.example`.

---

## 📚 API документация

После запуска backend откройте:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

### Основные эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/auth/login` | Получить JWT токен |
| `GET` | `/api/locomotives` | Список локомотивов |
| `GET` | `/api/locomotives/{id}/telemetry` | Текущая телеметрия |
| `GET` | `/api/locomotives/{id}/history` | История (параметры: `from`, `to`, `limit`) |
| `GET` | `/api/locomotives/{id}/health` | Индекс здоровья + топ-5 факторов |
| `GET` | `/api/locomotives/{id}/alerts` | Активные алерты |
| `WS` | `/ws/telemetry/{id}` | WebSocket поток телеметрии |
| `GET` | `/api/export/{id}/csv` | Экспорт телеметрии в CSV |
| `GET` | `/api/export/{id}/pdf` | Экспорт отчёта в PDF |
| `GET` | `/health` | Health-check сервиса |

---

## 🧪 Тестирование

### Запустить все тесты

```bash
cd backend
pytest
```

### Тест highload (x10)

```bash
python -m app.simulator.run --hz 10 --duration 60
```

### Нагрузочный тест API

```bash
# Требуется locust
pip install locust
locust -f tests/locustfile.py --host=http://localhost:8000
```

---

## 📁 Структура проекта

```
railway-digital-twin/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # JWT аутентификация
│   │   │   ├── locomotives.py   # REST эндпоинты
│   │   │   ├── export.py        # CSV / PDF экспорт
│   │   │   └── websocket.py     # WebSocket хендлер
│   │   ├── core/
│   │   │   ├── config.py        # Настройки (pydantic-settings)
│   │   │   ├── database.py      # SQLAlchemy async engine
│   │   │   └── security.py      # JWT, bcrypt
│   │   ├── models/
│   │   │   ├── telemetry.py     # ORM модели
│   │   │   └── user.py
│   │   ├── services/
│   │   │   ├── health_index.py  # Алгоритм индекса здоровья
│   │   │   ├── noise_filter.py  # EMA / медианный фильтр
│   │   │   └── alert_engine.py  # Генератор алертов
│   │   ├── simulator/
│   │   │   ├── generator.py     # Генератор телеметрии
│   │   │   └── run.py           # Точка входа симулятора
│   │   └── main.py              # FastAPI приложение
│   ├── alembic/                 # Миграции БД
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/       # Дашборд машиниста
│   │   │   ├── Dispatcher/      # Диспетчерский вид
│   │   │   ├── HealthIndex/     # Виджет индекса здоровья
│   │   │   ├── Charts/          # Графики и тренды
│   │   │   └── Map/             # Карта маршрута
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts  # WebSocket с reconnect
│   │   │   └── useTelemetry.ts  # Буфер + EMA
│   │   ├── store/               # Zustand state
│   │   ├── api/                 # REST клиент
│   │   └── App.tsx
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx/
│   └── nginx.conf
└── README.md
```

---

## 📊 Формула индекса здоровья

```
HealthIndex = 100 - Σ(weight_i × penalty_i) - alert_penalty

Подиндексы и веса:
  Тяга и двигатель    25%
  Тормозная система   25%
  Температуры         20%
  Электрика           15%
  Топливо/запас хода  10%
  Скорость/маршрут     5%

Категории:
  🟢 Норма     90–100
  🟡 Внимание  70–89
  🔴 Критично   0–69
```

Конфигурация весов и порогов — в `backend/app/config/health_weights.yaml`, без перекомпиляции.

---

## 🖼 Скриншоты

| Дашборд машиниста | Диспетчерский вид |
|---|---|
| ![Кабина](docs/screenshots/cabin.jpg) | ![Диспетчер](docs/screenshots/dispatcher.jpg) |

---

## 📄 Лицензия

MIT License — см. [LICENSE](LICENSE)

---

> Разработано для **HackNU 2026** | Кейс от Казахстанских железных дорог (КТЖ)
