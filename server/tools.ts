/**
 * This is where you define your tools.
 *
 * Tools are the functions that will be available on your
 * MCP server. They can be called from any other Deco app
 * or from your front-end code via typed RPC. This is the
 * recommended way to build your Web App.
 *
 * @see https://docs.deco.page/en/guides/creating-tools/
 */
import { createPrivateTool, createTool } from "@deco/workers-runtime/mastra";
import { z } from "zod";
import type { Env } from "./main.ts";
import { todosTable } from "./schema.ts";
import { getDb } from "./db.ts";
import { eq } from "drizzle-orm";

/**
 * `createPrivateTool` is a wrapper around `createTool` that
 * will call `env.DECO_CHAT_REQUEST_CONTEXT.ensureAuthenticated`
 * before executing the tool.
 *
 * It automatically returns a 401 error if valid user credentials
 * are not present in the request. You can also call it manually
 * to get the user object.
 */
export const createGetUserTool = (env: Env) =>
  createPrivateTool({
    id: "GET_USER",
    description: "Get the current logged in user",
    inputSchema: z.object({}),
    outputSchema: z.object({
      id: z.string(),
      name: z.string().nullable(),
      avatar: z.string().nullable(),
      email: z.string(),
    }),
    execute: async () => {
      const user = env.DECO_CHAT_REQUEST_CONTEXT.ensureAuthenticated();

      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user.id,
        name: user.user_metadata.full_name,
        avatar: user.user_metadata.avatar_url,
        email: user.email,
      };
    },
  });

/**
 * This tool is declared as public and can be executed by anyone
 * that has access to your MCP server.
 */
export const createListTodosTool = (env: Env) =>
  createTool({
    id: "LIST_TODOS",
    description: "List all todos",
    inputSchema: z.object({}),
    outputSchema: z.object({
      todos: z.array(
        z.object({
          id: z.number(),
          title: z.string().nullable(),
          completed: z.boolean(),
        }),
      ),
    }),
    execute: async () => {
      const db = await getDb(env);
      const todos = await db.select().from(todosTable);
      return {
        todos: todos.map((todo) => ({
          ...todo,
          completed: todo.completed === 1,
        })),
      };
    },
  });

const TODO_GENERATION_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "The title of the todo",
    },
  },
  required: ["title"],
};

export const createGenerateTodoWithAITool = (env: Env) =>
  createPrivateTool({
    id: "GENERATE_TODO_WITH_AI",
    description: "Generate a todo with AI",
    inputSchema: z.object({}),
    outputSchema: z.object({
      todo: z.object({
        id: z.number(),
        title: z.string().nullable(),
        completed: z.boolean(),
      }),
    }),
    execute: async () => {
      const db = await getDb(env);
      const generatedTodo = await env.DECO_CHAT_WORKSPACE_API
        .AI_GENERATE_OBJECT({
          model: "openai:gpt-4.1-mini",
          messages: [
            {
              role: "user",
              content:
                "Generate a funny TODO title that i can add to my TODO list! Keep it short and sweet, a maximum of 10 words.",
            },
          ],
          temperature: 0.9,
          schema: TODO_GENERATION_SCHEMA,
        });

      const generatedTodoTitle = String(generatedTodo.object?.title);

      if (!generatedTodoTitle) {
        throw new Error("Failed to generate todo");
      }

      const todo = await db.insert(todosTable).values({
        title: generatedTodoTitle,
        completed: 0,
      }).returning({ id: todosTable.id });

      return {
        todo: {
          id: todo[0].id,
          title: generatedTodoTitle,
          completed: false,
        },
      };
    },
  });

