import { Plugin } from '@nestjs/apollo';
import {
  GraphQLRequestListener,
  ApolloServerPlugin,
} from '@apollo/server';
import { GqlComplexityHelper } from './gql-complexity.helper';

@Plugin()
export class GqlComplexityPlugin implements ApolloServerPlugin {
  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    return {
      async didResolveOperation({ document, schema }) {
        GqlComplexityHelper.processDocumentAST(document, schema);
      },
    };
  }
}
