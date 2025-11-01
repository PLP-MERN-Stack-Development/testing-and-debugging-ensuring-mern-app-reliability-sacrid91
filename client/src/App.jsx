// client/src/App.jsx
import React from 'react';
import Button from './components/Button';

function App() {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Simulate API call
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Test App</h1>
      <Button onClick={fetchPosts} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Posts'}
      </Button>
      {posts.length > 0 && (
        <div data-testid="posts-container">
          {posts.map((post, index) => (
            <div key={post._id || index} className="post-item">
              <h3>{post.title}</h3>
              <p>{post.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;