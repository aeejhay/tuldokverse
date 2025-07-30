# Dynamic Sidebar System

This directory contains the dynamic sidebar system that makes it easy to add new pages to your application.

## Components

### Layout.js
The main layout wrapper that provides the sidebar and content area for all authenticated pages.

**Usage:**
```jsx
import Layout from './components/Layout';

const MyPage = () => {
  return (
    <Layout currentPage="mypage">
      {/* Your page content here */}
    </Layout>
  );
};
```

### Sidebar.js
The dynamic sidebar component that automatically generates navigation based on the menu configuration.

## Adding New Pages

To add a new page to the sidebar, follow these steps:

### 1. Create Your Page Component
Create a new page component (e.g., `MyPage.js`):

```jsx
import React from 'react';
import Layout from './components/Layout';
import './App.css';

const MyPage = () => {
  return (
    <Layout currentPage="mypage">
      {/* Your page content */}
    </Layout>
  );
};

export default MyPage;
```

### 2. Add Menu Item to Sidebar
Edit `Sidebar.js` and add your menu item to the `menuItems` array:

```jsx
const menuItems = [
  // ... existing items
  {
    id: 'mypage',
    label: 'My Page',
    icon: '📄',
    path: '/mypage',
    active: currentPage === 'mypage'
  },
  // ... more items
];
```

### 3. Add Route to App.js
Add the route to your `App.js`:

```jsx
import MyPage from './MyPage';

// In the Routes component:
<Route path="/mypage" element={<MyPage />} />
```

## Menu Item Configuration

Each menu item has the following properties:

- **id**: Unique identifier for the page (used for active state)
- **label**: Display text in the sidebar
- **icon**: Emoji or icon to display
- **path**: URL path for navigation
- **active**: Boolean indicating if this page is currently active

## Example: Adding a Posts Page

```jsx
// In Sidebar.js
{
  id: 'posts',
  label: 'Posts',
  icon: '📝',
  path: '/posts',
  active: currentPage === 'posts'
}

// In App.js
import PostsPage from './PostsPage';
<Route path="/posts" element={<PostsPage />} />

// Create PostsPage.js
import React from 'react';
import Layout from './components/Layout';

const PostsPage = () => {
  return (
    <Layout currentPage="posts">
      <div className="topbar">
        {/* Your top bar content */}
      </div>
      <main className="main-feed">
        {/* Your page content */}
      </main>
    </Layout>
  );
};

export default PostsPage;
```

## Features

- **Automatic Active State**: The sidebar automatically highlights the current page
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Easy Configuration**: Just add items to the menu array
- **Consistent Layout**: All pages get the same sidebar and layout structure
- **Icon Support**: Use emojis or custom icons for menu items

## Future Enhancements

You can easily extend this system by:

1. **Adding Sub-menus**: Create nested menu structures
2. **Role-based Menus**: Show different menu items based on user roles
3. **Collapsible Sidebar**: Add a toggle to collapse/expand the sidebar
4. **Custom Icons**: Replace emojis with SVG icons or icon fonts
5. **Breadcrumbs**: Add breadcrumb navigation for nested pages

## Styling

The sidebar uses CSS classes that can be customized in `Sidebar.css`:

- `.sidebar`: Main sidebar container
- `.sidebar-nav-item`: Individual menu items
- `.sidebar-nav-item.active`: Active menu item
- `.sidebar-nav-item:hover`: Hover state
- `.nav-icon`: Menu item icons
- `.nav-label`: Menu item labels

## Best Practices

1. **Consistent Naming**: Use consistent naming conventions for page IDs
2. **Meaningful Icons**: Choose icons that clearly represent the page purpose
3. **Short Labels**: Keep menu labels concise and clear
4. **Logical Ordering**: Arrange menu items in a logical order
5. **Mobile Consideration**: Ensure icons work well on mobile devices 