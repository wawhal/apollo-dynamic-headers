import React, { Component } from 'react';
import './App.css';
import { ApolloProvider } from 'react-apollo';
import ApolloClient from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { split } from 'apollo-link';
import { getMainDefinition } from 'apollo-utilities';
import Home from './Home';

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || `http://localhost:8080/v1alpha1/graphql`;

class App extends Component {

  state = {
    wsLink: null,
    client: null,
    headers: {
      'x-hasura-user-id': '1',
      'x-hasura-role': 'user',
      'x-hasura-access-key': '12346'
    }
  }

  componentWillMount() {
    // create a websocket link and store it in state/redux
    this.mkWsLink();
  }

  componentDidMount() {
    // create client and store in state
    this.initApollo();
  }

  getHeaders = async () => {
    // custom function to get your headers
    // can be async
    // in this case, we are just toggling the x-hasura-user-id between 1 and 2
    const newHeaders = {
      ...this.state.headers,
      'x-hasura-user-id': this.state.headers['x-hasura-user-id'] === '1' ? '2' : '1',
      'x-hasura-access-key': '12345'
    }
    this.setState({
      ...this.state,
      headers: newHeaders
    });
    return newHeaders;
  }

  // a function to create websocket link
  mkWsLink = () => {
    const splitUri = GRAPHQL_ENDPOINT.split('//');
    const wsClient = new SubscriptionClient(
      'ws://' + splitUri[1],
      {
        // get headers asynchronously and set in connectionParams
        connectionParams: async () => {
          const headers = await this.getHeaders();
          return {
            headers
          };
        },
        // on subscription error, refresh subscription (close and reconnect)
        onError: this.refreshSubscription,
        // set reconnect to true for reconnecting whenever the connection is closed
        reconnect: true
      }
    );

    // store wsLink in state such that we can refresh connections whenever we want
    this.setState({
      ...this.state,
      wsLink: new WebSocketLink(wsClient),
    });
  };

  // a function to create apollo client and store in state
  initApollo = () => {
    const httpLink = new HttpLink({ uri: GRAPHQL_ENDPOINT });
    const link = split(
      // split based on operation type
      ({ query }) => {
        const { kind, operation } = getMainDefinition(query);
        return kind === 'OperationDefinition' && operation === 'subscription';
      },
      this.state.wsLink,
      httpLink
    );
    const client = new ApolloClient({
      link,
      cache: new InMemoryCache({
        addTypename: false
      })
    });
    this.setState({
      ...this.state,
      client,
    });
  }

  refreshSubscription = () => {
    // refresh subscription whenever needed
    this.state.wsLink.subscriptionClient.close(false, false);
  }

  render() {
    const { client } = this.state;
    if (!client) {
      return "Loading";
    }
    return (
      <ApolloProvider client={client}>
        <Home refreshSubscription={this.refreshSubscription} headers={this.state.headers}/>
      </ApolloProvider>
    );
  }
}

export default App;
