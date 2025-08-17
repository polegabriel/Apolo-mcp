# Deco MCP Template

This is a **Deco MCP (Model Context Protocol) server** template with a **React + Tailwind CSS frontend**. It provides a full-stack development environment where:
- The `/server` folder contains the MCP server (Cloudflare Workers + Deco runtime)
- The `/view` folder contains the React frontend (Vite + Tailwind CSS)
- The server serves both MCP endpoints AND the built frontend assets

## Features

### Tools Available

1. **GET_HOLIDAYS** - Pesquisa feriados nacionais brasileiros
   - **Descrição**: Busca feriados nacionais usando a [Brasil API](https://brasilapi.com.br/docs#tag/Feriados-Nacionais)
   - **Parâmetros**: 
     - `year` (opcional): Ano para buscar feriados (padrão: ano atual)
   - **Retorno**: Lista de feriados com data, nome e tipo
   - **Exemplo de uso**:
     ```typescript
     const result = await client.GET_HOLIDAYS({ year: 2024 });
     // Retorna: { year: 2024, holidays: [...], total: 12 }
     ```

2. **ANALYZE_HOLIDAYS** - Análise inteligente de feriados para viagens
   - **Descrição**: Analisa feriados nacionais e gera sugestões de viagem, emendas e períodos ideais para férias
   - **Parâmetros**: 
     - `year` (opcional): Ano para analisar (padrão: ano atual)
   - **Retorno**: Análise completa com oportunidades de viagem, longos fins de semana, recomendações e períodos para evitar
   - **Exemplo de uso**:
     ```typescript
     const result = await client.ANALYZE_HOLIDAYS({ year: 2024 });
     // Retorna análise completa com sugestões de viagem
     ```

3. **HOLIDAY_CHAT** - Chat interativo sobre feriados
   - **Descrição**: Chat com IA para perguntas sobre feriados, emendas e sugestões de viagem
   - **Parâmetros**: 
     - `message`: Pergunta do usuário sobre feriados
     - `year` (opcional): Ano de referência (padrão: ano atual)
   - **Retorno**: Resposta da IA com sugestões adicionais
   - **Exemplo de uso**:
     ```typescript
     const result = await client.HOLIDAY_CHAT({ 
       message: "Quais feriados têm emenda com fim de semana?", 
       year: 2024 
     });
     // Retorna resposta da IA com sugestões
     ```

4. **GET_USER** - Obtém informações do usuário autenticado
5. **LIST_TODOS** - Lista todos os TODOs
6. **GENERATE_TODO_WITH_AI** - Gera um TODO usando IA
7. **TOGGLE_TODO** - Alterna o status de um TODO
8. **DELETE_TODO** - Remove um TODO

## Development

### Prerequisites
- Node.js >=18.0.0
- npm >=8.0.0
- Deno >=2.0.0
- Deco CLI installed: `deno install -Ar -g -n deco jsr:@deco/cli`

### Setup
1. `deco login` - Authenticate with deco.chat
2. `npm install` - Install all dependencies
3. `npm run configure` - Configure the app with the desired name and select its workspace
4. `npm run dev` - Start development

### Available Scripts
- `npm run dev` - Start development server
- `npm run gen` - Generate types for external integrations
- `npm run gen:self` - Generate types for your own tools/workflows
- `npm run deploy` - Deploy to production

## API Integration

### Brasil API - Feriados Nacionais

A tool foi implementada para consumir a [Brasil API](https://brasilapi.com.br/docs#tag/Feriados-Nacionais) e fornecer informações sobre feriados nacionais brasileiros.

**Endpoint utilizado**: `https://brasilapi.com.br/api/feriados/v1/{year}`

**Exemplo de resposta**:
```json
{
  "year": 2024,
  "holidays": [
    {
      "date": "2024-01-01",
      "name": "Confraternização Universal",
      "type": "nacional"
    },
    {
      "date": "2024-04-21",
      "name": "Tiradentes",
      "type": "nacional"
    }
  ],
  "total": 12
}
```

**Tipos de feriados**:
- `nacional` - Feriados nacionais
- `estadual` - Feriados estaduais
- `municipal` - Feriados municipais

## Frontend Components

### HolidaysList Component

O componente `HolidaysList` exibe uma interface amigável para visualizar feriados:

- **Seletor de ano**: Permite navegar entre anos (anterior, atual, próximo)
- **Lista de feriados**: Exibe cada feriado com data formatada e tipo
- **Badges coloridos**: Diferentes cores para cada tipo de feriado
- **Estados de loading e erro**: Interface responsiva para diferentes estados
- **Cache inteligente**: Dados são considerados frescos por 24 horas

### HolidayAnalysis Component

O componente `HolidayAnalysis` fornece análises avançadas e sugestões de viagem:

- **Melhores Oportunidades**: Identifica feriados que oferecem mais dias de folga com emendas
- **Longos Fins de Semana**: Lista períodos ideais para viagens curtas
- **Recomendações de Férias**: Sugestões baseadas em sazonalidade e preços
- **Períodos para Evitar**: Alertas sobre datas com preços elevados e muito movimento
- **Análise por Mês**: Distribuição de feriados ao longo do ano
- **Resumo Estatístico**: Visão geral com métricas importantes

### HolidayChat Component

O componente `HolidayChat` oferece um chat interativo com IA:

- **Chat Inteligente**: Interface de conversa com IA especializada em feriados
- **Sugestões Automáticas**: Oferece perguntas relacionadas após cada resposta
- **Seletor de Ano**: Permite consultar feriados de diferentes anos
- **Dicas Rápidas**: Botões para perguntas comuns sobre feriados
- **Histórico de Conversa**: Mantém o histórico da conversa
- **Respostas Contextuais**: IA responde baseada nos feriados reais do ano selecionado

## Project Structure

```
react-tailwind-view/
├── package.json          # Root workspace with dev/gen/deploy scripts
├── server/               # MCP Server (Cloudflare Workers + Deco)
│   ├── main.ts          # Main server entry point
│   ├── deco.gen.ts      # Generated types for integrations
│   ├── tools.ts         # Tool definitions (including GET_HOLIDAYS)
│   ├── wrangler.toml    # Cloudflare Workers config
│   └── package.json     # Server dependencies
└── view/                # React Frontend (Vite + Tailwind)
    ├── src/
    │   ├── main.tsx     # React app entry point
    │   ├── lib/rpc.ts   # RPC client for server communication
    │   ├── hooks/       # TanStack Query hooks for RPC calls
    │   ├── routes/      # React Router routes
    │   └── components/  # UI components (including holidays-list.tsx)
    ├── package.json     # Frontend dependencies
    └── vite.config.ts   # Vite configuration
```

## Usage Examples

### Using the GET_HOLIDAYS Tool

```typescript
// In your React component
import { useGetHolidays } from "@/hooks/useToolCalls";

function MyComponent() {
  const { data, isLoading, error } = useGetHolidays(2024);
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  
  return (
    <div>
      <h2>Feriados de {data?.year}</h2>
      <p>Total: {data?.total} feriados</p>
      {data?.holidays.map((holiday, index) => (
        <div key={index}>
          <strong>{holiday.name}</strong> - {holiday.date} ({holiday.type})
        </div>
      ))}
    </div>
  );
}
```

### Using the ANALYZE_HOLIDAYS Tool

```typescript
// In your React component
import { useAnalyzeHolidays } from "@/hooks/useToolCalls";

function TravelAnalysis() {
  const { data, isLoading, error } = useAnalyzeHolidays(2024);
  
  if (isLoading) return <div>Analisando...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  
  return (
    <div>
      <h2>Análise de Viagens {data?.year}</h2>
      
      {/* Melhores Oportunidades */}
      <div>
        <h3>Melhores Oportunidades</h3>
        {data?.analysis.bestTravelOpportunities.map((opp, index) => (
          <div key={index}>
            <strong>{opp.holiday}</strong> - {opp.daysOff} dias
            <p>{opp.recommendation}</p>
            <p>{opp.travelAdvice}</p>
          </div>
        ))}
      </div>
      
      {/* Longos Fins de Semana */}
      <div>
        <h3>Longos Fins de Semana</h3>
        {data?.analysis.longWeekends.map((weekend, index) => (
          <div key={index}>
            <strong>{weekend.description}</strong> - {weekend.totalDays} dias
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Direct RPC Calls

```typescript
import { client } from "@/lib/rpc";

// Buscar feriados do ano atual
const currentYearHolidays = await client.GET_HOLIDAYS({});

// Buscar feriados de um ano específico
const specificYearHolidays = await client.GET_HOLIDAYS({ year: 2025 });

// Analisar feriados para sugestões de viagem
const travelAnalysis = await client.ANALYZE_HOLIDAYS({ year: 2024 });

// Chat sobre feriados
const chatResponse = await client.HOLIDAY_CHAT({ 
  message: "Quais feriados têm emenda com fim de semana?", 
  year: 2024 
});
```

## Error Handling

As tools incluem tratamento robusto de erros:

- **Validação de entrada**: Ano deve estar entre 1900 e 2100
- **Tratamento de API**: Verifica status da resposta da Brasil API
- **Fallback para ano atual**: Se nenhum ano for fornecido, usa o ano atual
- **Mensagens de erro descritivas**: Informações claras sobre falhas
- **Tratamento de IA**: Fallback para respostas padrão em caso de erro na IA
- **Validação de mensagens**: Chat verifica se a mensagem não está vazia

## Performance Considerations

- **Cache de 24 horas**: Feriados não mudam frequentemente
- **Validação de entrada**: Evita chamadas desnecessárias à API
- **Tratamento de erro**: Falha graciosamente em caso de problemas de rede
- **IA Otimizada**: Usa modelo GPT-4o-mini para respostas rápidas
- **Contexto Limitado**: Envia apenas feriados relevantes para a IA
- **Sugestões Inteligentes**: Cache de sugestões comuns para respostas rápidas

## Contributing

Para adicionar novas funcionalidades:

1. Adicione a tool no arquivo `server/tools.ts`
2. Crie hooks TanStack Query em `view/src/hooks/`
3. Implemente componentes UI em `view/src/components/`
4. Execute `npm run gen:self` para gerar tipos atualizados
5. Teste a funcionalidade com `npm run dev`

## Exemplos de Uso

### Perguntas Comuns no Chat

- "Quais são os feriados nacionais de 2024?"
- "Quais feriados têm emenda com fim de semana?"
- "Qual o melhor período para tirar férias?"
- "Quais feriados oferecem mais dias de folga?"
- "Fale sobre emendas e longos fins de semana"
- "Quais são os melhores meses para viajar?"
- "Como aproveitar melhor os feriados?"

### Casos de Uso

1. **Planejamento de Viagens**: Use a análise para identificar as melhores datas
2. **Consultas Rápidas**: Chat para perguntas específicas sobre feriados
3. **Comparação de Anos**: Navegue entre anos para planejar a longo prazo
4. **Sugestões de Emendas**: Descubra como maximizar dias de folga
5. **Evitar Períodos Ruins**: Identifique datas com preços elevados

## Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Cloudflare Workers, Deco Runtime
- **UI Components**: shadcn/ui, Lucide React Icons
- **State Management**: TanStack Query (React Query)
- **Routing**: TanStack Router
- **AI Integration**: OpenAI GPT-4o-mini via Deco AI Gateway
- **API**: Brasil API para dados de feriados
- **Database**: SQLite com Drizzle ORM (para outras funcionalidades)

## License

This project is licensed under the MIT License.

---

**🎯 Funcionalidades Implementadas:**

✅ **GET_HOLIDAYS** - Lista de feriados nacionais  
✅ **ANALYZE_HOLIDAYS** - Análise inteligente para viagens  
✅ **HOLIDAY_CHAT** - Chat interativo com IA  
✅ **Interface Responsiva** - Design moderno e adaptável  
✅ **Cache Inteligente** - Performance otimizada  
✅ **Tratamento de Erros** - Experiência robusta  
✅ **Documentação Completa** - Guias de uso e exemplos  

**🚀 Pronto para uso em produção!**
