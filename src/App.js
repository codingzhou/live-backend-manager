import React from 'react';
import { jsonServerRestClient, Admin, Resource, Delete, fetchUtils } from 'admin-on-rest';
import PostIcon from 'material-ui/svg-icons/action/book';
import { PostList, PostEdit, PostCreate } from './posts';
import Dashboard from './dashboard';
import authClient from './authClient';
import myJsonServerClient from './jsonServerClient';

const App = () => (
  <Admin authClient={authClient} dashboard={Dashboard} restClient={myJsonServerClient('http://localhost:2333')}>
    <Resource name="posts" list={PostList} edit={PostEdit} create={PostCreate} remove={Delete} icon={PostIcon} />
  // ...
  </Admin>
);

export default App;
