import { Route, Router } from "@solidjs/router";
import "virtual:uno.css";
import "./shared.css";
import { render } from "solid-js/web";
import Navigation from "./components/Navigation";
import { WeightDataProvider } from "./context/WeightDataContext";
import CalendarPage from "./pages/Calendar";
import ChartPage from "./pages/Chart";
import Home from "./pages/Home";

function Layout(props: { children?: any }) {
  return (
    <WeightDataProvider>
      <Navigation />
      <main>{props.children}</main>
    </WeightDataProvider>
  );
}

render(
  () => (
    <Router root={Layout}>
      <Route path="/" component={Home} />
      <Route path="/chart" component={ChartPage} />
      <Route path="/calendar" component={CalendarPage} />
    </Router>
  ),
  document.getElementById("root")!,
);
