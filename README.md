# Edu Match

Aplicativo mobile que conecta jovens aprendizes (16–22 anos) a mentores profissionais para o desenvolvimento de soft skills.

Projeto acadêmico do Grupo 24, 5º semestre, Senac.

## Stack

- **React Native** + **Expo SDK 51** (managed workflow)
- **Expo Router 3** (rotas baseadas em arquivos)
- **TypeScript**
- **Firebase**: Authentication, Cloud Firestore e Storage
- **React Hook Form** + **Zod** (validação de formulários)

## Pré-requisitos

- Node.js 18 ou superior
- npm 9 ou superior
- **Expo Go** no celular (Android ou iOS) **ou** Android Studio com um emulador (AVD) criado

## Credenciais de teste

| Perfil   | E-mail                  | Senha       |
|----------|-------------------------|-------------|
| Aprendiz | `aprendiz@edumatch.com` | `Teste@123` |
| Mentor   | `mentor@edumatch.com`   | `Teste@123` |

Os dois usuários já existem no Firebase do projeto. Se for preciso recriá-los, veja o [passo 4](#4-crie-os-usuários-de-teste).

## Conexão com o Firebase

O projeto usa o Firebase **EduMacht** (`edumacht`), que já está configurado. Copie o bloco abaixo para um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_FIREBASE_API_KEY="AIzaSyBL5SOiHgmLEayHLVicsGKAM2SBwpq9o6I"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="edumacht.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="edumacht"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="edumacht.firebasestorage.app"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="230636426124"
EXPO_PUBLIC_FIREBASE_APP_ID="1:230636426124:web:f97be781aeda1b8b433ca9"
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID="G-BQ0M3K83YY"
```

O mesmo conteúdo está em `.env.example`, então também dá para rodar `cp .env.example .env`.

> Essas chaves identificam o projeto Firebase e não são senhas: ficam dentro de qualquer app que use o Firebase. Quem protege os dados são as regras de segurança em `firestore.rules`.

### Como o Firebase está configurado

| Serviço        | Configuração |
|----------------|--------------|
| Authentication | Provedor **Email/senha** ativado |
| Firestore      | Banco com ID **`default`** (sem parênteses), região `southamerica-east1` |
| Regras         | Conteúdo de `firestore.rules`, publicado no banco `default` |
| App registrado | App **Web** (o SDK JavaScript do Firebase usa a configuração Web, mesmo em app mobile) |

> **Atenção ao ID do banco:** ele foi criado como `default`, e não como o `(default)` padrão do Firebase. Por isso, `src/services/firebase.ts` e `scripts/seed-users.js` usam `getFirestore(app, 'default')`. Se o banco for recriado com o ID padrão, troque para `getFirestore(app)` nos dois arquivos.

## Como rodar

### 1. Clone e instale

```bash
git clone <URL_DO_REPO>
cd Grupo-24-EduMacht-5-Semestre-Senac
npm install --legacy-peer-deps
```

O `--legacy-peer-deps` é obrigatório: sem ele, o npm acusa um conflito entre `@testing-library/react-native` e o React 18 do Expo.

### 2. Crie o `.env`

Veja a seção [Conexão com o Firebase](#conexão-com-o-firebase).

### 3. Publique as regras do Firestore

Firebase Console → **Firestore → Segurança**. Confira se o seletor de banco mostra **default**, cole o conteúdo de `firestore.rules` e clique em **Publicar**.

### 4. Crie os usuários de teste

Só é necessário se os usuários ainda não existirem:

```bash
node scripts/seed-users.js
```

O script cria as contas no Authentication e os perfis na coleção `users` do Firestore. Se a conta já existir, ele apenas atualiza o perfil.

### 5. Inicie o app

```bash
npx expo start
```

- **Celular:** escaneie o QR Code com o Expo Go.
- **Emulador Android:** abra o emulador no Android Studio e pressione `a` no terminal.
- **Recarregar o app:** pressione `r` no terminal.

## Solução de problemas

| Erro | Causa e solução |
|------|-----------------|
| `npm error ERESOLVE` | Instale com `npm install --legacy-peer-deps` |
| `Cannot find module 'ajv/dist/compile/codegen'` | `npm install ajv@^8 --legacy-peer-deps` |
| `Cannot find module 'babel-plugin-module-resolver'` | `npm install babel-plugin-module-resolver --legacy-peer-deps` |
| Tela roxa que não sai do splash | Falta alguma imagem referenciada em `app.json`. A configuração atual não usa imagens |
| "Autenticação não configurada no Firebase" | Ative Email/senha em Authentication → Sign-in method |
| `NOT_FOUND` no Firestore | O código está apontando para um banco que não existe. Confira o ID do banco (veja a Atenção acima) |
| `PERMISSION_DENIED` no Firestore | As regras não foram publicadas no banco `default` (passo 3) |
| "Perfil não encontrado" após o login | O usuário existe no Authentication, mas não tem documento em `users/{UID}`. Rode o passo 4 |

## Estrutura do projeto

```
app/
  _layout.tsx          # Layout raiz (AuthProvider)
  index.tsx            # Redireciona conforme o perfil do usuário
  (auth)/              # Login, cadastro, recuperação de senha
  (aprendiz)/          # Abas e telas do aprendiz
  (mentor)/            # Abas e telas do mentor
src/
  types/               # Tipos TypeScript do domínio
  constants/           # Cores e opções de formulário
  services/            # Acesso ao Firebase (auth, users, matches, chat, trilhas)
  contexts/            # AuthContext
  hooks/               # useAuth
  components/          # Button, Input, Loading, MentorCard
  utils/               # Schemas Zod
scripts/
  seed-users.js        # Cria os usuários de teste
firestore.rules        # Regras de segurança do Firestore
```

## Perfis de usuário

| Perfil   | Fluxo principal |
|----------|-----------------|
| Aprendiz | Buscar mentores → solicitar conexão → chat → trilhas |
| Mentor   | Ver solicitações → aceitar ou recusar → chat com aprendizes |

## Funcionalidades

- Cadastro e login com Firebase Auth
- Perfis distintos para Aprendiz e Mentor
- Busca de mentores por nome, área e interesses
- Sistema de conexão: solicitação, aceite e recusa
- Chat privado em tempo real (Firestore `onSnapshot`)
- Trilhas de aprendizagem com progresso por lição
- Upload de foto de perfil (Firebase Storage)
- Recuperação de senha por e-mail

## Pendências conhecidas

- **Aceitar uma solicitação** está registrando a conexão como recusada, e a conversa é criada sem participantes.
- **A aba Conexões do aprendiz** aparece sempre vazia.
- **O chat** é aberto com o ID da conexão em vez do ID da conversa.
- **As trilhas** usam nomes de coleção (`learning_paths`, `lessons`) diferentes dos que estão em `firestore.rules`, e a consulta de lições precisa de um índice composto.
- **O Firebase Storage** ainda não foi ativado. Sem ele o upload de foto não funciona, e projetos novos podem precisar do plano Blaze para ativá-lo.