export const createToggleTodoTool = (env: Env) =>
  createPrivateTool({
    id: "TOGGLE_TODO",
    description: "Toggle a todo's completion status",
    inputSchema: z.object({
      id: z.number(),
    }),
    outputSchema: z.object({
      todo: z.object({
        id: z.number(),
        title: z.string().nullable(),
        completed: z.boolean(),
      }),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      // First get the current todo
      const currentTodo = await db.select().from(todosTable).where(
        eq(todosTable.id, context.id),
      ).limit(1);

      if (currentTodo.length === 0) {
        throw new Error("Todo not found");
      }

      // Toggle the completed status
      const newCompletedStatus = currentTodo[0].completed === 1 ? 0 : 1;

      const updatedTodo = await db.update(todosTable)
        .set({ completed: newCompletedStatus })
        .where(eq(todosTable.id, context.id))
        .returning();

      return {
        todo: {
          id: updatedTodo[0].id,
          title: updatedTodo[0].title,
          completed: updatedTodo[0].completed === 1,
        },
      };
    },
  });

export const createDeleteTodoTool = (env: Env) =>
  createPrivateTool({
    id: "DELETE_TODO",
    description: "Delete a todo",
    inputSchema: z.object({
      id: z.number(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      deletedId: z.number(),
    }),
    execute: async ({ context }) => {
      const db = await getDb(env);

      // First check if the todo exists
      const existingTodo = await db.select().from(todosTable).where(
        eq(todosTable.id, context.id),
      ).limit(1);

      if (existingTodo.length === 0) {
        throw new Error("Todo not found");
      }

      // Delete the todo
      await db.delete(todosTable).where(eq(todosTable.id, context.id));

      return {
        success: true,
        deletedId: context.id,
      };
    },
  });

/**
 * Tool para pesquisar feriados nacionais usando a Brasil API
 * @see https://brasilapi.com.br/docs#tag/Feriados-Nacionais
 */
export const createGetHolidaysTool = (env: Env) =>
  createTool({
    id: "GET_HOLIDAYS",
    description: "Pesquisa feriados nacionais brasileiros por ano usando a Brasil API",
    inputSchema: z.object({
      year: z.number().min(1900).max(2100).optional().default(new Date().getFullYear()),
    }),
    outputSchema: z.object({
      year: z.number(),
      holidays: z.array(
        z.object({
          date: z.string(),
          name: z.string(),
          type: z.string(),
        })
      ),
      total: z.number(),
    }),
    execute: async ({ context }) => {
      const year = context.year || new Date().getFullYear();
      
      try {
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        
        const holidays = await response.json();
        
        return {
          year,
          holidays: holidays.map((holiday: any) => ({
            date: holiday.date,
            name: holiday.name,
            type: holiday.type,
          })),
          total: holidays.length,
        };
      } catch (error) {
        console.error("Erro ao buscar feriados:", error);
        throw new Error(`Falha ao buscar feriados para o ano ${year}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    },
  });

/**
 * Tool para analisar feriados e gerar sugestões de viagem e emendas
 */
export const createAnalyzeHolidaysTool = (env: Env) =>
  createTool({
    id: "ANALYZE_HOLIDAYS",
    description: "Analisa feriados nacionais e gera sugestões de viagem, emendas e períodos ideais para férias",
    inputSchema: z.object({
      year: z.number().min(1900).max(2100).optional().default(new Date().getFullYear()),
    }),
    outputSchema: z.object({
      year: z.number(),
      analysis: z.object({
        bestTravelOpportunities: z.array(
          z.object({
            holiday: z.string(),
            date: z.string(),
            weekendConnection: z.string(),
            daysOff: z.number(),
            recommendation: z.string(),
            travelAdvice: z.string(),
          })
        ),
        longWeekends: z.array(
          z.object({
            startDate: z.string(),
            endDate: z.string(),
            totalDays: z.number(),
            description: z.string(),
            type: z.enum(["excellent", "good", "fair"]),
          })
        ),
        vacationRecommendations: z.array(
          z.object({
            period: z.string(),
            reason: z.string(),
            duration: z.string(),
            bestFor: z.string(),
          })
        ),
        avoidPeriods: z.array(
          z.object({
            period: z.string(),
            reason: z.string(),
            alternative: z.string(),
          })
        ),
        summary: z.object({
          totalHolidays: z.number(),
          bestMonths: z.array(z.string()),
          worstMonths: z.array(z.string()),
          totalLongWeekends: z.number(),
        }),
      }),
    }),
    execute: async ({ context }) => {
      const year = context.year || new Date().getFullYear();
      
      try {
        // Buscar feriados
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        
        const holidays = await response.json();
        
        // Função para verificar se uma data é fim de semana
        const isWeekend = (dateString: string) => {
          const date = new Date(dateString);
          const day = date.getDay();
          return day === 0 || day === 6; // 0 = domingo, 6 = sábado
        };
        
        // Função para calcular dias entre duas datas
        const daysBetween = (date1: string, date2: string) => {
          const d1 = new Date(date1);
          const d2 = new Date(date2);
          const diffTime = Math.abs(d2.getTime() - d1.getTime());
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        };
        
        // Função para adicionar dias a uma data
        const addDays = (dateString: string, days: number) => {
          const date = new Date(dateString);
          date.setDate(date.getDate() + days);
          return date.toISOString().split('T')[0];
        };
        
        // Analisar cada feriado
        const bestTravelOpportunities = holidays
          .filter((holiday: any) => holiday.type === 'nacional')
          .map((holiday: any) => {
            const holidayDate = new Date(holiday.date);
            const dayOfWeek = holidayDate.getDay();
            
            let weekendConnection = '';
            let daysOff = 1;
            let recommendation = '';
            let travelAdvice = '';
            
            // Verificar se o feriado cai em uma segunda-feira (emenda com domingo)
            if (dayOfWeek === 1) {
              weekendConnection = 'Segunda-feira - emenda com domingo';
              daysOff = 2;
              recommendation = 'Excelente oportunidade para viagem de fim de semana prolongado';
              travelAdvice = 'Considere sair na sexta-feira à noite para aproveitar 4 dias';
            }
            // Verificar se o feriado cai em uma sexta-feira (emenda com sábado)
            else if (dayOfWeek === 5) {
              weekendConnection = 'Sexta-feira - emenda com sábado';
              daysOff = 2;
              recommendation = 'Ótima oportunidade para viagem de fim de semana prolongado';
              travelAdvice = 'Considere retornar na segunda-feira para aproveitar 4 dias';
            }
            // Verificar se o feriado cai em uma terça-feira (emenda com segunda)
            else if (dayOfWeek === 2) {
              weekendConnection = 'Terça-feira - emenda com segunda-feira';
              daysOff = 3;
              recommendation = 'Oportunidade excepcional para viagem de 5 dias';
              travelAdvice = 'Tire segunda-feira e aproveite 5 dias consecutivos';
            }
            // Verificar se o feriado cai em uma quinta-feira (emenda com sexta)
            else if (dayOfWeek === 4) {
              weekendConnection = 'Quinta-feira - emenda com sexta-feira';
              daysOff = 3;
              recommendation = 'Oportunidade excepcional para viagem de 5 dias';
              travelAdvice = 'Tire sexta-feira e aproveite 5 dias consecutivos';
            }
            // Feriado no meio da semana
            else if (dayOfWeek === 3) {
              weekendConnection = 'Quarta-feira - feriado isolado';
              daysOff = 1;
              recommendation = 'Feriado isolado - considere tirar terça e quinta para 5 dias';
              travelAdvice = 'Tire terça e quinta-feira para criar uma semana de férias';
            }
            // Feriado no fim de semana
            else {
              weekendConnection = 'Fim de semana - sem emenda';
              daysOff = 1;
              recommendation = 'Feriado no fim de semana - sem benefício adicional';
              travelAdvice = 'Considere outros feriados para viagens mais longas';
            }
            
            return {
              holiday: holiday.name,
              date: holiday.date,
              weekendConnection,
              daysOff,
              recommendation,
              travelAdvice,
            };
          })
          .filter((opp: any) => opp.daysOff > 1) // Filtrar apenas oportunidades com mais de 1 dia
          .sort((a: any, b: any) => b.daysOff - a.daysOff); // Ordenar por dias de folga
        
        // Identificar longos fins de semana
        const longWeekends = holidays
          .filter((holiday: any) => holiday.type === 'nacional')
          .map((holiday: any) => {
            const holidayDate = new Date(holiday.date);
            const dayOfWeek = holidayDate.getDay();
            
            if (dayOfWeek === 1) { // Segunda-feira
              return {
                startDate: addDays(holiday.date, -2), // Sábado
                endDate: holiday.date, // Segunda
                totalDays: 4,
                description: `${holiday.name} - Segunda-feira`,
                type: 'excellent' as const,
              };
            } else if (dayOfWeek === 5) { // Sexta-feira
              return {
                startDate: holiday.date, // Sexta
                endDate: addDays(holiday.date, 2), // Domingo
                totalDays: 4,
                description: `${holiday.name} - Sexta-feira`,
                type: 'excellent' as const,
              };
            } else if (dayOfWeek === 2) { // Terça-feira
              return {
                startDate: addDays(holiday.date, -3), // Sábado
                endDate: holiday.date, // Terça
                totalDays: 5,
                description: `${holiday.name} - Terça-feira (com segunda)`,
                type: 'excellent' as const,
              };
            } else if (dayOfWeek === 4) { // Quinta-feira
              return {
                startDate: holiday.date, // Quinta
                endDate: addDays(holiday.date, 3), // Domingo
                totalDays: 5,
                description: `${holiday.name} - Quinta-feira (com sexta)`,
                type: 'excellent' as const,
              };
            }
            return null;
          })
          .filter(Boolean)
          .sort((a: any, b: any) => b.totalDays - a.totalDays);
        
        // Gerar recomendações de férias
        const vacationRecommendations = [
          {
            period: "Janeiro - Fevereiro",
            reason: "Após as festas de fim de ano, período mais tranquilo",
            duration: "2-3 semanas",
            bestFor: "Destinos nacionais, praias, montanhas",
          },
          {
            period: "Junho - Julho",
            reason: "Férias escolares, clima mais ameno no sul",
            duration: "2-4 semanas",
            bestFor: "Viagens internacionais, Europa, destinos frios",
          },
          {
            period: "Setembro - Outubro",
            reason: "Baixa temporada, preços mais acessíveis",
            duration: "1-2 semanas",
            bestFor: "Destinos nacionais, ecoturismo",
          },
        ];
        
        // Períodos para evitar
        const avoidPeriods = [
          {
            period: "Dezembro",
            reason: "Alta temporada, preços elevados, muito movimento",
            alternative: "Janeiro ou fevereiro para destinos de verão",
          },
          {
            period: "Julho (segunda quinzena)",
            reason: "Férias escolares, destinos lotados",
            alternative: "Junho ou agosto para destinos internacionais",
          },
          {
            period: "Carnaval",
            reason: "Preços exorbitantes, muito movimento",
            alternative: "Semana Santa ou outros feriados prolongados",
          },
        ];
        
        // Análise por mês
        const holidaysByMonth = holidays.reduce((acc: any, holiday: any) => {
          const month = new Date(holiday.date).getMonth();
          const monthName = new Date(0, month).toLocaleDateString('pt-BR', { month: 'long' });
          acc[monthName] = (acc[monthName] || 0) + 1;
          return acc;
        }, {});
        
        const bestMonths = Object.entries(holidaysByMonth)
          .sort(([,a]: any, [,b]: any) => b - a)
          .slice(0, 3)
          .map(([month]: any) => month);
        
        const worstMonths = Object.entries(holidaysByMonth)
          .sort(([,a]: any, [,b]: any) => a - b)
          .slice(0, 3)
          .map(([month]: any) => month);
        
        return {
          year,
          analysis: {
            bestTravelOpportunities,
            longWeekends,
            vacationRecommendations,
            avoidPeriods,
            summary: {
              totalHolidays: holidays.length,
              bestMonths,
              worstMonths,
              totalLongWeekends: longWeekends.length,
            },
          },
        };
      } catch (error) {
        console.error("Erro ao analisar feriados:", error);
        throw new Error(`Falha ao analisar feriados para o ano ${year}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    },
  });

/**
 * Tool para chat sobre feriados usando IA
 */
export const createHolidayChatTool = (env: Env) =>
  createTool({
    id: "HOLIDAY_CHAT",
    description: "Chat interativo para perguntas sobre feriados, emendas e sugestões de viagem",
    inputSchema: z.object({
      message: z.string().min(1, "Mensagem não pode estar vazia"),
      year: z.number().min(1900).max(2100).optional().default(new Date().getFullYear()),
    }),
    outputSchema: z.object({
      response: z.string(),
      year: z.number(),
      suggestions: z.array(z.string()).optional(),
    }),
    execute: async ({ context }) => {
      const year = context.year || new Date().getFullYear();
      
      try {
        // Buscar feriados para o ano
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        
        const holidays = await response.json();
        
        // Preparar contexto dos feriados para a IA
        const holidaysContext = holidays
          .filter((holiday: any) => holiday.type === 'nacional')
          .map((holiday: any) => {
            const date = new Date(holiday.date);
            const dayOfWeek = date.getDay();
            const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            
            return {
              name: holiday.name,
              date: holiday.date,
              dayOfWeek: dayNames[dayOfWeek],
              type: holiday.type
            };
          });
        
        // Criar prompt para a IA
        const systemPrompt = `Você é um assistente especializado em feriados brasileiros e planejamento de viagens. 

Feriados nacionais de ${year}:
${holidaysContext.map((h: any) => `- ${h.name}: ${h.date} (${h.dayOfWeek})`).join('\n')}

Você pode ajudar com:
- Informações sobre feriados específicos
- Sugestões de emendas e longos fins de semana
- Recomendações de viagem baseadas em feriados
- Períodos ideais para férias
- Dicas para aproveitar melhor os feriados

Responda de forma amigável e útil, sempre em português brasileiro. Seja específico e dê exemplos práticos quando possível.`;

        // Usar IA para gerar resposta
        const aiResponse = await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
          model: "openai:gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: context.message
            }
          ],
          temperature: 0.7,
          schema: {
            type: "object",
            properties: {
              response: {
                type: "string",
                description: "Resposta detalhada e útil para a pergunta do usuário"
              },
              suggestions: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Sugestões adicionais ou perguntas relacionadas que podem ser úteis"
              }
            },
            required: ["response"]
          }
        });

        return {
          response: String(aiResponse.object?.response || "Desculpe, não consegui processar sua pergunta. Pode tentar novamente?"),
          year,
          suggestions: Array.isArray(aiResponse.object?.suggestions) ? aiResponse.object.suggestions : []
        };
      } catch (error) {
        console.error("Erro no chat de feriados:", error);
        return {
          response: "Desculpe, ocorreu um erro ao processar sua pergunta. Verifique se a pergunta está relacionada a feriados brasileiros e tente novamente.",
          year,
          suggestions: [
            "Quais são os feriados nacionais de 2024?",
            "Quais feriados têm emenda com fim de semana?",
            "Qual o melhor período para tirar férias?",
            "Quais feriados oferecem mais dias de folga?"
          ]
        };
      }
    },
  });

export const tools = [
  createGetUserTool,
  createListTodosTool,
  createGenerateTodoWithAITool,
  createToggleTodoTool,
  createDeleteTodoTool,
  createGetHolidaysTool,
  createAnalyzeHolidaysTool,
  createHolidayChatTool,
];
