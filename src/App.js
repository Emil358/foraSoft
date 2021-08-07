import './App.css';
import { Switch, Route, BrowserRouter } from 'react-router-dom'
import Main from './components/main'
import Room from './components/room'
import NotFound from './components/404'

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path='/' component={Main} />
        <Route exact path='/room/:id' component={Room} />
        <Route component={NotFound} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
