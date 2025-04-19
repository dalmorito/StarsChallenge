import { IStorage } from "./storage";
import { DbStorage } from "./db-storage";
import { MemStorage } from "./storage";
import { shouldUseMemoryStorage } from "./db";

// Selecionar qual implementação de storage usar
let selectedStorage: IStorage;

// Se não temos uma conexão com o banco de dados válida, usar armazenamento em memória
if (shouldUseMemoryStorage) {
  console.log('USANDO ARMAZENAMENTO EM MEMÓRIA (os dados serão perdidos ao reiniciar o servidor)');
  selectedStorage = new MemStorage();
} else {
  console.log('USANDO ARMAZENAMENTO PERSISTENTE (banco de dados PostgreSQL)');
  selectedStorage = new DbStorage();
}

// Exportar a instância selecionada
export const dbStorage: IStorage = selectedStorage;

// Exportar como storage para compatibilidade com código existente
export default dbStorage;