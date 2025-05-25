# Projekt Szachy Wieloosobowe ♟️

## Roadmapa 🚀

### Faza 1: Przygotowanie i konfiguracja 🛠️
- [✅] Zainstaluj Node.js i PostgreSQL na swoim komputerze ⚙️
- [✅] Sklonuj repozytorium z GitHub 📂
- [✅] Utwórz strukturę projektu: `client/` (React) i `server/` (Node.js) 🗂️
- [✅] Skonfiguruj środowisko deweloperskie w VS Code 💻

### Faza 2: Podstawowa konfiguracja back-endu 🌐
- [✅] Zainstaluj zależności: Express, Socket.io, pg 📦
- [✅] Przygotuj bazę danych PostgreSQL dla użytkowników 👨‍🎓
- [ ] Przygotuj bazę danych PostgreSQL dla partii 🗄️
- [✅] Utwórz serwer Node.js z podstawowym API (rejestracja/logowanie) 🔗
- [✅] Połącz serwer z PostgreSQL do przechowywania danych użytkowników 🗃️
- [ ] Wdróż komunikację real-time z Socket.io dla ruchów w grze 📡

### Faza 3: Podstawowy front-end z Reactem 🎨
- [ ] Zainstaluj React i Tailwind CSS w folderze `client/` 🖼️
- [ ] Stwórz podstawowe komponenty: logowanie, lobby, plansza szachowa 🧩
- [ ] Połącz Reacta z Socket.io do synchronizacji ruchów ⚡
- [ ] Zaprojektuj responsywny interfejs z Tailwind CSS 📱

### Faza 4: Logika gry i funkcjonalności 🎮
- [ ] Zaimplementuj reguły szachów (ruchy figur, szach-mat) ♜
- [ ] Dodaj system pokoi gry w lobby 🏠
- [ ] Wdróż czat w czasie rzeczywistym między graczami 💬
- [ ] Zapisz wyniki partii do bazy danych 📊

### Faza 5: Testowanie i poprawki 🐞
- [ ] Przetestuj ruchy i synchronizację między graczami 🔍
- [ ] Popraw błędy w logice gry i interfejsie ✂️
- [ ] Upewnij się, że dane w bazie są poprawnie zapisywane ✅

### Faza 6: Deploy na Heroku (opcjonalnie) 🌍
- [ ] Przygotuj aplikację do wdrożenia (Procfile, zmienne środowiskowe) 📜
- [ ] Wdróż aplikację na Heroku 🚀
- [ ] Przetestuj aplikację online i debuguj logi 🖥️

### Faza 7: Dodatkowe funkcje 🌟
- [ ] Dodaj rankingi graczy 🏆
- [ ] Wdróż powiadomienia o nowych meczach 📩
- [ ] Dodaj możliwość zapraszania znajomych do gry 🤝

---

## Jak zacząć? 🏁
1. Sklonuj repozytorium: `git clone <url>`
2. Zainstalować npm, żeby działało z poziomu terminala. (Macos: brew install npm, Windows: najlepiej poradnik)
3. Zainstaluj zależności w `server/` i `client/` za pomocą `npm install`
4. Uruchom serwer: `npm start` (w folderze `server/`)
5. Uruchom front-end: `npm run dev` (w folderze `client/`)
6. Graj i rozwijaj projekt! 🎉

### Rozszerzenia VSC
1. Tailwind CSS IntelliSense
2. ESLint
3. Prettier
4. PostgreSQL

### Config

#### PostgreSQL
```shell
> user: 'admin'  
> host: 'localhost'  
> database: 'szachy'  
> password: 'password'  
> port: 5432
```
