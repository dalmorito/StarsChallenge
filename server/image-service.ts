import { storage } from "./storage";
import { log } from "./vite";

// Chaves e IDs de API
const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

/**
 * Busca imagens usando a API de Pesquisa Personalizada do Google
 * @param query A consulta de pesquisa
 * @returns Array de URLs de imagens
 */
async function searchGoogleImages(query: string, isGallery: boolean = false): Promise<string[]> {
  if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    log("Chaves de API do Google não configuradas.", "image-service");
    return [];
  }

  try {
    // Usamos a query exata que foi passada para a função (que já está refinada nos termos de busca)
    const searchQuery = query;
        
    log(`Buscando imagens para: "${searchQuery}"${isGallery ? ' (modo galeria)' : ''}`, "image-service");

    // Cria a URL da API do Google Custom Search
    const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
    searchUrl.searchParams.append("key", GOOGLE_API_KEY);
    searchUrl.searchParams.append("cx", GOOGLE_SEARCH_ENGINE_ID);
    searchUrl.searchParams.append("q", searchQuery);
    searchUrl.searchParams.append("searchType", "image");
    searchUrl.searchParams.append("num", "10"); // Solicita mais imagens para ter mais opções
    searchUrl.searchParams.append("safe", "off"); // Desativa o filtro de segurança para permitir mais resultados
    
    // Configurações específicas para cada tipo de busca
    if (isGallery) {
        // Para galeria focamos em faces e rostos
        searchUrl.searchParams.append("imgSize", "medium");
        searchUrl.searchParams.append("imgType", "face"); // Busca explicitamente por faces
    } else {
        // Para torneio queremos fotos profissionais de alta qualidade
        searchUrl.searchParams.append("imgSize", "large"); // Preferimos imagens maiores
        searchUrl.searchParams.append("imgType", "photo"); // Focamos em fotos profissionais
        // Muitas fotos profissionais têm fundo preto ou sólido
        searchUrl.searchParams.append("imgDominantColor", "black");
    }

    // Faz a solicitação à API
    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      const errorText = await response.text();
      log(`Erro na API do Google: ${response.status} - ${errorText}`, "image-service");
      return [];
    }

    const data = await response.json();

    // Verifica se temos resultados
    if (!data.items || data.items.length === 0) {
      log("Nenhuma imagem encontrada na pesquisa do Google", "image-service");
      return [];
    }
    
    // Usa diretamente as URLs do Google sem proxy
    const imageUrls = data.items
      .map((item: any) => item.link)
      // Adiciona um timestamp na URL para evitar cache e conseguir imagens diferentes
      .map((url: string) => `${url}${url.includes('?') ? '&' : '?'}cachebuster=${Date.now()}_${Math.random().toString(36).substring(2, 9)}`)
      .slice(0, 5); // Pega mais imagens para ter mais chances de diversidade

    log(`Encontradas ${imageUrls.length} imagens via Google API`, "image-service");
    return imageUrls;
  } catch (error) {
    log(`Erro ao buscar imagens no Google: ${error}`, "image-service");
    return [];
  }
}

/**
 * Verifica se uma URL de imagem é válida tentando carregar a imagem
 * @param imageUrl URL da imagem para validar
 * @returns true se a imagem for válida, false caso contrário
 */
