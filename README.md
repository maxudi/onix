# Onix - Sistema de Gestão de Condomínio

Sistema completo e moderno para gestão de condomínios, desenvolvido com React, Tailwind CSS e preparado para integração com Supabase.

## 🚀 Funcionalidades

### Para Moradores
- ✅ **Dashboard Intuitivo** - Visão geral de todas as informações importantes
- 💰 **Gestão Financeira** - Visualização e pagamento de boletos
- 📅 **Reservas** - Agendamento do salão de festas com calendário interativo
- 📢 **Mural de Avisos** - Comunicados e notícias do condomínio
- 👤 **Perfil** - Gerenciamento de dados pessoais

### Para Administradores
- 👥 **Gestão de Moradores** - Cadastro e controle de residentes
- 🏢 **Gestão de Unidades** - Controle de apartamentos e blocos
- ✅ **Aprovação de Reservas** - Gerenciar solicitações de uso do salão
- 📝 **Publicação de Avisos** - Criar e gerenciar comunicados
- 📊 **Visão Geral** - Estatísticas e métricas do condomínio

## 🛠️ Tecnologias Utilizadas

- **React 18** - Biblioteca JavaScript para interfaces
- **Vite** - Build tool rápido e moderno
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Roteamento de páginas
- **Lucide React** - Ícones modernos
- **date-fns** - Manipulação de datas

## 📦 Instalação

1. **Instalar dependências:**
```bash
npm install
```

2. **Iniciar servidor de desenvolvimento:**
```bash
npm run dev
```

3. **Acessar aplicação:**
```
http://localhost:3000
```

## 🔐 Credenciais de Teste

### Administrador
- Email: `admin@onix.com`
- Senha: `admin123`

### Morador
- Email: `joao@email.com`
- Senha: `123456`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Layout.jsx      # Layout principal com sidebar
│   └── ProtectedRoute.jsx  # Proteção de rotas
├── contexts/           # Contextos React
│   └── AuthContext.jsx # Gerenciamento de autenticação
├── pages/              # Páginas da aplicação
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Financeiro.jsx
│   ├── Reservas.jsx
│   ├── Avisos.jsx
│   ├── Perfil.jsx
│   └── Admin.jsx
├── services/           # Serviços e utilitários
│   ├── storage.js     # Abstração de armazenamento
│   └── mockData.js    # Dados de exemplo
├── index.css          # Estilos globais
└── main.jsx           # Ponto de entrada
```

## 🔄 Supabase - Banco de Dados em Nuvem

### ✅ Supabase já está configurado!

O projeto já está integrado com Supabase! As credenciais estão no arquivo `.env`:

```bash
VITE_SUPABASE_URL=https://condominio-supabase.zm83gd.easypanel.host
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 📝 Criar Tabelas no Supabase

Siga as instruções detalhadas no arquivo **[SUPABASE.md](SUPABASE.md)** para criar a estrutura do banco de dados.

**Passo a passo rápido:**

1. Acesse seu painel do Supabase
2. Vá em **SQL Editor**
3. Execute os comandos SQL do arquivo SUPABASE.md
4. Pronto! O sistema usará automaticamente o Supabase

### 🔀 Modo Híbrido

O sistema funciona em **modo híbrido**:
- ✅ Se Supabase está configurado → usa banco de dados
- ✅ Se Supabase não está disponível → usa localStorage

Isso garante que o sistema sempre funcione, mesmo offline!

### 📊 Estrutura do Banco de Dados

Tabelas criadas:
- `users` - Usuários/moradores
- `units` - Unidades/apartamentos
- `bills` - Boletos
- `bookings` - Reservas
- `notices` - Avisos

Todas com RLS (Row Level Security) e políticas de segurança configuradas.

## 🎨 Personalização

### Cores
Edite `tailwind.config.js` para mudar o esquema de cores:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Sua paleta de cores
      }
    }
  }
}
```

### Logo
Substitua o ícone Building2 em `Layout.jsx` e `Login.jsx` pela sua logo.

## 📱 Responsividade

O sistema é totalmente responsivo e funciona perfeitamente em:
- 📱 Mobile (smartphones)
- 📱 Tablet
- 💻 Desktop
- 🖥️ Wide screens

## 🚀 Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`.

## 📝 Próximas Melhorias

- [ ] Integração real com Supabase
- [ ] Notificações push
- [ ] Upload de documentos
- [ ] Chat entre moradores
- [ ] Aplicativo mobile (React Native)
- [ ] Relatórios em PDF
- [ ] Gráficos de gastos
- [ ] Sistema de enquetes

## 📄 Licença

Este projeto é de código aberto e está disponível para uso livre.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

---

Desenvolvido com ❤️ para facilitar a gestão de condomínios
