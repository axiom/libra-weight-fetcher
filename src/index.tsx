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
import EvalPage from "./pages/Eval";
import Landing from "./pages/Landing";
import Widget from "./pages/Widget";

import { A, useLocation } from "@solidjs/router";
import { Show } from "solid-js";

function Layout(props: { children?: any }) {
  const location = useLocation();
  const showNav = () => !location.pathname.startsWith("/widget");

  return (
    <ThemeProvider>
      <WeightDataProvider>
        <Show when={showNav()}>
          <Navigation />
        </Show>
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
      <Route path="/eval" component={EvalPage} />
      <Route path="/widget" component={Widget} />
    </Router>
  ),
  document.getElementById("root")!,
);
