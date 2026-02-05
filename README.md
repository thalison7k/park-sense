# 🚗 ParkSense - Sistema IoT de Monitoramento de Estacionamento

[![GAMATEC](https://img.shields.io/badge/GAMATEC-Digital%20Spark-blue)](https://gamatec-digital-spark.lovable.app/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-REST%20Framework-green)](https://www.django-rest-framework.org/)
[![MQTT](https://img.shields.io/badge/MQTT-Mosquitto-orange)](https://mosquitto.org/)

## 📋 Visão Geral

**ParkSense** é uma Prova de Conceito (PoC) de um sistema IoT para monitoramento de vagas de estacionamento em tempo real. O sistema utiliza sensores físicos conectados a microcontroladores que comunicam via MQTT com um backend Django, exibindo os dados em um dashboard web moderno e responsivo.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ARQUITETURA IoT                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     MQTT      ┌──────────────┐     REST     ┌──────────┐ │
│  │   Sensores   │ ───────────▶  │   Backend    │ ───────────▶ │ Frontend │ │
│  │  ESP32/8266  │               │   Django     │              │  React   │ │
│  └──────────────┘               └──────────────┘              └──────────┘ │
│         │                              │                            │       │
│         │                              │                            │       │
│         ▼                              ▼                            ▼       │
│  ┌──────────────┐               ┌──────────────┐              ┌──────────┐ │
│  │   Sensores   │               │  PostgreSQL  │              │  Proxy   │ │
│  │ Ultrassônico │               │   Database   │              │  Edge Fn │ │
│  │  Infraverm.  │               └──────────────┘              └──────────┘ │
│  │  Reed Switch │                                                           │
│  └──────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Componentes Principais

| Camada | Tecnologia | Responsabilidade |
|--------|------------|------------------|
| **Sensores** | ESP32/ESP8266 | Detecção de ocupação das vagas |
| **Comunicação** | MQTT (Mosquitto) | Transmissão de dados dos sensores |
| **Backend** | Django + DRF | API REST, processamento e persistência |
| **Banco de Dados** | PostgreSQL | Armazenamento de histórico e configurações |
| **Frontend** | React + TypeScript | Dashboard de visualização em tempo real |
| **Proxy** | Supabase Edge Functions | Contorna CORS para comunicação cross-origin |

---

## 🔄 Fluxo de Dados

### 1. Coleta de Dados (Sensores → MQTT)

```
Sensor Ultrassônico
        │
        ▼
   ESP32/ESP8266
        │
        │ Publica em: pi5/estacionamento/vaga/{id}
        ▼
   MQTT Broker (test.mosquitto.org)
```

**Payload MQTT:**
```json
{
  "vaga": "A01",
  "ocupada": true,
  "timestamp": "2025-02-05T19:30:00Z"
}
```

### 2. Processamento (MQTT → Django)

```python
# Backend Django subscreve ao tópico MQTT
# Topic: pi5/estacionamento/vaga/#

def on_message(client, userdata, msg):
    data = json.loads(msg.payload)
    VagaHistorico.objects.create(
        vaga_id=data['vaga'],
        ocupada=data['ocupada'],
        data_hora=data['timestamp']
    )
```

### 3. API REST (Django → Frontend)

**Endpoint:** `GET /vaga{id}.json`

**Resposta:**
```json
[
  {
    "data_hora": "2025-02-05T19:30:00Z",
    "ocupada": "True"
  },
  {
    "data_hora": "2025-02-05T19:25:00Z",
    "ocupada": "False"
  }
]
```

### 4. Visualização (Frontend)

```typescript
// Hook useVagas busca dados via proxy
const { spots, stats, isConnected } = useVagas({
  useMockData: false,
  refreshInterval: 5000
});
```

---

## 📁 Estrutura do Projeto

### Frontend (React + TypeScript)

```
src/
├── components/
│   ├── dashboard/
│   │   ├── Header.tsx           # Cabeçalho com status de conexão
│   │   ├── ParkingGrid.tsx      # Grid de vagas
│   │   ├── ParkingSpotCard.tsx  # Card individual de vaga
│   │   ├── StatsCard.tsx        # Cards de estatísticas
│   │   ├── MetricsPanel.tsx     # Painel de métricas
│   │   ├── OccupancyChart.tsx   # Gráfico de ocupação
│   │   ├── SensorControls.tsx   # Controles de sensores
│   │   └── ConnectionStatus.tsx # Status de conexões
│   └── ui/                      # Componentes shadcn/ui
├── hooks/
│   ├── useVagas.ts              # Hook principal de dados
│   ├── useMetrics.ts            # Cálculo de métricas
│   ├── useTheme.ts              # Tema claro/escuro
│   └── useAccessibility.ts      # Acessibilidade
├── services/
│   ├── api.ts                   # Cliente da API
│   └── metricsService.ts        # Serviço de métricas
├── types/
│   └── parking.ts               # Tipos TypeScript
├── data/
│   └── mockParkingData.ts       # Dados mock para desenvolvimento
└── pages/
    └── Index.tsx                # Página principal
```

### Backend (Django + DRF)

```
backend/
├── parksense/
│   ├── settings.py              # Configurações Django
│   ├── urls.py                  # Rotas principais
│   └── wsgi.py
├── vagas/
│   ├── models.py                # Modelo VagaHistorico
│   ├── views.py                 # ViewSets da API
│   ├── serializers.py           # Serializers DRF
│   ├── mqtt_client.py           # Cliente MQTT
│   └── urls.py                  # Rotas da API
├── docs/
│   └── swagger.yaml             # Documentação OpenAPI
└── manage.py
```

### Edge Functions (Supabase)

```
supabase/
├── functions/
│   └── proxy-vagas/
│       └── index.ts             # Proxy para contornar CORS
└── config.toml                  # Configuração Supabase
```

---

## 🔌 API REST - Documentação OpenAPI

### Base URL
```
https://{ngrok-url}/
```

### Endpoints

#### GET /vaga{id}.json
Retorna histórico de ocupação de uma vaga específica.

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| id | string | ID da vaga (ex: A01, A02, ..., A40) |

**Resposta 200:**
```json
[
  {
    "data_hora": "2025-02-05T19:30:00Z",
    "ocupada": "True"
  }
]
```

**Exemplo cURL:**
```bash
curl -X GET "https://your-ngrok.ngrok-free.app/vagaA01.json" \
  -H "Accept: application/json" \
  -H "ngrok-skip-browser-warning: true"
```

### Swagger/OpenAPI

Para habilitar documentação Swagger no Django:

```python
# settings.py
INSTALLED_APPS = [
    'rest_framework',
    'drf_yasg',  # Swagger/OpenAPI
    'corsheaders',
]

# urls.py
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="ParkSense API",
        default_version='v1',
        description="API de monitoramento de vagas de estacionamento",
    ),
    public=True,
)

urlpatterns = [
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0)),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0)),
]
```

Acesse em:
- `GET /swagger/` - Interface Swagger UI
- `GET /redoc/` - Interface ReDoc

---

## 🛠️ Decisões Técnicas

### 1. Comunicação via MQTT

**Por quê MQTT?**
- Protocolo leve, ideal para IoT
- Baixo consumo de banda e energia
- Padrão pub/sub adequado para sensores
- Broker público para PoC (test.mosquitto.org)

**Tópico utilizado:**
```
pi5/estacionamento/vaga/#
```

### 2. Proxy Edge Function

**Problema:** CORS bloqueia requisições do frontend para ngrok.

**Solução:** Edge Function como proxy intermediário.

```typescript
// supabase/functions/proxy-vagas/index.ts
const response = await fetch(backendUrl, {
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'ParkSense-Proxy/1.0',
  },
});
```

### 3. Polling vs WebSocket

**Escolha:** Polling com intervalo de 5 segundos.

**Justificativa:**
- Simplicidade de implementação
- Backend não suporta WebSocket nativamente
- Frequência adequada para monitoramento de vagas
- Menor complexidade de infraestrutura

### 4. Cálculo de Métricas no Frontend

**Abordagem híbrida:**
- Métricas em tempo real: calculadas no frontend
- Relatórios históricos: calculados no backend

```typescript
// Hook useMetrics calcula:
// - Tempo médio de ocupação
// - Taxa de ocupação por hora
// - Horários de pico
```

### 5. Fallback para Dados Mock

```typescript
const { spots } = useVagas({ 
  useMockData: false,  // true para desenvolvimento sem backend
  refreshInterval: 5000 
});
```

---

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- ngrok (para exposição do backend)

### Frontend

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Backend

```bash
# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependências
pip install django djangorestframework drf-yasg django-cors-headers paho-mqtt psycopg2-binary

# Aplicar migrações
python manage.py migrate

# Executar servidor
python manage.py runserver 8000

# Expor via ngrok (em outro terminal)
ngrok http 8000
```

### Configuração CORS (Django settings.py)

```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
    'rest_framework',
    'drf_yasg',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Deve ser o primeiro!
    # ...
]

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_HEADERS = ['*']
```

### Variáveis de Ambiente

**Frontend (.env):**
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx
```

**Backend (.env):**
```env
DEBUG=True
DATABASE_URL=postgres://user:pass@localhost:5432/parksense
MQTT_BROKER=test.mosquitto.org
MQTT_TOPIC=pi5/estacionamento/vaga/#
```

---

## 📊 Métricas e Monitoramento

### Métricas Disponíveis

| Métrica | Descrição |
|---------|-----------|
| **Vagas Livres** | Contagem em tempo real |
| **Vagas Ocupadas** | Contagem em tempo real |
| **Taxa de Ocupação** | Percentual de ocupação |
| **Tempo Médio** | Duração média de ocupação |
| **Horários de Pico** | Top 3 horas mais movimentadas |

### Dashboard Features

- Grid visual das 40 vagas com status colorido
- Cards com estatísticas resumidas
- Gráfico de ocupação por hora (Recharts)
- Status de conexão com backend
- Painel de métricas detalhadas
- Suporte a tema claro/escuro
- Responsivo para mobile

---

## 🎨 Design System

### Cores (Design Tokens)

```css
:root {
  --primary: 142.1 76.2% 36.3%;     /* Verde principal */
  --success: 142.1 76.2% 36.3%;     /* Vaga livre */
  --destructive: 0 84.2% 60.2%;     /* Vaga ocupada */
  --warning: 38 92% 50%;            /* Sensor inativo */
}
```

### Stack de UI

- **shadcn/ui** - Componentes base acessíveis
- **Tailwind CSS** - Estilização utility-first
- **Lucide Icons** - Ícones consistentes
- **Recharts** - Gráficos responsivos

---

## 🔒 Segurança

### Práticas Implementadas

1. **CORS configurado** no backend Django
2. **Headers customizados** para bypass ngrok
3. **Validação de entrada** com Zod
4. **Proxy Edge Function** isolando backend
5. **Design tokens** para consistência visual

### Recomendações para Produção

- [ ] Implementar autenticação JWT
- [ ] Usar HTTPS com certificado válido
- [ ] Configurar rate limiting
- [ ] Implementar logs de auditoria
- [ ] Adicionar monitoramento APM
- [ ] Trocar ngrok por servidor de produção

---

## 📚 Roadmap

- [x] Dashboard de monitoramento em tempo real
- [x] Tempo médio de ocupação + Gráficos
- [x] Proxy Edge Function para CORS
- [x] Documentação de arquitetura (README)
- [ ] Relatórios avançados (CSV/PDF)
- [ ] Alertas inteligentes customizáveis
- [ ] Histórico e auditoria com timeline
- [ ] Previsão de ocupação (ML)
- [ ] Acessibilidade avançada (WCAG 2.1)

---

## 👥 Equipe

**GAMATEC — Digital Spark**

Projeto desenvolvido como Prova de Conceito para demonstrar integração IoT com tecnologias modernas de desenvolvimento web.

---

## 📄 Licença

Este projeto é uma PoC educacional. Consulte a equipe GAMATEC para uso comercial.

---

<p align="center">
  <strong>GAMATEC</strong> — PIV © 2025
</p>
