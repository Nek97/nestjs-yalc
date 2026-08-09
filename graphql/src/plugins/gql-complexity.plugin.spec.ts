import { GqlComplexityPlugin } from './gql-complexity.plugin';
import { GqlComplexityHelper } from './gql-complexity.helper';


jest.mock('./gql-complexity.helper');

describe('GqlComplexityPlugin', () => {
  it('should be defined', () => {
    const plugin = new GqlComplexityPlugin();
    expect(plugin).toBeDefined();
  });

  it('should handle didResolveOperation lifecycle', async () => {
    const clonedQueryBuilder: any = {
      document: jest.fn().mockReturnValue({}),
    };

    const plugin = new GqlComplexityPlugin();
    const result = await plugin.requestDidStart();

    const spiedFunc = jest.spyOn(GqlComplexityHelper, 'processDocumentAST');
    expect(result.didResolveOperation).toBeDefined();

    if (result.didResolveOperation) {
      await result.didResolveOperation(clonedQueryBuilder as any);
    }
    expect(spiedFunc).toBeCalled();
    expect(spiedFunc).toHaveBeenCalledWith(clonedQueryBuilder.document, undefined);
  });
});
