# INITIALIZATION PROMPT: CACAUCULA V2

Você é um Engenheiro de Software Sênior e um expert em Frontend/Design. A sua tarefa é inicializar e construir do zero a aplicação web "Cacaucula v2". O Cacaucula é um sistema de registro e acompanhamento de horas focado em um escritório de arquitetura.

Por favor, siga as instruções abaixo rigorosamente para gerar os arquivos do projeto, estrutura do banco e o código de todos os módulos.

## 1. Stack Tecnológico e Configuração Geral
- **Frontend:** React com inicializador Vite (`npm create vite@latest . -- --template react`).
- **Navegação:** `react-router-dom`.
- **Backend/Banco/Auth:** Supabase (usar o pacote `@supabase/supabase-js`).
- **Gráficos:** `recharts` ou `react-chartjs-2`.
- **Ícones:** `lucide-react`.
- **Estilização:** Utilize CSS padrão (Vanilla) com variáveis CSS ou TailwindCSS se preferir, **MAS** a UI deve ser extremamente elegante, profissional, limpa e moderna. Crie interfaces polidas (sombra suave, bordas arredondadas, micro-interações ao passar o mouse). **ATENÇÃO:** Este não é um MVP provisório. É a versão final de produção que será entregue diretamente ao cliente. Não economize na qualidade, crie a melhor arquitetura e design possíveis.

## 2. Identidade Visual
Implemente esta paleta de cores como variáveis ​​globais:
- **Red/Terracota:** `#C65348` (Botões de destaque, alertas)
- **Yellow/Mustard:** `#E7B15B` (Avisos, destaques secundários)
- **Light Pink:** `#D9B3C9` (Cor de fundo de sidebars ou seleção)
- **White:** `#FFFFFF` (Fundos principais, cartões)
- **Gray:** `#C1C1C1` (Bordas, desativados, textos de apoio) - *Nota: Use um tom de cinza mais escuro ou perto do preto para textos normais para garantir a leitura.*
- **Logo:** O usuário já possui a tag `logo-cacau.jpeg`. Utilize um placeholder temporário num tamanho amigável (ex: `<img src="/logo-cacau.jpeg" alt="Logo" className="w-32" />`) no topo da Sidebar.

## 3. Autenticação (Supabase)
- Aplicação 100% protegida. Usuário não autenticado só vê a página de Login.
- **Login:** Email e Senha.
- **Cadastro:** Usuários criam suas contas e recebem um e-mail de verificação (Link padrão do Supabase). O acesso só funciona com as contas validadas.
- **Usuários Administradores:** Hardcode ou defina no banco como admin para estes emails: `adm@cacau-arquitetura.com` e `renan.junqueira.mendes@gmail.com`.

## 4. Banco de Dados e Política RLS (SQL)
Escreva um script `.sql` (ou me instrua a rodar no Editor SQL do Supabase) contemplando as seguintes tabelas e regras:
1. `collaborators`: Vinculado a auth.users (ID primário = uuid do auth). 
   - Colunas: `id`, `name`, `role` (Admin, Arquiteta, Designer, Estagiária), `is_active` (boolean, default FALSE).
   - Regra/Trigger sugerida: Ao criar um auth.user, gere uma linha automaticamente em collaborators. Ao inativar esse collaborator ou excluí-lo, o sistema bloqueia seu login.
2. `projects`: 
   - Colunas: `id`, `name`, `is_active` (boolean, default TRUE).
3. `time_logs`: 
   - Colunas: `id`, `collaborator_id`, `project_id`, `date` (date), `logged_hours` (numeric).

## 5. Estrutura do Layout Dashboard
- **Sidebar Esquerda:** Contém o Logo e 4 links de navegação: Projetos, Equipe, Registro de Horas, Dashboard. Um ícone de Logout na base.
- **Área Principal:** Exibe o conteúdo de cada página e o título da aba ativa no topo.

## 6. Telas e Lógicas de Negócio
### Aba: Projetos (Acesso exclusivo -> Admin)
- Formulário enxuto no topo: `Nome do projeto` e `Status` (switch/toggle entre Ativo e Inativo).
- Listagem: Uma tabela com os projetos cadastrados.

### Aba: Equipe (Acesso exclusivo -> Admin)
- Listagem de colaboradores (tabela lendo de `collaborators`).
- Colunas: Nome do Colaborador, Função (Dropdown editável) e Status Ativo/Inativo (Toggle editável).
- O toggle "Inativo" deverá impedir o usuário de utilizar a ferramenta.
- Botão/Ação de "Excluir": Excluirá esse usuário por completo (atenção às chaves estrangeiras).
- **Importante:** Apenas profissionais (ex: Arquitetas) que estiverem `is_active = true` poderão receber horas lançadas.

### Aba: Registro de Horas (Acesso -> Todos que possuem is_active = true)
- Visualização estilo Matriz/Calendário focada no Mês Atual (com seleção de Mês/Ano).
- Cabeçalhos (Eixo X): Dias do Mês (1 ao 30/31).
- Linhas (Eixo Y):
  - Coluna dropdown 1: Colaborador/Arquiteto (filtra apenas os ativos).
  - Coluna dropdown 2: Projeto (filtra apenas projetos ativos).
  - Dias (Células): Campos de Input estilo numérico para digitar as horas do dia.
- Permitir que o usuário "Adicione uma nova Linha de registro" e a "Exclua".
- **Validação ao Confirmar:** Quando o usuário salvar, se houver um arquiteto somando mais de 8 horas registradas em um único dia, exiba no front-end um Toast/Modal de CUIDADO e AVISO amigável, mas **não impeça o envio para o banco de dados**.

### Aba: Dashboard 
- Puxe as métricas da base `time_logs`.
- Gráfico de Barras: Balanço total de horas agrupado por cada arquiteto (do mês).
- Gráfico de Pizza ou Empilhadas: Distribuição de horas em projetos específicos por arquiteto.

## 7. Variáveis de Ambiente (Supabase)
Utilize estas credenciais para configurar no código (e no .env se necessário):
- `VITE_SUPABASE_URL=https://yvzccgskewudtirigiip.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_jP9I4cnoVJpamx03NRqEoA_Ls7u-nLK`
- `VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2emNjZ3NrZXd1ZHRpcmlnaWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTc1ODUsImV4cCI6MjA4ODM5MzU4NX0.w_8zbAyb9ejVfOXE_JCM8LlZ-BJKS3Ioua7QmwvyxsQ`

**Ação:** Utilize suas ferramentas para criar a infraestrutura Vite, gerar o schema SQL num arquivo, instalar as dependências, e criar todo o layout acima. Trabalhe de forma modular (Componentes reutilizáveis, código limpo, tratamento de erros). O objetivo é construir a versão **FINAL E DE PRODUÇÃO** para ser entregue ao cliente. Não pule etapas nem utilize atalhos provisórios. Avise quando a aplicação estiver completamente montada e funcionando perfeitamente!