async function isImageValid(imageUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const contentType = response.headers.get('content-type');
    return !!contentType && contentType.startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * Busca imagens do IAFD (Internet Adult Film Database)
 * @param name O nome da atriz para buscar
 * @returns URL da imagem se encontrada, null caso contrário
 */
async function searchIAFDImage(name: string): Promise<string | null> {
  try {
    // Formata o nome para padrões do IAFD
    const formattedName = name.toLowerCase().replace(/\s+/g, '');
    const firstLetter = name.toLowerCase().charAt(0);
    const firstName = name.toLowerCase().split(' ')[0];
    const lastName = name.toLowerCase().split(' ').pop() || '';
    
    // Lista AMPLIADA de URLs conhecidas para atrizes populares
    const knownActressUrls: Record<string, string> = {
      'mia lelani': 'https://www.iafd.com/graphics/headshots/m/mialelani_h.jpg',
      'aleska diamond': 'https://www.iafd.com/graphics/headshots/a/aleskadiamond_h.jpg',
      'lanny barbie': 'https://www.iafd.com/graphics/headshots/l/lannybarbie_h.jpg',
      'sunny leone': 'https://www.iafd.com/graphics/headshots/s/sunnyleone_h.jpg',
      'sandra shine': 'https://www.iafd.com/graphics/headshots/s/sandrashine_h.jpg',
      'lisa ann': 'https://www.iafd.com/graphics/headshots/l/lisaann_h.jpg',
      'jesse jane': 'https://www.iafd.com/graphics/headshots/j/jessejane_h.jpg',
      'sunny lane': 'https://www.iafd.com/graphics/headshots/s/sunnylane_h.jpg',
      'jenna jameson': 'https://www.iafd.com/graphics/headshots/j/jennajameson_h.jpg',
      'mia khalifa': 'https://www.iafd.com/graphics/headshots/m/miakhalifa_h.jpg',
      'riley reid': 'https://www.iafd.com/graphics/headshots/r/rileyreid_h.jpg',
      'alexis texas': 'https://www.iafd.com/graphics/headshots/a/alexistexas_h.jpg',
      'tera joy': 'https://www.iafd.com/graphics/headshots/t/terajoy_h.jpg',
      'reena sky': 'https://www.iafd.com/graphics/headshots/r/reenasky_h.jpg',
      'jayden lee': 'https://www.iafd.com/graphics/headshots/j/jaydenlee_h.jpg',
      'ash hollywood': 'https://www.iafd.com/graphics/headshots/a/ashhollywood_h.jpg',
      'kama oxi': 'https://www.iafd.com/graphics/headshots/k/kamasutra_h.jpg',
      'piper fawn': 'https://www.iafd.com/graphics/headshots/p/piperfawn_h.jpg',
      'brenna sparks': 'https://www.iafd.com/graphics/headshots/b/brennasparks_h.jpg',
      'kaylani lei': 'https://www.iafd.com/graphics/headshots/k/kaylanilei_h.jpg',
      'marica hase': 'https://www.iafd.com/graphics/headshots/m/maricahase_h.jpg',
      'morgan lee': 'https://www.iafd.com/graphics/headshots/m/morganlee_h.jpg',
      'alina li': 'https://www.iafd.com/graphics/headshots/a/alinali_h.jpg',
      'jennie rose': 'https://www.iafd.com/graphics/headshots/j/jennierose_h.jpg',
      'ariel rose': 'https://www.iafd.com/graphics/headshots/a/arielrose_h.jpg',
      'cindy starfall': 'https://www.iafd.com/graphics/headshots/c/cindystarfall_h.jpg',
      'jade kimiko': 'https://www.iafd.com/graphics/headshots/j/jadekimiko_h.jpg',
      'roxy jezel': 'https://www.iafd.com/graphics/headshots/r/roxyjezel_h.jpg',
      'may thai': 'https://www.iafd.com/graphics/headshots/m/maythai_h.jpg',
      'kalina ryu': 'https://www.iafd.com/graphics/headshots/k/kalinaryu_h.jpg',
      'kianna dior': 'https://www.iafd.com/graphics/headshots/k/kiannadior_h.jpg',
      'katsuni': 'https://www.iafd.com/graphics/headshots/k/katsuni_h.jpg',
      'london keyes': 'https://www.iafd.com/graphics/headshots/l/londonkeyes_h.jpg',
      'miko dai': 'https://www.iafd.com/graphics/headshots/m/mikodai_h.jpg',
      'eva lovia': 'https://www.iafd.com/graphics/headshots/e/evalovia_h.jpg',
      'maria ozawa': 'https://www.iafd.com/graphics/headshots/m/mariaozawa_h.jpg',
      'sumire mizukawa': 'https://www.iafd.com/graphics/headshots/s/sumiremizukawa_h.jpg',
      'sharon lee': 'https://www.iafd.com/graphics/headshots/s/sharonlee_h.jpg',
      'elle lee': 'https://www.iafd.com/graphics/headshots/e/ellelee_h.jpg',
      'tiffany mynx': 'https://www.iafd.com/graphics/headshots/t/tiffanymynx_h.jpg'
    };
    
    // Verifique primeiro se temos uma URL conhecida para esta atriz
    const lowerName = name.toLowerCase();
    if (knownActressUrls[lowerName]) {
      log(`URL conhecida encontrada para ${name}: ${knownActressUrls[lowerName]}`, "image-service");
      if (await isImageValid(knownActressUrls[lowerName])) {
        return knownActressUrls[lowerName];
      }
    }
    
    // Tentar vários formatos de URL possíveis
    const possibleUrls = [
      // Formato padrão com _h (alta resolução)
      `https://www.iafd.com/graphics/headshots/${firstLetter}/${formattedName}_h.jpg`,
      // Formato padrão
      `https://www.iafd.com/graphics/headshots/${firstLetter}/${formattedName}.jpg`,
      // Formatos alternativos com caracteres especiais removidos
      `https://www.iafd.com/graphics/headshots/${firstLetter}/${formattedName.replace(/[^a-z0-9]/g, '')}_h.jpg`,
      `https://www.iafd.com/graphics/headshots/${firstLetter}/${formattedName.replace(/[^a-z0-9]/g, '')}.jpg`,
      // Primeiro nome apenas
      `https://www.iafd.com/graphics/headshots/${firstLetter}/${firstName}_h.jpg`,
      `https://www.iafd.com/graphics/headshots/${firstLetter}/${firstName}.jpg`,
      // Último nome primeiro (formato de algumas atrizes asiáticas)
      `https://www.iafd.com/graphics/headshots/${lastName.charAt(0)}/${lastName}${firstName.charAt(0)}_h.jpg`,
      `https://www.iafd.com/graphics/headshots/${lastName.charAt(0)}/${lastName}${firstName.charAt(0)}.jpg`,
      // Outras variantes sem espaços ou caracteres especiais
      `https://www.iafd.com/graphics/headshots/${firstLetter}/${firstName}${lastName}_h.jpg`,
      `https://www.iafd.com/graphics/headshots/${firstLetter}/${firstName}${lastName}.jpg`
    ];
    
    // Testar cada URL possível
    for (const url of possibleUrls) {
      log(`Testando URL IAFD: ${url}`, "image-service");
      if (await isImageValid(url)) {
        log(`Imagem IAFD válida encontrada: ${url}`, "image-service");
        return url;
      }
    }
    
    // Caso específico para nomes artisticos muito populares
    const fallbackUrls: Record<string, string> = {
      'katsuni': 'https://www.iafd.com/graphics/headshots/k/katsuni_h.jpg',
      'tera joy': 'https://www.iafd.com/graphics/headshots/t/terajoy_h.jpg',
      'asa akira': 'https://www.iafd.com/graphics/headshots/a/asaakira_h.jpg',
      'sunny leone': 'https://hotsweetgirl.com/actresses/sunnyLeone.jpg'
    };
    
    if (fallbackUrls[lowerName]) {
      log(`Tentando URL de fallback para ${name}: ${fallbackUrls[lowerName]}`, "image-service");
      if (await isImageValid(fallbackUrls[lowerName])) {
        return fallbackUrls[lowerName];
      }
    }
    
    log(`Nenhuma imagem IAFD encontrada para ${name}`, "image-service");
    return null;
  } catch (error) {
    log(`Erro ao buscar imagem do IAFD para ${name}: ${error}`, "image-service");
    return null;
  }
}

/**
 * Obtém URLs para imagens das concorrentes, do Google Images ou IAFD
 * @param contestantId O ID da concorrente
 * @param name O nome da concorrente
 * @param source A fonte das imagens ('gallery' para IAFD ou 'tournament' para Google)
 * @returns Um array de URLs de imagens
 */
export async function fetchContestantImages(contestantId: number, name: string, source: 'gallery' | 'tournament' = 'tournament'): Promise<string[]> {
  try {
    log(`Buscando imagens para ${name} (source: ${source})`, "image-service");

    // Primeiro verifica se temos imagens em cache (do Google ou IAFD)
    const cacheKey = `${contestantId}-${source}`;
    const cachedImages = await storage.getImageCache(contestantId);
    if (cachedImages && cachedImages.imageUrls.length >= 3) {
      log(`Usando imagens em cache para ${name}`, "image-service");

      // Valida imagens em cache para garantir que ainda estão funcionando
      const validationPromises = cachedImages.imageUrls.map(isImageValid);
      const validationResults = await Promise.all(validationPromises);

      if (validationResults.every(result => result === true)) {
        log(`Imagens em cache válidas para ${name}`, "image-service");
        return cachedImages.imageUrls;
      }

      log(`Algumas imagens em cache inválidas para ${name}, buscando novas...`, "image-service");
    }

    // Para qualquer tipo de busca (gallery ou tournament), tenta buscar do IAFD primeiro para ter fotos de rosto
    // Mas priorizamos mais para a galeria
    try {
      log(`Tentando buscar foto do IAFD para ${name}`, "image-service");
      
      // Usa a função searchIAFDImage para tentar obter uma imagem do IAFD
      const iafdImageUrl = await searchIAFDImage(name);
      
      if (iafdImageUrl) {
        log(`Imagem IAFD encontrada para ${name}: ${iafdImageUrl}`, "image-service");
        
        // Cria um array com a mesma imagem repetida 3 vezes para manter o padrão
        const iafdImages = [iafdImageUrl, iafdImageUrl, iafdImageUrl];
        
        // Para a galeria, sempre usamos IAFD se encontrada
        if (source === 'gallery') {
          // Armazena em cache
          await storage.createImageCache({
            contestantId,
            imageUrls: iafdImages,
            createdAt: new Date()
          });
          
          return iafdImages;
        } 
        // Para o torneio, só usamos IAFD se explicitamente solicitado ou se não conseguirmos outras imagens
        else {
          // Armazenamos a imagem para uso posterior (como fallback)
          const iafdResult = iafdImages;
          
          // Continue com a busca normal para o torneio, mas mantenha IAFD como fallback
          log(`Imagem IAFD encontrada para ${name}, mas continuando busca para torneio`, "image-service");
          
          // Executamos a busca normal no Google usando o formato exato solicitado: "{nome da atriz}" "porn"
          const query = `"${name}" "porn"`;
          log(`Buscando imagens para: "${query}"`, "image-service");
          const googleImages = await searchGoogleImages(query, false);
          
          // Verificamos se as imagens são válidas
          if (googleImages && googleImages.length > 0) {
            const validImages = await Promise.all(
              googleImages.map(async url => ({ url, valid: await isImageValid(url) }))
            );
            
            const filteredImages = validImages
              .filter(item => item.valid)
              .map(item => item.url)
              .slice(0, 3); // Agora pegamos até 3 imagens
              
            // Se tivermos pelo menos 1 imagem, retornamos
            if (filteredImages.length >= 1) {
              // Asseguramos que temos 3 imagens, duplicando as existentes se necessário
              while (filteredImages.length < 3) {
                filteredImages.push(filteredImages[0]);
              }
              return filteredImages;
            }
          }
          
          // Se não conseguirmos imagens do Google, usamos as do IAFD
          return iafdResult;
        }
      }
      
      log(`Nenhuma imagem válida do IAFD encontrada para ${name}, tentando Google...`, "image-service");
    } catch (iafdError) {
      log(`Erro ao buscar do IAFD: ${iafdError}`, "image-service");
      // Continua para buscar do Google se falhar
    }

    // Termos de busca dependem da fonte (gallery vs tournament)
    const searchQueries = source === 'gallery' 
      ? [
          `${name} porn face portrait`,    // Combinação direta para garantir um rosto
          `${name} porn +face +closeup`,   // Com operadores explícitos forçando face
          `${name} +pornstar +face`,       // Forçando ator/atriz + face
          `${name} porn headshot`,         // Buscando headshots específicos
          `${name} +closeup +portrait`     // Closeup diretamente no rosto 
        ]
      : [
          `"${name}" "porn"`,              // Formato exato solicitado pelo usuário com espaço entre aspas
          `"${name}" "porn"`,              // Repetimos a mesma consulta para garantir compatibilidade
          `"${name}" "porn"`,              // Repetimos a mesma consulta para garantir compatibilidade
          `"${name}" "porn"`,              // Repetimos a mesma consulta para garantir compatibilidade
          `"${name}" "porn"`               // Repetimos a mesma consulta para garantir compatibilidade
        ];
    
    let allImages: string[] = [];
    
    // Variável para controlar se estamos buscando para a galeria ou torneio
    const isGallery = source === 'gallery';
    const targetImageCount = 3; // Agora queremos 3 imagens para qualquer caso
    
    // Tenta cada consulta até ter a quantidade necessária de imagens
    for (const query of searchQueries) {
      if (allImages.length >= targetImageCount) break;
      
      // Passa o flag isGallery para o método de busca
      const newImages = await searchGoogleImages(query, isGallery);
      if (newImages && newImages.length > 0) {
        // Verifica se as imagens são válidas
        const validImages = await Promise.all(
          newImages.map(async url => ({ url, valid: await isImageValid(url) }))
        );

        const filteredImages = validImages
          .filter(item => item.valid)
          .map(item => item.url);
          
        // Adiciona novas imagens à nossa coleção
        allImages = [...allImages, ...filteredImages];
        
        // Se já temos a quantidade desejada de imagens, paramos
        if (allImages.length >= targetImageCount) {
          allImages = allImages.slice(0, targetImageCount);
          break;
        }
      }
    }
    
    // Se conseguimos imagens, armazenamos em cache
    if (allImages.length > 0) {
      // Se for torneio e tivermos 1 imagem, duplicamos ela para manter compatibilidade
      if (!isGallery && allImages.length === 1) {
        allImages = [allImages[0], allImages[0], allImages[0]];
      } 
      // Para galeria, sempre preenchemos com 3 imagens duplicadas se necessário
      else if (isGallery) {
        while (allImages.length < 3) {
          allImages.push(allImages[0] || '');
        }
      }
      
      // Armazenamos a fonte das imagens no cache para uso futuro (gallery ou tournament)
      await storage.createImageCache({
        contestantId,
        imageUrls: allImages,
        createdAt: new Date()
      });
    }
    
    return allImages;
  } catch (error) {
    console.error(`Erro ao buscar imagens para ${name}:`, error);
    
    // Mesmo em caso de erro, retornamos um array vazio em vez de placeholders
    return [];
  }
}