import React, { Component } from 'react';
import { Subscription } from 'react-apollo';
import gql from 'graphql-tag';
import './App.css';

const subscription = gql`
  subscription {
    todo {
      id
      user_id
      text
    }
  }
`;

class Home extends Component {
  componentDidMount() {
    setInterval(
      () => {
        this.props.refreshSubscription();
      },
      3000
    );
  }
  render() {
    const { headers } = this.props;
    return (
      <div>
        <h3>Current headers:</h3>
        <div>
          {
            Object.keys(headers).map((key) => {
              return (
                <div>{key}: {headers[key]} </div>
              );
            })
          }
        </div>
        <hr />
        <h3>Subscription data:</h3>
        <Subscription
          subscription={subscription}
          shouldResubscribe={() => {console.log('Resubscribing'); return true;}}
        >
          {
            ({ data, loading, error}) => {
              if (loading || error) {
                return "Loading ...";
              }
              return data.todo.map((t, i) => <div key={i}>{t.text}</div>);
            }
          }
        </Subscription>
      </div>
    );
  }
}

export default Home;
