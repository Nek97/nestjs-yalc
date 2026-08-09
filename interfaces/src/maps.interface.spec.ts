import { FieldMapper, isFieldMapper, isFieldMapperProperty } from '.';

describe('test maps typeguards', () => {
  class FakeClass {
    fakeProperty: 'something';
  }

  const fieldMapper: FieldMapper<FakeClass> = {
    fakeProperty: {
      dst: 'somethingElse',
    },
  };

  it('test is isFieldMapper', () => {
    expect(isFieldMapper(fieldMapper)).toBeTruthy();
    expect(isFieldMapper({})).toBeFalsy();
  });

  it('test is isFieldMapperProperty', () => {
    expect(isFieldMapperProperty(fieldMapper.fakeProperty)).toBeTruthy();
    expect(isFieldMapperProperty({})).toBeFalsy();
  });
});
