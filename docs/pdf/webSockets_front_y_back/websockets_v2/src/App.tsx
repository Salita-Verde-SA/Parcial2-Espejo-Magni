import { AppRouter } from "./router/AppRouter";
import { InitApp } from "./init/InitApp";

export const App = () => (
  <InitApp>
    <AppRouter />
  </InitApp>
);

export default App;
