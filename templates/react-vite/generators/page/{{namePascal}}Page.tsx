import { Link } from 'react-router-dom';

export function {{namePascal}}Page() {
  return (
    <div>
      <h1>{{namePascal}}</h1>
      <p>Welcome to the {{namePascal}} page!</p>
      <Link to="/">Back to Home</Link>
    </div>
  );
}
