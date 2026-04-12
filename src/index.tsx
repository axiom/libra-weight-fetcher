import { Route, Router } from "@solidjs/router";
import "virtual:uno.css";
import "./shared.css";
import { render } from "solid-js/web";
import Navigation from "./components/Navigation";
import { ThemeProvider } from "./context/ThemeContext";
import { WeightDataProvider } from "./context/WeightDataContext";
import CalendarPage from "./pages/Calendar";
import ChartPage from "./pages/Chart";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";

function Layout(props: { children?: any }) {
  return (
    <ThemeProvider>
      <WeightDataProvider>
        <Navigation />
        <main>{props.children}</main>
      </WeightDataProvider>
    </ThemeProvider>
  );
}

render(
  () => (
    <Router root={Layout}>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/chart" component={ChartPage} />
      <Route path="/calendar" component={CalendarPage} />
    </Router>
  ),
  document.getElementById("root")!,
);