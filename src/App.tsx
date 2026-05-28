import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AuthPage } from "./pages/AuthPage";
import { BookDetailPage } from "./pages/BookDetailPage";
import { BookcasesPage } from "./pages/BookcasesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { GoalsPage } from "./pages/GoalsPage";
import { MyBooksPage } from "./pages/MyBooksPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RatingPage } from "./pages/RatingPage";
import { SearchPage } from "./pages/SearchPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StatsPage } from "./pages/StatsPage";
import { TropeBookcasePage } from "./pages/TropeBookcasePage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="my-books" element={<MyBooksPage />} />
        <Route path="bookcases" element={<BookcasesPage />} />
        <Route path="trope-bookcase" element={<TropeBookcasePage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="books/:bookId" element={<BookDetailPage />} />
        <Route path="books/:bookId/rate" element={<RatingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
