import { useState } from "react";
import { useAnalyzeHolidays } from "../hooks/useToolCalls";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Calendar, 
  CalendarDays, 
  Plane, 
  MapPin, 
  Clock, 
  Star, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  Loader
} from "lucide-react";

export function HolidayAnalysis() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data, isLoading, error, refetch } = useAnalyzeHolidays(selectedYear);

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
    switch (type) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysOffColor = (days: number) => {
    if (days >= 5) return 'bg-purple-100 text-purple-800';
    if (days >= 3) return 'bg-green-100 text-green-800';
    if (days >= 2) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Analisando feriados...
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
            <AlertTriangle className="h-5 w-5" />
            Erro na análise
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

  if (!data?.analysis) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Nenhuma análise disponível</p>
        </CardContent>
      </Card>
    );
  }

  const { analysis } = data;

  return (
    <div className="space-y-6">
      {/* Header com seletor de ano */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Análise de Viagens {selectedYear}
          </CardTitle>
          <CardDescription>
            Sugestões inteligentes para aproveitar melhor os feriados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
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

          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analysis.summary.totalHolidays}</div>
              <div className="text-sm text-blue-600">Feriados</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analysis.summary.totalLongWeekends}</div>
              <div className="text-sm text-green-600">Longos Fins de Semana</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{analysis.bestTravelOpportunities.length}</div>
              <div className="text-sm text-purple-600">Oportunidades</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analysis.summary.bestMonths.length}</div>
              <div className="text-sm text-orange-600">Melhores Meses</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Melhores Oportunidades de Viagem */}
      {analysis.bestTravelOpportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Melhores Oportunidades de Viagem
            </CardTitle>
            <CardDescription>
              Feriados que oferecem mais dias de folga com emendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.bestTravelOpportunities.map((opportunity: any, index: number) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{opportunity.holiday}</h3>
                      <p className="text-sm text-gray-600">{formatDate(opportunity.date)}</p>
                      <p className="text-sm text-gray-500 mt-1">{opportunity.weekendConnection}</p>
                    </div>
                    <Badge className={getDaysOffColor(opportunity.daysOff)}>
                      {opportunity.daysOff} dia{opportunity.daysOff !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-700">{opportunity.recommendation}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Plane className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-green-700">{opportunity.travelAdvice}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Longos Fins de Semana */}
      {analysis.longWeekends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Longos Fins de Semana
            </CardTitle>
            <CardDescription>
              Períodos ideais para viagens curtas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.longWeekends.map((weekend: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{weekend.description}</h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(weekend.startDate)} - {formatDate(weekend.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(weekend.type)}>
                      {weekend.totalDays} dia{weekend.totalDays !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {weekend.type === 'excellent' ? 'Excelente' : 
                       weekend.type === 'good' ? 'Bom' : 'Regular'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações de Férias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-500" />
            Períodos Ideais para Férias
          </CardTitle>
          <CardDescription>
            Sugestões baseadas em sazonalidade e preços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.vacationRecommendations.map((rec: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg">{rec.period}</h4>
                  <Badge variant="outline" className="text-xs">
                    {rec.duration}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <MapPin className="h-4 w-4" />
                  <span>Ideal para: {rec.bestFor}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Períodos para Evitar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Períodos para Evitar
          </CardTitle>
          <CardDescription>
            Datas com preços elevados e muito movimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.avoidPeriods.map((period: any, index: number) => (
              <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-red-800">{period.period}</h4>
                  <Badge variant="outline" className="text-red-600 border-red-300">
                    Evitar
                  </Badge>
                </div>
                <p className="text-sm text-red-700 mb-2">{period.reason}</p>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <TrendingUp className="h-4 w-4" />
                  <span>Alternativa: {period.alternative}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análise por Mês */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Análise por Mês
          </CardTitle>
          <CardDescription>
            Distribuição de feriados ao longo do ano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Melhores Meses
              </h4>
              <div className="space-y-2">
                {analysis.summary.bestMonths.map((month: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">{month}</span>
                    <Badge className="bg-green-100 text-green-800">
                      {index + 1}º lugar
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Meses com Menos Feriados
              </h4>
              <div className="space-y-2">
                {analysis.summary.worstMonths.map((month: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm font-medium">{month}</span>
                    <Badge className="bg-red-100 text-red-800">
                      {index + 1}º lugar
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
