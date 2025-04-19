import { useState, useEffect } from "react";
import { Contestant } from "@/lib/types";
import { getAllContestants, getContestantImages } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Search, PlusCircle } from "lucide-react";
import AddContestantDialog from "./AddContestantDialog";
import EditContestantDialog from "./EditContestantDialog";

// Função para converter o nome do país em emoji de bandeira
const getCountryFlag = (country: string): string => {
  // Mapeamento de países para códigos de bandeira
  const countryFlags: Record<string, string> = {
    'Brasil': '🇧🇷',
    'Brazil': '🇧🇷',
    'EUA': '🇺🇸',
    'Estados Unidos': '🇺🇸',
    'USA': '🇺🇸',
    'United States': '🇺🇸',
    'Japão': '🇯🇵',
    'Japan': '🇯🇵',
    'Reino Unido': '🇬🇧',
    'UK': '🇬🇧',
    'United Kingdom': '🇬🇧',
    'França': '🇫🇷',
    'France': '🇫🇷',
    'Alemanha': '🇩🇪',
    'Germany': '🇩🇪',
    'Espanha': '🇪🇸',
    'Spain': '🇪🇸',
    'Itália': '🇮🇹',
    'Italy': '🇮🇹',
    'Canadá': '🇨🇦',
    'Canada': '🇨🇦',
    'Austrália': '🇦🇺',
    'Australia': '🇦🇺',
    'Rússia': '🇷🇺',
    'Russia': '🇷🇺',
    'China': '🇨🇳',
    'Portugal': '🇵🇹',
    'Índia': '🇮🇳',
    'India': '🇮🇳',
    'México': '🇲🇽',
    'Mexico': '🇲🇽',
    'Argentina': '🇦🇷',
    'Holanda': '🇳🇱',
    'Netherlands': '🇳🇱',
    'Suécia': '🇸🇪',
    'Sweden': '🇸🇪',
    'República Tcheca': '🇨🇿',
    'Czech Republic': '🇨🇿',
    'Hungria': '🇭🇺',
    'Hungary': '🇭🇺',
    'Polônia': '🇵🇱',
    'Poland': '🇵🇱',
    'Ucrânia': '🇺🇦',
    'Ukraine': '🇺🇦',
    'Colômbia': '🇨🇴',
    'Colombia': '🇨🇴',
    'Venezuela': '🇻🇪',
    'Peru': '🇵🇪',
    'Chile': '🇨🇱',
    'Romênia': '🇷🇴',
    'Romania': '🇷🇴',
    'Bélgica': '🇧🇪',
    'Belgium': '🇧🇪',
    'Grécia': '🇬🇷',
    'Greece': '🇬🇷',
    'Suíça': '🇨🇭',
    'Switzerland': '🇨🇭',
    'Áustria': '🇦🇹',
    'Austria': '🇦🇹',
    'Irlanda': '🇮🇪',
    'Ireland': '🇮🇪',
    'Dinamarca': '🇩🇰',
    'Denmark': '🇩🇰',
    'Noruega': '🇳🇴',
    'Norway': '🇳🇴',
    'Finlândia': '🇫🇮',
    'Finland': '🇫🇮',
    'Tailândia': '🇹🇭',
    'Thailand': '🇹🇭',
    'Coreia do Sul': '🇰🇷',
    'South Korea': '🇰🇷',
    'Filipinas': '🇵🇭',
    'Philippines': '🇵🇭',
    'Malásia': '🇲🇾',
    'Malaysia': '🇲🇾',
    'Turquia': '🇹🇷',
    'Turkey': '🇹🇷'
  };

  // Retorna o emoji da bandeira se o país estiver no mapeamento, ou a bandeira dos EUA por padrão
  return countryFlags[country] || '🇺🇸';
};

