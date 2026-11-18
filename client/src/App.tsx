import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import TrackOrder from "./pages/TrackOrder";
import PolicyPage from "./pages/PolicyPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RetailLogin from "./pages/retail/RetailLogin";
import RetailPortal from "./pages/retail/RetailPortal";
import BulkEnquiryPage from "./pages/BulkEnquiryPage";
import CustomerAccountPage from "./pages/CustomerAccountPage";
import ProductEnquiryPage from "./pages/ProductEnquiryPage";
import CustomerAssistantBot from "./components/CustomerAssistantBot";
import FooterSamplesPage from "./pages/FooterSamplesPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Catalog} />
      <Route path="/categories/:slug" component={Catalog} />
      <Route path="/products/:slug" component={ProductDetail} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/policies/:type" component={PolicyPage} />
      <Route path="/track-order" component={TrackOrder} />
      <Route path="/bulk-enquiry" component={BulkEnquiryPage} />
      <Route path="/product-enquiry" component={ProductEnquiryPage} />
      <Route path="/account" component={CustomerAccountPage} />
      <Route path="/footer-samples" component={FooterSamplesPage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/:sub*" component={AdminDashboard} />
      <Route path="/retail/login" component={RetailLogin} />
      <Route path="/retail" component={RetailPortal} />
      <Route path="/retail/:sub*" component={RetailPortal} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="bottom-right" />
          <Router />
          <CustomerAssistantBot />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
