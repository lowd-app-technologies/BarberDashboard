// Script para garantir que as variáveis de ambiente sejam carregadas
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do arquivo .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('Carregando variáveis de ambiente de:', envPath);
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  
  // Definir cada variável no process.env
  for (const key in envConfig) {
    process.env[key] = envConfig[key];
  }
  
  // Verificar variáveis críticas
  const requiredVars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('Atenção: As seguintes variáveis de ambiente estão faltando:', missing.join(', '));
  } else {
    console.log('Todas as variáveis de ambiente necessárias foram carregadas com sucesso!');
  }
} else {
  console.error('Arquivo .env não encontrado em:', envPath);
}

// Exportar as variáveis para uso em outros módulos
export default process.env;
