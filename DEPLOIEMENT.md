# 🚀 GUIDE DE DÉPLOIEMENT — Club Football App

## Ce que vous allez créer
Une web app complète hébergée sur internet, accessible depuis n'importe quel appareil.
**Coût : 0 FCFA** — tout est gratuit.

---

## ÉTAPE 1 — Créer le projet Supabase (base de données + auth)

1. Allez sur **https://supabase.com** → "Start your project" → créez un compte
2. Cliquez **"New project"**
   - Nom : `club-football`
   - Mot de passe DB : notez-le bien
   - Région : choisissez **West EU (Ireland)** (la plus proche)
3. Attendez ~2 minutes que le projet démarre

4. Dans le menu gauche → **SQL Editor** → cliquez "New query"
5. Copiez-collez tout le contenu du fichier `lib/schema.sql`
6. Cliquez **"Run"** — la base de données est créée !

7. Allez dans **Settings > API** et copiez :
   - `Project URL` → c'est votre `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → c'est votre `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → c'est votre `SUPABASE_SERVICE_ROLE_KEY` (**gardez-la secrète !**)

---

## ÉTAPE 2 — Préparer le code sur GitHub

1. Allez sur **https://github.com** → créez un compte si besoin
2. Créez un **nouveau repository** → nom : `club-football-app` → Public ou Private
3. Sur votre ordinateur, installez **Git** (https://git-scm.com)
4. Dans un terminal, dans le dossier du projet :

```bash
git init
git add .
git commit -m "Initial commit - Club Football App"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/club-football-app.git
git push -u origin main
```

---

## ÉTAPE 3 — Déployer sur Vercel (hébergement)

1. Allez sur **https://vercel.com** → créez un compte (connectez avec GitHub)
2. Cliquez **"New Project"** → importez votre repository `club-football-app`
3. Dans **Environment Variables**, ajoutez les 3 variables :

| Clé | Valeur |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Votre URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Votre anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Votre service role key |

4. Cliquez **"Deploy"** — attendez ~3 minutes
5. Vercel vous donne une URL comme `club-football-app.vercel.app` → **votre app est en ligne !**

---

## ÉTAPE 4 — Créer le premier compte Admin

1. Dans Supabase → **Authentication > Users** → cliquez "Add user"
   - Email : votre email admin
   - Password : mot de passe sécurisé
   - Cochez "Auto Confirm User"

2. Dans **Table Editor > profiles**, trouvez l'utilisateur créé et changez le champ `role` à `admin`

3. Connectez-vous sur votre app avec ces identifiants — vous avez accès à tout !

---

## ÉTAPE 5 — Configuration finale

### Domaine personnalisé (optionnel)
Dans Vercel → Settings → Domains → ajoutez votre domaine (ex: `monclub.ml`)

### Activer les emails (optionnel)
Dans Supabase → Settings → Auth → SMTP settings → configurez pour envoyer des emails de réinitialisation de mot de passe

### Sauvegardes
Supabase fait des backups automatiques quotidiens sur le plan gratuit.

---

## Structure des fichiers importants

```
club-football-app/
├── app/
│   ├── (app)/              ← Pages protégées (nécessitent connexion)
│   │   ├── dashboard/      ← Tableau de bord
│   │   ├── players/        ← Gestion joueurs
│   │   ├── attendance/     ← Présences
│   │   ├── payments/       ← Cotisations
│   │   ├── evaluations/    ← Évaluations techniques
│   │   ├── competitions/   ← Matchs et tournois
│   │   ├── documents/      ← Documents joueurs
│   │   └── users/          ← Gestion des comptes
│   ├── api/admin/          ← APIs serveur (création/suppression comptes)
│   └── login/              ← Page de connexion
├── components/             ← Composants réutilisables
├── lib/
│   ├── schema.sql          ← Schéma base de données
│   ├── supabase/           ← Clients Supabase
│   └── utils.ts            ← Utilitaires
└── types/index.ts          ← Types TypeScript
```

---

## Rôles et permissions

| Module | Admin | Staff | Trésorier | Parent |
|--------|-------|-------|-----------|--------|
| Tableau de bord | ✅ | ✅ | ✅ | ❌ |
| Joueurs (lecture) | ✅ | ✅ | ✅ | Sa fiche |
| Joueurs (écriture) | ✅ | ✅ | ❌ | ❌ |
| Présences | ✅ | ✅ | ❌ | ❌ |
| Cotisations | ✅ | ❌ | ✅ | Sa fiche |
| Évaluations | ✅ | ✅ | ❌ | Sa fiche |
| Compétitions | ✅ | ✅ | ❌ | ✅ |
| Documents | ✅ | ✅ | ❌ | ❌ |
| Gestion comptes | ✅ | ❌ | ❌ | ❌ |

---

## En cas de problème

- **Erreur de connexion** : vérifiez les variables d'environnement dans Vercel
- **Base de données vide** : re-exécutez le fichier `schema.sql` dans Supabase SQL Editor
- **Upload de fichiers ne fonctionne pas** : vérifiez que les Storage buckets sont créés (inclus dans le SQL)
- **Support** : docs.supabase.com | vercel.com/docs

---

*App générée pour Club de Football — Bamako 2025*
