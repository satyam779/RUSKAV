import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Spinner } from "./components/ui";
import { Layout } from "./routes/Layout";
import { HomePage } from "./routes/HomePage";
import { AboutPage } from "./routes/AboutPage";
import { ProductsPage } from "./routes/ProductsPage";
import { CategoryPage } from "./routes/CategoryPage";
import { ShopPage } from "./routes/ShopPage";
import { ProductPage } from "./routes/ProductPage";
import { CartPage } from "./routes/CartPage";
import { QualityPage } from "./routes/QualityPage";
import { ContactPage } from "./routes/ContactPage";
import { NotFoundPage } from "./routes/NotFoundPage";

// Staff-only routes, loaded on demand.
const LoginPage = lazy(() =>
  import("./routes/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const AdminPage = lazy(() =>
  import("./routes/AdminPage").then((m) => ({ default: m.AdminPage }))
);

const staffRoute = (element: React.ReactNode) => (
  <Suspense fallback={<Spinner label="Loading dashboard" />}>{element}</Suspense>
);

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/products", element: <ProductsPage /> },
      { path: "/products/:categoryId", element: <CategoryPage /> },
      { path: "/shop", element: <ShopPage /> },
      { path: "/shop/:code", element: <ProductPage /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/quality", element: <QualityPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/login", element: staffRoute(<LoginPage />) },
      { path: "/admin", element: staffRoute(<AdminPage />) },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