export default function ContestantsGalleryView() {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [contestantImages, setContestantImages] = useState<Record<number, string[]>>({});

  useEffect(() => {
    const fetchContestants = async () => {
      try {
        const response = await getAllContestants();
        // Verifica se temos data na resposta e se é um array
        if (response && Array.isArray(response)) {
          setContestants(response);
          // Carregamos por partes para evitar sobrecarga da API
          loadContestantImagesInBatches(response);
        } else if (response && response.data && Array.isArray(response.data)) {
          // Caso a API esteja retornando { success: true, data: [...] }
          setContestants(response.data);
          // Carregamos por partes para evitar sobrecarga da API
          loadContestantImagesInBatches(response.data);
        } else {
          console.error("Formato de dados inválido:", response);
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao carregar concorrentes:", error);
        setLoading(false);
      }
    };

    // Carrega as imagens em pequenos lotes para evitar sobrecarga da API
    const loadContestantImagesInBatches = async (contestantList: Contestant[]) => {
      // Mostra logo a lista, mesmo sem as imagens
      setLoading(false);
      
      // Processa em lotes de 5 para não sobrecarregar a API
      const batchSize = 5;
      for (let i = 0; i < contestantList.length; i += batchSize) {
        const batch = contestantList.slice(i, i + batchSize);
        
        // Carrega as imagens para este lote
        await Promise.all(
          batch.map(async (contestant) => {
            try {
              // Especifica 'gallery' como fonte para buscar imagens do IAFD
              const response = await getContestantImages(contestant.id, 'gallery');
              console.log(`Imagens para ${contestant.name}:`, response);
              
              // Verifica se a resposta está no formato correto e extrai as imagens
              let contestantImages = [];
              if (response && response.data && response.data.images) {
                // Formato { success: true, data: { images: [...] } }
                contestantImages = response.data.images;
              } else if (response && Array.isArray(response)) {
                // Array direto de imagens
                contestantImages = response;
              } else if (response && response.images && Array.isArray(response.images)) {
                // Formato { images: [...] }
                contestantImages = response.images;
              }
              
              console.log(`Imagens processadas para ${contestant.name}:`, contestantImages);
              
              setContestantImages(prevImages => ({
                ...prevImages,
                [contestant.id]: contestantImages
              }));
            } catch (error) {
              console.error(`Erro ao carregar imagens para ${contestant.name}:`, error);
              // Continua mesmo com erro para não afetar os outros
            }
          })
        );
        
        // Espera um pouco entre os lotes para não sobrecarregar a API
        if (i + batchSize < contestantList.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    };

    fetchContestants();
  }, []);

  // Filtra as concorrentes com base na aba ativa e no termo de busca
  const filteredContestants = Array.isArray(contestants) ? contestants.filter((contestant) => {
    const matchesActiveTab = activeTab === "all" || 
                           (activeTab === "active" && contestant.active) || 
                           (activeTab === "inactive" && !contestant.active);
    
    const matchesSearchTerm = contestant.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesActiveTab && matchesSearchTerm;
  }) : [];

  // Ordena as concorrentes por nome
  const sortedContestants = [...filteredContestants].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Galeria de Atrizes</h2>
        <div className="flex items-center space-x-3">
          <AddContestantDialog />
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome..."
              className="w-60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todas ({Array.isArray(contestants) ? contestants.length : 0})</TabsTrigger>
          <TabsTrigger value="active">
            Ativas ({Array.isArray(contestants) ? contestants.filter(c => c.active).length : 0})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inativas ({Array.isArray(contestants) ? contestants.filter(c => !c.active).length : 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? (
              Array(12).fill(0).map((_, index) => (
                <Card key={index} className="h-[380px]">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-48 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : (
              sortedContestants.map((contestant) => (
                <ContestantCard 
                  key={contestant.id} 
                  contestant={contestant} 
                  images={contestantImages[contestant.id] || []}
                />
              ))
            )}
          </div>
          {!loading && filteredContestants.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Nenhuma atriz encontrada para a pesquisa "{searchTerm}"</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {!loading && filteredContestants.map((contestant) => (
              <ContestantCard 
                key={contestant.id} 
                contestant={contestant} 
                images={contestantImages[contestant.id] || []}
              />
            ))}
            {!loading && filteredContestants.length === 0 && (
              <div className="text-center py-10 col-span-full">
                <p className="text-muted-foreground">Nenhuma atriz ativa encontrada para a pesquisa "{searchTerm}"</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {!loading && filteredContestants.map((contestant) => (
              <ContestantCard 
                key={contestant.id} 
                contestant={contestant} 
                images={contestantImages[contestant.id] || []}
              />
            ))}
            {!loading && filteredContestants.length === 0 && (
              <div className="text-center py-10 col-span-full">
                <p className="text-muted-foreground">Nenhuma atriz inativa encontrada para a pesquisa "{searchTerm}"</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ContestantCardProps {
  contestant: Contestant;
  images: string[];
}

function ContestantCard({ contestant, images }: ContestantCardProps) {
  // URLs para o Bing com termos adequados para conteúdo adulto
  const bingPornUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(contestant.name + ' porn')}`;
  const bingSearchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(contestant.name + ' xxx')}`;
  
  // Exibe a primeira imagem por padrão (ou nenhuma se não existir)
  const mainImage = images && images.length > 0 ? images[0] : null;
  
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            {contestant.name} {contestant.nationality && <span className="ml-2">{getCountryFlag(contestant.nationality)}</span>}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={contestant.active ? "default" : "outline"}>
              {contestant.active ? "Ativa" : "Inativa"}
            </Badge>
            <EditContestantDialog contestant={contestant} />
          </div>
        </div>
        <CardDescription>
          Vitórias: {contestant.wins || 0} | Derrotas: {contestant.losses || 0}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-2 flex-grow">
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted flex items-center justify-center">
          {mainImage ? (
            <img 
              src={mainImage} 
              alt={contestant.name}
              className="object-cover w-full h-[200px]"
              onError={(e) => { 
                e.currentTarget.onerror = null; 
                
                // Tenta um fallback direto para o Bing - exibe uma imagem vazia
                // porque não podemos carregar diretamente do Bing devido a CORS
                e.currentTarget.parentElement?.classList.add('bg-gray-100');
                e.currentTarget.style.display = 'none';
                
                // Adiciona um elemento de texto explicativo
                const textElement = document.createElement('div');
                textElement.className = 'text-center text-sm text-gray-500 p-2';
                textElement.innerHTML = `<p>Clique em "Ver Mais" para ver imagens de ${contestant.name}</p>`;
                e.currentTarget.parentElement?.appendChild(textElement);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-[200px] text-muted-foreground">
              <span className="mb-2">Clique nos botões abaixo</span>
              <span className="text-sm">para ver imagens de {contestant.name}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full justify-between">
          <Button variant="outline" size="sm" asChild>
            <a href={bingPornUrl} target="_blank" rel="noopener noreferrer">
              Ver Fotos <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="default" size="sm" asChild>
            <a href={bingSearchUrl} target="_blank" rel="noopener noreferrer">
              Ver Mais <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}