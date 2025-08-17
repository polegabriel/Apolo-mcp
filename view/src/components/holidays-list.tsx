import { useState } from "react";
import { useGetHolidays } from "../hooks/useToolCalls";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, CalendarDays, Info } from "lucide-react";

export function HolidaysList() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data, isLoading, error, refetch } = useGetHolidays(selectedYear);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'nacional':
        return 'bg-red-100 text-red-800';
      case 'estadual':
        return 'bg-blue-100 text-blue-800';
      case 'municipal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Carregando feriados...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Info className="h-5 w-5" />
            Erro ao carregar feriados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : 'Erro desconhecido'}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Feriados Nacionais {data?.year}
        </CardTitle>
        <CardDescription>
          Lista de feriados nacionais brasileiros para o ano selecionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Seletor de ano */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium">Ano:</span>
          <div className="flex gap-1">
            {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
              <Button
                key={year}
                variant={year === selectedYear ? "default" : "outline"}
                size="sm"
                onClick={() => handleYearChange(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de feriados */}
        {data && data.holidays.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-2">
              Total: {data.total} feriado{data.total !== 1 ? 's' : ''}
            </div>
            {data.holidays.map((holiday: { name: string; date: string; type: string }, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{holiday.name}</div>
                    <div className="text-sm text-gray-600">
                      {formatDate(holiday.date)}
                    </div>
                  </div>
                </div>
                <Badge className={getTypeColor(holiday.type)}>
                  {holiday.type}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum feriado encontrado para {selectedYear}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
