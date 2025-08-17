import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../lib/rpc";

export interface ToolCall {
  timestamp: number;
  tool: string;
  input: any;
  output: any;
}

/**
 * Hook to read tool calls from localStorage and listen for updates
 */
export const useToolCalls = () => {
  const [calls, setCalls] = useState<ToolCall[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("toolCalls") ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handler = () => {
      try {
        setCalls(JSON.parse(localStorage.getItem("toolCalls") ?? "[]"));
      } catch {
        setCalls([]);
      }
    };

    // Listen for updates from the same tab
    window.addEventListener("__tool_calls_updated", handler);
    
    // Listen for updates from other tabs
    window.addEventListener("storage", (e) => {
      if (e.key === "toolCalls") {
        handler();
      }
    });

    return () => {
      window.removeEventListener("__tool_calls_updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const clearCalls = () => {
    localStorage.removeItem("toolCalls");
    setCalls([]);
    window.dispatchEvent(new CustomEvent("__tool_calls_updated"));
  };

  return { calls, clearCalls };
};

// Hook para buscar feriados nacionais
export const useGetHolidays = (year?: number) => {
  return useQuery({
    queryKey: ["holidays", year],
    queryFn: () => client.GET_HOLIDAYS({ year: year || new Date().getFullYear() }),
    enabled: true, // Sempre habilitado, usa ano atual se não especificado
    staleTime: 24 * 60 * 60 * 1000, // Considera dados frescos por 24 horas (feriados não mudam frequentemente)
  });
};

// Hook para analisar feriados e gerar sugestões de viagem
export const useAnalyzeHolidays = (year?: number) => {
  return useQuery({
    queryKey: ["analyzeHolidays", year],
    queryFn: () => client.ANALYZE_HOLIDAYS({ year: year || new Date().getFullYear() }),
    enabled: true,
    staleTime: 24 * 60 * 60 * 1000, // Cache por 24 horas
  });
};

// Hook para chat sobre feriados
export const useHolidayChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: { message: string; year?: number }) => 
      client.HOLIDAY_CHAT(input),
    onSuccess: () => {
      // Invalidate related queries after successful chat
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });
};
